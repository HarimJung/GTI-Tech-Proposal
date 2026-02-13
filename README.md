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

## System Architecture

```mermaid
flowchart TB
    A["SurveyMonkey CSV Export"] --> D
    B["Excel / CSV Partners"] --> D
    C["JSON API (future)"] --> D

    subgraph PIPELINE["R Scoring Pipeline"]
        direction TB
        D["batch_ingest() → 80+ partner files"]
        E["validate_survey() → QA report + cleaned data"]
        F["score_pillar() → weighted average"]
        G["score_all() → 7 pillars × N countries"]
        D --> E --> F --> G
    end

    G --> H["JSON (dashboard)"]
    G --> I["Excel (OMCT)"]
    G --> J["Factsheets (per-country)"]

    H --> DASH

    subgraph DASH["React + D3.js Dashboard"]
        direction TB
        subgraph T1["Tab 1 : Methodology"]
            M1["Pipeline flow diagram"]
            M2["7 pillar cards"]
            M3["Scoring formula + weights"]
            M4["Experience match matrix"]
        end
        subgraph T2["Tab 2 : Interactive Global Index"]
            N1["D3 choropleth map — 27 countries"]
            N2["Country ranking cards"]
            N3["Pillar-by-country heatmap"]
            N4["Year-on-year sparklines"]
            N5["Country detail: radar + bar"]
        end
    end

    style PIPELINE fill:#fff3e0,stroke:#ef8e01,stroke-width:2px,color:#000
    style DASH fill:#e8f4fd,stroke:#1a84c7,stroke-width:2px,color:#000
    style T1 fill:#fce4ec,stroke:#d44a6a,stroke-width:1px,color:#000
    style T2 fill:#e0f2f1,stroke:#00897b,stroke-width:1px,color:#000
```

> **Scoring formula** — `Σ(wᵢ × xᵢ) / Σ(wᵢ) × 100 − penalty`
>
> **Data flow** — R → JSON → Dashboard → Browser
>
> **Upload** — drag-drop R JSON to switch from demo data
