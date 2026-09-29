"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { Empty, ErrorState, Loading, RiskBadge, Section } from "@/components/ui";
import { band as getBand, HEX } from "@/lib/risk";

const RISK_FILL = { GREEN: "#b8e2c6", AMBER: "#ffd274", RED: "#f18b82" };
const STATE_ALIASES = {
  "andaman and nicobar island": "andaman and nicobar islands",
  "arunanchal pradesh": "arunachal pradesh",
  "dadra and nagar havelli and daman and diu": "dadra and nagar haveli and daman and diu",
  "nct of delhi": "delhi",
  "new delhi": "delhi",
  "jandk": "jammu and kashmir",
  "j and k": "jammu and kashmir",
  "orissa": "odisha",
  "pondicherry": "puducherry"
};
const normalizeState = (value) => {
  const key = String(value ?? "").trim().toLocaleLowerCase("en-IN").replaceAll("&", "and").replace(/\s+/g, " ");
  return STATE_ALIASES[key] ?? key;
};
const displayState = (value) => ({
  "Andaman & Nicobar Island": "Andaman and Nicobar Islands",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadra & Nagar Havelli and Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu"
}[value] ?? value);
const MAP_LABELS = {
  "Andaman and Nicobar Islands": "A&N", "Arunachal Pradesh": "AR", Assam: "AS", Manipur: "MN",
  Meghalaya: "ML", Mizoram: "MZ", Nagaland: "NL", Sikkim: "SK", Tripura: "TR",
  "Dadra and Nagar Haveli and Daman and Diu": "DNHDD", Lakshadweep: "LDK", Goa: "GA", Delhi: "DL"
};
const projectColor = (project) => HEX[project.band] ?? HEX[getBand(project.risk)];
const parseViewBox = (value) => String(value).trim().split(/[ ,]+/).map(Number);
const viewBoxString = (box) => box.map((value) => value.toFixed(2)).join(" ");

function animateViewBox(svg, target, onComplete) {
  if (!svg) return () => {};
  const current = parseViewBox(svg.getAttribute("viewBox"));
  const destination = parseViewBox(target);
  if (current.length !== 4 || destination.length !== 4 || [...current, ...destination].some((value) => !Number.isFinite(value))) return () => {};

  let frame = 0;
  const started = performance.now();
  const duration = 420;
  const step = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = current.map((value, index) => value + (destination[index] - value) * eased);
    svg.setAttribute("viewBox", viewBoxString(next));
    if (progress < 1) frame = requestAnimationFrame(step);
    else onComplete?.(viewBoxString(destination));
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

export default function ProjectMapPage() {
  const { data = [], error, loading, retry } = useData(getProjects);
  const [boundaryData, setBoundaryData] = useState(null);
  const [boundaryError, setBoundaryError] = useState("");
  const [boundaryAttempt, setBoundaryAttempt] = useState(0);
  const [selectedState, setSelectedState] = useState("");
  const [mapViewBox, setMapViewBox] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const mapSvgRef = useRef(null);
  const cancelMapAnimation = useRef(null);

  useEffect(() => {
    let current = true;
    setBoundaryError("");
    fetch("/data/india-state-boundaries.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load the India state map.");
        return response.json();
      })
      .then((value) => { if (current) setBoundaryData(value); })
      .catch((cause) => { if (current) setBoundaryError(cause.message || "Unable to load the India state map."); });
    return () => { current = false; };
  }, [boundaryAttempt]);

  const mapStates = useMemo(() => {
    const projectsByState = new Map();
    data.forEach((project) => {
      const key = normalizeState(project.state);
      if (!key) return;
      projectsByState.set(key, [...(projectsByState.get(key) ?? []), project]);
    });
    return (boundaryData?.features ?? []).map((feature) => {
      const name = displayState(feature.name);
      const projects = [...(projectsByState.get(normalizeState(name)) ?? [])].sort((a, b) => b.risk - a.risk);
      return { ...feature, name, projects, highestRisk: projects[0]?.risk ?? 0, highestBand: projects[0]?.band ?? "GREEN" };
    });
  }, [boundaryData, data]);

  useEffect(() => {
    const svg = mapSvgRef.current;
    if (!svg || !boundaryData?.viewBox) return;
    cancelMapAnimation.current?.();
    let target = boundaryData.viewBox;
    let targetZoom = 1;
    if (selectedState) {
      const path = [...svg.querySelectorAll("[data-state-name]")].find((item) => item.dataset.stateName === selectedState);
      if (path) {
        const bounds = path.getBBox();
        const [baseX, baseY, baseWidth, baseHeight] = parseViewBox(boundaryData.viewBox);
        targetZoom = 1.4;
        const width = baseWidth / targetZoom;
        const height = baseHeight / targetZoom;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const x = Math.max(baseX, Math.min(baseX + baseWidth - width, centerX - width / 2));
        const y = Math.max(baseY, Math.min(baseY + baseHeight - height, centerY - height / 2));
        target = viewBoxString([x, y, width, height]);
      }
    }
    setMapZoom(targetZoom);
    cancelMapAnimation.current = animateViewBox(svg, target, setMapViewBox);
    return () => cancelMapAnimation.current?.();
  }, [boundaryData, selectedState]);

  if (loading || (!boundaryData && !boundaryError)) return <Loading rows={6} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (boundaryError) return <ErrorState message={boundaryError} retry={() => { setBoundaryData(null); setBoundaryAttempt((attempt) => attempt + 1); }} />;

  const states = mapStates.filter((state) => state.projects.length > 0).sort((a, b) => b.highestRisk - a.highestRisk);
  const selected = mapStates.find((state) => state.name === selectedState);
  const mappedCount = states.reduce((sum, state) => sum + state.projects.length, 0);
  const riskBandLabel = (state) => state.projects.length ? ({ GREEN: "Stable", AMBER: "Elevated", RED: "Severe" }[state.highestBand] ?? "Unavailable") : "No project forecasts";
  const currentBox = parseViewBox(mapViewBox ?? boundaryData.viewBox);
  const currentZoom = Math.max(1, Math.min(4, mapZoom));
  const visibleProjectMarkers = selectedState
    ? (selected?.projects ?? []).slice(0, 5).map((project) => ({ state: selected, project }))
    : currentZoom >= 1.7
      ? mapStates.filter((state) => state.projects.length && state.centroid[0] >= currentBox[0] && state.centroid[0] <= currentBox[0] + currentBox[2] && state.centroid[1] >= currentBox[1] && state.centroid[1] <= currentBox[1] + currentBox[3])
        .flatMap((state) => state.projects.slice(0, currentZoom >= 2.6 ? 3 : 2).map((project) => ({ state, project })))
      : [];

  const selectState = (state) => setSelectedState((current) => current === state.name ? "" : state.name);
  const zoomTo = (requestedScale) => {
    const svg = mapSvgRef.current;
    if (!svg || !boundaryData?.viewBox) return;
    cancelMapAnimation.current?.();
    const [baseX, baseY, baseWidth, baseHeight] = parseViewBox(boundaryData.viewBox);
    const current = parseViewBox(svg.getAttribute("viewBox"));
    const nextScale = Math.max(1, Math.min(4, requestedScale));
    setMapZoom(nextScale);
    const width = baseWidth / nextScale;
    const height = baseHeight / nextScale;
    const centerX = current[0] + current[2] / 2;
    const centerY = current[1] + current[3] / 2;
    const x = Math.max(baseX, Math.min(baseX + baseWidth - width, centerX - width / 2));
    const y = Math.max(baseY, Math.min(baseY + baseHeight - height, centerY - height / 2));
    cancelMapAnimation.current = animateViewBox(svg, viewBoxString([x, y, width, height]), setMapViewBox);
  };
  const zoomMap = (direction) => zoomTo(currentZoom * direction);
  const resetMapView = () => {
    setSelectedState("");
    setMapZoom(1);
    const svg = mapSvgRef.current;
    if (svg) {
      cancelMapAnimation.current?.();
      cancelMapAnimation.current = animateViewBox(svg, boundaryData.viewBox, setMapViewBox);
    }
  };
  const handleStateKey = (event, state) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectState(state);
    }
  };

  return <>
    <header className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-700">Geographic portfolio view</p>
      <h1 className="mt-2 text-3xl font-bold">Projects across India</h1>
      <p className="mt-2 max-w-3xl text-ink-500">Select a state or territory to see its projects. State shading and the marker show the highest project risk; each project has its own risk colour.</p>
    </header>

    {!data.length ? <Empty message="Add forecast data to view projects on the India map." /> : <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-ink-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Projects on map</p><p className="mt-1 text-2xl font-semibold tabular-nums">{mappedCount}</p></div>
        <div className="border border-ink-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-500">States and territories</p><p className="mt-1 text-2xl font-semibold tabular-nums">{states.length}</p></div>
        <div className="col-span-2 border border-ink-200 bg-white p-4 sm:col-span-1"><p className="text-xs uppercase tracking-wide text-ink-500">Highest project risk</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-risk-green" />Stable</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-risk-amber" />Elevated</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-risk-red" />Severe</span></div></div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Section title="India project map" hint="Select a state to focus the map and show its five highest-risk project markers. The full state project list appears alongside.">
          <div className="hidden">
            <button type="button" onClick={() => zoomMap(1.5)} aria-label="Zoom in on map" className="btn-ghost h-9 w-9 px-0 text-lg" title="Zoom in">+</button>
            <button type="button" onClick={() => zoomMap(1 / 1.5)} aria-label="Zoom out on map" className="btn-ghost h-9 w-9 px-0 text-lg" title="Zoom out">−</button>
            <button type="button" onClick={() => { setSelectedState(""); const svg = mapSvgRef.current; if (svg) { cancelMapAnimation.current?.(); cancelMapAnimation.current = animateViewBox(svg, boundaryData.viewBox, setMapViewBox); } }} className="btn-ghost h-9 px-3 text-xs">Reset view</button>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => zoomMap(1 / 1.35)} disabled={currentZoom <= 1.01} aria-label="Zoom out on map" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-xl font-semibold text-slate-700 shadow-sm transition hover:border-gov-700 hover:bg-gov-50 disabled:cursor-not-allowed disabled:opacity-40" title="Zoom out">−</button>
              <button type="button" onClick={() => zoomMap(1.25)} disabled={currentZoom >= 3.95} aria-label="Zoom in on map" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-xl font-semibold text-slate-700 shadow-sm transition hover:border-gov-700 hover:bg-gov-50 disabled:cursor-not-allowed disabled:opacity-40" title="Zoom in">+</button>
              <label className="ml-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500"><span>Zoom</span><input type="range" min="1" max="4" step="0.1" value={currentZoom} onChange={(event) => zoomTo(Number(event.target.value))} aria-label="Map zoom level" className="w-24 accent-gov-800 sm:w-36" /><span className="w-10 text-right tabular-nums">{currentZoom.toFixed(1)}×</span></label>
            </div>
            <button type="button" onClick={resetMapView} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-gov-700 hover:bg-gov-50">Reset map</button>
          </div>
          <div className="mx-auto max-w-[740px] overflow-hidden rounded-sm border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-3 shadow-inner sm:p-5">
            <svg ref={mapSvgRef} viewBox={mapViewBox ?? boundaryData.viewBox} role="img" aria-label="Labeled map of Indian states and union territories, shaded by highest project risk" className="mx-auto block h-auto max-h-[800px] w-full">
              {mapStates.map((state) => {
                const active = selectedState === state.name;
                const fill = state.projects.length ? RISK_FILL[state.highestBand] : "#dceaf1";
                return <path key={state.code || state.name} data-state-name={state.name} d={state.path} fill={fill} fillRule="evenodd" stroke={active ? "#164e63" : "#ffffff"} strokeWidth={active ? 2.6 : 1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" role="button" tabIndex={0} aria-label={`${state.name}, ${state.projects.length} projects, ${riskBandLabel(state)}`} aria-pressed={active} onClick={() => selectState(state)} onKeyDown={(event) => handleStateKey(event, state)} className="cursor-pointer transition-[filter,stroke] duration-200 hover:brightness-95 focus-visible:outline-none">
                  <title>{`${state.name}: ${state.projects.length} projects · ${riskBandLabel(state)}`}</title>
                </path>;
              })}
              {states.map((state) => {
                const active = selectedState === state.name;
                const [x, y] = state.centroid;
                const color = HEX[state.highestBand] ?? HEX.GREEN;
                return <g key={`marker-${state.code || state.name}`} role="button" tabIndex={0} aria-label={`Open ${state.name}: ${state.projects.length} projects`} onClick={() => selectState(state)} onKeyDown={(event) => handleStateKey(event, state)} className="cursor-pointer">
                  <circle cx={x} cy={y} r="12" fill={color} fillOpacity="0.18" />
                  {active && <circle cx={x} cy={y} r="12" fill="none" stroke="#164e63" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                  <circle cx={x} cy={y} r="7.5" fill={color} stroke="white" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <title>{`${state.name}: ${state.projects.length} projects · ${state.highestRisk.toFixed(1)}% highest risk`}</title>
                </g>;
              })}
              {mapStates.map((state) => {
                const [x, y] = state.centroid;
                const label = MAP_LABELS[state.name] ?? state.name;
                const projects = visibleProjectMarkers.filter((marker) => marker.state.name === state.name);
                if (selectedState === state.name && projects.length) return <g key={`labels-${state.code || state.name}`}>
                  {projects.map(({ project }, index) => {
                    const count = projects.length;
                    const markerY = y + (index - (count - 1) / 2) * 17;
                    const color = projectColor(project);
                    const markerLabel = `${project.risk.toFixed(1)}% · ${project.name}`;
                    return <Link key={project.id} href={`/projects/${encodeURIComponent(project.id)}`} aria-label={`Open priority project ${project.name}, risk index ${project.risk.toFixed(1)} percent, ${state.name}`} className="cursor-pointer">
                      <title>{`${project.name} · ${state.name} · ${project.risk.toFixed(1)}% risk index · open project`}</title>
                      <circle cx={x} cy={markerY} r="7" fill={color} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      <circle cx={x} cy={markerY} r="3" fill="white" />
                      <path d={`M${x + 6} ${markerY}h7`} stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                      <rect x={x + 12} y={markerY - 9} width="150" height="18" rx="5" fill="white" fillOpacity=".96" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                      <text x={x + 18} y={markerY + 3} fill="#102a43" fontSize="8" fontWeight="700" textLength="138" lengthAdjust="spacingAndGlyphs" pointerEvents="none">{markerLabel}</text>
                    </Link>;
                  })}
                </g>;
                const showPriorityMarkers = currentZoom >= 1.7 && projects.length > 0;
                return <g key={`labels-${state.code || state.name}`}>
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#17324d" stroke="white" strokeWidth="3.5" paintOrder="stroke" fontSize="10" fontWeight="700" pointerEvents="none" aria-hidden="true"><title>{state.name}</title>{label}</text>
                  {showPriorityMarkers && projects.map(({ project }, index) => {
                    const count = projects.length;
                    const markerY = y + (index - (count - 1) / 2) * 15;
                    const color = projectColor(project);
                    const markerLabel = `${project.risk.toFixed(1)}% · ${project.name}`;
                    return <Link key={project.id} href={`/projects/${encodeURIComponent(project.id)}`} aria-label={`Open priority project ${project.name}, risk index ${project.risk.toFixed(1)} percent, ${state.name}`} className="cursor-pointer">
                      <title>{`${project.name} · ${state.name} · ${project.risk.toFixed(1)}% risk index · open project`}</title>
                      <circle cx={x} cy={markerY} r="6" fill={color} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      <circle cx={x} cy={markerY} r="2.5" fill="white" />
                      {currentZoom >= 2.3 && <><path d={`M${x + 5} ${markerY}h10`} stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><rect x={x + 14} y={markerY - 8} width="145" height="16" rx="4" fill="white" fillOpacity=".96" stroke={color} strokeWidth="1.1" vectorEffect="non-scaling-stroke" /><text x={x + 19} y={markerY + 3} fill="#102a43" fontSize="7.5" fontWeight="700" textLength="135" lengthAdjust="spacingAndGlyphs" pointerEvents="none">{markerLabel}</text></>}
                    </Link>;
                  })}
                </g>;
              })}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
          
            <a href="https://www.nwdp.nwic.gov.in/hi/dataset/state-boundary" target="_blank" rel="noreferrer" className="text-gov-800 underline underline-offset-2">Boundary source: Survey of India / NWIC</a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Select a state">
           
          </div>
        </Section>

        <section id="state-projects" aria-live="polite" className="border border-ink-200 bg-white p-5">
          {selected ? <>
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 pb-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-gov-700">Selected state or territory</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2><p className="mt-1 text-sm text-ink-500">{selected.projects.length} {selected.projects.length === 1 ? "project" : "projects"}{selected.projects.length > 0 && ` · highest risk ${selected.highestRisk.toFixed(1)}%`}</p></div>
              <button type="button" onClick={() => setSelectedState("")} aria-label="Close state details" className="btn-ghost px-3 py-1.5">Close</button>
            </div>
            {selected.projects.length ? <ul className="divide-y divide-ink-200">
              {selected.projects.map((project) => <li key={project.id} className="py-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: projectColor(project) }} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/projects/${encodeURIComponent(project.id)}`} className="font-semibold text-gov-800 hover:underline">{project.name}</Link>
                    <p className="mt-1 text-xs text-ink-500">{project.district || project.city_district || project.city || "District unavailable"} · {project.sector}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><RiskBadge band={project.band} /><span className="text-sm font-semibold tabular-nums">{project.risk.toFixed(1)}%</span><Link href={`/projects/${encodeURIComponent(project.id)}`} className="ml-auto text-xs font-semibold text-gov-800 hover:underline">View project →</Link></div>
                  </div>
                </div>
              </li>)}
            </ul> : <p className="py-6 text-sm text-ink-500">No project forecasts are assigned to this state in the current data.</p>}
          </> : <>
            <p className="text-xs font-semibold uppercase tracking-wide text-gov-700">State details</p>
            <h2 className="mt-1 text-xl font-bold">Select a state</h2>
            <p className="mt-2 text-sm text-ink-500">Click a shaded state or one of its risk markers to see the associated projects and open their forecast pages.</p>
            <div className="mt-6 border-t border-ink-200 pt-4">
              <h3 className="text-sm font-semibold">Highest risk by state</h3>
              <ol className="mt-2 divide-y divide-ink-100">
                {states.slice(0, 7).map((state) => <li key={state.code || state.name}>
                  <button type="button" onClick={() => setSelectedState(state.name)} className="flex w-full items-center gap-2 py-2 text-left text-sm hover:text-gov-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HEX[state.highestBand] ?? HEX.GREEN }} />
                    <span className="flex-1">{state.name}</span><span className="text-xs text-ink-500">{state.projects.length} projects</span><span className="font-semibold tabular-nums">{state.highestRisk.toFixed(1)}%</span>
                  </button>
                </li>)}
              </ol>
            </div>
          </>}
        </section>
      </div>
      {mappedCount < data.length && <p className="mt-4 text-xs text-ink-500">{data.length - mappedCount} projects have missing or unrecognized state names and are not placed on the map.</p>}
    </>}
  </>;
}
