export default function CategoryTick({ x = 0, y = 0, payload }) {
  const label = String(payload?.value ?? "");
  const displayLabel = label === "Telecommunication" ? "Telecom." : label;
  const maxChars = 12;
  const lines = [];

  for (const word of displayLabel.split(/\s+/).filter(Boolean)) {
    let remainder = word;
    while (remainder.length > maxChars) {
      const chunk = remainder.slice(0, maxChars);
      const last = lines.length - 1;
      if (last >= 0 && lines[last].length + chunk.length + 1 <= maxChars) {
        lines[last] += ` ${chunk}`;
      } else {
        lines.push(chunk);
      }
      remainder = remainder.slice(maxChars);
    }

    if (!remainder) continue;
    const last = lines.length - 1;
    if (last < 0 || lines[last].length + remainder.length + 1 > maxChars) lines.push(remainder);
    else lines[last] += ` ${remainder}`;
  }

  return <g transform={`translate(${x},${y})`}>
    <text textAnchor="middle" fill="#52616b" fontSize={9} fontWeight={700}>
      <title>{label}</title>
      {lines.map((line, index) => <tspan key={`${line}-${index}`} x="0" dy={index === 0 ? 12 : 11}>{line}</tspan>)}
    </text>
  </g>;
}
