import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, MagnifyingGlass, X } from "@phosphor-icons/react";
import { iconResults } from "../data/catalog";
import { ConstructionIcon, WeightIcon } from "../components/IconPreview";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { searchIcons } from "../services/search";
import { copyText, renderIconSvg } from "../services/svg";

function readExploreParams() {
  const [, queryString = ""] = window.location.hash.split("?");
  const params = new URLSearchParams(queryString);
  return {
    query: params.get("q") ?? "payment successful",
    category: params.get("category") ?? "all",
    weight: (params.get("weight") ?? "all") as "all" | "regular" | "fill",
  };
}

export function ExplorePage() {
  const initial = useMemo(readExploreParams, []);
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.category);
  const [weightFilter, setWeightFilter] = useState(initial.weight);
  const [selectedId, setSelectedId] = useState("circle-check");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const categories = useMemo(() => ["all", ...new Set(iconResults.map((icon) => icon.category))], []);
  const filtered = useMemo(() => searchIcons(iconResults, query, { category, weight: weightFilter }), [query, category, weightFilter]);

  useEffect(() => {
    if (filtered.length && !filtered.some((icon) => icon.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (weightFilter !== "all") params.set("weight", weightFilter);
    const nextHash = `#explore${params.size ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextHash);
  }, [query, category, weightFilter]);

  const selected = iconResults.find((icon) => icon.id === selectedId) ?? filtered[0] ?? iconResults[0];

  const handleCopy = async () => {
    try {
      await copyText(renderIconSvg(selected.Icon, selected.weight));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <main className="page-shell explore-page">
      <PageIntro number="01" title="Search the icon system." aside={
        <label className="hero-search"><MagnifyingGlass size={22} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search icons" placeholder="Describe an intent…" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={19} /></button>}</label>
      }>
        Search by intent. Compare styles. Copy production-ready SVG with consistent sizing, alignment, and semantics.
      </PageIntro>

      <div className="explore-grid">
        <Panel className="result-panel">
          <PanelHeader number="02" title={`Results (${filtered.length})`} meta={query ? "RANKED" : "ALL ICONS"} accent={Boolean(query)} />
          <div className="result-filters">
            <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}</select></label>
            <label><span>Weight</span><select value={weightFilter} onChange={(event) => setWeightFilter(event.target.value as "all" | "regular" | "fill")}><option value="all">All weights</option><option value="regular">Regular</option><option value="fill">Solid</option></select></label>
          </div>
          <div className="result-columns" aria-hidden="true"><span>Icon</span><span>Name</span></div>
          <div className="result-list">
            {filtered.length ? filtered.map((icon, index) => (
              <button key={icon.id} className={selected.id === icon.id ? "result-row selected" : "result-row"} onClick={() => setSelectedId(icon.id)} aria-pressed={selected.id === icon.id}>
                <span className="result-number">{String(index + 1).padStart(2, "0")}</span><WeightIcon Icon={icon.Icon} size={25} weight={icon.weight} /><span>{icon.name}<small>{icon.matchScore} relevance</small></span><ArrowRight size={16} />
              </button>
            )) : (
              <div className="empty-state"><MagnifyingGlass size={28} /><strong>No exact icon found</strong><p>Try a broader intent or create a constrained draft.</p><a href="#create">Create a draft <ArrowRight size={15} /></a></div>
            )}
          </div>
        </Panel>

        <Panel className="preview-panel">
          <PanelHeader number="03" title={`Preview: ${selected.name}`} meta="COMPARE" accent />
          <div className="pair-preview"><div><span>Regular</span><WeightIcon Icon={selected.Icon} size={104} weight="regular" /></div><div><span>Solid</span><WeightIcon Icon={selected.Icon} size={104} weight="fill" /></div></div>
          <div className="construction-preview"><div><ConstructionIcon Icon={selected.Icon} /></div><div><ConstructionIcon Icon={selected.Icon} weight="fill" /></div></div>
          <p className="preview-note">View on a 24px construction field. Both styles preserve the same semantic silhouette.</p>
        </Panel>

        <Panel className="inspector-panel">
          <PanelHeader number="04" title={`Selected: ${selected.name}`} meta="READY" accent />
          <dl className="metadata-list">
            <div><dt>Stable ID</dt><dd>{selected.stableId}</dd></div><div><dt>Name</dt><dd>{selected.name}</dd></div><div><dt>Version</dt><dd>{selected.version}</dd></div><div><dt>Category</dt><dd>{selected.category}</dd></div><div><dt>Direction</dt><dd>{selected.directionality}</dd></div><div><dt>Grid</dt><dd>24 × 24</dd></div><div><dt>Licence</dt><dd>{selected.licence}</dd></div><div><dt>Validation</dt><dd><span className="status-dot" /> Valid</dd></div>
          </dl>
          <div className="inspector-copy"><p>{selected.description} Pairs with the matching error or inactive state.</p><button className="primary-action" onClick={handleCopy}>{copyState === "copied" ? <Check size={20} /> : <Copy size={20} />}{copyState === "copied" ? "SVG copied" : copyState === "error" ? "Copy failed" : "Copy SVG"}</button><p className="microcopy" aria-live="polite">Inline-ready SVG with stable metadata.</p></div>
        </Panel>
      </div>
    </main>
  );
}
