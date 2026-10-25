import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Check } from "@phosphor-icons/react/Check";
import { Copy } from "@phosphor-icons/react/Copy";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { X } from "@phosphor-icons/react/X";
import { iconResults } from "../data/catalog";
import { SvgIcon, WeightIcon } from "../components/IconPreview";
import { FamilyProof } from "../components/FamilyProof";
import { Dialog } from "../components/Dialog";
import { searchIcons } from "../services/search";
import { copyDesignSvg, copyText, downloadSvg } from "../services/svg";
import { repository } from "../services/repositories";
import type {
  CatalogIcon,
  CatalogLibrary,
  CatalogVariant,
} from "../domain/types";
import {
  CATALOG_WEIGHTS,
  fetchCatalogSvg,
  loadExternalCatalog,
  weightLabel,
} from "../services/externalCatalog";
import { CatalogMotionPreview } from "../components/CatalogMotionPreview";
import { IconColourControl } from "../components/IconColourControl";
import {
  colourIconSvg,
  iconProofBackground,
  normalizeIconColour,
} from "../services/iconColour";
import { sha256Text } from "../services/candidateAsset";
import {
  EXTERNAL_LIBRARY_IDS,
  LIBRARY_SOURCES,
  weightsForLibrary,
  type ExternalLibraryId,
} from "../data/librarySources";

const PAGE_SIZE = 48;
// Approved specimen order; searches still use ranked results, upstream families keep their order.
const coreSpecimenOrder = new Map(
  [
    "cloud-upload",
    "cloud-sync",
    "file",
    "folder",
    "file-lock",
    "folder-spark",
    "download-tray",
    "image",
    "camera",
    "home",
    "grid-four",
    "search",
    "copy",
    "mail",
    "message",
    "message-sent",
    "bell",
    "calendar",
    "bookmark",
    "star",
    "globe",
    "credit-card",
    "card-check",
    "receipt-search",
    "key",
    "lock",
    "shield-check",
    "user-shield",
    "link",
    "archive-box",
  ].map((name, index) => [name, index]),
);
const libraryLabel = (icon: CatalogIcon) =>
  icon.libraryLabel ??
  (icon.library === "projects" ? "Team releases" : "Formaglyph Core");
const sourceOptions = [
  { id: "all", label: "All libraries" },
  { id: "core", label: "Formaglyph Core" },
  { id: "projects", label: "Team releases" },
  ...EXTERNAL_LIBRARY_IDS.map((id) => ({
    id,
    label: LIBRARY_SOURCES[id].label,
  })),
];

export function CatalogGlyph({
  icon,
  size = 32,
  colour = null,
}: {
  icon: CatalogIcon;
  size?: number;
  colour?: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [exactAsset, setExactAsset] = useState<{ url: string; svg: string } | null>(null);
  const needsExactPaint = !!(colour && icon.exactPaint && icon.assetUrl && !icon.svg);
  const assetUrl = icon.assetUrl;
  const contentHash = icon.contentHash;
  useEffect(() => {
    if (!needsExactPaint || !assetUrl) return;
    const controller = new AbortController();
    void fetchCatalogSvg(icon, controller.signal).then(svg => {
      if (!controller.signal.aborted) setExactAsset({ url: assetUrl, svg });
    }).catch(() => {
      if (!controller.signal.aborted) setFailedUrl(assetUrl);
    });
    return () => controller.abort();
    // Primitive immutable identity dependencies: changing only the selected hex
    // recolours the verified SVG locally rather than issuing another request.
  }, [needsExactPaint, assetUrl, contentHash]);
  const background = colour ? iconProofBackground(colour) : undefined;
  const svg = icon.svg ?? (needsExactPaint && exactAsset?.url === assetUrl ? exactAsset?.svg : undefined);
  let content;
  if (svg)
    content = <SvgIcon svg={colourIconSvg(svg, colour)} size={size} />;
  else if (needsExactPaint)
    content = <span className="asset-unavailable">{failedUrl === assetUrl ? "Asset unavailable" : "Loading…"}</span>;
  else if (icon.assetUrl && failedUrl !== icon.assetUrl)
    content = colour ? (
      <>
        <span
          className="catalog-colour-mask"
          style={{
            maskImage: `url(${JSON.stringify(icon.assetUrl)})`,
            WebkitMaskImage: `url(${JSON.stringify(icon.assetUrl)})`,
          }}
        />
        <img
          className="catalog-mask-source"
          src={icon.assetUrl}
          width={size}
          height={size}
          loading="lazy"
          alt=""
          onError={() => setFailedUrl(icon.assetUrl!)}
        />
      </>
    ) : (
      <img
        className="catalog-asset"
        src={icon.assetUrl}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        alt=""
        onError={() => setFailedUrl(icon.assetUrl!)}
      />
    );
  else
    content = icon.Icon ? (
      <WeightIcon Icon={icon.Icon} size={size} weight={icon.previewWeight} />
    ) : (
      <span className="asset-unavailable">Asset unavailable</span>
    );
  return (
    <span
      className="catalog-glyph"
      style={{
        width: size,
        height: size,
        color: colour ?? undefined,
        backgroundColor: background,
        boxShadow: background ? `0 0 0 6px ${background}` : undefined,
      }}
      aria-hidden="true"
    >
      {content}
    </span>
  );
}

function CatalogInspector({
  selected,
  siblings,
  onSelect,
  onClose,
  colour,
  onColourChange,
}: {
  selected: CatalogIcon;
  siblings: CatalogIcon[];
  onSelect: (icon: CatalogIcon) => void;
  onClose: () => void;
  colour: string | null;
  onColourChange: (colour: string | null) => void;
}) {
  const [loaded, setLoaded] = useState<{ id: string; svg: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("");
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 1100px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const inspectorTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    inspectorTitle.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    setError("");
    setCopyState("");
    if (selected.svg || !selected.assetUrl) return;
    const controller = new AbortController();
    void fetchCatalogSvg(selected, controller.signal)
      .then((svg) => {
        if (!controller.signal.aborted) setLoaded({ id: selected.id, svg });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Could not verify this SVG. Try selecting it again.");
      });
    return () => controller.abort();
  }, [selected.id, selected.assetUrl, selected.svg]);
  const displayIcon =
    loaded?.id === selected.id ? { ...selected, svg: loaded.svg } : selected;
  useEffect(() => {
    setCopyState("");
  }, [colour]);
  const act = async (
    action: "copy" | "download" | "pair" | "figma" | "penpot",
  ) => {
    setBusy(true);
    setError("");
    try {
      // Verify the immutable source before making a colour-only export derivative.
      const sourceSvg = await fetchCatalogSvg(selected);
      const svg = colourIconSvg(sourceSvg, colour);
      const colourSuffix = colour ? `-${colour.slice(1)}` : "";
      if (action === "copy") {
        await copyText(svg);
        setCopyState(`${weightLabel(selected.variant)} SVG copied`);
      } else if (action === "download")
        downloadSvg(
          `${selected.name}-${selected.variant}-${selected.version}${colourSuffix}.svg`,
          svg,
        );
      else if (action === "pair") {
        const pair = siblings.filter(
          (icon) => icon.variant === "regular" || icon.variant === "solid",
        );
        const assets = await Promise.all(
          pair.map(async (icon) => ({
            icon,
            svg:
              icon.id === selected.id
                ? svg
                : colourIconSvg(await fetchCatalogSvg(icon), colour),
          })),
        );
        for (const asset of assets)
          downloadSvg(
            `${asset.icon.name}-${asset.icon.variant}-${asset.icon.version}${colourSuffix}.svg`,
            asset.svg,
          );
        setCopyState("Regular and Solid downloaded");
      } else {
        await copyDesignSvg(
          svg,
          {
            stableId: selected.stableId,
            name: selected.name,
            label: selected.label,
            version: selected.version,
            variant: selected.variant,
            licence: selected.licenceLabel ?? selected.licence,
            contentHash: colour ? await sha256Text(svg) : selected.contentHash,
            sourceContentHash: colour
              ? (selected.contentHash ?? (await sha256Text(sourceSvg)))
              : undefined,
            exportColour: colour ?? undefined,
            library: libraryLabel(selected),
            sourceUrl: selected.sourceUrl,
          },
          action,
        );
        setCopyState(`Copied for ${action === "figma" ? "Figma" : "Penpot"}`);
      }
    } catch {
      setError(
        "That action failed. Check your connection and try again; your selection is retained.",
      );
    } finally {
      setBusy(false);
    }
  };
  const hasPair =
    (!selected.library ||
      selected.library === "core" ||
      selected.library === "projects") &&
    siblings.some((icon) => icon.variant === "regular") &&
    siblings.some((icon) => icon.variant === "solid");
  const content = (
    <aside
      className="catalog-inspector"
      aria-label={`Selected icon: ${selected.name}`}
    >
      <div className="inspector-mobile-back">
        <button onClick={onClose}>
          <ArrowLeft size={16} />
          Back to Explore
        </button>
      </div>
      <header className="inspector-heading">
        <span className="eyebrow">Selected icon</span>
        <button
          className="icon-action inspector-close"
          onClick={onClose}
          aria-label="Close icon details"
        >
          <X size={18} />
        </button>
        <h2 ref={inspectorTitle} tabIndex={-1}>
          {selected.name}
        </h2>
        <p>
          {libraryLabel(selected)} / {selected.category}
        </p>
      </header>
      <div
        className={`inspector-variants${siblings.length > 4 ? " many-variants" : ""}`}
        aria-label="Available icon weights"
      >
        {siblings.map((icon) => (
          <button
            key={icon.id}
            aria-pressed={selected.id === icon.id}
            onClick={() => onSelect(icon)}
          >
            <CatalogGlyph
              icon={icon.id === selected.id ? displayIcon : icon}
              size={56}
              colour={colour}
            />
            <span>{weightLabel(icon.variant)}</span>
          </button>
        ))}
      </div>
      <FamilyProof
        render={(size) => (
          <CatalogGlyph icon={displayIcon} size={size} colour={colour} />
        )}
      />
      <div className="inspector-colour-control">
        <IconColourControl
          colour={colour}
          onChange={onColourChange}
          label="Change icon colour"
          previewLabel={selected.name}
          renderPreview={(value) => (
            <CatalogGlyph icon={displayIcon} size={32} colour={value} />
          )}
        />
      </div>
      <dl className="inspector-facts">
        <div>
          <dt>Licence</dt>
          <dd>
            {selected.licenseUrl ? (
              <a href={selected.licenseUrl} target="_blank" rel="noreferrer">
                {selected.licenceLabel ?? selected.licence}
                <ArrowUpRight size={12} />
              </a>
            ) : (
              selected.licence
            )}
          </dd>
        </div>
        <div>
          <dt>Native grid</dt>
          <dd>
            {selected.gridSize ?? 24} × {selected.gridHeight ?? selected.gridSize ?? 24}
          </dd>
        </div>
        <div>
          <dt>{selected.distribution ? "Snapshot" : "Version"}</dt>
          <dd>{selected.version}</dd>
        </div>
        <div>
          <dt>Origin</dt>
          <dd>
            {selected.provenance.kind === "third-party"
              ? "Third-party library"
              : selected.library === "core" ||
                  selected.provenance.kind === "original"
                ? "Original geometry"
                : "Human-reviewed release"}
          </dd>
        </div>
      </dl>
      <div className="inspector-primary-actions">
        <button
          className="primary-action"
          disabled={busy}
          onClick={() => void act("copy")}
        >
          {copyState.includes("copied") ? (
            <Check size={16} />
          ) : (
            <Copy size={16} />
          )}
          Copy {weightLabel(selected.variant)} SVG
        </button>
        <button
          className="secondary-action"
          disabled={busy}
          onClick={() => void act(hasPair ? "pair" : "download")}
        >
          <DownloadSimple size={16} />
          {hasPair
            ? "Download pair"
            : `Download ${weightLabel(selected.variant)} SVG`}
        </button>
        <span role="status" className="action-feedback">
          {copyState}
        </span>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
      </div>
      <details className="inspector-details">
        <summary>Details & provenance</summary>
        <p>{selected.description}</p>
        {selected.fixedWhite && <p>This original includes fixed white artwork. Colour overrides change currentColor only; the white details remain unchanged.</p>}
        <dl>
          <dt>Stable ID</dt>
          <dd>
            <code>{selected.stableId}</code>
          </dd>
          {selected.contentHash && (
            <>
              <dt>Source SHA-256</dt>
              <dd>
                <code>{selected.contentHash}</code>
              </dd>
            </>
          )}
        </dl>
        {selected.sourceUrl && (
          <p>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
              Original source <ArrowUpRight size={12} />
            </a>
            . Source-specific licence notices are retained in copied SVGs. No
            affiliation is implied.
          </p>
        )}
      </details>
      <details className="inspector-details">
        <summary>Design handoff & motion</summary>
        <div className="design-handoff-actions">
          <button
            className="secondary-action"
            disabled={busy}
            onClick={() => void act("figma")}
          >
            Copy for Figma
          </button>
          <button
            className="secondary-action"
            disabled={busy}
            onClick={() => void act("penpot")}
          >
            Copy for Penpot
          </button>
        </div>
        <p>Clipboard handoff, not live design-tool synchronization.</p>
        <CatalogMotionPreview svg={displayIcon.svg} colour={colour} />
      </details>
    </aside>
  );
  return compact ? (
    <Dialog
      title={`Icon details: ${selected.name}`}
      className="catalog-inspector-dialog"
      onClose={onClose}
    >
      {content}
    </Dialog>
  ) : (
    content
  );
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const deferredQuery = useDeferredValue(query);
  const category = params.get("category") ?? "all";
  const libraryParam = params.get("library") ?? "core";
  const library = sourceOptions.some((source) => source.id === libraryParam)
    ? (libraryParam as "all" | CatalogLibrary)
    : "core";
  const weights =
    library === "all" ? CATALOG_WEIGHTS : weightsForLibrary(library);
  const weightParam = params.get("weight") ?? "regular";
  const variant =
    weightParam === "all" || weights.includes(weightParam as CatalogVariant)
      ? (weightParam as "all" | CatalogVariant)
      : "regular";
  const size = [24, 32, 40, 48].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 32;
  const colour = normalizeIconColour(params.get("color"));
  const [projects, setProjects] = useState<CatalogIcon[]>([]);
  const [libraries, setLibraries] = useState<
    Partial<Record<ExternalLibraryId, CatalogIcon[]>>
  >({});
  const [failed, setFailed] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastTile = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const chrome = chromeRef.current;
    if (!chrome) return;
    // Share the measured chrome height with sticky panels, including after font/viewport changes.
    const measure = () =>
      pageRef.current?.style.setProperty(
        "--catalog-chrome-height",
        `${Math.ceil(chrome.getBoundingClientRect().height)}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(chrome);
    return () => observer.disconnect();
  }, []);
  const set = (updates: Record<string, string | null>, replace = false) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(updates))
          value == null ? next.delete(key) : next.set(key, value);
        return next;
      },
      { replace },
    );
  const changeLibrary = (value: string) =>
    set({
      library: value,
      category: null,
      weight:
        value !== "all" &&
        variant !== "all" &&
        !weightsForLibrary(value as CatalogLibrary).includes(variant)
          ? null
          : params.get("weight"),
      page: null,
      icon: null,
    });
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.isContentEditable
        )
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    let active = true;
    setPending([...EXTERNAL_LIBRARY_IDS, "projects"]);
    setFailed([]);
    for (const id of EXTERNAL_LIBRARY_IDS)
      void loadExternalCatalog(id)
        .then((icons) => {
          if (active) setLibraries((current) => ({ ...current, [id]: icons }));
        })
        .catch(() => {
          if (active) setFailed((current) => [...current, id]);
        })
        .finally(() => {
          if (active)
            setPending((current) => current.filter((item) => item !== id));
        });
    void repository
      .listPublishedIcons()
      .then((icons) => {
        if (active)
          setProjects(
            icons.filter(
              (icon) =>
                icon.library === "projects" || repository.mode !== "local",
            ),
          );
      })
      .catch(() => {
        if (active) setFailed((current) => [...current, "projects"]);
      })
      .finally(() => {
        if (active)
          setPending((current) =>
            current.filter((item) => item !== "projects"),
          );
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const catalog = useMemo(() => {
    const merged = new Map(
      iconResults.map((icon) => [`${icon.stableId}:${icon.variant}`, icon]),
    );
    for (const icon of [
      ...projects,
      ...EXTERNAL_LIBRARY_IDS.flatMap((id) => libraries[id] ?? []),
    ])
      merged.set(`${icon.stableId}:${icon.variant}`, {
        ...icon,
        library: icon.library ?? "projects",
      });
    return [...merged.values()];
  }, [projects, libraries]);
  const categories = useMemo(
    () =>
      [
        "all",
        ...new Set(
          catalog
            .filter(
              (icon) =>
                library === "all" || (icon.library ?? "core") === library,
            )
            .flatMap((icon) => icon.categories ?? [icon.category]),
        ),
      ].sort((a, b) =>
        a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
      ),
    [catalog, library],
  );
  const filtered = useMemo(() => {
    const results = searchIcons(catalog, deferredQuery, {
      library,
      category,
      variant,
    });
    return library === "core" && !deferredQuery && category === "all"
      ? results.sort(
          (left, right) =>
            (coreSpecimenOrder.get(left.name) ?? 99) -
            (coreSpecimenOrder.get(right.name) ?? 99),
        )
      : results;
  }, [catalog, deferredQuery, library, category, variant]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(
    pages,
    Math.max(1, Number(params.get("page")) || 1),
  );
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const selected = catalog.find((icon) => icon.id === params.get("icon"));
  const siblings = useMemo(
    () =>
      selected
        ? CATALOG_WEIGHTS.flatMap((weight) =>
            catalog.filter(
              (icon) =>
                icon.stableId === selected.stableId && icon.variant === weight,
            ),
          )
        : [],
    [catalog, selected?.stableId],
  );
  const closeInspector = () => {
    set({ icon: null }, true);
  };
  useEffect(() => {
    if (!selected && lastTile.current?.isConnected) {
      const frame = window.requestAnimationFrame(() =>
        lastTile.current?.focus({ preventScroll: true }),
      );
      return () => window.cancelAnimationFrame(frame);
    }
  }, [selected?.id]);
  const loading =
    library === "all" ? pending.length > 0 : pending.includes(library);
  const relevantFailures = failed.filter(
    (id) => library === "all" || id === library,
  );
  const onColourChange = (next: string | null) =>
    set({ color: next?.slice(1) ?? null }, true);
  const previewIcon = selected ?? iconResults[0];
  const controls = (
    <>
      <label>
        <span>Weight</span>
        <select
          aria-label="Weight"
          value={variant}
          onChange={(event) =>
            set({ weight: event.target.value, page: null, icon: null })
          }
        >
          <option value="all">All weights</option>
          {weights.map((weight) => (
            <option key={weight} value={weight}>
              {weightLabel(weight)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Size</span>
        <select
          aria-label="Icon size"
          value={size}
          onChange={(event) => set({ size: event.target.value }, true)}
        >
          {[24, 32, 40, 48].map((value) => (
            <option key={value} value={value}>
              Size {value} px
            </option>
          ))}
        </select>
      </label>
      <IconColourControl
        colour={colour}
        onChange={onColourChange}
        previewLabel={`${previewIcon.name}${selected ? "" : " · example"}`}
        renderPreview={(value) => (
          <CatalogGlyph icon={previewIcon} size={32} colour={value} />
        )}
      />
      <label className="mobile-category-select">
        <span>Category</span>
        <select
          aria-label="Category"
          value={category}
          onChange={(event) =>
            set({
              category:
                event.target.value === "all" ? null : event.target.value,
              page: null,
              icon: null,
            })
          }
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All categories" : item}
            </option>
          ))}
        </select>
      </label>
    </>
  );
  return (
    <main
      ref={pageRef}
      className={`page-shell explore-page workbench-explore${selected ? " has-inspector" : ""}`}
    >
      <div className="catalog-sticky-header" ref={chromeRef}>
        <section className="catalog-page-heading">
          <div>
            <h1>Explore</h1>
            <p>Find the right glyph. Check the details. Make it yours.</p>
          </div>
          <button className="text-action" onClick={() => setGuideOpen(true)}>
            Library guide <ArrowUpRight size={14} />
          </button>
        </section>
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <MagnifyingGlass size={19} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) =>
                set(
                  { q: event.target.value || null, page: null, icon: null },
                  true,
                )
              }
              aria-label="Search icons"
              placeholder="Search icons, aliases or intent…"
            />
            {query ? (
              <button
                onClick={() => set({ q: null, page: null, icon: null })}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd>/</kbd>
            )}
          </label>
          <label className="catalog-library-select">
            <span className="sr-only">Library</span>
            <select
              aria-label="Library"
              value={library}
              onChange={(event) => changeLibrary(event.target.value)}
            >
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <div className="catalog-desktop-filters">{controls}</div>
          <button
            className="catalog-mobile-filters secondary-action"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </div>
      </div>
      <div className="catalog-workbench">
        <aside
          className="catalog-sidebar"
          aria-label="Catalog filters"
          tabIndex={0}
        >
          <nav aria-label="Icon categories">
            <h2>Categories</h2>
            {categories.map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                onClick={() =>
                  set({
                    category: item === "all" ? null : item,
                    page: null,
                    icon: null,
                  })
                }
              >
                {item === "all" ? "All icons" : item}
              </button>
            ))}
          </nav>
          <nav aria-label="Source libraries">
            <h2>Source libraries</h2>
            {sourceOptions
              .filter((source) => source.id !== "all")
              .map((source) => (
                <button
                  key={source.id}
                  aria-pressed={library === source.id}
                  onClick={() => changeLibrary(source.id)}
                >
                  {source.label}
                </button>
              ))}
          </nav>
          <a
            className="licence-note"
            href="/libraries/NOTICE.txt"
            target="_blank"
            rel="noreferrer"
          >
            Licences stay with each source library.
          </a>
        </aside>
        <section
          className="catalog-results"
          aria-label="Icon results"
          aria-busy={loading}
        >
          <header className="catalog-results-header">
            <strong>
              {filtered.length.toLocaleString()}{" "}
              {variant === "all" ? "variants" : "icons"}
            </strong>
            <span>
              {weightLabel(variant === "all" ? "regular" : variant)} / {size} px
            </span>
          </header>
          {relevantFailures.length > 0 && (
            <div className="catalog-notice" role="status">
              Some libraries could not load. Your filters are retained.{" "}
              <button onClick={() => setRetry((value) => value + 1)}>
                Retry
              </button>
            </div>
          )}
          <div className="catalog-tile-grid">
            {visible.map((icon) => (
              <button
                key={icon.id}
                className={`icon-specimen-tile${selected?.id === icon.id ? " selected" : ""}`}
                aria-label={`Inspect ${icon.name}, ${weightLabel(icon.variant)}, ${libraryLabel(icon)}`}
                aria-pressed={selected?.id === icon.id}
                onClick={(event) => {
                  lastTile.current = event.currentTarget;
                  set({ icon: icon.id });
                }}
              >
                <span className="specimen-stage">
                  <CatalogGlyph icon={icon} size={size} colour={colour} />
                </span>
                <span className="specimen-name">{icon.name}</span>
                {library === "all" && <small>{libraryLabel(icon)}</small>}
              </button>
            ))}
          </div>
          {!visible.length && (
            <div className="empty-state">
              <MagnifyingGlass size={28} />
              <h2>
                {loading
                  ? "Loading library…"
                  : relevantFailures.length
                    ? "Library unavailable"
                    : "No icons match this search"}
              </h2>
              <p>
                {loading
                  ? "Your selected library will appear here."
                  : "Try a broader term, another library or a different weight."}
              </p>
              <button
                className="secondary-action"
                onClick={() =>
                  set({
                    q: null,
                    category: null,
                    weight: null,
                    page: null,
                    icon: null,
                  })
                }
              >
                Clear filters
              </button>
              <Link to="/projects/core/create">Create a draft</Link>
            </div>
          )}
          {visible.length > 0 && (
            <nav className="catalog-pagination" aria-label="Icon result pages">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length.toLocaleString()}
              </span>
              <div>
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    set({ page: String(currentPage - 1), icon: null })
                  }
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} / {pages}
                </span>
                <button
                  disabled={currentPage === pages}
                  onClick={() =>
                    set({ page: String(currentPage + 1), icon: null })
                  }
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </section>
        {selected && (
          <CatalogInspector
            key={selected.stableId}
            selected={selected}
            siblings={siblings}
            onSelect={(icon) =>
              set({ icon: icon.id, weight: icon.variant }, true)
            }
            onClose={closeInspector}
            colour={colour}
            onColourChange={onColourChange}
          />
        )}
      </div>
      {filtersOpen && (
        <Dialog title="Catalog filters" onClose={() => setFiltersOpen(false)}>
          <div className="filter-sheet-controls">{controls}</div>
          <button
            className="primary-action"
            onClick={() => setFiltersOpen(false)}
          >
            Show results
          </button>
        </Dialog>
      )}
      {guideOpen && (
        <Dialog title="Library guide" onClose={() => setGuideOpen(false)}>
          <p>
            Formaglyph Core contains original 24 px Regular and Solid pairs.
            Open-source families keep their own geometry, native grids, weights
            and licence terms.
          </p>
          <p>
            Select an icon to compare available weights and inspect actual-size
            Family Proof specimens. Copy and download preserve source metadata;
            design handoff is clipboard-based, not live synchronization.
          </p>
          <p>
            Hugeicons contains the free Stroke Rounded collection, shown as
            Regular. Paid Pro styles are not included.
          </p>
          <p>
            Bootstrap keeps its 16 px grid, Radix its 15 px grid, and Ionicons
            its source-scale geometry and separate Sharp style. Only actual
            variants are shown; some symbols have no Regular/Solid pair.
          </p>
          <a href="/libraries/NOTICE.txt" target="_blank" rel="noreferrer">
            Read third-party licence notices <ArrowUpRight size={14} />
          </a>
        </Dialog>
      )}
    </main>
  );
}
