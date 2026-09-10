"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accessibility, ArrowRight, Bell, CheckCircle2, ChevronDown, ChevronRight,
  Download, FileText, Menu, Search, Settings, ShieldCheck, X, HelpCircle
} from "lucide-react";
import { nirmanProjects, NirmanProject } from "../data/projects";

type Page = "Home" | "Projects" | "Risk Intelligence" | "Decision Support" | "Data & Reliability" | "Reports" | "Settings" | "Help & Support";
type Language = "English" | "हिन्दी";

type Project = NirmanProject;

const images = {
  hero: "https://static.pib.gov.in/WriteReadData/userfiles/image/AOLDW.JPG",
  project: "/images/project-intelligence.jpg",
  risk: "/images/risk-intelligence.png",
  decision: "/images/decision-support.png",
  reliability: "/images/data-reliability.png"
};

const nav: { name: Page; en: string; hi: string }[] = [
  { name: "Home", en: "Home", hi: "होम" },
  { name: "Projects", en: "Projects", hi: "परियोजनाएँ" },
  { name: "Risk Intelligence", en: "Risk Intelligence", hi: "जोखिम आसूचना" },
  { name: "Decision Support", en: "Decision Support", hi: "निर्णय सहायता" },
  { name: "Data & Reliability", en: "Data & Reliability", hi: "डेटा एवं विश्वसनीयता" },
  { name: "Reports", en: "Reports", hi: "रिपोर्ट" },
  { name: "Settings", en: "Settings", hi: "सेटिंग्स" }
];

const t = (language: Language, en: string, hi: string) => language === "English" ? en : hi;
const riskClass = (risk: Project["risk"]) => risk === "Critical" ? "critical" : risk === "Watch" ? "medium" : "low";

export default function NirmanApp() {
  const [page, setPage] = useState<Page>("Home");
  const [selected, setSelected] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [language, setLanguage] = useState<Language>("English");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => { document.documentElement.lang = language === "English" ? "en" : "hi"; }, [language]);

  const filtered = useMemo(() => nirmanProjects.filter(p => `${p.name} ${p.id} ${p.location} ${p.sector} ${p.agency}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600) };
  const go = (next: Page) => { setPage(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const counts = useMemo(() => ({
    total: nirmanProjects.length,
    critical: nirmanProjects.filter(p => p.band === "RED").length,
    watch: nirmanProjects.filter(p => p.band === "AMBER").length,
    low: nirmanProjects.filter(p => p.band === "GREEN").length,
    reliability: Math.round(nirmanProjects.reduce((a, p) => a + p.reliability, 0) / nirmanProjects.length),
    deteriorating: nirmanProjects.filter(p => p.change > 0).length
  }), []);

  return <div className={`app ${accessibility ? "accessibility-mode" : ""}`}>
    <a className="skip-link" href="#main-content">{t(language, "Skip to main content", "मुख्य सामग्री पर जाएँ")}</a>
    <header className="gov-header">
      <div className="utility-bar"><div className="content-width utility-inner">
        <span>{t(language, "Infrastructure Risk & Monitoring Analysis Network", "बुनियादी ढांचा जोखिम एवं निगरानी विश्लेषण नेटवर्क")}</span>
        <div className="utility-links">
          <button onClick={() => go("Help & Support")}><HelpCircle size={13} />{t(language, "Help", "सहायता")}</button>
          <button onClick={() => setAccessibility(v => !v)}><Accessibility size={14} />{t(language, "Accessibility", "अभिगम्यता")}</button>
          <div className="language-menu">
            <button className="language-trigger" aria-haspopup="menu" aria-expanded={languageOpen} onClick={() => setLanguageOpen(v => !v)}>
              {t(language, "Languages", "भाषाएँ")} <ChevronDown size={13} />
            </button>
            {languageOpen && <div className="language-options" role="menu">
              <button role="menuitem" className={language === "English" ? "selected" : ""} onClick={() => { setLanguage("English"); setLanguageOpen(false) }}>English {language === "English" && "✓"}</button>
              <button role="menuitem" className={language === "हिन्दी" ? "selected" : ""} onClick={() => { setLanguage("हिन्दी"); setLanguageOpen(false) }}>हिन्दी {language === "हिन्दी" && "✓"}</button>
            </div>}
          </div>
        </div>
      </div></div>
      <div className="brand-row content-width">
        <button className="mobile-menu" onClick={() => setMobileNav(v => !v)} aria-label={t(language, "Open navigation", "नेविगेशन खोलें")}><Menu size={21} /></button>
        <button className="brand-lockup" onClick={() => go("Home")} aria-label="NIRMAN home">
          <img className="state-emblem" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="State Emblem of India" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-copy"><strong>NIRMAN</strong><small>{t(language, "Infrastructure Risk & Monitoring Analysis Network", "बुनियादी ढांचा जोखिम एवं निगरानी विश्लेषण नेटवर्क")}</small></span>
        </button>
        <div className="co-brand"><span>{t(language, "National infrastructure", "राष्ट्रीय बुनियादी ढांचा")}</span><strong>{t(language, "Decision-support platform", "निर्णय-सहायता मंच")}</strong></div>
        <label className="global-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t(language, "Search projects, reports and services", "परियोजनाएँ, रिपोर्ट और सेवाएँ खोजें")} aria-label={t(language, "Search", "खोजें")} /><kbd>Ctrl K</kbd></label>
      </div>
      <nav className={`global-nav ${mobileNav ? "open" : ""}`} aria-label={t(language, "Global navigation", "मुख्य नेविगेशन")}><div className="content-width nav-inner">
        {nav.map(item => <button key={item.name} className={page === item.name ? "active" : ""} onClick={() => go(item.name)}>{language === "English" ? item.en : item.hi}</button>)}
      </div></nav>
    </header>

    <div className="announcement"><div className="content-width announcement-inner"><strong>{t(language, "Announcements", "घोषणाएँ")}</strong><span>{t(language, "September 2026 portfolio assessment cycle is now available.", "सितंबर 2026 पोर्टफोलियो आकलन चक्र उपलब्ध है।")}</span><button onClick={() => notify(t(language, "Assessment cycle details opened.", "आकलन चक्र का विवरण खोला गया।"))}>{t(language, "View details", "विवरण देखें")}</button></div></div>

    <main id="main-content" className="content-width main-content">
      {notice && <div className="notice"><CheckCircle2 size={16} />{notice}</div>}
      {page === "Home" && <HomePage language={language} counts={counts} onSelect={setSelected} go={go} />}
      {page === "Projects" && <ProjectsPage language={language} projects={filtered} query={query} setQuery={setQuery} onSelect={setSelected} />}
      {page === "Risk Intelligence" && <RiskPage language={language} projects={nirmanProjects} onSelect={setSelected} />}
      {page === "Decision Support" && <Simulator language={language} projects={nirmanProjects} />}
      {page === "Data & Reliability" && <ReliabilityPage language={language} counts={counts} />}
      {page === "Reports" && <ReportsPage language={language} projects={nirmanProjects} onSelect={setSelected} />}
      {page === "Settings" && <SettingsPage language={language} />}
      {page === "Help & Support" && <HelpPage language={language} />}
    </main>

    <footer className="gov-footer">
      <div className="content-width footer-top">
        <div className="footer-brand"><span className="footer-symbol">N</span><div><strong>NIRMAN</strong><span>{t(language, "Infrastructure Risk & Monitoring Analysis Network", "बुनियादी ढांचा जोखिम एवं निगरानी विश्लेषण नेटवर्क")}</span><small>{t(language, "Decision support for infrastructure project monitoring.", "बुनियादी ढांचा परियोजना निगरानी के लिए निर्णय सहायता।")}</small></div></div>
        <div className="footer-cols">
          <div><strong>{t(language, "Website", "वेबसाइट")}</strong><button onClick={() => notify(t(language, "Website policy opened.", "वेबसाइट नीति खोली गई।"))}>{t(language, "Website Policy", "वेबसाइट नीति")}</button><button onClick={() => notify(t(language, "Related links opened.", "संबंधित लिंक खोले गए।"))}>{t(language, "Related Links", "संबंधित लिंक")}</button></div>
          <div><strong>{t(language, "Help", "सहायता")}</strong><button onClick={() => go("Help & Support")}>{t(language, "Help & FAQs", "सहायता एवं सामान्य प्रश्न")}</button><button onClick={() => setAccessibility(v => !v)}>{t(language, "Accessibility", "अभिगम्यता")}</button><button onClick={() => notify(t(language, "Feedback form opened.", "प्रतिक्रिया प्रपत्र खोला गया।"))}>{t(language, "Feedback", "प्रतिक्रिया")}</button></div>
          <div><strong>{t(language, "Resources", "संसाधन")}</strong><button onClick={() => go("Reports")}>{t(language, "Reports", "रिपोर्ट")}</button><button onClick={() => notify(t(language, "Methodology information opened.", "पद्धति की जानकारी खोली गई।"))}>{t(language, "Methodology", "पद्धति")}</button><button onClick={() => go("Data & Reliability")}>{t(language, "Data guidance", "डेटा मार्गदर्शन")}</button></div>
          <div><strong>{t(language, "Contact", "संपर्क")}</strong><button onClick={() => go("Help & Support")}>{t(language, "Support", "सहायता")}</button><button onClick={() => notify(t(language, "NIRMAN contact information opened.", "NIRMAN संपर्क जानकारी खोली गई।"))}>{t(language, "Contact NIRMAN", "NIRMAN से संपर्क करें")}</button><button onClick={() => notify(t(language, "Important links opened.", "महत्वपूर्ण लिंक खोले गए।"))}>{t(language, "Important links", "महत्वपूर्ण लिंक")}</button></div>
        </div>
      </div>
      <div className="footer-bottom"><div className="content-width"><span>{t(language, "Last Updated On: 09.09.2026", "अंतिम अद्यतन: 09.09.2026")}</span><span>{t(language, "Content maintained by NIRMAN", "सामग्री का रखरखाव NIRMAN द्वारा")}</span><span>© NIRMAN</span></div></div>
    </footer>
    {selected && <ProjectPanel language={language} project={selected} onClose={() => setSelected(null)} />}
  </div>
}

function PageHeader({ language, section, title, desc, action }: { language: Language; section: string; title: string; desc: string; action?: React.ReactNode }) {
  return <div className="page-header"><div className="breadcrumb"><button>Home</button><ChevronRight size={13} /><span>{section}</span></div><div className="page-title-row"><div><h1>{title}</h1><p>{desc}</p></div>{action}</div></div>
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`dbim-card ${className}`}>{children}</section> }
function CardHead({ kicker, title, action }: { kicker?: string; title: string; action?: React.ReactNode }) { return <div className="card-head"><div>{kicker && <div className="section-kicker">{kicker}</div>}<h2>{title}</h2></div>{action}</div> }

function HomePage({ language, counts, onSelect, go }: { language: Language; counts: { total: number; critical: number; watch: number; low: number; reliability: number; deteriorating: number }; onSelect: (p: Project) => void; go: (p: Page) => void }) {
  const [activePersona, setActivePersona] = useState("Portfolio Manager");
  const [showMore, setShowMore] = useState(false);
  const persona = language === "English" ? activePersona : ({ "Portfolio Manager": "पोर्टफोलियो प्रबंधक", "Project Owner": "परियोजना स्वामी", "Analyst": "विश्लेषक", "Administrator": "प्रशासक" } as Record<string, string>)[activePersona];
  const topProjects = nirmanProjects.slice().sort((a, b) => b.priority - a.priority).slice(0, 4);
  return <>
    <PageHeader language={language} section={t(language, "Home", "होम")} title={t(language, "Infrastructure Risk Intelligence", "बुनियादी ढांचा जोखिम आसूचना")} desc={t(language, "A clear view of project condition, emerging risks and decisions that require attention.", "परियोजना की स्थिति, उभरते जोखिमों और ध्यान देने योग्य निर्णयों का स्पष्ट अवलोकन।")} action={<span className="cycle-label"><Bell size={14} /> {t(language, "Assessment cycle: September 2026", "आकलन चक्र: सितंबर 2026")}</span>} />
    <section className="image-hero"><img src={images.hero} alt="Indian infrastructure bridge and roadway" /><div className="image-hero-overlay"><h2>{t(language, "See risk early. Understand why. Act with confidence.", "जोखिम को पहले पहचानें। कारण समझें। विश्वास के साथ कार्रवाई करें।")}</h2><p>{t(language, "Use project evidence, risk drivers and scenario testing to move from detection to informed intervention.", "परियोजना साक्ष्य, जोखिम कारकों और परिदृश्य परीक्षण के आधार पर पहचान से सूचित हस्तक्षेप तक जाएँ।")}</p><div className="hero-actions"><button className="btn primary" onClick={() => go("Risk Intelligence")}>{t(language, "Open risk radar", "जोखिम रडार खोलें")}</button><button className="btn image-secondary" onClick={() => go("Decision Support")}>{t(language, "Run simulation", "सिमुलेशन चलाएँ")}</button></div></div><div className="image-credit">Image: Press Information Bureau</div></section>
    <section className="numbered-section"><div className="section-title"><div><span className="eyebrow">{t(language, "PORTFOLIO SNAPSHOT", "पोर्टफोलियो स्थिति")}</span><h2>{t(language, "At a glance", "एक नज़र में")}</h2></div><span className="as-of">{t(language, "As of 09.09.2026", "09.09.2026 तक")}</span></div><div className="numbered-grid"><Numbered number={String(counts.total)} label={t(language, "Projects monitored", "निगरानी में परियोजनाएँ")} detail={t(language, "Current NIRMAN portfolio records", "वर्तमान NIRMAN पोर्टफोलियो रिकॉर्ड")} /><Numbered number={String(counts.critical)} label={t(language, "Critical risk", "गंभीर जोखिम")} detail={t(language, "Projects requiring priority attention", "प्राथमिकता से ध्यान देने योग्य परियोजनाएँ")} tone="alert" /><Numbered number={String(counts.deteriorating).padStart(2, "0")} label={t(language, "Risk deteriorating", "बढ़ता जोखिम")} detail={t(language, "Risk movement above previous assessment", "पिछले आकलन की तुलना में जोखिम वृद्धि")} tone="watch" /><Numbered number={`${counts.reliability}%`} label={t(language, "Data reliability", "डेटा विश्वसनीयता")} detail={t(language, "Portfolio quality index", "पोर्टफोलियो गुणवत्ता सूचकांक")} /></div></section>
    <section className="workflow-strip" aria-label="NIRMAN decision workflow">{["DETECT", "EXPLAIN", "ACT", "SIMULATE"].map((step, i) => <div key={step} className="workflow-step"><span>0{i + 1}</span><strong>{step}</strong><small>{[t(language, "Find emerging exposure", "उभरते जोखिम का पता लगाएँ"), t(language, "See the main drivers", "मुख्य कारक देखें"), t(language, "Review intervention", "हस्तक्षेप की समीक्षा करें"), t(language, "Test the outcome", "परिणाम का परीक्षण करें")][i]}</small></div>)}</section>
    <div className="content-grid home-grid"><Card className="feature-card"><CardHead kicker={t(language, "EARLY WARNING", "प्रारंभिक चेतावनी")} title={t(language, "Projects requiring attention", "ध्यान देने योग्य परियोजनाएँ")} action={<button className="text-btn" onClick={() => go("Projects")}>{t(language, "View all", "सभी देखें")} <ChevronRight size={14} /></button>} /><div className="attention-list">{topProjects.map(p => <button key={p.id} className="attention-row" onClick={() => onSelect(p)}><span className={`risk-dot ${riskClass(p.risk)}`} /><span className="attention-main"><strong>{p.name}</strong><small>{p.location} · {p.sector}</small></span><span className="attention-score"><strong>{p.score}</strong><small>{t(language, "risk", "जोखिम")}</small></span><span className={`delta ${p.change > 0 ? "up" : "down"}`}>{p.change > 0 ? "↑" : "↓"}{Math.abs(p.change).toFixed(1)}%</span></button>)}</div></Card><Card className="image-card"><img src={images.project} alt="Project intelligence illustration" /><div className="image-card-body"><span className="section-kicker">{t(language, "PROJECT INTELLIGENCE", "परियोजना आसूचना")}</span><h2>{t(language, "Move from a portfolio signal to the project story.", "पोर्टफोलियो संकेत से परियोजना की पूरी स्थिति तक जाएँ।")}</h2><p>{t(language, "Open any project to see its current score, movement, primary driver, completion and recommended action.", "किसी परियोजना को खोलकर वर्तमान स्कोर, बदलाव, मुख्य कारक, पूर्णता और अनुशंसित कार्रवाई देखें।")}</p><button className="text-btn" onClick={() => onSelect(topProjects[0])}>{t(language, "Open project intelligence", "परियोजना आसूचना खोलें")} <ArrowRight size={14} /></button></div></Card></div>
    <section className="section-block"><div className="section-title"><div><span className="eyebrow">{t(language, "NIRMAN CAPABILITIES", "NIRMAN क्षमताएँ")}</span><h2>{t(language, "Choose what you need to do", "अपनी आवश्यकता के अनुसार चुनें")}</h2></div></div><div className="tile-grid"><ActionTile language={language} title="Risk Intelligence" hi="जोखिम आसूचना" text="See exposure by project and sector." hiText="परियोजना और क्षेत्र के अनुसार जोखिम देखें।" image={images.risk} onClick={() => go("Risk Intelligence")} /><ActionTile language={language} title="Decision Support" hi="निर्णय सहायता" text="Test delay, cost and contractor scenarios." hiText="देरी, लागत और ठेकेदार परिदृश्यों का परीक्षण करें।" image={images.decision} onClick={() => go("Decision Support")} /><ActionTile language={language} title="Data Reliability" hi="डेटा विश्वसनीयता" text="Check the quality behind every assessment." hiText="हर आकलन के पीछे डेटा की गुणवत्ता जाँचें।" image={images.reliability} onClick={() => go("Data & Reliability")} /></div></section>
    <section className="persona-section"><div className="section-title"><div><span className="eyebrow">{t(language, "PERSONA-BASED NAVIGATION", "भूमिका-आधारित नेविगेशन")}</span><h2>{t(language, "Start from your role", "अपनी भूमिका से शुरू करें")}</h2></div></div><div className="persona-tabs">{["Portfolio Manager", "Project Owner", "Analyst", "Administrator"].map(role => <button key={role} className={activePersona === role ? "active" : ""} onClick={() => setActivePersona(role)}>{language === "English" ? role : ({ "Portfolio Manager": "पोर्टफोलियो प्रबंधक", "Project Owner": "परियोजना स्वामी", "Analyst": "विश्लेषक", "Administrator": "प्रशासक" } as Record<string, string>)[role]}</button>)}</div><div className="persona-panel"><div><span className="section-kicker">{persona.toUpperCase()}</span><h3>{t(language, activePersona === "Portfolio Manager" ? "Prioritise the projects that need attention." : activePersona === "Project Owner" ? "Understand the drivers behind your project risk." : activePersona === "Analyst" ? "Validate evidence and examine risk movement." : "Maintain reliable, accessible decision-support workflows.", activePersona === "Portfolio Manager" ? "ध्यान देने योग्य परियोजनाओं को प्राथमिकता दें।" : activePersona === "Project Owner" ? "अपनी परियोजना के जोखिम के पीछे के कारकों को समझें।" : activePersona === "Analyst" ? "साक्ष्य का सत्यापन करें और जोखिम बदलाव की जाँच करें।" : "विश्वसनीय और सुलभ निर्णय-सहायता कार्यप्रवाह बनाए रखें।")}</h3><p>{t(language, "Use the risk radar, early-warning list and intervention recommendations to focus review time.", "समीक्षा समय को प्राथमिकता देने के लिए जोखिम रडार, प्रारंभिक चेतावनी सूची और हस्तक्षेप अनुशंसाओं का उपयोग करें।")}</p></div><button className="btn secondary" onClick={() => go(activePersona === "Analyst" ? "Data & Reliability" : activePersona === "Administrator" ? "Settings" : activePersona === "Project Owner" ? "Projects" : "Risk Intelligence")}>{t(language, "Continue", "जारी रखें")} <ArrowRight size={14} /></button></div></section>
    <section className="updates-grid"><Card><CardHead kicker={t(language, "WHAT'S NEW", "नवीनतम अपडेट")} title={t(language, "Recent updates", "हालिया अपडेट")} /><div className="news-list"><News language={language} date="09.09.2026" title="September portfolio assessment cycle published" hi="सितंबर पोर्टफोलियो आकलन चक्र प्रकाशित" /><News language={language} date="08.09.2026" title="Risk register refreshed from NIRMAN portfolio records" hi="NIRMAN पोर्टफोलियो रिकॉर्ड से जोखिम रजिस्टर अपडेट" /><News language={language} date="07.09.2026" title="Data validation queue refreshed" hi="डेटा सत्यापन कतार अपडेट" /><News language={language} date="05.09.2026" title="Project intelligence records updated" hi="परियोजना आसूचना रिकॉर्ड अपडेट" /></div></Card><Card><CardHead kicker={t(language, "RECENT DOCUMENTS", "हालिया दस्तावेज़")} title={t(language, "Reports & resources", "रिपोर्ट एवं संसाधन")} /><div className="document-list"><Doc language={language} title="September 2026 Portfolio Risk Assessment" hi="सितंबर 2026 पोर्टफोलियो जोखिम आकलन" /><Doc language={language} title="Project Risk Review Register — September 2026" hi="परियोजना जोखिम समीक्षा रजिस्टर — सितंबर 2026" /><Doc language={language} title="Data Reliability & Validation Report" hi="डेटा विश्वसनीयता एवं सत्यापन रिपोर्ट" />{showMore && <Doc language={language} title="NIRMAN Methodology Note" hi="NIRMAN पद्धति नोट" />}</div><button className="text-btn" onClick={() => setShowMore(v => !v)}>{showMore ? t(language, "Show fewer", "कम देखें") : t(language, "View more documents", "अधिक दस्तावेज़ देखें")} <ChevronDown size={14} /></button></Card></section>
  </>;
}
function Numbered({ number, label, detail, tone = "" }: { number: string; label: string; detail: string; tone?: string }) { return <div className={`numbered ${tone}`}><strong>{number}</strong><div><span>{label}</span><small>{detail}</small></div></div> }
function ActionTile({ language, title, hi, text, hiText, image, onClick }: { language: Language; title: string; hi: string; text: string; hiText: string; image: string; onClick: () => void }) { return <button className="action-tile" onClick={onClick}><img src={image} alt="" /><span><strong>{language === "English" ? title : hi}</strong><small>{language === "English" ? text : hiText}</small><b>{t(language, "Explore", "देखें")} <ArrowRight size={14} /></b></span></button> }
function News({ language, date, title, hi }: { language: Language; date: string; title: string; hi: string }) { return <button className="news-row"><time>{date}</time><span>{language === "English" ? title : hi}</span><ChevronRight size={15} /></button> }
function Doc({ language, title, hi }: { language: Language; title: string; hi: string }) { return <button className="doc-row"><FileText size={18} /><span><strong>{language === "English" ? title : hi}</strong><small>{t(language, "Document · September 2026", "दस्तावेज़ · सितंबर 2026")}</small></span><Download size={15} /></button> }

function ProjectsPage({ language, projects: items, query, setQuery, onSelect }: { language: Language; projects: Project[]; query: string; setQuery: (s: string) => void; onSelect: (p: Project) => void }) { return <><PageHeader language={language} section={t(language, "Projects", "परियोजनाएँ")} title={t(language, "Project Register", "परियोजना रजिस्टर")} desc={t(language, "Search and review monitored infrastructure projects and their current risk condition.", "निगरानी वाली बुनियादी ढांचा परियोजनाओं और उनकी वर्तमान जोखिम स्थिति खोजें और समीक्षा करें।")} /><Card><div className="toolbar"><label className="field-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t(language, "Search by project, location or sector", "परियोजना, स्थान या क्षेत्र से खोजें")} /></label><span className="result-count">{items.length} {t(language, "projects", "परियोजनाएँ")}</span></div><div className="table-wrap"><table><thead><tr><th>{t(language, "Project", "परियोजना")}</th><th>{t(language, "Sector", "क्षेत्र")}</th><th>{t(language, "Location", "स्थान")}</th><th>{t(language, "Risk", "जोखिम")}</th><th>{t(language, "Score", "स्कोर")}</th><th>{t(language, "Trend", "रुझान")}</th><th>{t(language, "Primary driver", "मुख्य कारक")}</th><th>{t(language, "Action", "कार्रवाई")}</th></tr></thead><tbody>{items.map(p => <tr key={p.id}><td><button className="table-link" onClick={() => onSelect(p)}><strong>{p.name}</strong><small>{p.id} · {p.agency}</small></button></td><td>{p.sector}</td><td>{p.location}</td><td><span className={`status ${riskClass(p.risk)}`}><i />{t(language, p.risk, p.risk === "Critical" ? "गंभीर" : p.risk === "Watch" ? "निगरानी" : "कम")}</span></td><td className="number-cell"><strong>{p.score}</strong></td><td><span className={p.change > 0 ? "trend up" : "trend down"}>{p.change > 0 ? "↑" : "↓"} {Math.abs(p.change).toFixed(1)}%</span></td><td>{t(language, p.driver, "वर्तमान परियोजना परिस्थितियाँ")}</td><td><button className="small-btn" onClick={() => onSelect(p)}>{t(language, p.action, "समीक्षा")}</button></td></tr>)}</tbody></table></div></Card></> }

function RiskPage({ language, projects, onSelect }: { language: Language; projects: Project[]; onSelect: (p: Project) => void }) {
  const [hovered, setHovered] = useState<Project | null>(null);
  const ranked = useMemo(() => projects.slice().sort((a, b) => b.priority - a.priority).slice(0, 12), [projects]);
  const costs = projects.map(p => Math.log10(Math.max(p.cost, 1))).sort((a, b) => a - b);
  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const exposure = (p: Project) => ((Math.log10(Math.max(p.cost, 1)) - minCost) / (maxCost - minCost || 1));
  // Use percentile-like spacing for the plotted risk score so equal/high scores remain readable.
  const riskPositions = useMemo(() => {
    const ordered = projects.slice().sort((a, b) => a.score - b.score || a.priority - b.priority);
    const map = new Map<string, number>();
    ordered.forEach((p, i) => map.set(p.id, 8 + (i / Math.max(1, ordered.length - 1)) * 84));
    return map;
  }, [projects]);
  const x = (p: Project) => riskPositions.get(p.id) ?? 50;
  const y = (p: Project) => Math.min(92, Math.max(8, exposure(p) * 82 + 9));
  const sectors = Array.from(new Set(projects.map(p => p.sector))).map(s => ({ sector: s, count: projects.filter(p => p.sector === s).length, critical: projects.filter(p => p.sector === s && p.band === "RED").length })).sort((a, b) => b.critical - a.critical || b.count - a.count).slice(0, 6);
  const maxCritical = Math.max(...sectors.map(s => s.critical), 1);
  return <><PageHeader language={language} section={t(language, "Risk Intelligence", "जोखिम आसूचना")} title={t(language, "Portfolio Risk Intelligence", "पोर्टफोलियो जोखिम आसूचना")} desc={t(language, "See where exposure is concentrated, which sectors are moving, and which projects need review.", "जोखिम कहाँ केंद्रित है, कौन से क्षेत्र बदल रहे हैं और किन परियोजनाओं की समीक्षा चाहिए—यहाँ देखें।")} /><div className="risk-layout"><Card><CardHead kicker={t(language, "PORTFOLIO EXPOSURE", "पोर्टफोलियो जोखिम एक्सपोज़र")} title={t(language, "Risk exposure matrix", "जोखिम एक्सपोज़र मैट्रिक्स")} action={<span className="matrix-note">{t(language, "12 highest-priority projects", "पोर्टफोलियो प्राथमिकता वाली 12 परियोजनाएँ")}</span>} /><div className="matrix-wrap"><div className="matrix-y-label">{t(language, "Financial exposure", "वित्तीय एक्सपोज़र")}</div><div className="matrix-box"><div className="matrix-gridline v25" /><div className="matrix-gridline v50" /><div className="matrix-gridline v75" /><div className="matrix-gridline h25" /><div className="matrix-gridline h50" /><div className="matrix-gridline h75" /><div className="matrix-quadrant q1">{t(language, "MONITOR", "निगरानी")}</div><div className="matrix-quadrant q2">{t(language, "HIGH EXPOSURE", "उच्च एक्सपोज़र")}</div><div className="matrix-quadrant q3">{t(language, "LOW PRIORITY", "कम प्राथमिकता")}</div><div className="matrix-quadrant q4">{t(language, "CRITICAL PRIORITY", "गंभीर प्राथमिकता")}</div>{ranked.map(p => <button key={p.id} className={`matrix-dot ${riskClass(p.risk)}`} style={{ left: `${x(p)}%`, bottom: `${y(p)}%`, width: `${10 + Math.min(13, p.cost / 450)}px`, height: `${10 + Math.min(13, p.cost / 450)}px` }} onMouseEnter={() => setHovered(p)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(p)} onBlur={() => setHovered(null)} onClick={() => onSelect(p)} aria-label={`${p.name}, risk score ${p.score}, ${p.risk} risk, project cost ${p.cost} crore`}>{p.id.replace("P", "")}</button>)}{hovered && <div className="matrix-tooltip"><strong>{hovered.name}</strong><span>{hovered.sector} · {hovered.location}</span><span>{t(language, "Risk", "जोखिम")}: {hovered.score} · ₹{hovered.cost.toLocaleString("en-IN")} Cr</span></div>}</div><div className="matrix-x-labels"><span>{t(language, "Lower likelihood", "कम संभावना")}</span><span>{t(language, "Risk likelihood", "जोखिम संभावना")}</span><span>{t(language, "Higher likelihood", "अधिक संभावना")}</span></div></div><div className="matrix-legend"><span><i className="legend-dot low" />{t(language, "Low", "कम")}</span><span><i className="legend-dot medium" />{t(language, "Watch", "निगरानी")}</span><span><i className="legend-dot critical" />{t(language, "Critical", "गंभीर")}</span><span className="legend-size">{t(language, "Bubble size = project cost", "बबल आकार = परियोजना लागत")}</span></div></Card><Card><CardHead kicker={t(language, "SECTOR VIEW", "क्षेत्र दृश्य")} title={t(language, "Risk by sector", "क्षेत्र के अनुसार जोखिम")} /><div className="sector-bars">{sectors.map(s => <div className="sector-row" key={s.sector}><div><span>{s.sector}</span><strong>{s.critical}</strong></div><div className="bar-track"><span style={{ width: `${(s.critical / maxCritical) * 100}%` }} /></div><small>{s.count} {t(language, "projects", "परियोजनाएँ")}</small></div>)}</div></Card></div><Card><CardHead kicker={t(language, "MOVEMENT", "बदलाव")} title={t(language, "Projects with greatest risk change", "सबसे अधिक जोखिम बदलाव वाली परियोजनाएँ")} /><div className="rank-list">{projects.slice().sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6).map((p, i) => <button key={p.id} onClick={() => onSelect(p)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{p.name}</strong><small>{p.sector} · {p.location}</small><b className={p.change > 0 ? "up" : "down"}>{p.change > 0 ? "↑" : "↓"}{Math.abs(p.change).toFixed(1)}%</b></button>)}</div></Card></>;
}

function Simulator({ language, projects: items }: { language: Language; projects: Project[] }) { const [project, setProject] = useState(items[0].id); const [delay, setDelay] = useState(22); const [cost, setCost] = useState(14); const [contractor, setContractor] = useState(30); const base = items.find(p => p.id === project)?.score || 0; const projected = Math.min(99, Math.round(base + delay * .28 + cost * .34 + contractor * .18)); return <><PageHeader language={language} section={t(language, "Decision Support", "निर्णय सहायता")} title={t(language, "What-if Simulator", "व्हाट-इफ सिमुलेटर")} desc={t(language, "Test project conditions and compare projected risk before recommending an intervention.", "हस्तक्षेप की अनुशंसा से पहले परियोजना परिस्थितियों का परीक्षण करें और अनुमानित जोखिम की तुलना करें।")} /><div className="sim-layout"><Card><CardHead kicker={t(language, "PROJECT CONDITIONS", "परियोजना परिस्थितियाँ")} title={t(language, "Scenario inputs", "परिदृश्य इनपुट")} /><label className="field-label">{t(language, "Project", "परियोजना")}<select value={project} onChange={e => setProject(e.target.value)}>{items.slice(0, 60).map(p => <option key={p.id} value={p.id}>{p.name} · {p.sector}</option>)}</select></label><Slider language={language} label="Schedule delay" hi="अनुसूची देरी" value={delay} setValue={setDelay} suffix=" days" /><Slider language={language} label="Cost escalation" hi="लागत वृद्धि" value={cost} setValue={setCost} suffix="%" /><Slider language={language} label="Contractor performance impact" hi="ठेकेदार प्रदर्शन प्रभाव" value={contractor} setValue={setContractor} suffix=" pts" /><div className="scenario-note"><Bell size={15} />{t(language, "Adjust conditions to see how projected risk changes. This is a decision-support simulation, not a forecast guarantee.", "परिस्थितियों को बदलकर अनुमानित जोखिम में बदलाव देखें। यह निर्णय-सहायता सिमुलेशन है, पूर्वानुमान की गारंटी नहीं।")}</div></Card><Card><CardHead kicker={t(language, "SCENARIO RESULT", "परिदृश्य परिणाम")} title={t(language, "Risk comparison", "जोखिम तुलना")} /><div className="risk-compare"><div><span>{t(language, "Current risk", "वर्तमान जोखिम")}</span><strong>{base}</strong><small>{t(language, "Project score", "परियोजना स्कोर")}</small></div><div className="compare-arrow">→</div><div className="projected"><span>{t(language, "Projected risk", "अनुमानित जोखिम")}</span><strong >{projected}</strong><small>{projected > base ? `+${projected - base}` : t(language, "No increase", "कोई वृद्धि नहीं")} {t(language, "points", "अंक")}</small></div></div><div className="impact-list"><Impact language={language} label="Schedule" hi="अनुसूची" value={Math.round(delay * .28)} /><Impact language={language} label="Cost" hi="लागत" value={Math.round(cost * .34)} /><Impact language={language} label="Contractor" hi="ठेकेदार" value={Math.round(contractor * .18)} /></div><button className="btn primary full" onClick={() => window.print()}>{t(language, "Export scenario", "परिदृश्य निर्यात करें")}</button></Card></div></> }
function Slider({ language, label, hi, value, setValue, suffix }: { language: Language; label: string; hi: string; value: number; setValue: (v: number) => void; suffix: string }) { return <label className="slider-field"><div><span>{language === "English" ? label : hi}</span><strong>{value}{suffix}</strong></div><input type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} /></label> }
function Impact({ language, label, hi, value }: { language: Language; label: string; hi: string; value: number }) { return <div className="impact"><span>{language === "English" ? label : hi}</span><div><i style={{ width: `${Math.min(100, value * 3)}%` }} /></div><strong>+{value}</strong></div> }

function ReliabilityPage({ language, counts }: { language: Language; counts: { total: number; critical: number; watch: number; low: number; reliability: number; deteriorating: number } }) { return <><PageHeader language={language} section={t(language, "Data & Reliability", "डेटा एवं विश्वसनीयता")} title={t(language, "Data Reliability", "डेटा विश्वसनीयता")} desc={t(language, "Monitor completeness, source consistency, freshness and validation issues before each assessment cycle.", "हर आकलन चक्र से पहले पूर्णता, स्रोत संगति, ताजगी और सत्यापन समस्याओं की निगरानी करें।")} /><div className="numbered-grid three"><Numbered number={`${counts.reliability}%`} label={t(language, "Portfolio quality", "पोर्टफोलियो गुणवत्ता")} detail={t(language, "Overall reliability index", "समग्र विश्वसनीयता सूचकांक")} /><Numbered number="06" label={t(language, "Records to review", "समीक्षा हेतु रिकॉर्ड")} detail={t(language, "Validation queue", "सत्यापन कतार")} tone="watch" /><Numbered number="14" label={t(language, "Source feeds", "स्रोत फीड")} detail={t(language, "12 healthy · 2 attention", "12 स्वस्थ · 2 ध्यान योग्य")} /></div><div className="content-grid two-one"><Card><CardHead kicker={t(language, "QUALITY CHECKS", "गुणवत्ता जाँच")} title={t(language, "Portfolio data quality", "पोर्टफोलियो डेटा गुणवत्ता")} /><QualityRow language={language} label="Completeness" hi="पूर्णता" value={94} /><QualityRow language={language} label="Source consistency" hi="स्रोत संगति" value={91} /><QualityRow language={language} label="Reporting freshness" hi="रिपोर्टिंग ताजगी" value={89} /><QualityRow language={language} label="Schema validation" hi="स्कीमा सत्यापन" value={97} /></Card><Card><CardHead kicker={t(language, "VALIDATION QUEUE", "सत्यापन कतार")} title={t(language, "Records requiring review", "समीक्षा आवश्यक रिकॉर्ड")} /><div className="queue"><strong>06</strong><p>{t(language, "Missing milestone dates, stale updates and source mismatches are awaiting review.", "गुम माइलस्टोन तिथियाँ, पुराने अपडेट और स्रोत असंगतियाँ समीक्षा की प्रतीक्षा में हैं।")}</p><button className="small-btn">{t(language, "Open validation queue", "सत्यापन कतार खोलें")}</button></div></Card></div><Card><CardHead kicker={t(language, "SOURCE REGISTER", "स्रोत रजिस्टर")} title={t(language, "Data sources", "डेटा स्रोत")} /><div className="source-grid">{["PAIMANA project records", "Progress reporting feeds", "Financial reporting", "Contractor submissions", "Milestone updates", "Geospatial reference"].map((s, i) => <div key={s}><ShieldCheck size={18} /><span><strong>{s}</strong><small>{i === 4 ? t(language, "Attention required", "ध्यान आवश्यक") : t(language, "Validated · current", "सत्यापित · वर्तमान")}</small></span><b className={i === 4 ? "warning" : "ok"}>{i === 4 ? t(language, "Review", "समीक्षा") : t(language, "Healthy", "स्वस्थ")}</b></div>)}</div></Card></> }
function QualityRow({ language, label, hi, value }: { language: Language; label: string; hi: string; value: number }) { return <div className="quality-row"><div><span>{language === "English" ? label : hi}</span><strong>{value}%</strong></div><div className="quality-track"><span style={{ width: `${value}%` }} /></div></div> }

function ReportsPage({ language, projects, onSelect }: { language: Language; projects: Project[]; onSelect: (p: Project) => void }) {
  const reviewProjects = projects.slice().sort((a, b) => b.priority - a.priority).slice(0, 10);
  return <><PageHeader language={language} section={t(language, "Reports", "रिपोर्ट")} title={t(language, "Project Reviews & Reports", "परियोजना समीक्षा एवं रिपोर्ट")} desc={t(language, "Review project situation alongside the files and assessments associated with each monitoring cycle.", "हर निगरानी चक्र से जुड़े दस्तावेज़ और आकलन के साथ परियोजना की स्थिति की समीक्षा करें।")} /><div className="report-summary"><div><strong>{projects.length}</strong><span>{t(language, "Projects in review register", "समीक्षा रजिस्टर में परियोजनाएँ")}</span></div><div><strong>{reviewProjects.filter(p => p.band === "RED").length}</strong><span>{t(language, "Priority reviews", "प्राथमिकता समीक्षा")}</span></div><div><strong>{reviewProjects.filter(p => p.reliability < 100).length}</strong><span>{t(language, "Data checks flagged", "डेटा जाँच चिन्हित")}</span></div></div><Card><CardHead kicker={t(language, "REVIEW REGISTER", "समीक्षा रजिस्टर")} title={t(language, "Project review files", "परियोजना समीक्षा फाइलें")} /><div className="report-register"><div className="report-register-head"><span>{t(language, "Project / situation", "परियोजना / स्थिति")}</span><span>{t(language, "Risk", "जोखिम")}</span><span>{t(language, "Review file", "समीक्षा फाइल")}</span><span>{t(language, "Updated", "अद्यतन")}</span><span></span></div>{reviewProjects.map(p => <div className="report-register-row" key={p.id}><button className="report-project" onClick={() => onSelect(p)}><strong>{p.name}</strong><small>{p.id} · {p.sector} · {p.location}</small><em>{t(language, p.risk, p.risk === "Critical" ? "गंभीर" : p.risk === "Watch" ? "निगरानी" : "कम")} · {p.score}</em></button><span className={`status ${riskClass(p.risk)}`}><i />{p.score}</span><button className="file-link"><FileText size={15} /><span>{p.band === "RED" ? t(language, "Priority risk review", "प्राथमिकता जोखिम समीक्षा") : t(language, "Monthly project review", "मासिक परियोजना समीक्षा")}</span></button><span>09.09.2026</span><button className="text-action" onClick={() => onSelect(p)}><Download size={14} /></button></div>)}</div></Card></>
}

function SettingsPage({ language }: { language: Language }) { const [alerts, setAlerts] = useState(true); const [email, setEmail] = useState(false); return <><PageHeader language={language} section={t(language, "Settings", "सेटिंग्स")} title={t(language, "Settings", "सेटिंग्स")} desc={t(language, "Manage accessibility, notifications and application preferences.", "अभिगम्यता, सूचनाओं और एप्लिकेशन प्राथमिकताओं का प्रबंधन करें।")} /><div className="content-grid two-one"><Card><CardHead kicker={t(language, "ACCESSIBILITY", "अभिगम्यता")} title={t(language, "User controls", "उपयोगकर्ता नियंत्रण")} /><Toggle language={language} label="High contrast mode" hi="उच्च कंट्रास्ट मोड" value={false} setValue={() => { }} /><Toggle language={language} label="Keyboard navigation support" hi="कीबोर्ड नेविगेशन सहायता" value={true} setValue={() => { }} /><Toggle language={language} label="Screen reader optimisations" hi="स्क्रीन रीडर अनुकूलन" value={true} setValue={() => { }} /></Card><Card><CardHead kicker={t(language, "NOTIFICATIONS", "सूचनाएँ")} title={t(language, "Alerts", "अलर्ट")} /><Toggle language={language} label="Portfolio risk alerts" hi="पोर्टफोलियो जोखिम अलर्ट" value={alerts} setValue={setAlerts} /><Toggle language={language} label="Email summaries" hi="ईमेल सारांश" value={email} setValue={setEmail} /></Card></div><Card><CardHead kicker={t(language, "SYSTEM INFORMATION", "सिस्टम जानकारी")} title={t(language, "NIRMAN platform", "NIRMAN मंच")} /><div className="system-info"><div><span>{t(language, "Application version", "एप्लिकेशन संस्करण")}</span><strong>2.1 · DBIM design-system build</strong></div><div><span>{t(language, "Assessment cycle", "आकलन चक्र")}</span><strong>{t(language, "September 2026", "सितंबर 2026")}</strong></div><div><span>{t(language, "Last updated", "अंतिम अद्यतन")}</span><strong>09.09.2026</strong></div></div></Card></> }
function Toggle({ language, label, hi, value, setValue }: { language: Language; label: string; hi: string; value: boolean; setValue: (v: boolean) => void }) { return <div className="toggle-row"><span>{language === "English" ? label : hi}</span><button className={value ? "toggle on" : "toggle"} onClick={() => setValue(!value)} aria-pressed={value}><i /></button></div> }

function HelpPage({ language }: { language: Language }) {
  const faqs = language === "English"
    ? [
      "How is project risk calculated?",
      "What do the risk bands mean?",
      "How does early warning work?",
      "What does Data Reliability measure?",
      "How should I use the What-if Simulator?"
    ]
    : [
      "परियोजना जोखिम की गणना कैसे होती है?",
      "जोखिम बैंड का क्या अर्थ है?",
      "प्रारंभिक चेतावनी कैसे काम करती है?",
      "डेटा विश्वसनीयता क्या मापती है?",
      "व्हाट-इफ सिमुलेटर का उपयोग कैसे करें?"
    ];
  const answers = language === "English"
    ? [
      "Risk uses project evidence and the trained NIRMAN risk model.",
      "GREEN, AMBER and RED indicate increasing risk attention.",
      "Early warning is based on sustained elevated model risk before a classic reactive signal.",
      "It reflects completeness, consistency, freshness and validation quality.",
      "Use scenario inputs to compare a project's current and simulated risk."
    ]
    : [
      "जोखिम परियोजना साक्ष्य और प्रशिक्षित NIRMAN जोखिम मॉडल का उपयोग करता है।",
      "GREEN, AMBER और RED बढ़ते जोखिम-ध्यान को दर्शाते हैं।",
      "प्रारंभिक चेतावनी क्लासिक प्रतिक्रिया संकेत से पहले लगातार ऊँचे मॉडल जोखिम पर आधारित है।",
      "यह पूर्णता, संगति, ताजगी और सत्यापन गुणवत्ता को दर्शाती है।",
      "परिदृश्य इनपुट से वर्तमान और सिमुलेटेड जोखिम की तुलना करें।"
    ];
  return <>
    <PageHeader language={language} section={t(language, "Help & Support", "सहायता एवं समर्थन")} title={t(language, "Help & Support", "सहायता एवं समर्थन")} desc={t(language, "Find guidance for using NIRMAN, understanding assessments and reporting an issue.", "NIRMAN के उपयोग, आकलन समझने और समस्या रिपोर्ट करने के लिए मार्गदर्शन पाएँ।")} />
    <div className="help-grid">
      <Card>
        <CardHead kicker={t(language, "SEARCH HELP", "सहायता खोजें")} title={t(language, "Find an answer", "उत्तर खोजें")} />
        <label className="field-search"><Search size={17} /><input placeholder={t(language, "Search help, FAQs and guides", "सहायता, सामान्य प्रश्न और गाइड खोजें")} /></label>
      </Card>
      <Card>
        <CardHead kicker={t(language, "CONTACT SUPPORT", "समर्थन से संपर्क")} title={t(language, "Need assistance?", "सहायता चाहिए?")} />
        <p>{t(language, "For a technical issue or incorrect project information, record the project ID and the assessment date before raising a support request.", "तकनीकी समस्या या गलत परियोजना जानकारी के लिए सहायता अनुरोध दर्ज करने से पहले परियोजना ID और आकलन तिथि नोट करें।")}</p>
        <button className="btn primary">{t(language, "Report an issue", "समस्या रिपोर्ट करें")}</button>
      </Card>
    </div>
    <Card>
      <CardHead kicker={t(language, "FREQUENTLY ASKED QUESTIONS", "अक्सर पूछे जाने वाले प्रश्न")} title={t(language, "Common questions", "सामान्य प्रश्न")} />
      <div className="faq-list">
        {faqs.map((q, i) => <button key={q} onClick={() => window.alert(answers[i])}><span>{q}</span><ChevronRight size={15} /></button>)}
      </div>
    </Card>
    <Card>
      <CardHead kicker={t(language, "USER GUIDES", "उपयोगकर्ता गाइड")} title={t(language, "Using NIRMAN", "NIRMAN का उपयोग")} />
      <div className="guide-list">
        <div><strong>{t(language, "Risk Intelligence", "जोखिम आसूचना")}</strong><span>{t(language, "Read portfolio exposure and project movement.", "पोर्टफोलियो एक्सपोज़र और परियोजना बदलाव पढ़ें।")}</span></div>
        <div><strong>{t(language, "Decision Support", "निर्णय सहायता")}</strong><span>{t(language, "Test delay, cost and contractor scenarios.", "देरी, लागत और ठेकेदार परिदृश्यों का परीक्षण करें।")}</span></div>
        <div><strong>{t(language, "Data & Reliability", "डेटा एवं विश्वसनीयता")}</strong><span>{t(language, "Review the quality behind each assessment.", "हर आकलन के पीछे डेटा की गुणवत्ता की समीक्षा करें।")}</span></div>
      </div>
    </Card>
  </>;
}

function ProjectPanel({ language, project, onClose }: { language: Language; project: Project; onClose: () => void }) { return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">{t(language, "PROJECT INTELLIGENCE", "परियोजना आसूचना")}</span><h2>{project.name}</h2><small>{project.id} · {project.sector} · {project.location}</small></div><button onClick={onClose} aria-label={t(language, "Close", "बंद करें")}><X size={19} /></button></div><div className="drawer-score"><div><span>{t(language, "Current risk", "वर्तमान जोखिम")}</span><strong>{project.score}</strong><small className={project.change > 0 ? "up" : "down"}>{project.change > 0 ? "↑" : "↓"} {Math.abs(project.change).toFixed(1)}% {t(language, "vs previous assessment", "पिछले आकलन की तुलना में")}</small></div><span className={`status ${riskClass(project.risk)}`}><i />{t(language, project.risk, project.risk === "Critical" ? "गंभीर" : project.risk === "Watch" ? "निगरानी" : "कम")}</span></div><div className="driver"><span className="eyebrow">{t(language, "PRIMARY DRIVER", "मुख्य कारक")}</span><h3>{project.driver}</h3><p>{t(language, "The current assessment indicates that this factor contributes to the project's present risk condition.", "वर्तमान आकलन दर्शाता है कि यह कारक परियोजना की वर्तमान जोखिम स्थिति में योगदान करता है।")}</p></div><div className="driver-list"><div><span>{t(language, "Recommended action", "अनुशंसित कार्रवाई")}</span><strong>{t(language, project.action, "प्राथमिकता समीक्षा")}</strong></div><div><span>{t(language, "Completion", "पूर्णता")}</span><strong>{project.completion}%</strong></div><div><span>{t(language, "Project cost", "परियोजना लागत")}</span><strong>₹{project.cost.toLocaleString("en-IN")} Cr</strong></div><div><span>{t(language, "Data reliability", "डेटा विश्वसनीयता")}</span><strong>{project.reliability}%</strong></div></div><button className="btn primary full" onClick={onClose}>{t(language, "Close project view", "परियोजना दृश्य बंद करें")}</button></aside></div> }
