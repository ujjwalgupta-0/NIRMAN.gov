// Risk-index bands use the same 30% and 60% cutoffs across horizons.
export const THRESHOLDS = { amber: 30, red: 60 };

// pandas.cut in the v7 notebook uses right-closed intervals: 30 is stable and 60 is elevated.
export const band = (risk) => (risk > THRESHOLDS.red ? "RED" : risk > THRESHOLDS.amber ? "AMBER" : "GREEN");

// Hex equivalents of the risk colours, for SVG/chart libraries that can't take
// Tailwind classes. Kept here so every chart colours a band the same way.
export const HEX = { GREEN: "#15803d", AMBER: "#b45309", RED: "#b91c1c" };

const hexToRgb = (hex) => {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const num = Number.parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const mix = (a, b, ratio) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * ratio);
  const g = Math.round(ca.g + (cb.g - ca.g) * ratio);
  const bVal = Math.round(ca.b + (cb.b - ca.b) * ratio);
  return `rgb(${r}, ${g}, ${bVal})`;
};

export const riskColor = (value) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  if (clamped < THRESHOLDS.amber) return mix(HEX.GREEN, HEX.AMBER, clamped / THRESHOLDS.amber);
  if (clamped < THRESHOLDS.red) return mix(HEX.AMBER, HEX.RED, (clamped - THRESHOLDS.amber) / (THRESHOLDS.red - THRESHOLDS.amber));
  return HEX.RED;
};

export const BAND_STYLE = {
  GREEN: { text: "text-risk-green", bg: "bg-risk-green", border: "border-risk-green", soft: "bg-green-50", label: "Stable" },
  AMBER: { text: "text-risk-amber", bg: "bg-risk-amber", border: "border-risk-amber", soft: "bg-amber-50", label: "Elevated" },
  RED: { text: "text-risk-red", bg: "bg-risk-red", border: "border-risk-red", soft: "bg-red-50", label: "Severe" }
};

export const HEADLINE = {
  GREEN: "Stable outlook within expected cost and schedule tolerance",
  AMBER: "Elevated cost or schedule pressure requires monitoring",
  RED: "Severe risk of cost or schedule slippage"
};

export const pp = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(1) + " pp";

export const crore = (n) => "₹" + n.toLocaleString("en-IN") + " Cr";

export const stamp = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
  }) + " IST";
