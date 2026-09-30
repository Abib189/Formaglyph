import { useMemo, useState } from "react";
import { MorphIcon } from "morphicons/react";
import { prepareMorphIcon, svgStrokeWidth } from "../services/morphicons";

const startSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const startIcon = prepareMorphIcon(startSvg).icon;

function ReadyMotion({ svg }: { svg: string }) {
  const prepared = useMemo(() => prepareMorphIcon(svg), [svg]);
  const [target, setTarget] = useState(true);
  if (!prepared.icon || !startIcon) return <div className="catalog-motion"><strong>Static preview</strong><p>{prepared.reason ?? "This geometry is not compatible with stroke morphing."} Original SVG remains unchanged. <a href="/libraries/morphicons/LICENSE.txt" target="_blank" rel="noreferrer">Morphicons licence</a>.</p></div>;
  return <div className="catalog-motion"><div><MorphIcon icon={target ? prepared.icon : startIcon} size={42} strokeWidth={svgStrokeWidth(svg)} reducedMotion="user" label="Morphicons motion preview" /><button className="secondary-action" onClick={() => setTarget((value) => !value)}>Play morph preview</button></div><p>Powered by <a href="https://github.com/guillermolg00/morphicons" target="_blank" rel="noreferrer">Morphicons</a>. Menu ↔ selected stroke icon. Honours reduced motion; downloads remain static SVG.</p></div>;
}

export function CatalogMotionPreview({ svg }: { svg?: string }) {
  return svg ? <ReadyMotion svg={svg} /> : <div className="catalog-motion"><strong>Static SVG preview</strong><p>Morphicons supports stroke geometry, not filled outlines. This library asset is displayed unchanged. <a href="/libraries/morphicons/LICENSE.txt" target="_blank" rel="noreferrer">Engine licence</a>.</p></div>;
}
