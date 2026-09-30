import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Check } from "@phosphor-icons/react/Check";
import { Copy } from "@phosphor-icons/react/Copy";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { FigmaLogo } from "@phosphor-icons/react/FigmaLogo";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { X } from "@phosphor-icons/react/X";
import { CloudArrowUp } from "@phosphor-icons/react/CloudArrowUp";
import { iconResults, workspaceIconLibrary } from "../data/catalog";
import { ConstructionIcon, SvgIcon, WeightIcon } from "../components/IconPreview";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { searchIcons } from "../services/search";
import { copyDesignSvg, copyText, downloadSvg, renderIconSvg } from "../services/svg";
import { useAppState } from "../state/AppState";
import { repository } from "../services/repositories";
import { useSearchParams } from "react-router-dom";
import type { CatalogIcon, CatalogLibrary, CatalogVariant } from "../domain/types";
import { CATALOG_WEIGHTS, fetchCatalogSvg, loadExternalCatalog, weightLabel } from "../services/externalCatalog";
import { CatalogMotionPreview } from "../components/CatalogMotionPreview";

const coreConceptCount = new Set(iconResults.map((icon) => icon.stableId)).size;
const PAGE_SIZE = 48;
const libraryLabel = (icon: CatalogIcon) => icon.libraryLabel ?? (icon.library === "projects" ? "Team releases" : "Formaglyph Core");

function CatalogGlyph({ icon, size = 25, weight = icon.previewWeight }: { icon: CatalogIcon; size?: number; weight?: "regular" | "fill" }) {
  const [assetFailed, setAssetFailed] = useState(false);
  if (icon.svg) return <SvgIcon svg={icon.svg} size={size} />;
  if (icon.assetUrl && !assetFailed) return <img className="catalog-asset" src={icon.assetUrl} width={size} height={size} loading="lazy" decoding="async" alt="" onError={() => setAssetFailed(true)} />;
  return icon.Icon ? <WeightIcon Icon={icon.Icon} size={size} weight={weight} /> : <span className="microcopy">Unavailable</span>;
}

export function ExplorePage() {
  const { state } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [variantFilter, setVariantFilter] = useState<"all" | CatalogVariant>(() => { const weight = searchParams.get("weight"); return weight === "all" || CATALOG_WEIGHTS.includes(weight as CatalogVariant) ? weight as "all" | CatalogVariant : "regular"; });
  const [library, setLibrary] = useState<"all" | CatalogLibrary>(() => { const value = searchParams.get("library"); return ["core", "projects", "phosphor", "lucide"].includes(value ?? "") ? value as CatalogLibrary : "all"; });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [designCopyState, setDesignCopyState] = useState<"idle" | "figma" | "penpot" | "error">("idle");
  const [downloadError, setDownloadError] = useState(false);
  const [repositoryCatalog, setRepositoryCatalog] = useState<CatalogIcon[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(repository.mode === "supabase");
  const [externalCatalog, setExternalCatalog] = useState<CatalogIcon[]>([]);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalLoading, setExternalLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [loadedSelection, setLoadedSelection] = useState<{ id: string; svg: string } | null>(null);
  const [selectionError, setSelectionError] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;
    setExternalLoading(true);
    setExternalError(null);
    void loadExternalCatalog("phosphor").then((icons) => { if (active) setExternalCatalog(icons); }).catch(() => { if (active) setExternalError("Phosphor could not load. Formaglyph Core is still available."); }).finally(() => { if (active) setExternalLoading(false); });
    return () => { active = false; };
  }, [retry]);

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
    library: "projects" as const,
  })), [state.workspace]);
  const catalog = useMemo(() => {
    const merged = new Map(iconResults.map((icon) => [`${icon.stableId}:${icon.variant}`, icon]));
    // The local repository returns the same Core fixtures; don't relabel them as team releases.
    const projectIcons = repository.mode === "local" ? publishedWorkspaceIcons : repositoryCatalog;
    for (const icon of [...projectIcons, ...externalCatalog]) merged.set(`${icon.stableId}:${icon.variant}`, { ...icon, library: icon.library ?? "projects" });
    return [...merged.values()];
  }, [publishedWorkspaceIcons, repositoryCatalog, externalCatalog]);
  const categories = useMemo(() => ["all", ...[...new Set(catalog.filter((icon) => library === "all" || (icon.library ?? "core") === library).flatMap((icon) => icon.categories ?? [icon.category]))].sort()], [catalog, library]);
  const filtered = useMemo(() => searchIcons(catalog, deferredQuery, { category, variant: variantFilter, library }), [catalog, deferredQuery, category, variantFilter, library]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleIcons = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = catalog.find((icon) => icon.id === selectedId) ?? filtered[0] ?? catalog[0];
  const matchingWeights = useMemo(() => selected ? CATALOG_WEIGHTS.flatMap((weight) => catalog.filter((icon) => icon.stableId === selected.stableId && icon.variant === weight)) : [], [catalog, selected?.stableId]);
  const selectedPreview = selected && loadedSelection?.id === selected.id ? { ...selected, svg: loadedSelection.svg } : selected;

  useEffect(() => { setPage(1); }, [query, category, variantFilter, library]);
  useEffect(() => {
    if (!selected || selected.svg || !selected.assetUrl) return;
    const controller = new AbortController();
    setSelectionError(false);
    void fetchCatalogSvg(selected, controller.signal).then((svg) => { if (!controller.signal.aborted) setLoadedSelection({ id: selected.id, svg }); }).catch(() => { if (!controller.signal.aborted) setSelectionError(true); });
    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    if (filtered.length && !filtered.some((icon) => icon.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (variantFilter !== "regular") params.set("weight", variantFilter);
    if (library !== "all") params.set("library", library);
    setSearchParams(params, { replace: true });
  }, [category, query, setSearchParams, variantFilter, library]);

  if (!selected) {
    return <main className="page-shell explore-page"><PageIntro number="01" title="Search the icon system.">Search by intent. Compare styles. Copy production-ready SVG with consistent sizing, alignment, and semantics.</PageIntro><Panel className="workspace-list-panel"><PanelHeader number="02" title="Published catalog" meta={catalogError ? "OFFLINE" : "LOADING"} accent={Boolean(catalogError)} /><div className="workspace-empty"><MagnifyingGlass size={30} /><strong>{catalogError ? "Catalog unavailable" : "Loading published icons…"}</strong><p>{catalogError ?? "Restoring immutable icon versions from PostgreSQL."}</p></div></Panel></main>;
  }

  const selectedSvg = async () => {
    const svg = selected.svg ?? (selected.assetUrl ? await fetchCatalogSvg(selected) : selected.Icon ? renderIconSvg(selected.Icon, selected.previewWeight) : null);
    if (!svg) throw new Error("Asset unavailable");
    return svg;
  };

  const handleCopy = async () => {
    try {
      const svg = await selectedSvg();
      await copyText(svg);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  const handleDownload = async () => {
    setDownloadError(false);
    try {
      downloadSvg(`${selected.library === "phosphor" || selected.library === "lucide" ? selected.library : "formaglyph"}-${selected.name}-${selected.variant}-${selected.version}.svg`, await selectedSvg());
    } catch {
      setDownloadError(true);
    }
  };

  const handleDesignCopy = async (target: "figma" | "penpot") => {
    try {
      await copyDesignSvg(await selectedSvg(), {
        stableId: selected.stableId,
        name: selected.name,
        label: selected.label,
        version: selected.version,
        variant: selected.variant,
        licence: selected.licence,
        contentHash: selected.contentHash,
        library: libraryLabel(selected),
        sourceUrl: selected.sourceUrl,
      }, target);
      setDesignCopyState(target);
    } catch {
      setDesignCopyState("error");
    }
    window.setTimeout(() => setDesignCopyState("idle"), 1800);
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
          <PanelHeader number="02" title={`Results (${filtered.length})`} meta={catalogLoading || externalLoading ? "SYNCING" : query ? "RANKED" : "ALL ICONS"} accent={Boolean(query || catalogError || externalError)} />
          <div className="catalog-summary"><span>{coreConceptCount} Core + {new Set(externalCatalog.map((icon) => icon.stableId)).size.toLocaleString()} upstream concepts</span>{(query || category !== "all" || library !== "all" || variantFilter !== "regular") && <button onClick={() => { setQuery(""); setCategory("all"); setLibrary("all"); setVariantFilter("regular"); }}>Browse all icons <ArrowRight size={14} /></button>}</div>
          <div className="catalog-library-filter"><label><span>Library</span><select aria-label="Library" value={library} onChange={(event) => { setLibrary(event.target.value as "all" | CatalogLibrary); setCategory("all"); }}><option value="all">All libraries</option><option value="core">Formaglyph Core</option><option value="projects">Team releases</option><option value="phosphor">Phosphor Icons</option></select></label><a href="/libraries/phosphor/LICENSE.txt" target="_blank" rel="noreferrer">Licence notices</a></div>
          <div className="result-filters">
            <label><span>Category</span><select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}</select></label>
            <label><span>Weight</span><select aria-label="Weight" value={variantFilter} onChange={(event) => setVariantFilter(event.target.value as "all" | CatalogVariant)}><option value="all">All weights</option>{CATALOG_WEIGHTS.map((weight) => <option key={weight} value={weight}>{weightLabel(weight)}</option>)}</select></label>
          </div>
          <div className="result-columns" aria-hidden="true"><span>Icon</span><span>Name</span></div>
          <div className="result-list">
            {catalogError && <div className="catalog-notice" role="status">Team catalog unavailable. Open-source libraries remain available.</div>}
            {externalError && <div className="catalog-notice" role="status">{externalError} <button onClick={() => setRetry((value) => value + 1)}>Retry library</button></div>}
            {filtered.length ? visibleIcons.map((icon, index) => (
              <button key={icon.id} className={selected.id === icon.id ? "result-row selected" : "result-row"} onClick={() => setSelectedId(icon.id)} aria-pressed={selected.id === icon.id}>
                <span className="result-number">{String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</span><CatalogGlyph icon={icon} /><span>{icon.name}<small>{libraryLabel(icon)} · {icon.variant}</small></span><ArrowRight size={16} />
              </button>
            )) : (
              <div className="empty-state"><MagnifyingGlass size={28} /><strong>{externalLoading ? "Loading libraries…" : "No exact icon found"}</strong><p>Try another library, weight, or broader intent.</p><a href="/projects/core/create">Create a draft <ArrowRight size={15} /></a></div>
            )}
          </div>
          <nav className="catalog-pagination" aria-label="Icon result pages"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span aria-live="polite">Page {currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></nav>
        </Panel>

        <Panel className="preview-panel">
          <PanelHeader number="03" title={`Preview: ${selected.name}`} meta="COMPARE" accent />
          <div className={`catalog-weight-previews ${matchingWeights.length > 2 ? "many-weights" : ""}`} aria-label="Available icon weights">{matchingWeights.map((icon) => <button key={icon.id} aria-pressed={selected.id === icon.id} onClick={() => { setSelectedId(icon.id); setVariantFilter(icon.variant); }}><span>{weightLabel(icon.variant)}</span><CatalogGlyph icon={icon} size={matchingWeights.length > 2 ? 64 : 96} /></button>)}</div>
          <div className="catalog-construction"><ConstructionIcon Icon={selected.Icon} svg={selectedPreview?.svg} assetUrl={selected.assetUrl} weight={selected.previewWeight} /></div>
          <p className="preview-note">{libraryLabel(selected)} · native {selected.gridSize ?? 24}px grid. Weights and source geometry stay with their original library.</p>
          <CatalogMotionPreview svg={selectedPreview?.svg} />
        </Panel>

        <Panel className="inspector-panel">
          <PanelHeader number="04" title={`Selected: ${selected.name}`} meta="READY" accent />
          <dl className="metadata-list">
            <div><dt>Library</dt><dd>{libraryLabel(selected)}</dd></div><div><dt>Stable ID</dt><dd>{selected.stableId}</dd></div><div><dt>Name</dt><dd>{selected.name}</dd></div><div><dt>Version</dt><dd>{selected.version}</dd></div><div><dt>Category</dt><dd>{selected.category}</dd></div><div><dt>Direction</dt><dd>{selected.provenance.kind === "third-party" ? "Not specified upstream" : selected.directionality}</dd></div><div><dt>Grid</dt><dd>{selected.gridSize ?? 24} × {selected.gridSize ?? 24}</dd></div><div><dt>Licence</dt><dd>{selected.licenseUrl ? <a href={selected.licenseUrl} target="_blank" rel="noreferrer">{selected.licence} · notice</a> : selected.licence}</dd></div><div><dt>Safety</dt><dd>{selectionError ? "Asset check failed" : "Validated SVG"}</dd></div>
          </dl>
          <div className="inspector-copy">
            <p>{selected.description}</p>
            <button className="primary-action" onClick={handleCopy}>{copyState === "copied" ? <Check size={20} /> : <Copy size={20} />}{copyState === "copied" ? "SVG copied" : copyState === "error" ? "Copy failed" : "Copy SVG"}</button>
            <button className="secondary-action catalog-download" onClick={() => void handleDownload()}><DownloadSimple size={20} />Download {weightLabel(selected.variant)} SVG</button>
            {downloadError && <p className="microcopy" role="alert">Download failed. Please try again.</p>}
            <div className="design-handoff-actions" aria-label="Design tool handoff">
              <button className="secondary-action" onClick={() => void handleDesignCopy("figma")}>{designCopyState === "figma" ? <Check size={17} /> : <FigmaLogo size={17} />}{designCopyState === "figma" ? "Copied" : "For Figma"}</button>
              <button className="secondary-action" onClick={() => void handleDesignCopy("penpot")}>{designCopyState === "penpot" ? <Check size={17} /> : <SlidersHorizontal size={17} />}{designCopyState === "penpot" ? "Copied" : "For Penpot"}</button>
            </div>
            <p className="microcopy" aria-live="polite">{designCopyState === "error" ? "Design copy failed. Copy the SVG directly instead." : "Design copies include stable ID, version, variant, licence, and content hash metadata."}</p>
            {selected.sourceUrl && <p className="microcopy">Third-party geometry, not Formaglyph-authored. <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Original source</a>. Upstream licence is embedded in copied and downloaded SVGs.</p>}
          </div>
        </Panel>
      </div>
    </main>
  );
}
