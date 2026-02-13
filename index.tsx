import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

declare const d3: any;
declare const topojson: any;

// ===== SYNTHETIC DATA ENGINE =====
const PILLARS = [
  {id:'P1',name:'Political Commitment',items:42},
  {id:'P2',name:'Ending Police Brutality',items:93},
  {id:'P3',name:'Freedom in Detention',items:37},
  {id:'P4',name:'Ending Impunity',items:108},
  {id:'P5',name:'Victims\' Rights',items:25},
  {id:'P6',name:'Protection for All',items:88},
  {id:'P7',name:'Right to Defend',items:47}
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

function seededRandom(seed: number){
    let s=seed;
    return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;}
}

// Updated risk colors for light mode (Slightly darker for better contrast on white)
function riskColor(score: number){
  if(score>=80) return '#006633';
  if(score>=60) return '#558800';
  if(score>=40) return '#cc8800';
  if(score>=20) return '#cc4400';
  return '#8b0000';
}

function transparencyLabel(score: number){
  if(score>=80) return 'Transparent';
  if(score>=60) return 'Accessible';
  if(score>=40) return 'Circumscribed';
  if(score>=20) return 'Concealed';
  return 'Suppressive';
}

// ===== COMPONENTS =====

const Header = ({activeTab, setActiveTab}: {activeTab: string, setActiveTab: (t: string)=>void}) => (
  <div className="brand-header">
    <div className="container">
      <div className="brand-nav-top">
        <span>EN ▼</span>
        <span>FOLLOW US ON BLUESKY</span>
        <button className="donate-btn">DONATE</button>
      </div>
      <div className="brand-main-row">
        <div className="brand-logo">
          OMCT<br/><span>SOS-Torture</span> Network
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

const Footer = () => (
  <footer className="footer animate d7">
    <div className="container">
      <div style={{fontSize:'32px', fontWeight:900, marginBottom:'20px'}}>THE GLOBAL VOICE FOR ENDING TORTURE</div>
      <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.7 }}>Harim Jung, MSc, PRINCE2 — UN Data Architect</p>
      <p style={{ marginTop: '8px' }}>
      <a href="https://www.visualclimate.org">visualclimate.org</a> · {' '}
      <a href="mailto:hjung1@worldbank.org">hjung1@worldbank.org</a>
      </p>
      <p style={{ marginTop: '40px', fontSize: '10px', opacity: 0.5 }}>
      All data in the dashboard prototype is synthetic. Built to demonstrate pipeline architecture and scoring methodology comprehension.<br />
      Methodology source: OMCT Global Torture Index 2025 Methodology Note.
      </p>
    </div>
  </footer>
);

const ArchitectureView = () => {
    return (
        <>
        {/* HERO */}
        <div className="page-header animate d1">
            <div className="container">
                <div className="hero-content">
                    <span className="badge-red">TECHNICAL PROPOSAL</span>
                    <h1 className="hero-title">GTI 2026<br/>Methodology Architecture</h1>
                    <p className="hero-sub">End-to-End Scoring, Analysis & Visualization System Design for the World Organisation Against Torture.</p>
                    <button className="read-more-btn">VIEW DOCUMENTATION</button>
                </div>
            </div>
        </div>

        {/* RED STATS BANNER */}
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
            {/* PIPELINE */}
            <h2 className="section-title animate d3">Data Pipeline Flow</h2>
            <div className="card-grid animate d3">
                <div className="pipeline-card">
                    <div className="num-badge">1</div>
                    <h3>Data Ingestion</h3>
                    <p>SurveyMonkey CSV export → 80+ partner responses across 40+ countries.</p>
                    <span className="tag">CSV</span><span className="tag">API</span>
                </div>
                <div className="pipeline-card">
                    <div className="num-badge">2</div>
                    <h3>Validation</h3>
                    <p>Cross-validate 2025→2026 revised questionnaire. Flag discrepancies.</p>
                    <span className="tag">R</span><span className="tag">QA</span>
                </div>
                <div className="pipeline-card">
                    <div className="num-badge">3</div>
                    <h3>Scoring Engine</h3>
                    <p>Penalised weighted-average: 3 weight tiers. Missing data penalty.</p>
                    <span className="tag">Tidyverse</span>
                </div>
                <div className="pipeline-card">
                    <div className="num-badge">4</div>
                    <h3>Analysis</h3>
                    <p>Longitudinal check. Structural break detection. Score recalibration.</p>
                    <span className="tag">Stats</span>
                </div>
                <div className="pipeline-card">
                    <div className="num-badge">5</div>
                    <h3>Output</h3>
                    <p>Interactive choropleth map, radar charts, heatmaps, trend lines.</p>
                    <span className="tag">D3.js</span><span className="tag">React</span>
                </div>
            </div>

            {/* PILLARS */}
            <h2 className="section-title animate d4">Seven Thematic Pillars</h2>
            <div className="grid-cols-7 animate d4">
                {PILLARS.map((p, i) => (
                    <div className="pillar-card" key={p.id}>
                        <div className="icon">♦</div>
                        <h4>{p.name}</h4>
                        <div className="count">{p.items}</div>
                        <div style={{fontSize:'10px', color:'#888', textTransform:'uppercase'}}>Items</div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* FORMULA */}
        <div className="formula-block animate d5">
            <div className="formula-text">
                <h3>Scoring Methodology</h3>
                <p style={{marginBottom:'20px', opacity:0.8}}>The scoring engine implements an exact replication of the GTI methodology, including the missing data penalty (0.5 deduction max) and the 3-tier weighting system (1/5/10).</p>
                <div className="grid-cols-3" style={{gap:'20px'}}>
                    <div><div style={{fontWeight:800, color:'#ce2029'}}>WEIGHT 10</div><div style={{fontSize:'12px'}}>High Priority</div></div>
                    <div><div style={{fontWeight:800, color:'#f7c948'}}>WEIGHT 5</div><div style={{fontSize:'12px'}}>Medium</div></div>
                    <div><div style={{fontWeight:800, color:'#444'}}>WEIGHT 1</div><div style={{fontSize:'12px'}}>Regular</div></div>
                </div>
            </div>
            <div className="formula-display">
                <div style={{color:'#f7c948', marginBottom:'10px'}}>Score = WeightedAvg(R × W) − 0.5 × (M / N)</div>
                <div style={{color:'#888', fontSize:'12px'}}>Robustness validated against 2025 dataset.</div>
            </div>
        </div>

        <div className="container section-container">
            <h2 className="section-title animate d6">Direct Experience Match</h2>
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', background:'#f9f9f9', padding:'40px', border:'1px solid #eee'}}>
                <div>
                    <h4 style={{textTransform:'uppercase', fontWeight:800, marginBottom:'20px', color:'#ce2029'}}>Requirements</h4>
                    <ul style={{listStyle:'none', fontSize:'14px', lineHeight:'1.8'}}>
                        <li>• SurveyMonkey → R scoring pipeline</li>
                        <li>• Penalised weighted-average logic</li>
                        <li>• 7-pillar aggregation → 0-100 score</li>
                        <li>• Longitudinal comparability analysis</li>
                        <li>• Auto-generated country factsheets</li>
                    </ul>
                </div>
                <div>
                    <h4 style={{textTransform:'uppercase', fontWeight:800, marginBottom:'20px', color:'#111'}}>My Experience</h4>
                    <ul style={{listStyle:'none', fontSize:'14px', lineHeight:'1.8'}}>
                        <li>• Built UNICEF MICS/DHS Python/R pipeline</li>
                        <li>• Developed weighted severity scoring models</li>
                        <li>• Created composite vulnerability indices</li>
                        <li>• WMO COP29 Trend Analysis (100+ countries)</li>
                        <li>• Automated PDF reporting engines</li>
                    </ul>
                </div>
             </div>
        </div>
        </>
    );
};

const DashboardView = () => {
    const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(null);
    const [countries, setCountries] = useState<any[]>([]);

    // Section Refs for Scrolling
    const mapSectionRef = useRef<HTMLDivElement>(null);
    const heatmapSectionRef = useRef<HTMLDivElement>(null);
    const trendSectionRef = useRef<HTMLDivElement>(null);

    // Refs for D3 Containers
    const mapRef = useRef<HTMLDivElement>(null);
    const heatmapRef = useRef<HTMLDivElement>(null);
    const radarRef = useRef<HTMLDivElement>(null);
    const pillarBarsRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Initialize Data
    useMemo(() => {
        const rng = seededRandom(2026);
        const data = COUNTRIES_RAW.map((c, idx) => {
            const baseScores: any = {
                'AFG':12,'ARG':55,'BHR':22,'BLR':18,'CMR':28,'COL':42,
                'COD':15,'SLV':35,'ETH':25,'HND':38,'HUN':62,'IND':35,
                'IDN':40,'ITA':75,'KGZ':45,'LBY':10,'MYS':48,'MEX':32,
                'MDA':58,'NGA':30,'PAK':28,'PHL':33,'RUS':20,'ESP':78,
                'TGO':35,'TUN':52,'TUR':30
            };
            const base = baseScores[c.iso] || 40;
            const pillars = PILLARS.map(p => {
                const variance = (rng()-0.5) * 30;
                let score = Math.max(0, Math.min(100, base + variance));
                return {pillar:p.id, name:p.name, items:p.items, score:Math.round(score*10)/10};
            });
            const totalScore = Math.round(pillars.reduce((s,p)=>s+p.score,0)/7*10)/10;
            const transparency = Math.max(10, Math.min(95, base + (rng()-0.3)*40));
            const score2025 = Math.max(0,Math.min(100, totalScore + (rng()-0.5)*12));
            const riskLevel = totalScore>=80?'Low Risk':totalScore>=60?'Moderate Risk':totalScore>=40?'Considerable Risk':totalScore>=20?'High Risk':'Very High Risk';
            const riskColorVal = riskColor(totalScore);
            return {...c, pillars, totalScore, transparency:Math.round(transparency*10)/10, score2025:Math.round(score2025*10)/10, riskLevel, riskColor: riskColorVal};
        }).sort((a,b)=>a.totalScore-b.totalScore);
        setCountries(data);
    }, []);

    const selectedCountry = useMemo(() => {
        return countries.find(c => c.iso === selectedCountryIso);
    }, [countries, selectedCountryIso]);

    const showDetail = (iso: string) => {
        setSelectedCountryIso(iso);
    };

    const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>) => {
        // If in detail view, switch to overview first
        if (selectedCountryIso) {
            setSelectedCountryIso(null);
            // Use setTimeout to allow render to switch back to overview before scrolling
            setTimeout(() => {
                 sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        } else {
             sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Draw Map (Only when in Overview)
    useEffect(() => {
        if (!selectedCountryIso && mapRef.current && countries.length > 0) {
            const container = mapRef.current;
            container.innerHTML = '';
            const width = container.clientWidth;
            const height = 600;
            const svg = d3.select(container).append('svg').attr('viewBox',`0 0 ${width} ${height}`);
            // Adjusted projection for better view
            const projection = d3.geoNaturalEarth1().scale(width/6).translate([width/2, height/1.8]);
            const path = d3.geoPath(projection);

            d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
                const land = topojson.feature(world, world.objects.countries);
                const numToIso3: any = {4:'AFG',32:'ARG',48:'BHR',112:'BLR',120:'CMR',170:'COL',180:'COD',222:'SLV',231:'ETH',340:'HND',348:'HUN',356:'IND',360:'IDN',380:'ITA',417:'KGZ',434:'LBY',458:'MYS',484:'MEX',498:'MDA',566:'NGA',586:'PAK',608:'PHL',643:'RUS',724:'ESP',768:'TGO',788:'TUN',792:'TUR'};
                
                // Draw all land first as light grey
                svg.append('path')
                    .datum(land)
                    .attr('d', path)
                    .attr('fill', '#e0e0e0')
                    .attr('stroke', 'white')
                    .attr('stroke-width', 0.5);

                svg.selectAll('path.country')
                    .data(land.features)
                    .join('path')
                    .attr('class', 'country')
                    .attr('d', path)
                    .attr('fill', (d: any) => {
                        const iso3 = numToIso3[+d.id];
                        const country = countries.find(c=>c.iso===iso3);
                        return country ? country.riskColor : 'none';
                    })
                    .attr('stroke','white')
                    .attr('stroke-width',0.5)
                    .style('cursor', (d: any) => {
                        const iso3 = numToIso3[+d.id];
                        return countries.find(c=>c.iso===iso3) ? 'pointer' : 'default';
                    })
                    .on('mouseover', function(event: any, d: any){
                        const iso3 = numToIso3[+d.id];
                        const country = countries.find(c=>c.iso===iso3);
                        if(!country) return;
                        
                        d3.select(this).attr('stroke','#333').attr('stroke-width',1.5).raise();
                        
                        let html = `<div class="tt-country">${country.name}</div>`;
                        html += `<div class="tt-score" style="color:${country.riskColor}">${country.totalScore}</div>`;
                        html += `<div class="tt-risk" style="color:${country.riskColor}">${country.riskLevel}</div>`;
                        country.pillars.forEach((p: any)=>{
                            html += `<div class="tt-pillar"><span class="tp-name">${p.name}</span><span class="tp-val" style="color:${riskColor(p.score)}">${p.score}</span></div>`;
                        });
                        
                        if (tooltipRef.current) {
                            tooltipRef.current.innerHTML = html;
                            tooltipRef.current.style.opacity = '1';
                            tooltipRef.current.style.left = (event.pageX+15)+'px';
                            tooltipRef.current.style.top = (event.pageY-10)+'px';
                        }
                    })
                    .on('mousemove', function(event: any){
                        if (tooltipRef.current) {
                            tooltipRef.current.style.left = (event.pageX+15)+'px';
                            tooltipRef.current.style.top = (event.pageY-10)+'px';
                        }
                    })
                    .on('mouseout', function(){
                        d3.select(this).attr('stroke','white').attr('stroke-width',0.5);
                        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
                    })
                    .on('click', function(event: any, d: any){
                        const iso3 = numToIso3[+d.id];
                        if(iso3) showDetail(iso3);
                    });
            });
        }
    }, [selectedCountryIso, countries]);

    // Draw Heatmap (Only when in Overview)
    useEffect(() => {
        if (!selectedCountryIso && heatmapRef.current && countries.length > 0) {
            const container = heatmapRef.current;
            container.innerHTML = '';
            const sorted = [...countries].sort((a,b)=>a.totalScore-b.totalScore);
            const cellW=42, cellH=28;
            const margin={top:120,right:20,bottom:20,left:140};
            const w = margin.left + sorted.length*cellW + margin.right;
            const h = margin.top + 7*cellH + margin.bottom;
            
            const svg = d3.select(container).append('svg').attr('width',w).attr('height',h);
            const g = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
            
            sorted.forEach((c,i)=>{
                svg.append('text').attr('x',margin.left+i*cellW+cellW/2).attr('y',margin.top-8).text(c.iso).attr('fill','#333').attr('font-size',10).attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',700)
                .attr('transform',`rotate(-45,${margin.left+i*cellW+cellW/2},${margin.top-8})`);
            });
            
            PILLARS.forEach((p,j)=>{
                svg.append('text').attr('x',margin.left-8).attr('y',margin.top+j*cellH+cellH/2).text(p.name).attr('fill','#666').attr('font-size',11).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-family','Inter').attr('font-weight',600);
            });
            
            sorted.forEach((c,i)=>{
                c.pillars.forEach((p: any,j: any)=>{
                g.append('rect')
                    .attr('x',i*cellW).attr('y',j*cellH)
                    .attr('width',cellW-2).attr('height',cellH-2)
                    .attr('fill',riskColor(p.score))
                    .attr('opacity',0.9)
                    .style('cursor','pointer')
                    .on('mouseover',function(event: any){
                        d3.select(this).attr('opacity',1).attr('stroke','#333').attr('stroke-width',2);
                        if (tooltipRef.current) {
                            tooltipRef.current.innerHTML=`<div class="tt-country">${c.name}</div><div style="font-size:12px;color:#888;margin-bottom:4px;">${p.name}</div><div class="tt-score" style="color:${riskColor(p.score)}">${p.score}</div>`;
                            tooltipRef.current.style.opacity='1';
                            tooltipRef.current.style.left=(event.pageX+15)+'px';
                            tooltipRef.current.style.top=(event.pageY-10)+'px';
                        }
                    })
                    .on('mouseout',function(){
                        d3.select(this).attr('opacity',0.9).attr('stroke','none');
                        if (tooltipRef.current) tooltipRef.current.style.opacity='0';
                    })
                    .on('click',()=>showDetail(c.iso));
                
                g.append('text')
                    .attr('x',i*cellW+(cellW-2)/2).attr('y',j*cellH+(cellH-2)/2)
                    .text(Math.round(p.score))
                    .attr('fill','#fff').attr('font-size',9).attr('font-weight',700)
                    .attr('text-anchor','middle').attr('dominant-baseline','middle')
                    .attr('font-family','Inter').attr('pointer-events','none');
                });
            });
        }
    }, [selectedCountryIso, countries]);

    // Draw Detail Charts (Only when in Detail)
    useEffect(() => {
        if (selectedCountryIso && selectedCountry && radarRef.current && pillarBarsRef.current) {
            // Radar
            const containerR = radarRef.current;
            containerR.innerHTML = '';
            const w=350, h=350, cx=w/2, cy=h/2, r=120;
            const svgR = d3.select(containerR).append('svg').attr('viewBox',`0 0 ${w} ${h}`);
            const n = 7;
            const angleSlice = Math.PI*2/n;
            [20,40,60,80,100].forEach(v=>{
                const gr = r*v/100;
                svgR.append('circle').attr('cx',cx).attr('cy',cy).attr('r',gr).attr('fill','none').attr('stroke','#ddd').attr('stroke-width',1);
                svgR.append('text').attr('x',cx+4).attr('y',cy-gr+4).text(v).attr('fill','#999').attr('font-size',10).attr('font-family','Inter');
            });
            PILLARS.forEach((p,i)=>{
                const angle = angleSlice*i - Math.PI/2;
                const x2 = cx + Math.cos(angle)*r;
                const y2 = cy + Math.sin(angle)*r;
                svgR.append('line').attr('x1',cx).attr('y1',cy).attr('x2',x2).attr('y2',y2).attr('stroke','#ddd');
                const lx = cx + Math.cos(angle)*(r+25);
                const ly = cy + Math.sin(angle)*(r+25);
                svgR.append('text').attr('x',lx).attr('y',ly).text(p.name.split(' ').slice(0,2).join(' ')).attr('fill','#333').attr('font-size',9).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-family','Inter').attr('font-weight',600);
            });
            const points = selectedCountry.pillars.map((p: any, i: number)=>{
                const angle = angleSlice*i - Math.PI/2;
                const pr = r*p.score/100;
                return [cx+Math.cos(angle)*pr, cy+Math.sin(angle)*pr];
            });
            svgR.append('polygon').attr('points', points.map((p: any)=>p.join(',')).join(' ')).attr('fill', selectedCountry.riskColor).attr('fill-opacity',0.15).attr('stroke', selectedCountry.riskColor).attr('stroke-width',2);
            points.forEach((pt: any,i: number)=>{
                svgR.append('circle').attr('cx',pt[0]).attr('cy',pt[1]).attr('r',4).attr('fill',selectedCountry.riskColor).attr('stroke','#fff').attr('stroke-width',1);
            });

            // Bars
            const containerB = pillarBarsRef.current;
            containerB.innerHTML = '';
            const margin={top:10,right:60,bottom:10,left:200};
            const wB=containerB.clientWidth || 700;
            const barH=32, gap=12;
            const hB = (barH+gap)*7 + margin.top + margin.bottom;
            const svgB = d3.select(containerB).append('svg').attr('viewBox',`0 0 ${wB} ${hB}`);
            const gB = svgB.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
            const bw = wB - margin.left - margin.right;
            selectedCountry.pillars.forEach((p: any,i: number)=>{
                const y = i*(barH+gap);
                gB.append('rect').attr('x',0).attr('y',y).attr('width',bw).attr('height',barH).attr('fill','#f4f4f4');
                gB.append('rect').attr('x',0).attr('y',y).attr('width',0).attr('height',barH).attr('fill',riskColor(p.score)).transition().duration(800).delay(i*100).attr('width',bw*p.score/100);
                svgB.append('text').attr('x',margin.left-10).attr('y',margin.top+y+barH/2).text(p.name).attr('fill','#444').attr('font-size',12).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-family','Inter').attr('font-weight',600);
                gB.append('text').attr('x',bw+8).attr('y',y+barH/2).text(p.score).attr('fill',riskColor(p.score)).attr('font-size',14).attr('font-weight',800).attr('dominant-baseline','middle').attr('font-family','Inter');
            });
        }
    }, [selectedCountryIso, selectedCountry]);

    return (
        <div className="dashboard-main">
            <div className="tooltip" ref={tooltipRef}></div>

            {/* STICKY DASHBOARD NAV */}
            <div className="sticky-dash-header">
                <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h2 style={{fontSize:'24px', fontWeight:900, textTransform:'uppercase', margin:0}}>Interactive Index</h2>
                    </div>
                    <div className="grid-cols-3" style={{gap:'10px'}}>
                        <button className="read-more-btn" onClick={() => scrollToSection(mapSectionRef)}>Global Map</button>
                        <button className="read-more-btn" onClick={() => scrollToSection(heatmapSectionRef)}>Heatmap</button>
                        <button className="read-more-btn" onClick={() => scrollToSection(trendSectionRef)}>Trends</button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="container">
                {selectedCountryIso ? (
                    // DETAIL VIEW
                    <div className="animate d1" style={{paddingTop:'40px'}}>
                         {selectedCountry && (
                            <>
                                <div className="detail-header" style={{marginTop:'20px'}}>
                                    <div>
                                        <span className="badge-red" style={{marginBottom:'10px'}}>COUNTRY PROFILE</span>
                                        <h2>{selectedCountry.name}</h2>
                                    </div>
                                    <button className="back-btn" onClick={() => setSelectedCountryIso(null)}>Back to Overview</button>
                                </div>
                                
                                <div className="detail-content">
                                    <div className="detail-row">
                                        <div className="chart-box">
                                            <h3>Score & Risk</h3>
                                            <div style={{textAlign:'center', marginBottom:'40px'}}>
                                                <div style={{fontSize:'80px', fontWeight:900, color:selectedCountry.riskColor, lineHeight:1}}>{selectedCountry.totalScore}</div>
                                                <div style={{fontSize:'16px', fontWeight:800, textTransform:'uppercase', color:selectedCountry.riskColor}}>{selectedCountry.riskLevel}</div>
                                            </div>
                                            <div style={{textAlign:'center'}}>
                                                <div style={{fontSize:'12px', fontWeight:700, color:'#666', marginBottom:'5px', textTransform:'uppercase'}}>Transparency</div>
                                                <div style={{height:'8px', width:'100%', background:'#eee', borderRadius:'4px', overflow:'hidden', marginBottom:'5px'}}>
                                                    <div style={{height:'100%', width:selectedCountry.transparency+'%', background:riskColor(selectedCountry.transparency)}}></div>
                                                </div>
                                                <div style={{fontSize:'12px', fontWeight:700}}>{selectedCountry.transparency} / 100</div>
                                            </div>
                                        </div>
                                        <div className="chart-box">
                                            <h3>Risk Profile</h3>
                                            <div id="radar-chart" ref={radarRef}></div>
                                        </div>
                                    </div>
                                    
                                    <div className="chart-box">
                                        <h3>Pillar Breakdown</h3>
                                        <div id="pillar-bars" ref={pillarBarsRef}></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // OVERVIEW SECTIONS (VERTICAL SCROLL)
                    <>
                        {/* MAP SECTION */}
                        <div ref={mapSectionRef} className="scroll-section">
                            <div className="section-container" style={{padding:0}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'20px'}}>
                                    <h2 className="section-title" style={{marginBottom:0}}>Global Risk Map</h2>
                                    <p style={{fontSize:'13px', color:'#666'}}>Explore risk data across 27 pilot countries.</p>
                                </div>
                                
                                <div id="world-map" ref={mapRef}></div>
                                <div className="map-legend">
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#8b0000'}}></div>Very High</div>
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#cc4400'}}></div>High</div>
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#cc8800'}}></div>Considerable</div>
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#558800'}}></div>Moderate</div>
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#006633'}}></div>Low</div>
                                    <div className="legend-item"><div className="legend-dot" style={{background:'#e0e0e0',border:'1px solid #ccc'}}></div>No Data</div>
                                </div>
                                
                                <h3 style={{fontSize:'18px', fontWeight:800, textTransform:'uppercase', margin:'40px 0 20px 0'}}>Country Rankings</h3>
                                <div className="country-grid grid-cols-7" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'20px'}}>
                                    {countries.map((c: any) => (
                                        <div key={c.iso} className="country-card" onClick={() => showDetail(c.iso)}>
                                            <div className="cc-name">{c.name}</div>
                                            <div className="cc-score" style={{color:c.riskColor}}>{c.totalScore}</div>
                                            <div className="cc-risk" style={{color:c.riskColor}}>{c.riskLevel}</div>
                                            <div style={{height:'4px', width:'100%', background:'#eee', marginTop:'8px'}}>
                                                <div style={{height:'100%', width:c.totalScore+'%', background:c.riskColor}}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* HEATMAP SECTION */}
                        <div ref={heatmapSectionRef} className="scroll-section">
                             <div className="section-container" style={{padding:0}}>
                                <h2 className="section-title">Comparative Heatmap</h2>
                                <p style={{marginBottom:'20px', color:'#666'}}>Cross-pillar analysis highlighting systemic weaknesses.</p>
                                <div style={{overflowX:'auto', border:'1px solid #eee', padding:'20px'}}>
                                    <div id="heatmap" ref={heatmapRef}></div>
                                </div>
                            </div>
                        </div>

                        {/* TRENDS SECTION */}
                        <div ref={trendSectionRef} className="scroll-section" style={{borderBottom:'none'}}>
                            <div className="section-container" style={{padding:0}}>
                                <h2 className="section-title">Year-on-Year Trends</h2>
                                <p style={{marginBottom:'20px', color:'#666'}}>Tracking progress from 2025 baseline to 2026 current status.</p>
                                <div className="trend-grid" ref={trendSectionRef} style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
                                    {countries.slice().sort((a,b)=>(a.totalScore-a.score2025)-(b.totalScore-b.score2025)).map((c: any) => {
                                        const change = Math.round((c.totalScore - c.score2025)*10)/10;
                                        const changeColor = change>0?'#006633':change<0?'#cc0000':'#666';
                                        const changeSign = change>0?'+':'';
                                        const x1=30, x2=270, y1=55-c.score2025/100*50, y2=55-c.totalScore/100*50;
                                        return (
                                            <div key={c.iso} className="country-card" onClick={() => showDetail(c.iso)}>
                                                <div className="cc-name">{c.name}</div>
                                                <div style={{fontSize:'12px', fontWeight:700, color:changeColor, marginBottom:'12px'}}>{changeSign}{change} points</div>
                                                <svg viewBox="0 0 300 60" style={{width:'100%',height:'60px'}}>
                                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={changeColor} strokeWidth="2" strokeLinecap="round" />
                                                    <circle cx={x1} cy={y1} r="4" fill={riskColor(c.score2025)} stroke="#fff" strokeWidth="1" />
                                                    <text x={x1} y={y1-10} fill="#999" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="700">{Math.round(c.score2025)}</text>
                                                    <text x={x1} y="58" fill="#ccc" fontSize="9" textAnchor="middle" fontFamily="Inter">2025</text>

                                                    <circle cx={x2} cy={y2} r="4" fill={riskColor(c.totalScore)} stroke="#fff" strokeWidth="1" />
                                                    <text x={x2} y={y2-10} fill="#666" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="700">{Math.round(c.totalScore)}</text>
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


const App = () => {
  const [activeTab, setActiveTab] = useState('architecture');

  return (
    <div className="page-wrapper">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'architecture' ? <ArchitectureView /> : <DashboardView />}

        <Footer />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
