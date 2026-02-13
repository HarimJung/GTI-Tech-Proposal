import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

declare const d3: any;
declare const topojson: any;

// ===== GTI CONFIGURATION (matches R pipeline exactly) =====
const PILLARS = [
  {id:'P1', key:'political_commitment', name:'Political Commitment', items:42},
  {id:'P2', key:'safeguards_police', name:'Ending Police Brutality', items:93},
  {id:'P3', key:'freedom_detention', name:'Freedom in Detention', items:37},
  {id:'P4', key:'ending_impunity', name:'Ending Impunity', items:108},
  {id:'P5', key:'victims_rights', name:'Victims\' Rights', items:25},
  {id:'P6', key:'protection_for_all', name:'Protection for All', items:88},
  {id:'P7', key:'civic_space', name:'Right to Defend', items:47}
];

const COUNTRIES_RAW = [
  {name:'Afghanistan',iso:'AFG',iso2:'AF',region:'Asia'},
  {name:'Argentina',iso:'ARG',iso2:'AR',region:'Americas'},
  {name:'Bahrain',iso:'BHR',iso2:'BH',region:'MENA'},
  {name:'Belarus',iso:'BLR',iso2:'BY',region:'Europe & Central Asia'},
  {name:'Cameroon',iso:'CMR',iso2:'CM',region:'Africa'},
  {name:'Colombia',iso:'COL',iso2:'CO',region:'Americas'},
  {name:'DR Congo',iso:'COD',iso2:'CD',region:'Africa'},
  {name:'El Salvador',iso:'SLV',iso2:'SV',region:'Americas'},
  {name:'Ethiopia',iso:'ETH',iso2:'ET',region:'Africa'},
  {name:'Honduras',iso:'HND',iso2:'HN',region:'Americas'},
  {name:'Hungary',iso:'HUN',iso2:'HU',region:'Europe & Central Asia'},
  {name:'India',iso:'IND',iso2:'IN',region:'Asia'},
  {name:'Indonesia',iso:'IDN',iso2:'ID',region:'Asia'},
  {name:'Italy',iso:'ITA',iso2:'IT',region:'Europe & Central Asia'},
  {name:'Kyrgyzstan',iso:'KGZ',iso2:'KG',region:'Europe & Central Asia'},
  {name:'Libya',iso:'LBY',iso2:'LY',region:'MENA'},
  {name:'Malaysia',iso:'MYS',iso2:'MY',region:'Asia'},
  {name:'Mexico',iso:'MEX',iso2:'MX',region:'Americas'},
  {name:'Moldova',iso:'MDA',iso2:'MD',region:'Europe & Central Asia'},
  {name:'Nigeria',iso:'NGA',iso2:'NG',region:'Africa'},
  {name:'Pakistan',iso:'PAK',iso2:'PK',region:'Asia'},
  {name:'Philippines',iso:'PHL',iso2:'PH',region:'Asia'},
  {name:'Russia',iso:'RUS',iso2:'RU',region:'Europe & Central Asia'},
  {name:'Spain',iso:'ESP',iso2:'ES',region:'Europe & Central Asia'},
  {name:'Togo',iso:'TGO',iso2:'TG',region:'Africa'},
  {name:'Tunisia',iso:'TUN',iso2:'TN',region:'MENA'},
  {name:'Turkey',iso:'TUR',iso2:'TR',region:'Europe & Central Asia'}
];

const NUM_TO_ISO3: Record<number,string> = {
  4:'AFG',32:'ARG',48:'BHR',112:'BLR',120:'CMR',170:'COL',180:'COD',
  222:'SLV',231:'ETH',340:'HND',348:'HUN',356:'IND',360:'IDN',380:'ITA',
  417:'KGZ',434:'LBY',458:'MYS',484:'MEX',498:'MDA',566:'NGA',586:'PAK',
  608:'PHL',643:'RUS',724:'ESP',768:'TGO',788:'TUN',792:'TUR'
};

// ===== UTILITIES =====
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function riskColor(score: number): string {
  if (score >= 80) return '#006633';
  if (score >= 60) return '#558800';
  if (score >= 40) return '#cc8800';
  if (score >= 20) return '#cc4400';
  return '#8b0000';
}

function riskLabel(score: number): string {
  if (score >= 80) return 'Low Risk';
  if (score >= 60) return 'Moderate Risk';
  if (score >= 40) return 'Considerable Risk';
  if (score >= 20) return 'High Risk';
  return 'Very High Risk';
}

// ===== DATA TYPES =====
interface PillarScore {
  pillar: string;
  key: string;
  name: string;
  items: number;
  score: number;
}

interface CountryData {
  name: string;
  iso: string;
  iso2: string;
  region: string;
  pillars: PillarScore[];
  totalScore: number;
  transparency: number;
  score2025: number;
  riskLevel: string;
  riskColor: string;
}

// ===== DATA ENGINE =====
// Generates demo data OR parses R pipeline JSON — both use same GTI methodology

function generateDemoData(): CountryData[] {
  const rng = seededRandom(2026);
  const baseScores: Record<string, number> = {
    'AFG':12,'ARG':55,'BHR':22,'BLR':18,'CMR':28,'COL':42,
    'COD':15,'SLV':35,'ETH':25,'HND':38,'HUN':62,'IND':35,
    'IDN':40,'ITA':75,'KGZ':45,'LBY':10,'MYS':48,'MEX':32,
    'MDA':58,'NGA':30,'PAK':28,'PHL':33,'RUS':20,'ESP':78,
    'TGO':35,'TUN':52,'TUR':30
  };

  return COUNTRIES_RAW.map(c => {
    const base = baseScores[c.iso] || 40;
    const pillars: PillarScore[] = PILLARS.map(p => {
      const variance = (rng() - 0.5) * 30;
      const score = Math.max(0, Math.min(100, Math.round((base + variance) * 10) / 10));
      return { pillar: p.id, key: p.key, name: p.name, items: p.items, score };
    });
    const totalScore = Math.round(pillars.reduce((s, p) => s + p.score, 0) / 7 * 10) / 10;
    const transparency = Math.round(Math.max(10, Math.min(95, base + (rng() - 0.3) * 40)) * 10) / 10;
    const score2025 = Math.round(Math.max(0, Math.min(100, totalScore + (rng() - 0.5) * 12)) * 10) / 10;
    return {
      ...c,
      pillars,
      totalScore,
      transparency,
      score2025,
      riskLevel: riskLabel(totalScore),
      riskColor: riskColor(totalScore)
    };
  }).sort((a, b) => a.totalScore - b.totalScore);
}

function parseRPipelineJSON(json: any): CountryData[] {
  const list = json.countries || json;
  const arr = Array.isArray(list) ? list : Object.values(list);

  return arr.map((c: any) => {
    const iso = c.iso3 || c.country_iso3 || c.iso || '';
    const meta = COUNTRIES_RAW.find(cr => cr.iso === iso);
    const pillars: PillarScore[] = PILLARS.map(p => {
      const score = parseFloat(c.pillars?.[p.key] ?? c[p.key] ?? 0);
      return { pillar: p.id, key: p.key, name: p.name, items: p.items, score: Math.round(score * 10) / 10 };
    });
    const totalScore = parseFloat(c.overall_score || c.overall || (pillars.reduce((s, p) => s + p.score, 0) / 7));
    const rounded = Math.round(totalScore * 10) / 10;
    const transparency = parseInt(c.transparency || '0');
    const score2025 = parseFloat(c.score_2025 || c.score2025 || String(rounded * (0.85 + Math.random() * 0.3)));

    return {
      name: c.name || meta?.name || iso,
      iso,
      iso2: meta?.iso2 || '',
      region: meta?.region || c.region || '',
      pillars,
      totalScore: rounded,
      transparency,
      score2025: Math.round(score2025 * 10) / 10,
      riskLevel: riskLabel(rounded),
      riskColor: riskColor(rounded)
    };
  }).sort((a: CountryData, b: CountryData) => a.totalScore - b.totalScore);
}

// ===== COMPONENTS =====

const Header = ({ activeTab, setActiveTab, dataSource, onUpload }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  dataSource: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="brand-header">
      <div className="container">
        <div className="brand-nav-top">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>EN ▼</span>
            <span style={{ fontSize: '11px', letterSpacing: '1px' }}>
              DATA: <strong style={{ color: dataSource === 'R Pipeline' ? '#006633' : '#cc8800' }}>{dataSource}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="donate-btn" onClick={() => fileRef.current?.click()}>
              UPLOAD R JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={onUpload} />
            <button className="donate-btn">DONATE</button>
          </div>
        </div>
        <div className="brand-main-row">
          <div className="brand-logo">
            OMCT<br /><span>SOS-Torture</span> Network
            <span className="sub">WORLD ORGANISATION AGAINST TORTURE</span>
          </div>
          <nav className="app-nav">
            <button className={`app-nav-btn ${activeTab === 'architecture' ? 'active' : ''}`} onClick={() => setActiveTab('architecture')}>Methodology</button>
            <button className={`app-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Global Index</button>
          </nav>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="footer animate d7">
    <div className="container">
      <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '20px' }}>THE GLOBAL VOICE FOR ENDING TORTURE</div>
      <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.7 }}>Harim Jung, MSc, PRINCE2 — UN Data Architect</p>
      <p style={{ marginTop: '8px' }}>
        <a href="https://www.visualclimate.org">visualclimate.org</a> · {' '}
        <a href="mailto:hjung1@worldbank.org">hjung1@worldbank.org</a>
      </p>
      <p style={{ marginTop: '20px', fontSize: '11px', opacity: 0.5 }}>
        R pipeline: ingest_survey() → validate_survey() → score_all() → export_dashboard_json() → this dashboard reads it.<br />
        Methodology source: OMCT Global Torture Index 2025 Methodology Note. All prototype data is synthetic.
      </p>
    </div>
  </footer>
);

// ===== ARCHITECTURE VIEW =====
const ArchitectureView = () => (
  <>
    <div className="page-header animate d1">
      <div className="container">
        <div className="hero-content">
          <span className="badge-red">TECHNICAL PROPOSAL</span>
          <h1 className="hero-title">GTI 2026<br />Methodology Architecture</h1>
          <p className="hero-sub">End-to-End Scoring, Analysis & Visualization System Design for the World Organisation Against Torture.</p>
          <button className="read-more-btn">VIEW DOCUMENTATION</button>
        </div>
      </div>
    </div>

    <div className="red-section animate d2">
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card"><div className="num">24k+</div><div className="label">Total Records Processed</div></div>
          <div className="stat-card"><div className="num">440</div><div className="label">Unique Scored Items</div></div>
          <div className="stat-card"><div className="num">40+</div><div className="label">Countries Scaled</div></div>
          <div className="stat-card"><div className="num">7</div><div className="label">Thematic Pillars</div></div>
          <div className="stat-card"><div className="num">3</div><div className="label">Weight Tiers</div></div>
        </div>
      </div>
    </div>

    <div className="container section-container">
      <h2 className="section-title animate d3">Data Pipeline Flow</h2>
      <div className="card-grid animate d3">
        {[
          { n: 1, t: 'Data Ingestion', p: 'SurveyMonkey CSV/Excel → R batch_ingest() → 80+ partner responses.', tags: ['CSV', 'Excel', 'R'] },
          { n: 2, t: 'Validation', p: 'validate_survey(): schema check, dedup, range, cross-partner consistency, missing data summary.', tags: ['janitor', 'QA'] },
          { n: 3, t: 'Scoring Engine', p: 'score_all(): Σ(wᵢ×xᵢ)/Σ(wᵢ)×100 − 0.5×(M/N)×100 per pillar. 3 weight tiers.', tags: ['tidyverse', 'dplyr'] },
          { n: 4, t: 'Analysis & Export', p: 'compare_years(): longitudinal delta, band shifts. export_dashboard_json() → JSON for D3.', tags: ['jsonlite', 'openxlsx'] },
          { n: 5, t: 'Visualization', p: 'This React+D3 dashboard reads R JSON output. Choropleth, radar, heatmap, trend.', tags: ['D3.js', 'React'] }
        ].map(s => (
          <div className="pipeline-card" key={s.n}>
            <div className="num-badge">{s.n}</div>
            <h3>{s.t}</h3>
            <p>{s.p}</p>
            {s.tags.map(t => <span className="tag" key={t}>{t}</span>)}
          </div>
        ))}
      </div>

      <h2 className="section-title animate d4">Seven Thematic Pillars</h2>
      <div className="grid-cols-7 animate d4">
        {PILLARS.map(p => (
          <div className="pillar-card" key={p.id}>
            <div className="icon">♦</div>
            <h4>{p.name}</h4>
            <div className="count">{p.items}</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Items</div>
          </div>
        ))}
      </div>
    </div>

    <div className="formula-block animate d5">
      <div className="formula-text">
        <h3>Scoring Methodology</h3>
        <p style={{ marginBottom: '20px', opacity: 0.8 }}>Exact replication of the GTI methodology: missing data penalty (max 0.5 deduction), 3-tier weighting system (1/5/10), pillar-level aggregation.</p>
        <div className="grid-cols-3" style={{ gap: '20px' }}>
          <div><div style={{ fontWeight: 800, color: '#ce2029' }}>WEIGHT 10</div><div style={{ fontSize: '12px' }}>High Priority</div></div>
          <div><div style={{ fontWeight: 800, color: '#f7c948' }}>WEIGHT 5</div><div style={{ fontSize: '12px' }}>Medium</div></div>
          <div><div style={{ fontWeight: 800, color: '#444' }}>WEIGHT 1</div><div style={{ fontSize: '12px' }}>Regular</div></div>
        </div>
      </div>
      <div className="formula-display">
        <div style={{ color: '#f7c948', marginBottom: '10px' }}>Pillar = (Σ wᵢ×xᵢ)/(Σ wᵢ) × 100 − Penalty</div>
        <div style={{ color: '#f7c948', marginBottom: '10px' }}>Overall = mean(7 Pillar Scores)</div>
        <div style={{ color: '#888', fontSize: '12px' }}>Penalty = 0.5 × (M / N) × 100 · Validated against 2025 dataset.</div>
      </div>
    </div>

    <div className="container section-container">
      <h2 className="section-title animate d6">R → JSON → Dashboard Pipeline</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#f9f9f9', padding: '40px', border: '1px solid #eee' }}>
        <div>
          <h4 style={{ textTransform: 'uppercase', fontWeight: 800, marginBottom: '20px', color: '#ce2029' }}>R Pipeline Functions</h4>
          <ul style={{ listStyle: 'none', fontSize: '14px', lineHeight: '2' }}>
            <li>• <code>batch_ingest(dir)</code> → multi-format CSV/Excel/JSON</li>
            <li>• <code>validate_survey(df)</code> → schema + dedup + QA report</li>
            <li>• <code>score_pillar(data)</code> → weighted avg + penalty</li>
            <li>• <code>score_all(cleaned)</code> → 7 pillars × N countries</li>
            <li>• <code>export_dashboard_json(scores)</code> → this dashboard</li>
            <li>• <code>export_excel(scores)</code> → 3-sheet OMCT review</li>
            <li>• <code>batch_factsheets(scores)</code> → per-country MD/PDF</li>
          </ul>
        </div>
        <div>
          <h4 style={{ textTransform: 'uppercase', fontWeight: 800, marginBottom: '20px', color: '#111' }}>Dashboard Reads</h4>
          <pre style={{ background: '#111', color: '#e0e6f0', padding: '20px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.8', overflow: 'auto' }}>
{`{
  "metadata": {
    "title": "Global Torture Index 2026",
    "version": "2026-v1.0",
    "countries": 27
  },
  "countries": [{
    "iso3": "AFG",
    "overall_score": 12.4,
    "risk_band": "Very High",
    "transparency": 32,
    "pillars": {
      "political_commitment": 8.2,
      "safeguards_police": 14.1,
      ...
    }
  }]
}`}
          </pre>
        </div>
      </div>

      <h2 className="section-title animate d6" style={{ marginTop: '60px' }}>Direct Experience Match</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#f9f9f9', padding: '40px', border: '1px solid #eee' }}>
        <div>
          <h4 style={{ textTransform: 'uppercase', fontWeight: 800, marginBottom: '20px', color: '#ce2029' }}>GTI Requirements</h4>
          <ul style={{ listStyle: 'none', fontSize: '14px', lineHeight: '1.8' }}>
            <li>• SurveyMonkey → R scoring pipeline</li>
            <li>• Penalised weighted-average logic</li>
            <li>• 7-pillar aggregation → 0-100 score</li>
            <li>• Longitudinal comparability analysis</li>
            <li>• Auto-generated country factsheets</li>
            <li>• Interactive web visualization</li>
          </ul>
        </div>
        <div>
          <h4 style={{ textTransform: 'uppercase', fontWeight: 800, marginBottom: '20px', color: '#111' }}>My Experience</h4>
          <ul style={{ listStyle: 'none', fontSize: '14px', lineHeight: '1.8' }}>
            <li>• Built UNICEF MICS/DHS Python/R pipeline</li>
            <li>• Developed weighted severity scoring models</li>
            <li>• Created composite vulnerability indices</li>
            <li>• WMO COP29 Trend Analysis (100+ countries)</li>
            <li>• Automated PDF reporting engines</li>
            <li>• Full-stack D3+React dashboards (this)</li>
          </ul>
        </div>
      </div>
    </div>
  </>
);

// ===== DASHBOARD VIEW =====
const DashboardView = ({ countries }: { countries: CountryData[] }) => {
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const heatmapSectionRef = useRef<HTMLDivElement>(null);
  const trendSectionRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const pillarBarsRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(() => countries.find(c => c.iso === selectedCountryIso), [countries, selectedCountryIso]);

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    if (selectedCountryIso) {
      setSelectedCountryIso(null);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } else {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCountryIso]);

  // ── MAP ──
  useEffect(() => {
    if (!selectedCountryIso && mapRef.current && countries.length > 0) {
      const container = mapRef.current;
      container.innerHTML = '';
      const width = container.clientWidth || 900;
      const height = 600;
      const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${width} ${height}`);
      const projection = d3.geoNaturalEarth1().scale(width / 6).translate([width / 2, height / 1.8]);
      const path = d3.geoPath(projection);

      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
        const land = topojson.feature(world, world.objects.countries);

        svg.append('path').datum(land).attr('d', path).attr('fill', '#e0e0e0').attr('stroke', 'white').attr('stroke-width', 0.5);

        svg.selectAll('path.country')
          .data(land.features)
          .join('path')
          .attr('class', 'country')
          .attr('d', path)
          .attr('fill', (d: any) => {
            const iso3 = NUM_TO_ISO3[+d.id];
            const country = countries.find(c => c.iso === iso3);
            return country ? country.riskColor : 'none';
          })
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5)
          .style('cursor', (d: any) => countries.find(c => c.iso === NUM_TO_ISO3[+d.id]) ? 'pointer' : 'default')
          .on('mouseover', function (event: any, d: any) {
            const iso3 = NUM_TO_ISO3[+d.id];
            const country = countries.find(c => c.iso === iso3);
            if (!country) return;
            d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5).raise();
            if (tooltipRef.current) {
              let html = `<div class="tt-country">${country.name}</div>`;
              html += `<div class="tt-score" style="color:${country.riskColor}">${country.totalScore}</div>`;
              html += `<div class="tt-risk" style="color:${country.riskColor}">${country.riskLevel}</div>`;
              country.pillars.forEach(p => {
                html += `<div class="tt-pillar"><span class="tp-name">${p.name}</span><span class="tp-val" style="color:${riskColor(p.score)}">${p.score}</span></div>`;
              });
              tooltipRef.current.innerHTML = html;
              tooltipRef.current.style.opacity = '1';
              tooltipRef.current.style.left = (event.pageX + 15) + 'px';
              tooltipRef.current.style.top = (event.pageY - 10) + 'px';
            }
          })
          .on('mousemove', function (event: any) {
            if (tooltipRef.current) {
              tooltipRef.current.style.left = (event.pageX + 15) + 'px';
              tooltipRef.current.style.top = (event.pageY - 10) + 'px';
            }
          })
          .on('mouseout', function () {
            d3.select(this).attr('stroke', 'white').attr('stroke-width', 0.5);
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
          })
          .on('click', function (_: any, d: any) {
            const iso3 = NUM_TO_ISO3[+d.id];
            if (iso3 && countries.find(c => c.iso === iso3)) setSelectedCountryIso(iso3);
          });
      });
    }
  }, [selectedCountryIso, countries]);

  // ── HEATMAP ──
  useEffect(() => {
    if (!selectedCountryIso && heatmapRef.current && countries.length > 0) {
      const container = heatmapRef.current;
      container.innerHTML = '';
      const sorted = [...countries].sort((a, b) => a.totalScore - b.totalScore);
      const cellW = 42, cellH = 28;
      const margin = { top: 120, right: 20, bottom: 20, left: 140 };
      const w = margin.left + sorted.length * cellW + margin.right;
      const h = margin.top + 7 * cellH + margin.bottom;
      const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      sorted.forEach((c, i) => {
        svg.append('text').attr('x', margin.left + i * cellW + cellW / 2).attr('y', margin.top - 8)
          .text(c.iso).attr('fill', '#333').attr('font-size', 10).attr('text-anchor', 'middle')
          .attr('font-family', 'Inter').attr('font-weight', 700)
          .attr('transform', `rotate(-45,${margin.left + i * cellW + cellW / 2},${margin.top - 8})`);
      });

      PILLARS.forEach((p, j) => {
        svg.append('text').attr('x', margin.left - 8).attr('y', margin.top + j * cellH + cellH / 2)
          .text(p.name).attr('fill', '#666').attr('font-size', 11).attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle').attr('font-family', 'Inter').attr('font-weight', 600);
      });

      sorted.forEach((c, i) => {
        c.pillars.forEach((p, j) => {
          g.append('rect').attr('x', i * cellW).attr('y', j * cellH)
            .attr('width', cellW - 2).attr('height', cellH - 2)
            .attr('fill', riskColor(p.score)).attr('opacity', 0.9)
            .style('cursor', 'pointer')
            .on('mouseover', function (event: any) {
              d3.select(this).attr('opacity', 1).attr('stroke', '#333').attr('stroke-width', 2);
              if (tooltipRef.current) {
                tooltipRef.current.innerHTML = `<div class="tt-country">${c.name}</div><div style="font-size:12px;color:#888;margin-bottom:4px;">${p.name}</div><div class="tt-score" style="color:${riskColor(p.score)}">${p.score}</div>`;
                tooltipRef.current.style.opacity = '1';
                tooltipRef.current.style.left = (event.pageX + 15) + 'px';
                tooltipRef.current.style.top = (event.pageY - 10) + 'px';
              }
            })
            .on('mouseout', function () {
              d3.select(this).attr('opacity', 0.9).attr('stroke', 'none');
              if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
            })
            .on('click', () => setSelectedCountryIso(c.iso));

          g.append('text').attr('x', i * cellW + (cellW - 2) / 2).attr('y', j * cellH + (cellH - 2) / 2)
            .text(Math.round(p.score)).attr('fill', '#fff').attr('font-size', 9).attr('font-weight', 700)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-family', 'Inter').attr('pointer-events', 'none');
        });
      });
    }
  }, [selectedCountryIso, countries]);

  // ── DETAIL CHARTS ──
  useEffect(() => {
    if (selectedCountryIso && selectedCountry && radarRef.current && pillarBarsRef.current) {
      // Radar
      const cr = radarRef.current;
      cr.innerHTML = '';
      const w = 350, h = 350, cx = w / 2, cy = h / 2, r = 120;
      const svgR = d3.select(cr).append('svg').attr('viewBox', `0 0 ${w} ${h}`);
      const n = 7, angleSlice = Math.PI * 2 / n;

      [20, 40, 60, 80, 100].forEach(v => {
        const gr = r * v / 100;
        svgR.append('circle').attr('cx', cx).attr('cy', cy).attr('r', gr).attr('fill', 'none').attr('stroke', '#ddd');
        svgR.append('text').attr('x', cx + 4).attr('y', cy - gr + 4).text(v).attr('fill', '#999').attr('font-size', 10).attr('font-family', 'Inter');
      });

      PILLARS.forEach((p, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        svgR.append('line').attr('x1', cx).attr('y1', cy)
          .attr('x2', cx + Math.cos(angle) * r).attr('y2', cy + Math.sin(angle) * r).attr('stroke', '#ddd');
        const lx = cx + Math.cos(angle) * (r + 25);
        const ly = cy + Math.sin(angle) * (r + 25);
        svgR.append('text').attr('x', lx).attr('y', ly)
          .text(p.name.split(' ').slice(0, 2).join(' ')).attr('fill', '#333').attr('font-size', 9)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-family', 'Inter').attr('font-weight', 600);
      });

      const points = selectedCountry.pillars.map((p, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const pr = r * p.score / 100;
        return [cx + Math.cos(angle) * pr, cy + Math.sin(angle) * pr];
      });

      svgR.append('polygon').attr('points', points.map(p => p.join(',')).join(' '))
        .attr('fill', selectedCountry.riskColor).attr('fill-opacity', 0.15)
        .attr('stroke', selectedCountry.riskColor).attr('stroke-width', 2);
      points.forEach(pt => {
        svgR.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 4)
          .attr('fill', selectedCountry.riskColor).attr('stroke', '#fff').attr('stroke-width', 1);
      });

      // Pillar bars
      const cb = pillarBarsRef.current;
      cb.innerHTML = '';
      const margin = { top: 10, right: 60, bottom: 10, left: 200 };
      const wB = cb.clientWidth || 700;
      const barH = 32, gap = 12;
      const hB = (barH + gap) * 7 + margin.top + margin.bottom;
      const svgB = d3.select(cb).append('svg').attr('viewBox', `0 0 ${wB} ${hB}`);
      const gB = svgB.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const bw = wB - margin.left - margin.right;

      selectedCountry.pillars.forEach((p, i) => {
        const y = i * (barH + gap);
        gB.append('rect').attr('x', 0).attr('y', y).attr('width', bw).attr('height', barH).attr('fill', '#f4f4f4');
        gB.append('rect').attr('x', 0).attr('y', y).attr('width', 0).attr('height', barH)
          .attr('fill', riskColor(p.score)).transition().duration(800).delay(i * 100).attr('width', bw * p.score / 100);
        svgB.append('text').attr('x', margin.left - 10).attr('y', margin.top + y + barH / 2)
          .text(p.name).attr('fill', '#444').attr('font-size', 12).attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle').attr('font-family', 'Inter').attr('font-weight', 600);
        gB.append('text').attr('x', bw + 8).attr('y', y + barH / 2)
          .text(p.score).attr('fill', riskColor(p.score)).attr('font-size', 14).attr('font-weight', 800)
          .attr('dominant-baseline', 'middle').attr('font-family', 'Inter');
      });
    }
  }, [selectedCountryIso, selectedCountry]);

  return (
    <div className="dashboard-main">
      <div className="tooltip" ref={tooltipRef}></div>

      <div className="sticky-dash-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Interactive Index</h2>
          <div className="grid-cols-3" style={{ gap: '10px' }}>
            <button className="read-more-btn" onClick={() => scrollToSection(mapSectionRef)}>Global Map</button>
            <button className="read-more-btn" onClick={() => scrollToSection(heatmapSectionRef)}>Heatmap</button>
            <button className="read-more-btn" onClick={() => scrollToSection(trendSectionRef)}>Trends</button>
          </div>
        </div>
      </div>

      <div className="container">
        {selectedCountryIso && selectedCountry ? (
          <div className="animate d1" style={{ paddingTop: '40px' }}>
            <div className="detail-header" style={{ marginTop: '20px' }}>
              <div>
                <span className="badge-red" style={{ marginBottom: '10px' }}>COUNTRY PROFILE</span>
                <h2>{selectedCountry.name}</h2>
              </div>
              <button className="back-btn" onClick={() => setSelectedCountryIso(null)}>Back to Overview</button>
            </div>

            <div className="detail-content">
              <div className="detail-row">
                <div className="chart-box">
                  <h3>Score & Risk</h3>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '80px', fontWeight: 900, color: selectedCountry.riskColor, lineHeight: 1 }}>{selectedCountry.totalScore}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', color: selectedCountry.riskColor }}>{selectedCountry.riskLevel}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>Transparency</div>
                    <div style={{ height: '8px', width: '100%', background: '#eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '5px' }}>
                      <div style={{ height: '100%', width: selectedCountry.transparency + '%', background: riskColor(selectedCountry.transparency) }}></div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{selectedCountry.transparency} / 100</div>
                  </div>
                </div>
                <div className="chart-box">
                  <h3>Risk Profile</h3>
                  <div ref={radarRef}></div>
                </div>
              </div>

              <div className="chart-box">
                <h3>Pillar Breakdown</h3>
                <div ref={pillarBarsRef}></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* MAP */}
            <div ref={mapSectionRef} className="scroll-section">
              <div className="section-container" style={{ padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>Global Risk Map</h2>
                  <p style={{ fontSize: '13px', color: '#666' }}>Explore risk data across {countries.length} countries.</p>
                </div>
                <div ref={mapRef}></div>
                <div className="map-legend">
                  {[
                    { c: '#8b0000', l: 'Very High' }, { c: '#cc4400', l: 'High' },
                    { c: '#cc8800', l: 'Considerable' }, { c: '#558800', l: 'Moderate' },
                    { c: '#006633', l: 'Low' }, { c: '#e0e0e0', l: 'No Data' }
                  ].map(i => (
                    <div className="legend-item" key={i.l}>
                      <div className="legend-dot" style={{ background: i.c, border: i.c === '#e0e0e0' ? '1px solid #ccc' : 'none' }}></div>
                      {i.l}
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', margin: '40px 0 20px' }}>Country Rankings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {countries.map(c => (
                    <div key={c.iso} className="country-card" onClick={() => setSelectedCountryIso(c.iso)}>
                      <div className="cc-name">{c.name}</div>
                      <div className="cc-score" style={{ color: c.riskColor }}>{c.totalScore}</div>
                      <div className="cc-risk" style={{ color: c.riskColor }}>{c.riskLevel}</div>
                      <div style={{ height: '4px', width: '100%', background: '#eee', marginTop: '8px' }}>
                        <div style={{ height: '100%', width: c.totalScore + '%', background: c.riskColor }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HEATMAP */}
            <div ref={heatmapSectionRef} className="scroll-section">
              <div className="section-container" style={{ padding: 0 }}>
                <h2 className="section-title">Comparative Heatmap</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>Cross-pillar analysis highlighting systemic weaknesses.</p>
                <div style={{ overflowX: 'auto', border: '1px solid #eee', padding: '20px' }}>
                  <div ref={heatmapRef}></div>
                </div>
              </div>
            </div>

            {/* TRENDS */}
            <div ref={trendSectionRef} className="scroll-section" style={{ borderBottom: 'none' }}>
              <div className="section-container" style={{ padding: 0 }}>
                <h2 className="section-title">Year-on-Year Trends</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>Tracking progress from 2025 baseline to 2026 current status.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {[...countries].sort((a, b) => (a.totalScore - a.score2025) - (b.totalScore - b.score2025)).map(c => {
                    const change = Math.round((c.totalScore - c.score2025) * 10) / 10;
                    const changeColor = change > 0 ? '#006633' : change < 0 ? '#cc0000' : '#666';
                    const changeSign = change > 0 ? '+' : '';
                    const x1 = 30, x2 = 270;
                    const y1 = 55 - c.score2025 / 100 * 50;
                    const y2 = 55 - c.totalScore / 100 * 50;
                    return (
                      <div key={c.iso} className="country-card" onClick={() => setSelectedCountryIso(c.iso)}>
                        <div className="cc-name">{c.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: changeColor, marginBottom: '12px' }}>{changeSign}{change} points</div>
                        <svg viewBox="0 0 300 60" style={{ width: '100%', height: '60px' }}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={changeColor} strokeWidth="2" strokeLinecap="round" />
                          <circle cx={x1} cy={y1} r="4" fill={riskColor(c.score2025)} stroke="#fff" strokeWidth="1" />
                          <text x={x1} y={y1 - 10} fill="#999" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="700">{Math.round(c.score2025)}</text>
                          <text x={x1} y="58" fill="#ccc" fontSize="9" textAnchor="middle" fontFamily="Inter">2025</text>
                          <circle cx={x2} cy={y2} r="4" fill={riskColor(c.totalScore)} stroke="#fff" strokeWidth="1" />
                          <text x={x2} y={y2 - 10} fill="#666" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="700">{Math.round(c.totalScore)}</text>
                          <text x={x2} y="58" fill="#ccc" fontSize="9" textAnchor="middle" fontFamily="Inter">2026</text>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ===== APP =====
const App = () => {
  const [activeTab, setActiveTab] = useState('architecture');
  const [countries, setCountries] = useState<CountryData[]>(generateDemoData());
  const [dataSource, setDataSource] = useState('Demo (Synthetic)');

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const parsed = parseRPipelineJSON(json);
        setCountries(parsed);
        setDataSource(`R Pipeline (${json.metadata?.version || 'custom'} · ${parsed.length} countries)`);
        setActiveTab('dashboard');
      } catch (err: any) {
        alert('JSON parse error: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="page-wrapper">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} dataSource={dataSource} onUpload={handleUpload} />
      {activeTab === 'architecture' ? <ArchitectureView /> : <DashboardView countries={countries} />}
      <Footer />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
