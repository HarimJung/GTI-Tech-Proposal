# ============================================================
# OMCT Global Torture Index 2026 — Full Scoring Pipeline
# Author: Harim Jung, MSc | visualclimate.org
# Purpose: Ingest → Validate → Score → Classify → Export
# Methodology: OMCT GTI 2025 Methodology Note (7 pillars,
#   440 indicators, 3 weight tiers, missing-data penalty)
# ============================================================

# ── 0. PACKAGES ──────────────────────────────────────────────
library(tidyverse)    # dplyr, tidyr, ggplot2, readr, purrr, stringr
library(janitor)      # clean_names, tabyl
library(readxl)       # Excel ingestion
library(jsonlite)     # JSON export for D3.js dashboard
library(scales)       # label formatting
library(glue)         # string interpolation
library(fmsb)         # radar charts
library(RColorBrewer) # palettes
library(knitr)        # reporting tables
library(rmarkdown)    # automated factsheet generation
library(openxlsx)     # Excel export with formatting

cat("─── GTI 2026 Scoring Pipeline Loaded ───\n")

# ============================================================
# 1. CONFIGURATION — mirrors OMCT methodology exactly
# ============================================================
PILLARS <- tibble(
  pillar_id   = paste0("P", 1:7),
  pillar_name = c(
    "Political Commitment",
    "Safeguards: Police & Security",
    "Freedom from Arbitrary Detention",
    "Ending Impunity",
    "Victims' Rights & Rehabilitation",
    "Protection for All",
    "Right to Defend / Civic Space"
  )
)

RISK_BANDS <- tibble(
  band       = c("Very High", "High", "Considerable", "Moderate", "Low"),
  score_min  = c(0, 20, 40, 60, 80),
  score_max  = c(19.99, 39.99, 59.99, 79.99, 100),
  color_hex  = c("#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6")
)

WEIGHT_TIERS <- c(1, 5, 10)  # severity-based

MISSING_PENALTY_COEF <- 0.5  # per methodology: -0.5 * (M/N) * 100


# ============================================================
# 2. DATA INGESTION — SurveyMonkey / Excel / CSV
# ============================================================

#' Ingest raw GTI survey data from multiple file formats
#' @param path File path (CSV, XLSX, or JSON)
#' @return Cleaned tibble with standardized column names
ingest_survey <- function(path) {
  ext <- tools::file_ext(path) %>% str_to_lower()
  
  raw <- switch(ext,
    "csv"  = read_csv(path, show_col_types = FALSE),
    "xlsx" = read_xlsx(path, sheet = 1),
    "xls"  = read_xlsx(path, sheet = 1),
    "json" = fromJSON(path) %>% as_tibble(),
    stop(glue("Unsupported file format: .{ext}"))
  )
  
  raw %>%
    clean_names() %>%
    mutate(
      ingestion_timestamp = Sys.time(),
      source_file = basename(path)
    )
}

#' Batch ingest from a directory of partner submissions
#' @param dir_path Directory containing survey files
#' @return Combined tibble from all partner files
batch_ingest <- function(dir_path) {
  files <- list.files(dir_path, 
                      pattern = "\\.(csv|xlsx|xls|json)$",
                      full.names = TRUE, 
                      recursive = TRUE)
  
  cat(glue("Found {length(files)} survey files\n\n"))
  
  map_dfr(files, function(f) {
    cat(glue("  Ingesting: {basename(f)}\n"))
    tryCatch(
      ingest_survey(f),
      error = function(e) {
        warning(glue("FAILED: {basename(f)} — {e$message}"))
        tibble()
      }
    )
  })
}


# ============================================================
# 3. VALIDATION — Data Quality Assurance
# ============================================================

#' Comprehensive data validation report
#' @param df Ingested survey tibble
#' @return List: cleaned data + validation report
validate_survey <- function(df) {
  
  report <- list()
  
  # ── 3a. Schema check: required columns ──
  required_cols <- c("country_iso3", "partner_id", "indicator_id",
                     "pillar_id", "response_value", "weight_tier")
  
  missing_cols <- setdiff(required_cols, names(df))
  report$missing_columns <- missing_cols
  
  if (length(missing_cols) > 0) {
    stop(glue("Missing required columns: {paste(missing_cols, collapse=', ')}"))
  }
  
  # ── 3b. Duplicate detection ──
  dupes <- df %>%
    group_by(country_iso3, partner_id, indicator_id) %>%
    filter(n() > 1) %>%
    ungroup()
  
  report$duplicate_count <- nrow(dupes)
  report$duplicate_records <- dupes
  
  cat(glue("  Duplicates found: {nrow(dupes)}\n"))
  
  # ── 3c. Value range validation ──
  out_of_range <- df %>%
    filter(response_value < 0 | response_value > 1 | is.na(response_value))
  
  report$out_of_range_count <- nrow(out_of_range)
  
  # ── 3d. Weight tier validation ──
  invalid_weights <- df %>%
    filter(!weight_tier %in% WEIGHT_TIERS)
  
  report$invalid_weight_count <- nrow(invalid_weights)
  
  # ── 3e. Cross-partner consistency (same indicator, same country) ──
  consistency <- df %>%
    group_by(country_iso3, indicator_id) %>%
    summarise(
      n_partners = n_distinct(partner_id),
      mean_val   = mean(response_value, na.rm = TRUE),
      sd_val     = sd(response_value, na.rm = TRUE),
      cv         = ifelse(mean_val > 0, sd_val / mean_val, NA),
      .groups = "drop"
    ) %>%
    filter(n_partners >= 2, cv > 0.5)  # flag high variance
  
  report$high_variance_indicators <- consistency
  report$high_variance_count <- nrow(consistency)
  
  cat(glue("  High-variance indicators: {nrow(consistency)}\n"))
  
  # ── 3f. Missing data summary per country ──
  missing_summary <- df %>%
    group_by(country_iso3) %>%
    summarise(
      total_indicators = n(),
      missing_count    = sum(is.na(response_value)),
      missing_pct      = round(missing_count / total_indicators * 100, 1),
      .groups = "drop"
    )
  
  report$missing_summary <- missing_summary
  
  # ── 3g. Clean: deduplicate (keep latest / mean) ──
  cleaned <- df %>%
    filter(!is.na(response_value),
           response_value >= 0 & response_value <= 1,
           weight_tier %in% WEIGHT_TIERS) %>%
    group_by(country_iso3, indicator_id, pillar_id, weight_tier) %>%
    summarise(
      response_value = mean(response_value, na.rm = TRUE),
      n_sources      = n(),
      .groups = "drop"
    )
  
  report$raw_rows    <- nrow(df)
  report$clean_rows  <- nrow(cleaned)
  report$drop_rate   <- round((1 - nrow(cleaned) / nrow(df)) * 100, 1)
  
  cat(glue("  Raw: {report$raw_rows} → Cleaned: {report$clean_rows} ",
           "(dropped {report$drop_rate}%)\n"))
  
  list(data = cleaned, report = report)
}


# ============================================================
# 4. SCORING — exact GTI methodology
# ============================================================

#' Score a single pillar for one country
#' @param pillar_data Tibble: indicators for one country + one pillar
#' @return Tibble: pillar score + diagnostics
score_pillar <- function(pillar_data) {
  
  n_total     <- nrow(pillar_data)
  n_answered  <- sum(!is.na(pillar_data$response_value))
  n_missing   <- n_total - n_answered
  
  if (n_answered == 0) {
    return(tibble(
      weighted_score  = NA_real_,
      n_indicators    = n_total,
      n_answered      = 0,
      n_missing       = n_total,
      missing_penalty = MISSING_PENALTY_COEF * (n_total / max(n_total, 1)) * 100
    ))
  }
  
  # Weighted average: Σ(wᵢ × xᵢ) / Σ(wᵢ)
  scored <- pillar_data %>%
    filter(!is.na(response_value)) %>%
    summarise(
      numerator   = sum(weight_tier * response_value),
      denominator = sum(weight_tier)
    )
  
  raw_score <- (scored$numerator / scored$denominator) * 100
  
  # Missing data penalty: -0.5 × (M / N) × 100
  penalty <- MISSING_PENALTY_COEF * (n_missing / n_total) * 100
  
  tibble(
    weighted_score  = round(max(0, raw_score - penalty), 2),
    raw_score       = round(raw_score, 2),
    n_indicators    = n_total,
    n_answered      = n_answered,
    n_missing       = n_missing,
    missing_penalty = round(penalty, 2)
  )
}

#' Score all pillars for all countries
#' @param cleaned_data Output from validate_survey()$data
#' @return Tibble: country × pillar scores + overall
score_all <- function(cleaned_data) {
  
  # Score per country × pillar
  pillar_scores <- cleaned_data %>%
    group_by(country_iso3, pillar_id) %>%
    group_modify(~ score_pillar(.x)) %>%
    ungroup() %>%
    left_join(PILLARS, by = "pillar_id")
  
  # Overall score: simple mean of 7 pillar scores
  overall <- pillar_scores %>%
    group_by(country_iso3) %>%
    summarise(
      overall_score = round(mean(weighted_score, na.rm = TRUE), 2),
      pillars_scored = sum(!is.na(weighted_score)),
      total_indicators = sum(n_indicators),
      total_answered = sum(n_answered),
      total_missing = sum(n_missing),
      avg_penalty = round(mean(missing_penalty, na.rm = TRUE), 2),
      .groups = "drop"
    ) %>%
    mutate(
      # Transparency score
      transparency = round((total_answered / total_indicators) * 100, 1),
      # Risk classification
      risk_band = case_when(
        overall_score < 20 ~ "Very High",
        overall_score < 40 ~ "High",
        overall_score < 60 ~ "Considerable",
        overall_score < 80 ~ "Moderate",
        TRUE               ~ "Low"
      ),
      risk_color = case_when(
        overall_score < 20 ~ "#EF4444",
        overall_score < 40 ~ "#F97316",
        overall_score < 60 ~ "#EAB308",
        overall_score < 80 ~ "#22C55E",
        TRUE               ~ "#3B82F6"
      )
    ) %>%
    arrange(overall_score)
  
  list(
    pillar_scores = pillar_scores,
    overall       = overall
  )
}


# ============================================================
# 5. LONGITUDINAL COMPARABILITY (2025 → 2026)
# ============================================================

#' Compare scores across years
#' @param scores_2025 Overall scores tibble from 2025
#' @param scores_2026 Overall scores tibble from 2026
#' @return Tibble with deltas, direction, significance flags
compare_years <- function(scores_2025, scores_2026) {
  
  combined <- scores_2026 %>%
    select(country_iso3, score_2026 = overall_score, 
           risk_2026 = risk_band, transparency_2026 = transparency) %>%
    left_join(
      scores_2025 %>%
        select(country_iso3, score_2025 = overall_score,
               risk_2025 = risk_band, transparency_2025 = transparency),
      by = "country_iso3"
    ) %>%
    mutate(
      delta         = round(score_2026 - score_2025, 2),
      delta_pct     = round(delta / score_2025 * 100, 1),
      direction     = case_when(
        delta > 2  ~ "Improved",
        delta < -2 ~ "Deteriorated",
        TRUE       ~ "Stable"
      ),
      band_changed  = risk_2025 != risk_2026,
      transparency_delta = transparency_2026 - transparency_2025
    ) %>%
    arrange(delta)
  
  combined
}


# ============================================================
# 6. JSON EXPORT — feeds D3.js dashboard directly
# ============================================================

#' Export scored data as JSON for web dashboard
#' @param scores Output from score_all()
#' @param output_path File path for JSON export
export_dashboard_json <- function(scores, output_path = "gti_2026_dashboard.json") {
  
  # Reshape pillar scores to wide format for each country
  pillar_wide <- scores$pillar_scores %>%
    select(country_iso3, pillar_name, weighted_score) %>%
    pivot_wider(names_from = pillar_name, values_from = weighted_score)
  
  # Merge with overall
  dashboard_data <- scores$overall %>%
    left_join(pillar_wide, by = "country_iso3") %>%
    mutate(
      last_updated = as.character(Sys.Date()),
      methodology_version = "GTI-2026-v1.0"
    )
  
  # Convert to nested JSON structure
  json_list <- dashboard_data %>%
    pmap(function(...) {
      row <- list(...)
      list(
        iso3          = row$country_iso3,
        overall_score = row$overall_score,
        risk_band     = row$risk_band,
        risk_color    = row$risk_color,
        transparency  = row$transparency,
        pillars = list(
          political_commitment = row$`Political Commitment`,
          safeguards_police    = row$`Safeguards: Police & Security`,
          freedom_detention    = row$`Freedom from Arbitrary Detention`,
          ending_impunity      = row$`Ending Impunity`,
          victims_rights       = row$`Victims' Rights & Rehabilitation`,
          protection_for_all   = row$`Protection for All`,
          civic_space          = row$`Right to Defend / Civic Space`
        )
      )
    })
  
  output <- list(
    metadata = list(
      title   = "Global Torture Index 2026",
      source  = "OMCT / Civil Society Partners",
      updated = as.character(Sys.Date()),
      version = "2026-v1.0",
      countries = length(json_list)
    ),
    countries = json_list
  )
  
  write_json(output, output_path, pretty = TRUE, auto_unbox = TRUE)
  cat(glue("\n✓ Dashboard JSON exported: {output_path}\n",
           "  Countries: {length(json_list)}\n"))
}


# ============================================================
# 7. EXCEL EXPORT — formatted workbook for OMCT review
# ============================================================

export_excel <- function(scores, output_path = "GTI_2026_Results.xlsx") {
  
  wb <- createWorkbook()
  
  # ── Sheet 1: Overall Rankings ──
  addWorksheet(wb, "Overall Rankings")
  writeDataTable(wb, "Overall Rankings", scores$overall)
  
  # Conditional formatting: risk band colors
  conditionalFormatting(wb, "Overall Rankings",
    cols = which(names(scores$overall) == "overall_score"),
    rows = 2:(nrow(scores$overall) + 1),
    rule = c(0, 20), style = createStyle(bgFill = "#FEE2E2"))
  conditionalFormatting(wb, "Overall Rankings",
    cols = which(names(scores$overall) == "overall_score"),
    rows = 2:(nrow(scores$overall) + 1),
    rule = c(20, 40), style = createStyle(bgFill = "#FFEDD5"))
  conditionalFormatting(wb, "Overall Rankings",
    cols = which(names(scores$overall) == "overall_score"),
    rows = 2:(nrow(scores$overall) + 1),
    rule = c(40, 60), style = createStyle(bgFill = "#FEF9C3"))
  conditionalFormatting(wb, "Overall Rankings",
    cols = which(names(scores$overall) == "overall_score"),
    rows = 2:(nrow(scores$overall) + 1),
    rule = c(60, 80), style = createStyle(bgFill = "#DCFCE7"))
  conditionalFormatting(wb, "Overall Rankings",
    cols = which(names(scores$overall) == "overall_score"),
    rows = 2:(nrow(scores$overall) + 1),
    rule = c(80, 100), style = createStyle(bgFill = "#DBEAFE"))
  
  # ── Sheet 2: Pillar Detail ──
  addWorksheet(wb, "Pillar Scores")
  pillar_export <- scores$pillar_scores %>%
    select(country_iso3, pillar_id, pillar_name, 
           weighted_score, raw_score, n_indicators, 
           n_answered, n_missing, missing_penalty)
  writeDataTable(wb, "Pillar Scores", pillar_export)
  
  # ── Sheet 3: Methodology Reference ──
  addWorksheet(wb, "Methodology")
  methodology_info <- tibble(
    Parameter = c("Scoring Formula", "Weight Tiers", "Missing Penalty",
                  "Risk Bands", "Transparency", "Pillar Aggregation",
                  "Scale", "Source"),
    Value = c(
      "Pillar = (Σ wᵢ×xᵢ)/(Σ wᵢ) × 100 − penalty",
      "1 (basic), 5 (important), 10 (critical)",
      "-0.5 × (M/N) × 100",
      "Very High (<20), High (20-39), Considerable (40-59), Moderate (60-79), Low (≥80)",
      "(Answered / Total) × 100",
      "Overall = mean(7 pillar scores)",
      "0-100 (higher = lower risk)",
      "OMCT GTI 2025 Methodology Note"
    )
  )
  writeDataTable(wb, "Methodology", methodology_info)
  
  saveWorkbook(wb, output_path, overwrite = TRUE)
  cat(glue("\n✓ Excel exported: {output_path}\n"))
}


# ============================================================
# 8. VISUALIZATIONS — publication-ready ggplot2
# ============================================================

#' Global ranking lollipop chart
plot_rankings <- function(scores) {
  scores$overall %>%
    mutate(country_iso3 = fct_reorder(country_iso3, overall_score)) %>%
    ggplot(aes(x = overall_score, y = country_iso3)) +
    geom_segment(aes(x = 0, xend = overall_score, 
                     y = country_iso3, yend = country_iso3,
                     color = risk_band), linewidth = 1.2) +
    geom_point(aes(color = risk_band), size = 4) +
    geom_text(aes(label = overall_score), hjust = -0.5, size = 3, color = "white") +
    scale_color_manual(values = c(
      "Very High" = "#EF4444", "High" = "#F97316",
      "Considerable" = "#EAB308", "Moderate" = "#22C55E", "Low" = "#3B82F6"
    )) +
    scale_x_continuous(limits = c(0, 110), breaks = seq(0, 100, 20)) +
    geom_vline(xintercept = c(20, 40, 60, 80), 
               linetype = "dashed", color = "grey30", linewidth = 0.3) +
    labs(
      title = "Global Torture Index 2026 — Country Rankings",
      subtitle = "Higher score = lower risk of torture (0–100 scale)",
      x = "GTI Score", y = NULL, color = "Risk Band"
    ) +
    theme_minimal(base_family = "Inter") +
    theme(
      plot.background  = element_rect(fill = "#0a0e1a", color = NA),
      panel.background = element_rect(fill = "#0a0e1a", color = NA),
      panel.grid.major.y = element_blank(),
      panel.grid.minor = element_blank(),
      panel.grid.major.x = element_line(color = "grey20"),
      text = element_text(color = "#e0e6f0"),
      axis.text = element_text(color = "#94a3b8"),
      plot.title = element_text(face = "bold", size = 16),
      legend.position = "bottom"
    )
}

#' Pillar heatmap
plot_pillar_heatmap <- function(scores) {
  scores$pillar_scores %>%
    mutate(
      pillar_short = str_extract(pillar_name, "^[^:]+") %>% str_trim(),
      country_iso3 = fct_reorder(country_iso3, weighted_score, .fun = mean)
    ) %>%
    ggplot(aes(x = pillar_short, y = country_iso3, fill = weighted_score)) +
    geom_tile(color = "#0a0e1a", linewidth = 1) +
    geom_text(aes(label = round(weighted_score, 0)), 
              size = 2.8, color = "white", fontface = "bold") +
    scale_fill_gradientn(
      colors = c("#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"),
      values = rescale(c(0, 20, 40, 60, 80, 100)),
      limits = c(0, 100),
      name = "Score"
    ) +
    labs(
      title = "GTI 2026 — Pillar-by-Country Heatmap",
      x = NULL, y = NULL
    ) +
    theme_minimal(base_family = "Inter") +
    theme(
      plot.background  = element_rect(fill = "#0a0e1a", color = NA),
      panel.background = element_rect(fill = "#0a0e1a", color = NA),
      text = element_text(color = "#e0e6f0"),
      axis.text.x = element_text(angle = 45, hjust = 1, color = "#94a3b8", size = 9),
      axis.text.y = element_text(color = "#94a3b8", size = 9),
      plot.title = element_text(face = "bold", size = 14),
      panel.grid = element_blank()
    )
}

#' Radar chart for a single country
plot_radar <- function(scores, iso3_code) {
  country_pillars <- scores$pillar_scores %>%
    filter(country_iso3 == iso3_code) %>%
    arrange(pillar_id)
  
  country_name <- country_pillars$country_iso3[1]
  
  radar_data <- country_pillars %>%
    select(pillar_name, weighted_score) %>%
    pivot_wider(names_from = pillar_name, values_from = weighted_score)
  
  radar_df <- rbind(
    rep(100, 7),  # max
    rep(0, 7),    # min
    as.numeric(radar_data[1, ])
  ) %>% as.data.frame()
  
  names(radar_df) <- country_pillars$pillar_name %>%
    str_replace(":.+", "") %>% str_trim()
  
  par(bg = "#0a0e1a", mar = c(1, 1, 2, 1))
  
  overall <- scores$overall %>% filter(country_iso3 == iso3_code)
  risk_col <- overall$risk_color
  
  radarchart(radar_df,
    axistype = 1,
    pcol = risk_col, pfcol = adjustcolor(risk_col, alpha.f = 0.25),
    plwd = 3, plty = 1,
    cglcol = "grey30", cglty = 1, cglwd = 0.8,
    axislabcol = "grey50", vlcex = 0.8, calcex = 0.7,
    title = glue("{iso3_code} — GTI Score: {overall$overall_score} ({overall$risk_band})"),
    col.title = "white", cex.main = 1.2
  )
}

#' Year-over-year comparison
plot_trend <- function(comparison) {
  comparison %>%
    mutate(country_iso3 = fct_reorder(country_iso3, delta)) %>%
    ggplot(aes(x = delta, y = country_iso3, fill = direction)) +
    geom_col(width = 0.7) +
    geom_vline(xintercept = 0, color = "white", linewidth = 0.5) +
    geom_text(aes(label = glue("{ifelse(delta>0,'+','')}{delta}"),
                  hjust = ifelse(delta >= 0, -0.2, 1.2)),
              size = 3, color = "white") +
    scale_fill_manual(values = c(
      "Improved" = "#22C55E", "Deteriorated" = "#EF4444", "Stable" = "#64748B"
    )) +
    labs(
      title = "GTI Score Change: 2025 → 2026",
      subtitle = "Positive = improvement (lower torture risk)",
      x = "Score Change", y = NULL, fill = "Direction"
    ) +
    theme_minimal(base_family = "Inter") +
    theme(
      plot.background  = element_rect(fill = "#0a0e1a", color = NA),
      panel.background = element_rect(fill = "#0a0e1a", color = NA),
      panel.grid.major.y = element_blank(),
      panel.grid.minor = element_blank(),
      text = element_text(color = "#e0e6f0"),
      axis.text = element_text(color = "#94a3b8"),
      plot.title = element_text(face = "bold", size = 14),
      legend.position = "bottom"
    )
}


# ============================================================
# 9. AUTOMATED FACTSHEET GENERATOR (per country)
# ============================================================

generate_factsheet <- function(scores, iso3_code, output_dir = "factsheets") {
  
  dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)
  
  overall <- scores$overall %>% filter(country_iso3 == iso3_code)
  pillars <- scores$pillar_scores %>% 
    filter(country_iso3 == iso3_code) %>% 
    arrange(pillar_id)
  
  # Build markdown content
  md <- glue("
---
title: 'GTI 2026 Factsheet: {iso3_code}'
output: pdf_document
---

# {iso3_code} — Global Torture Index 2026

**Overall Score:** {overall$overall_score} / 100

**Risk Band:** {overall$risk_band}

**Transparency Score:** {overall$transparency}%

## Pillar Breakdown

| Pillar | Score | Indicators | Missing | Penalty |
|--------|-------|-----------|---------|---------|
{paste(pillars %>% 
  mutate(row = glue('| {pillar_name} | {weighted_score} | {n_indicators} | {n_missing} | {missing_penalty} |')) %>% 
  pull(row), collapse = '\n')}

## Methodology Note

Scores range from 0 (highest risk) to 100 (lowest risk). 
Each pillar aggregates weighted indicators (tiers: 1, 5, 10) with a 
missing-data penalty of −0.5 × (M/N) × 100.

*Source: OMCT GTI 2026 | Prepared by Harim Jung*
")
  
  md_path <- file.path(output_dir, glue("{iso3_code}_factsheet.md"))
  writeLines(md, md_path)
  cat(glue("  ✓ Factsheet: {md_path}\n"))
  
  md_path
}

#' Generate factsheets for all countries
batch_factsheets <- function(scores, output_dir = "factsheets") {
  cat("Generating factsheets...\n")
  scores$overall$country_iso3 %>%
    walk(~ generate_factsheet(scores, .x, output_dir))
  cat(glue("\n✓ All {nrow(scores$overall)} factsheets generated in /{output_dir}/\n"))
}


# ============================================================
# 10. MASTER EXECUTION — run full pipeline
# ============================================================

run_gti_pipeline <- function(data_dir, 
                              scores_2025_path = NULL,
                              output_dir = "output") {
  
  dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)
  
  cat("\n╔══════════════════════════════════════════╗\n")
  cat("║   GTI 2026 — Full Scoring Pipeline       ║\n")
  cat("╚══════════════════════════════════════════╝\n\n")
  
  # Step 1: Ingest
  cat("▸ Step 1/6: Ingesting survey data...\n")
  raw <- batch_ingest(data_dir)
  
  # Step 2: Validate
  cat("\n▸ Step 2/6: Validating data...\n")
  validated <- validate_survey(raw)
  
  # Step 3: Score
  cat("\n▸ Step 3/6: Scoring (7 pillars × all countries)...\n")
  scores <- score_all(validated$data)
  cat(glue("  Countries scored: {nrow(scores$overall)}\n"))
  
  # Step 4: Export JSON for D3 dashboard
  cat("\n▸ Step 4/6: Exporting dashboard JSON...\n")
  export_dashboard_json(scores, file.path(output_dir, "gti_2026_dashboard.json"))
  
  # Step 5: Export Excel
  cat("\n▸ Step 5/6: Exporting Excel workbook...\n")
  export_excel(scores, file.path(output_dir, "GTI_2026_Results.xlsx"))
  
  # Step 6: Visualizations
  cat("\n▸ Step 6/6: Generating visualizations...\n")
  
  p1 <- plot_rankings(scores)
  ggsave(file.path(output_dir, "gti_rankings.png"), p1, 
         width = 12, height = 10, dpi = 300, bg = "#0a0e1a")
  
  p2 <- plot_pillar_heatmap(scores)
  ggsave(file.path(output_dir, "gti_heatmap.png"), p2, 
         width = 14, height = 10, dpi = 300, bg = "#0a0e1a")
  
  # Radar for top-3 worst & best
  worst3 <- head(scores$overall$country_iso3, 3)
  best3  <- tail(scores$overall$country_iso3, 3)
  
  for (iso in c(worst3, best3)) {
    png(file.path(output_dir, glue("radar_{iso}.png")), 
        width = 600, height = 600, bg = "#0a0e1a")
    plot_radar(scores, iso)
    dev.off()
  }
  
  # Year-over-year comparison
  if (!is.null(scores_2025_path)) {
    cat("\n▸ Bonus: Year-over-year comparison...\n")
    scores_2025 <- read_csv(scores_2025_path, show_col_types = FALSE)
    comparison <- compare_years(scores_2025, scores$overall)
    write_csv(comparison, file.path(output_dir, "gti_yoy_comparison.csv"))
    
    p3 <- plot_trend(comparison)
    ggsave(file.path(output_dir, "gti_trend.png"), p3, 
           width = 12, height = 10, dpi = 300, bg = "#0a0e1a")
  }
  
  # Factsheets
  batch_factsheets(scores, file.path(output_dir, "factsheets"))
  
  cat("\n╔══════════════════════════════════════════╗\n")
  cat("║   ✓ Pipeline complete!                    ║\n")
  cat(glue("║   Output: ./{output_dir}/                    ║\n"))
  cat("╚══════════════════════════════════════════╝\n")
  
  invisible(list(
    raw       = raw,
    validated = validated,
    scores    = scores
  ))
}


# ============================================================
# USAGE EXAMPLE
# ============================================================
# results <- run_gti_pipeline(
#   data_dir         = "data/surveys/",
#   scores_2025_path = "data/gti_2025_overall.csv",
#   output_dir       = "output/gti_2026"
# )
#
# # Individual visualizations:
# plot_rankings(results$scores)
# plot_pillar_heatmap(results$scores)
# plot_radar(results$scores, "BRA")
#
# # Export for D3 dashboard:
# export_dashboard_json(results$scores)
Copy
