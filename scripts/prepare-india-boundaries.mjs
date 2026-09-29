import fs from "node:fs";
import path from "node:path";

// Simplifies the Survey of India state GeoJSON supplied by the National Water Data Portal.
// The source uses a projected CRS; coordinates are preserved proportionally for SVG rendering.

const [sourcePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !outputPath) throw new Error("Pass source GeoJSON and output JSON paths.");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const allPoints = [];
const visit = (value) => {
  if (Array.isArray(value) && typeof value[0] === "number") allPoints.push(value);
  else if (Array.isArray(value)) value.forEach(visit);
};
source.features.forEach((feature) => visit(feature.geometry.coordinates));

const bounds = allPoints.reduce((box, [x, y]) => [
  Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)
], [Infinity, Infinity, -Infinity, -Infinity]);
const [minX, minY, maxX, maxY] = bounds;
const width = 700;
const height = 800;
const padding = 10;
const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
const offsetX = (width - (maxX - minX) * scale) / 2;
const offsetY = (height - (maxY - minY) * scale) / 2;
const project = ([x, y]) => [
  +(((x - minX) * scale + offsetX).toFixed(1)),
  +(((maxY - y) * scale + offsetY).toFixed(1))
];

const distanceToSegmentSquared = (point, start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (!dx && !dy) return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return (point[0] - (start[0] + t * dx)) ** 2 + (point[1] - (start[1] + t * dy)) ** 2;
};

const simplifyOpenLine = (points, toleranceSquared) => {
  if (points.length <= 2) return points;
  let farthest = toleranceSquared;
  let index = -1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distanceToSegmentSquared(points[i], points[0], points.at(-1));
    if (distance > farthest) { farthest = distance; index = i; }
  }
  if (index < 0) return [points[0], points.at(-1)];
  return [...simplifyOpenLine(points.slice(0, index + 1), toleranceSquared).slice(0, -1), ...simplifyOpenLine(points.slice(index), toleranceSquared)];
};

const simplifyRing = (closedRing) => {
  const points = closedRing.slice(0, -1);
  if (points.length <= 4) return closedRing;
  const origin = points[0];
  let pivot = 1;
  let farthest = -1;
  points.forEach((point, index) => {
    const distance = (point[0] - origin[0]) ** 2 + (point[1] - origin[1]) ** 2;
    if (distance > farthest) { farthest = distance; pivot = index; }
  });
  const firstArc = simplifyOpenLine(points.slice(0, pivot + 1), 1_500 ** 2);
  const secondArc = simplifyOpenLine([...points.slice(pivot), points[0]], 1_500 ** 2);
  const result = [...firstArc, ...secondArc.slice(1)];
  return result.length >= 4 ? result : closedRing;
};

const signedAreaAndCentroid = (ring) => {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  const area = Math.abs(twiceArea / 2);
  return { area, point: twiceArea ? [cx / (3 * twiceArea), cy / (3 * twiceArea)] : ring[0] };
};

const pathForRing = (ring) => {
  const points = simplifyRing(ring).map(project);
  return `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
};

const features = source.features.map((feature) => {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const outerRings = polygons.map((polygon) => polygon[0]);
  const largest = outerRings.map((ring) => ({ ring, ...signedAreaAndCentroid(ring) })).sort((a, b) => b.area - a.area)[0];
  const pathData = polygons.flatMap((polygon) => polygon.map(pathForRing)).join("");
  return {
    name: feature.properties.state_name || feature.properties.state,
    code: feature.properties.state,
    path: pathData,
    centroid: project(largest.point)
  };
}).filter((feature) => feature.name && feature.path);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ viewBox: `0 0 ${width} ${height}`, features }));
console.log(JSON.stringify({ features: features.length, inputPositions: allPoints.length, outputBytes: fs.statSync(outputPath).size }));
