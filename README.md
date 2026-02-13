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

flowchart TB
    subgraph INPUT["📥 Data Sources"]
        A["SurveyMonkey\nCSV Export"]
        B["Excel / CSV\nPartners"]
        C["JSON API\n(future)"]
    end

    subgraph PIPELINE["⚙️ R Scoring Pipeline"]
        direction TB
        D["batch_ingest()\n80+ partner files"]
        E["validate_survey()\nQA report + cleaned data"]
        F["score_pillar()\nper-pillar weighted average\n<i>Σ(wᵢ × xᵢ) / Σ(wᵢ) × 100 − penalty</i>"]
        G["score_all()\n7 pillars × N countries"]

        D --> E --> F --> G
    end

    subgraph OUTPUT["📦 Outputs"]
        H["JSON\n(dashboard)"]
        I["Excel\n(OMCT)"]
        J["Factsheets\n(per-country)"]
    end

    subgraph DASHBOARD["🖥️ React + D3.js Dashboard"]
        direction TB
        subgraph TAB1["Tab 1 · Methodology Architecture"]
            K1["Pipeline flow diagram"]
            K2["7 pillar cards with indicator counts"]
            K3["Scoring formula + weight explanation"]
            K4["Experience match matrix"]
        end
        subgraph TAB2["Tab 2 · Interactive Global Index"]
            L1["D3 choropleth world map (27 countries)"]
            L2["Country ranking cards"]
            L3["Pillar-by-country heatmap (SVG)"]
            L4["Year-on-year trend sparklines"]
            L5["Country detail: radar + bar charts"]
        end
    end

    A & B & C --> D
    G --> H & I & J
    H --> DASHBOARD

    style INPUT fill:#e8f4fd,stroke:#2196F3,color:#000
    style PIPELINE fill:#fff3e0,stroke:#FF9800,color:#000
    style OUTPUT fill:#e8f5e9,stroke:#4CAF50,color:#000
    style DASHBOARD fill:#f3e5f5,stroke:#9C27B0,color:#000
    style TAB1 fill:#fce4ec,stroke:#E91E63,color:#000
    style TAB2 fill:#e0f2f1,stroke:#009688,color:#000
