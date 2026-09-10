 "use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  Eye,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type Risk = "Critical" | "High" | "Medium" | "Low";

type Project = {
  id: string;
  name: string;
  sector: string;
  location: string;
  risk: Risk;
  score: number;
  change: number;
  driver: string;
  action: string;
  updated: string;
};

const projects: Project[] = [
  { id:"NIRMAN-0241", name:"Delhi–Mumbai Expressway", sector:"Transport", location:"Rajasthan", risk:"High", score:82, change:14, driver:"Schedule delay", action:"Review intervention", updated:"08 Sep 2026" },
  { id:"NIRMAN-0198", name:"Urban Transit Corridor", sector:"Urban Mobility", location:"Maharashtra", risk:"High", score:78, change:9, driver:"Cost escalation", action:"Review cost plan", updated:"08 Sep 2026" },
  { id:"NIRMAN-0312", name:"Eastern Freight Corridor", sector:"Rail Infrastructure", location:"Uttar Pradesh", risk:"Medium", score:64, change:4, driver:"Contractor performance", action:"Monitor", updated:"07 Sep 2026" },
  { id:"NIRMAN-0174", name:"Regional Water Supply Scheme", sector:"Water", location:"Karnataka", risk:"Medium", score:59, change:-6, driver:"Material availability", action:"Monitor", updated:"07 Sep 2026" },
  { id:"NIRMAN-0287", name:"Industrial Logistics Hub", sector:"Logistics", location:"Gujarat", risk:"Low", score:31, change:-11, driver:"No dominant risk", action:"View project", updated:"06 Sep 2026" },
  { id:"NIRMAN-0119", name:"Integrated Power Corridor", sector:"Energy", location:"Madhya Pradesh", risk:"Low", score:27, change:-8, driver:"No dominant risk", action:"View project", updated:"06 Sep 2026" }
];

const riskClass = (risk: Risk) => risk.toLowerCase();

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All Risk");
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = useMemo(() => projects.filter((p) => {
    const haystack = `${p.name} ${p.id} ${p.location} ${p.sector}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) &&
      (riskFilter === "All Risk" || p.risk === riskFilter);
  }), [query, riskFilter]);

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div>
              <div className="brand-title">NIRMAN</div>
              <div className="brand-sub">National Infrastructure Risk &amp; Monitoring Analysis Network</div>
            </div>
          </div>
          <div className="top-actions">
            <div className="status-chip">
              <span className="status-dot" /> System operational
            </div>
            <div className="sync-text">Last sync: 09 Sep 2026, 21:45 IST</div>
            <button className="primary-btn"><Plus size={14} /> New Project</button>
          </div>
        </header>

        <nav className="nav">
          {["Dashboard","Projects","Risk Radar","Data Reliability","Reports"].map((item, i) =>
            <div key={item} className={`nav-item ${i === 0 ? "active" : ""}`}>{item}</div>
          )}
        </nav>

        <section className="heading-row">
          <div>
            <div className="eyebrow">NIRMAN/ Portfolio</div>
            <h1>Infrastructure Risk Dashboard</h1>
            <div className="heading-note">
              Portfolio-level view of project risk, early warnings and recommended interventions.
            </div>
          </div>
          <div className="heading-note update-note"><Bell size={13} /> Assessment cycle: September 2026</div>
        </section>

        <section className="grid kpi-grid">
          <Kpi label="Projects Monitored" value="248" meta="Across 18 infrastructure sectors" />
          <Kpi label="High / Critical Risk" value="17" meta="6.8% of monitored portfolio" />
          <Kpi label="Risk Deteriorating" value="9" meta="↑ from previous assessment" />
          <Kpi label="Data Reliability" value="91%" meta="Portfolio quality index" />
        </section>

        <section className="grid hero-grid">
          <div className="card portfolio-card">
            <div className="card-pad">
              <div className="card-head">
                <div>
                  <div className="section-kicker">Portfolio condition</div>
                  <div className="card-title large-title">Portfolio Risk Overview</div>
                </div>
                <span className="card-link">Risk Radar <ChevronRight size={12} /></span>
              </div>

              <div className="portfolio-main">
                <div className="portfolio-score">
                  <div className="muted-label">Projects requiring attention</div>
                  <div className="big-number">17</div>
                  <div className="subtle">High / Critical risk</div>
                </div>
                <div className="portfolio-facts">
                  <Fact label="Highest current score" value="82" />
                  <Fact label="Deteriorating" value="09" />
                  <Fact label="Data warnings" value="06" />
                </div>
              </div>

              <div className="condition-block">
                <div className="condition-head"><span>Portfolio condition</span><span>248 projects</span></div>
                <Condition label="Stable" count="189" width={92} className="low" />
                <Condition label="Watch" count="42" width={52} className="medium" />
                <Condition label="At Risk" count="10" width={25} className="high" />
                <Condition label="Critical" count="07" width={18} className="critical" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-pad">
              <div className="card-head">
                <div>
                  <div className="section-kicker">Current distribution</div>
                  <div className="card-title large-title">Risk Distribution</div>
                </div>
                <span className="total-label">248 total</span>
              </div>
              <RiskBar label="Critical" count={7} width={18} />
              <RiskBar label="High" count={10} width={25} />
              <RiskBar label="Medium" count={42} width={52} />
              <RiskBar label="Low" count={189} width={92} />
              <div className="distribution-note">17 projects are currently in High or Critical status.</div>
            </div>
          </div>
        </section>

        <section className="grid lower-grid">
          <div className="card">
            <div className="card-pad">
              <div className="card-head">
                <div>
                  <div className="section-kicker">Early warning</div>
                  <div className="card-title large-title">Projects Requiring Attention</div>
                </div>
                <span className="card-link">View All <ChevronRight size={12} /></span>
              </div>
              <div className="attention-list">
                {projects.slice(0, 4).map((p) =>
                  <button key={p.id} className="attention-item" onClick={() => setSelected(p)}>
                    <span className={`dot ${riskClass(p.risk)}`} />
                    <span className="attention-copy">
                      <span className="project-name">{p.name}</span>
                      <span className="project-meta">{p.location} · {p.driver}</span>
                    </span>
                    <span className="attention-score">
                      <strong>{p.score}</strong><small>risk</small>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-pad">
              <div className="card-head">
                <div>
                  <div className="section-kicker">Assessment trend</div>
                  <div className="card-title large-title">Risk Trajectory</div>
                </div>
                <span className="total-label">30 days</span>
              </div>
              <div className="line-chart">
                <div className="gridline one" />
                <div className="gridline two" />
                <div className="gridline three" />
                <svg viewBox="0 0 520 150" preserveAspectRatio="none" aria-label="Risk trajectory">
                  <polyline
                    points="0,117 43,108 86,110 129,94 172,97 215,83 258,91 301,70 344,62 387,51 430,57 473,39 520,49"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="x-labels">{["12 Aug","16","20","24","28","01 Sep","05","09"].map(x => <span key={x}>{x}</span>)}</div>
              </div>
              <div className="chart-foot"><span>Portfolio risk movement</span><strong>↑ 6.2% vs previous period</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-pad">
              <div className="card-head">
                <div>
                  <div className="section-kicker">Quality controls</div>
                  <div className="card-title large-title">Data Reliability</div>
                </div>
                <span className="card-link">Inspect <ChevronRight size={12} /></span>
              </div>
              <div className="reliability">
                <Reliability title="Complete project records" sub="Required fields available" value={94} />
                <Reliability title="Source consistency" sub="Cross-source validation" value={91} />
                <Reliability title="Reporting freshness" sub="Within expected cycle" value={89} />
                <Reliability title="Validation warnings" sub="Records needing review" value={6} />
              </div>
              <div className="quality-note"><span className="quality-marker" /> 6 records require review before the next assessment.</div>
            </div>
          </div>
        </section>

        <section className="card table-card">
          <div className="card-pad table-heading">
            <div>
              <div className="section-kicker">Portfolio register</div>
              <div className="card-title large-title">Project Risk Register</div>
              <div className="heading-note">Search and review projects requiring portfolio-level decisions.</div>
            </div>
            <div className="filters">
              <div className="search-wrap">
                <Search size={14} />
                <input className="search" placeholder="Search project or ID" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <select className="select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
                <option>All Risk</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Project</th><th>Location</th><th>Risk</th><th>Score</th><th>Trend</th><th>Primary Driver</th><th>Recommended Action</th><th>Updated</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(p => <tr key={p.id}>
                  <td className="project-cell"><strong>{p.name}</strong><span>{p.id} · {p.sector}</span></td>
                  <td>{p.location}</td>
                  <td><span className={`pill ${riskClass(p.risk)}`}>{p.risk}</span></td>
                  <td><strong className="table-score">{p.score}</strong></td>
                  <td className={p.change > 0 ? "trend-up" : "trend-down"}>{p.change > 0 ? "↑" : "↓"} {Math.abs(p.change)}%</td>
                  <td>{p.driver}</td>
                  <td>{p.action}</td>
                  <td>{p.updated}</td>
                  <td><button className="text-action" onClick={() => setSelected(p)}>View <ChevronRight size={11} /></button></td>
                </tr>)}
                {filtered.length === 0 && <tr><td colSpan={9} className="empty">No projects match the current search or risk filter.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {filtered.length} sample records of 248 portfolio projects</span>
            <span className="pagination">1&nbsp;&nbsp; 2&nbsp;&nbsp; 3&nbsp;&nbsp; …&nbsp;&nbsp; 25 <ChevronRight size={12} /></span>
          </div>
        </section>

        <footer className="footer">
          NIRMAN· Infrastructure Risk Intelligence · Internal decision-support interface
        </footer>
      </div>

      {selected && <ProjectPanel project={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function Kpi({label, value, meta}:{label:string,value:string,meta:string}) {
  return (
    <div className="card kpi-card">
      <div className="card-pad">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-meta">{meta}</div>
        <div className="kpi-accent" />
      </div>
    </div>
  );
}

function Fact({label, value}:{label:string,value:string}) {
  return <div className="fact"><strong>{value}</strong><span>{label}</span></div>;
}

function Condition({label,count,width,className}:{label:string,count:string,width:number,className:string}) {
  return (
    <div className="condition-row">
      <span>{label}</span><div className="condition-track"><div className={`bar ${className}`} style={{width:`${width}%`}} /></div><strong>{count}</strong>
    </div>
  );
}

function RiskBar({label,count,width}:{label:string,count:number,width:number}) {
  return <div className="bar-row"><span>{label}</span><div className="bar-track"><div className={`bar ${label.toLowerCase()}`} style={{width:`${width}%`}} /></div><strong>{String(count).padStart(2,"0")}</strong></div>;
}

function Reliability({title,sub,value}:{title:string,sub:string,value:number}) {
  return (
    <div className="rel-row">
      <div>
        <div className="rel-title">{title}</div>
        <div className="rel-sub">{sub}</div>
        <div className="progress"><span style={{width:`${value}%`}} /></div>
      </div>
      <div className="rel-num">{value}%</div>
    </div>
  );
}

function ProjectPanel({project,onClose}:{project:Project,onClose:()=>void}) {
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="project-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <div>
            <div className="eyebrow">Project Intelligence</div>
            <h2>{project.name}</h2>
            <div className="heading-note">{project.id} · {project.sector} · {project.location}</div>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </div>

        <div className="current-risk">
          <div>
            <div className="muted-label">Current Risk</div>
            <div className="panel-score">{project.score}</div>
          </div>
          <div className="panel-risk-right">
            <span className={`pill ${riskClass(project.risk)}`}>{project.risk}</span>
            <span className={project.change > 0 ? "trend-up" : "trend-down"}>{project.change > 0 ? "↑" : "↓"} {Math.abs(project.change)}% since assessment</span>
          </div>
        </div>

        <h3>Why is this project at risk?</h3>
        {[
          ["Schedule Delay",31],["Cost Escalation",24],["Contractor Performance",18],["Material Availability",11]
        ].map(([name,val]) =>
          <div className="driver" key={name as string}>
            <div><span>{name}</span><strong>{val}%</strong></div>
            <div className="progress"><span style={{width:`${val}%`}} /></div>
          </div>
        )}

        <h3>Recommended Intervention</h3>
        <div className="recommendation">
          <strong>{project.action}</strong>
          <p>Review the dominant risk driver, validate the latest project evidence and record the intervention decision.</p>
        </div>
        <button className="primary-btn full"><FileText size={14} /> Record Intervention</button>

        <h3>What-if Simulation</h3>
        <div className="simulation">
          <div className="muted-label">Scenario</div>
          <strong>Reduce the dominant risk driver by 20%</strong>
          <div className="simulation-values">
            <div><span>Current</span><strong>{project.score}</strong></div>
            <ChevronRight size={18} />
            <div><span>Illustrative projection</span><strong className="projected">{Math.max(10, project.score - 12)}</strong></div>
          </div>
          <p>Illustrative interface state. Connect this control to the NIRMAN risk engine for production calculations.</p>
        </div>
        <button className="secondary-btn full">Run Simulation</button>
      </aside>
    </div>
  );
}
