const shapes = {
  alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  play: <path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none"/>,
  reset: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></>,
  shieldAlert: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="M12 8v4m0 4h.01"/></>,
  shieldCheck: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
  arrowUp: <><path d="M12 19V5m-7 7 7-7 7 7"/></>,
  arrowDown: <><path d="M12 5v14m7-7-7 7-7-7"/></>,
  arrowUpRight: <><path d="M7 17 17 7M7 7h10v10"/></>,
  arrowDownRight: <><path d="m7 7 10 10M17 7v10H7"/></>,
  minus: <path d="M5 12h14"/>,
  trendUp: <><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></>,
  trendDown: <><path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5m-5 5V3"/></>,
  printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></>
};

export default function Icon({ name, className = "", size, ...props }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{shapes[name] ?? null}</svg>;
}
