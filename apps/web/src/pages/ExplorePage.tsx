import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, MagnifyingGlass, X } from "@phosphor-icons/react";
import { CloudArrowUp } from "@phosphor-icons/react";
import { iconResults, workspaceIconLibrary } from "../data/catalog";
import { ConstructionIcon, WeightIcon } from "../components/IconPreview";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { searchIcons } from "../services/search";
import { copyText, renderIconSvg } from "../services/svg";
import { useAppState } from "../state/AppState";
import { repository } from "../services/repositories";
import { useSearchParams } from "react-router-dom";
import type { CatalogIcon } from "../domain/types";

function CatalogGlyph({ icon, size = 25, weight = icon.previewWeight }: { icon: CatalogIcon; size?: number; weight?: "regular" | "fill" }) {
  const [assetFailed, setAssetFailed] = useState(false);
  return icon.assetUrl && !assetFailed ? <img className="catalog-asset" src={icon.assetUrl} width={size} height={size} alt="" onError={() => setAssetFailed(true)} /> : <WeightIcon Icon={icon.Icon} size={size} weight={weight} />;
}

export function ExplorePage() {
  const { state } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "payment successful");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [variantFilter, setVariantFilter] = useState((searchParams.get("weight") ?? "all") as "all" | "regular" | "solid");
  const [selectedId, setSelectedId] = useState("circle-check");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [repositoryCatalog, setRepositoryCatalog] = useState<CatalogIcon[]>(repository.mode === "local" ? iconResults : []);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(repository.mode === "supabase");

  useEffect(() => {
    let active = true;
    void repository.listPublishedIcons().then((icons) => { if (active) setRepositoryCatalog(icons); }).catch((error: unknown) => { if (active) setCatalogError(error instanceof Error ? error.message : "Could not load the published catalog."); }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  const publishedWorkspaceIcons = useMemo<CatalogIcon[]>(() => state.workspace.filter((icon) => icon.status === "published").map((icon) => ({
    id: icon.id,
    stableId: icon.stableId,
    name: icon.name,
    label: icon.label,
    category: icon.category,
    description: icon.description,
    Icon: workspaceIconLibrary[icon.visualKey as keyof typeof workspaceIconLibrary] ?? CloudArrowUp,
    tags: icon.tags,
    aliases: [{ locale: "en", value: icon.label.toLowerCase(), reviewed: true }],
    version: icon.version,
    variant: icon.variant,
    previewWeight: icon.variant === "solid" ? "fill" as const : "regular" as const,
    directionality: "neutral" as const,
    licence: "MIT" as const,
    status: "published" as const,
    provenance: { kind: "generated" as const, source: "Formaglyph Workspace", adapter: "local-svg", disclosed: true },
  })), [state.workspace]);
  const catalog = useMemo(() => repository.mode === "local" ? [...repositoryCatalog, ...publishedWorkspaceIcons] : repositoryCatalog, [publishedWorkspaceIcons, repositoryCatalog]);
  const categories = useMemo(() => ["all", ...new Set(catalog.map((icon) => icon.category))], [catalog]);
  const filtered = useMemo(() => searchIcons(catalog, query, { category, variant: variantFilter }), [catalog, query, category, variantFilter]);

  useEffect(() => {
    if (filtered.length && !filtered.some((icon) => icon.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (variantFilter !== "all") params.set("weight", variantFilter);
    setSearchParams(params, { replace: true });
  }, [category, query, setSearchParams, variantFilter]);

  const selected = catalog.find((icon) => icon.id === selectedId) ?? filtered[0] ?? catalog[0];

  if (!selected) {
    return <main className="page-shell explore-page"><PageIntro number="01" title="Search the icon system.">Search by intent. Compare styles. Copy production-ready SVG with consistent sizing, alignment, and semantics.</PageIntro><Panel className="workspace-list-panel"><PanelHeader number="02" title="Published catalog" meta={catalogError ? "OFFLINE" : "LOADING"} accent={Boolean(catalogError)} /><div className="workspace-empty"><MagnifyingGlass size={30} /><strong>{catalogError ? "Catalog unavailable" : "Loading published icons…"}</strong><p>{catalogError ?? "Restoring immutable icon versions from PostgreSQL."}</p></div></Panel></main>;
  }

  const handleCopy = async () => {
    try {
      const svg = selected.assetUrl ? await fetch(selected.assetUrl).then((response) => { if (!response.ok) throw new Error("Asset unavailable"); return response.text(); }) : renderIconSvg(selected.Icon, selected.previewWeight);
      await copyText(svg);
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
            <label><span>Weight</span><select value={variantFilter} onChange={(event) => setVariantFilter(event.target.value as "all" | "regular" | "solid")}><option value="all">All weights</option><option value="regular">Regular</option><option value="solid">Solid</option></select></label>
          </div>
          <div className="result-columns" aria-hidden="true"><span>Icon</span><span>Name</span></div>
          <div className="result-list">
            {catalogLoading ? <div className="workspace-empty"><strong>Loading published icons…</strong><p>Restoring the immutable catalog from PostgreSQL.</p></div> : catalogError ? <div className="workspace-empty"><strong>Catalog unavailable</strong><p>{catalogError}</p></div> : filtered.length ? filtered.map((icon, index) => (
              <button key={icon.id} className={selected.id === icon.id ? "result-row selected" : "result-row"} onClick={() => setSelectedId(icon.id)} aria-pressed={selected.id === icon.id}>
                <span className="result-number">{String(index + 1).padStart(2, "0")}</span><CatalogGlyph icon={icon} /><span>{icon.name}<small>{icon.matchScore} relevance</small></span><ArrowRight size={16} />
              </button>
            )) : (
              <div className="empty-state"><MagnifyingGlass size={28} /><strong>No exact icon found</strong><p>Try a broader intent or create a constrained draft.</p><a href="/projects/core/create">Create a draft <ArrowRight size={15} /></a></div>
            )}
          </div>
        </Panel>

        <Panel className="preview-panel">
          <PanelHeader number="03" title={`Preview: ${selected.name}`} meta="COMPARE" accent />
          <div className="pair-preview"><div><span>Regular</span><CatalogGlyph icon={selected} size={104} weight="regular" /></div><div><span>Solid</span><CatalogGlyph icon={selected} size={104} weight="fill" /></div></div>
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
