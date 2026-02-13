<div align="center">

# 🔴 Global Torture Index 2026 — Technical Proposal

### Full-Stack Data Pipeline & Interactive Dashboard

**A working prototype demonstrating end-to-end capability for the OMCT GTI 2026 Data Analysis Consultancy**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3dotjs&logoColor=white)](https://d3js.org)
[![R](https://img.shields.io/badge/R-4.3+-276DC3?logo=r&logoColor=white)](https://www.r-project.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Demo](https://gti-2026-proposal.vercel.app) · [R Pipeline Code](#r-scoring-pipeline) · [Architecture](#system-architecture) · [Contact](#contact)

---

<img src="./docs/preview-map.png" alt="GTI Dashboard Preview" width="90%" />

</div>

---

## What Is This?

This repository is a **technical proposal** for the [OMCT Open Call for Consultant: Data Analysis for the 2026 Global Torture Index](https://www.omct.org/en/careers/open-call-for-consultant-data-analysis-for-the-2026-global-torture-index).

Instead of submitting a traditional letter of interest, I built the actual deliverable — a fully functional R scoring pipeline connected to a React + D3.js interactive dashboard — to demonstrate that I can execute every task in the Terms of Reference on day one.

**This is not a concept. This is a working system.**

The prototype replicates the exact GTI methodology as documented in the [OMCT 2025 Methodology Note](https://www.omct.org/site-resources/files/OMCT-GLOBAL-TORTURE-INDEX-2025-METHODOLOGY-NOTE.pdf):

- 7 thematic pillars, 440 unique indicators, 3 weight tiers (1 / 5 / 10)
- Penalised weighted-average scoring with missing-data penalty
- 5-tier risk classification (Very High → Low)
- Transparency & Access to Information scoring
- 27 countries across 5 regions (Africa, Americas, Europe & Central Asia, Asia, MENA)

> All data displayed is **synthetic** (generated via seeded random for reproducibility). The system is designed to ingest real SurveyMonkey CSV/Excel the moment data becomes available.

---

## Why This Proposal Exists

The GTI consultancy requires:

| OMCT Requirement | What This Repo Proves |
|---|---|
| Verify and clean Excel data from partners | `validate_survey()` — schema check, dedup, range validation, cross-partner consistency |
| Develop R scripts for scoring & aggregation | `score_all()` — exact weighted-average + penalty formula |
| Ensure 2025→2026 longitudinal comparability | `compare_years()` — delta analysis, band-shift detection |
| Produce country scores and comparison reports | `export_excel()` — 3-sheet formatted workbook with conditional formatting |
| Support data visualisation for the GTI webpage | This entire React + D3.js dashboard — choropleth, radar, heatmap, trends |
| Provide technical support to the GTI team | Full documentation, modular codebase, JSON API contract |

---

## System Architecture

┌─────────────────────────────────────────────────────────────────┐ │ GTI 2026 SYSTEM ARCHITECTURE │ ├─────────────────────────────────────────────────────────────────┤ │ │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │ │ SurveyMonkey │ │ Excel/CSV │ │ JSON API │ │ │ │ CSV Export │ │ Partners │ │ (future) │ │ │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ │ │ │ │ │ │ └───────────┬───────┴───────────────────┘ │ │ ▼ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │ R SCORING PIPELINE │ │ │ │ │ │ │ │ batch_ingest() → 80+ partner files │ │ │ │ ↓ │ │ │ │ validate_survey() → QA report + cleaned data │ │ │ │ ↓ │ │ │ │ score_pillar() → per-pillar weighted average │ │ │ │ ↓ Σ(wᵢ×xᵢ)/Σ(wᵢ)×100 − penalty │ │ │ │ score_all() → 7 pillars × N countries │ │ │ │ ↓ │ │ │ │ ┌────────────┬────────────┬─────────────┐ │ │ │ │ │ JSON │ Excel │ Factsheets │ │ │ │ │ │ (dashboard)│ (OMCT) │ (per-country)│ │ │ │ │ └─────┬──────┴────────────┴─────────────┘ │ │ │ └────────┼────────────────────────────────────────────┘ │ │ ▼ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │ REACT + D3.js DASHBOARD │ │ │ │ │ │ │ │ ┌───────────────────────────────────────────┐ │ │ │ │ │ Tab 1: Methodology Architecture │ │ │ │ │ │ - Pipeline flow diagram │ │ │ │ │ │ - 7 pillar cards with indicator counts │ │ │ │ │ │ - Scoring formula + weight explanation │ │ │ │ │ │ - Experience match matrix │ │ │ │ │ └───────────────────────────────────────────┘ │ │ │ │ ┌───────────────────────────────────────────┐ │ │ │ │ │ Tab 2: Interactive Global Index │ │ │ │ │ │ - D3 choropleth world map (27 countries) │ │ │ │ │ │ - Country ranking cards │ │ │ │ │ │ - Pillar-by-country heatmap (SVG) │ │ │ │ │ │ - Year-on-year trend sparklines │ │ │ │ │ │ - Country detail: radar + bar charts │ │ │ │ │ └───────────────────────────────────────────┘ │ │ │ └─────────────────────────────────────────────────────┘ │ │ │ │ Data flow: R ──JSON──▶ Dashboard ──render──▶ Browser │ │ Upload: User can drag-drop R JSON to switch from demo │ │ │ └─────────────────────────────────────────────────────────────────┘