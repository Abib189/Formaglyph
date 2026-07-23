import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Database,
  FigmaLogo,
  GithubLogo,
  HardDrives,
  Key,
  Palette,
  PlugsConnected,
  Robot,
  ShieldCheck,
  SlidersHorizontal,
  Trash,
} from "@phosphor-icons/react";
import type { IntegrationName } from "../domain/types";
import type { IssuedProjectToken, ProjectTokenSummary } from "../services/repositories/types";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { useAppState } from "../state/AppState";
import { repository } from "../services/repositories";
import { copyText } from "../services/svg";
import { useParams } from "react-router-dom";

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={checked ? "settings-toggle active" : "settings-toggle"} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingRow({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <div className="setting-row"><div className="setting-row-icon">{icon}</div><div className="setting-row-copy"><strong>{title}</strong><p>{description}</p></div><div className="setting-control">{children}</div></div>;
}

const integrationDetails: Record<IntegrationName, { label: string; description: string; icon: ReactNode; available: boolean }> = {
  github: { label: "GitHub", description: "Pull request automation and release commits are planned for a later milestone.", icon: <GithubLogo size={19} />, available: false },
  figma: { label: "Figma", description: "Copy a named vector with stable ID, version, licence, and hash metadata from Explore.", icon: <FigmaLogo size={19} />, available: true },
  penpot: { label: "Penpot", description: "Copy the same reviewed SVG handoff for an open design-system library.", icon: <SlidersHorizontal size={19} />, available: true },
};

export function SettingsPage({ dark, onSetDark }: { dark: boolean; onSetDark: (value: boolean) => void }) {
  const { state, updateSetting, role } = useAppState();
  const { projectSlug = "core" } = useParams();
  const [mcpCopyState, setMcpCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [tokens, setTokens] = useState<ProjectTokenSummary[]>([]);
  const [tokenName, setTokenName] = useState("Codex draft handoff");
  const [issuedToken, setIssuedToken] = useState<IssuedProjectToken | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const publicOrigin = import.meta.env.DEV ? "https://formaglyph.com" : window.location.origin;
  const publicApiEndpoint = `${publicOrigin}/api/v1`;
  const publicMcpEndpoint = `${publicOrigin}/mcp`;
  const copyMcpEndpoint = async () => {
    try {
      await copyText(publicMcpEndpoint);
      setMcpCopyState("copied");
    } catch {
      setMcpCopyState("error");
    }
    window.setTimeout(() => setMcpCopyState("idle"), 1800);
  };

  useEffect(() => {
    if (repository.mode !== "supabase" || role !== "admin") return;
    let active = true;
    setTokenError(null);
    void repository.listProjectTokens(projectSlug)
      .then((records) => { if (active) setTokens(records); })
      .catch((error: unknown) => { if (active) setTokenError(error instanceof Error ? error.message : "Could not load project tokens."); });
    return () => { active = false; };
  }, [projectSlug, role]);

  const issueToken = async () => {
    if (tokenName.trim().length < 2) {
      setTokenError("Give this token a name of at least 2 characters.");
      return;
    }
    setTokenBusy(true);
    setTokenError(null);
    try {
      const issued = await repository.issueProjectToken(projectSlug, tokenName.trim(), 30);
      setIssuedToken(issued);
      setTokens((current) => [issued, ...current]);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : "Could not issue the project token.");
    } finally {
      setTokenBusy(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    setTokenBusy(true);
    setTokenError(null);
    try {
      const revoked = await repository.revokeProjectToken(tokenId);
      setTokens((current) => current.map((token) => token.id === revoked.id ? revoked : token));
      if (issuedToken?.id === revoked.id) setIssuedToken(null);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : "Could not revoke the project token.");
    } finally {
      setTokenBusy(false);
    }
  };

  return (
    <main className="page-shell settings-page">
      <PageIntro number="01" title="Configure Formaglyph." aside={<div className="settings-scope"><span>Storage boundary</span><strong>{repository.mode === "supabase" ? "Supabase project" : "Local browser"}</strong><p>{repository.mode === "supabase" ? "Project records use RLS-backed PostgreSQL; appearance remains on this device." : "Preferences and demo connection states stay on this device."}</p></div>}>
        Set appearance, generation policy, agent access, integrations, and privacy defaults for this workspace.
      </PageIntro>

      <div className="settings-layout">
        <nav className="settings-index" aria-label="Settings sections">
          <a href="#appearance">Appearance</a><a href="#generation">Generation</a><a href="#agents">Agents and API</a><a href="#integrations">Integrations</a><a href="#data">Data and privacy</a>
        </nav>

        <div className="settings-panels">
          <Panel className="settings-panel" >
            <div id="appearance" className="settings-anchor" />
            <PanelHeader number="02" title="Appearance and defaults" meta="SAVED LOCALLY" />
            <SettingRow icon={<Palette size={19} />} title="Interface theme" description="Switch the complete application between its light and inverse modes.">
              <div className="segmented-control"><button className={!dark ? "active" : ""} onClick={() => onSetDark(false)}>Light</button><button className={dark ? "active" : ""} onClick={() => onSetDark(true)}>Dark</button></div>
            </SettingRow>
            <SettingRow icon={<SlidersHorizontal size={19} />} title="Project style profile" description="Use these construction rules when generating and validating icons.">
              <select value={state.settings.projectProfile} onChange={(event) => updateSetting("projectProfile", event.target.value)}><option>Formaglyph core</option><option>Commerce kit</option><option>Desktop set</option></select>
            </SettingRow>
            <SettingRow icon={<SlidersHorizontal size={19} />} title="Default variant" description="Choose the first style shown for a new draft.">
              <div className="segmented-control"><button className={state.settings.defaultVariant === "regular" ? "active" : ""} onClick={() => updateSetting("defaultVariant", "regular")}>Regular</button><button className={state.settings.defaultVariant === "solid" ? "active" : ""} onClick={() => updateSetting("defaultVariant", "solid")}>Solid</button></div>
            </SettingRow>
          </Panel>

          <Panel className="settings-panel">
            <div id="generation" className="settings-anchor" />
            <PanelHeader number="03" title="Generation policy" meta="LOCAL ADAPTER LIVE" accent />
            <div className="adapter-options">
              <button className={state.settings.generationAdapter === "local" ? "active" : ""} onClick={() => updateSetting("generationAdapter", "local")}><HardDrives size={22} /><span><strong>Local Geometry</strong><small>Deterministic, open, and processed in this browser.</small></span><i /></button>
              <button disabled className={state.settings.generationAdapter === "hosted" ? "active" : ""}><Robot size={22} /><span><strong>OmniSVG worker</strong><small>Requires a separately deployed GPU worker and project opt-in.</small></span><i /></button>
            </div>
            <SettingRow icon={<ShieldCheck size={19} />} title="Enable hosted generation" description="Disabled until an administrator connects and approves a disclosed model provider."><Toggle disabled checked={state.settings.hostedGeneration} onChange={() => undefined} label="Enable hosted generation" /></SettingRow>
            <SettingRow icon={<Check size={19} />} title="Automatic validation" description="Run geometry, naming, provenance, and licence checks after generation."><Toggle checked={state.settings.automaticValidation} onChange={(value) => updateSetting("automaticValidation", value)} label="Enable automatic validation" /></SettingRow>
            <SettingRow icon={<Database size={19} />} title="Retain generation prompts" description="Off stores only a SHA-256 hash for provenance. On stores the complete brief in project history."><Toggle checked={state.settings.retainPrompts} onChange={(value) => updateSetting("retainPrompts", value)} label="Retain generation prompts" /></SettingRow>
          </Panel>

          <Panel className="settings-panel">
            <div id="agents" className="settings-anchor" />
            <PanelHeader number="04" title="Agents and API" meta="MCP + API LIVE" accent />
            <div className="connection-field"><label>Public REST endpoint</label><div><code>{publicApiEndpoint}</code><button onClick={() => window.open(publicApiEndpoint, "_blank", "noopener,noreferrer")}>Open</button></div><p>Read-only Formaglyph Core search, manifests, metadata, OpenAPI, and immutable SVG delivery. No key required.</p></div>
            <SettingRow icon={<PlugsConnected size={19} />} title="Public MCP server" description="Live read-only tools, resources, and prompts for agent clients."><Toggle disabled checked onChange={() => undefined} label="Public MCP server enabled" /></SettingRow>
            <div className="connection-field"><label>Streamable HTTP MCP endpoint</label><div><code>{publicMcpEndpoint}</code><button onClick={() => void copyMcpEndpoint()}>{mcpCopyState === "copied" ? <><Check size={13} />Copied</> : <><Copy size={13} />{mcpCopyState === "error" ? "Copy failed" : "Copy"}</>}</button></div><p>Connect an MCP client directly. Search, inspect, and retrieve public Core SVGs without a key; project data is never exposed.</p></div>
            <SettingRow icon={<Key size={19} />} title="Project token scope" description="Tokens can create text-only drafts. They cannot upload SVGs, submit, review, approve, publish, or read private records."><select disabled value="drafts:write"><option value="drafts:write">drafts:write</option></select></SettingRow>
            {repository.mode !== "supabase" ? (
              <div className="api-key-block"><div><strong>Project tokens</strong><p>Switch to the Supabase data mode to issue scoped credentials.</p></div><button className="secondary-action" disabled>Unavailable locally</button></div>
            ) : role !== "admin" ? (
              <div className="api-key-block"><div><strong>Project tokens</strong><p>Only a project admin can issue or revoke agent credentials.</p></div><button className="secondary-action" disabled>Admin required</button></div>
            ) : (
              <div className="agent-token-manager">
                <form className="agent-token-form" onSubmit={(event) => { event.preventDefault(); void issueToken(); }}>
                  <label htmlFor="agent-token-name">Token name</label>
                  <div><input id="agent-token-name" value={tokenName} maxLength={80} onChange={(event) => setTokenName(event.target.value)} /><button className="primary-action" disabled={tokenBusy} type="submit">Issue 30-day token</button></div>
                  <p>The secret is shown once. Store it in your MCP client, never in source control.</p>
                </form>
                {issuedToken && <div className="connection-field token-secret" role="status"><label>New project token</label><div><code>{issuedToken.token}</code><button onClick={() => void copyText(issuedToken.token)}><Copy size={13} />Copy once</button></div><p>Created for {issuedToken.name}. Close this value after copying it.</p></div>}
                {tokenError && <p className="token-error" role="alert">{tokenError}</p>}
                <div className="token-list" aria-label="Project tokens">
                  {tokens.length === 0 ? <p>No project tokens issued.</p> : tokens.map((token) => {
                    const inactive = Boolean(token.revokedAt) || new Date(token.expiresAt).getTime() <= Date.now();
                    return <article key={token.id}><div><strong>{token.name}</strong><code>{token.tokenPrefix}••••</code><small>{inactive ? token.revokedAt ? "Revoked" : "Expired" : `Expires ${new Date(token.expiresAt).toLocaleDateString("en-GB")}`} · {token.lastUsedAt ? `Last used ${new Date(token.lastUsedAt).toLocaleDateString("en-GB")}` : "Never used"}</small></div><button type="button" disabled={inactive || tokenBusy} onClick={() => void revokeToken(token.id)}><Trash size={15} />Revoke</button></article>;
                  })}
                </div>
              </div>
            )}
          </Panel>

          <Panel className="settings-panel">
            <div id="integrations" className="settings-anchor" />
            <PanelHeader number="05" title="Design handoff" meta="COPY/EXPORT LIVE" accent />
            {(Object.keys(integrationDetails) as IntegrationName[]).map((name) => {
              const detail = integrationDetails[name];
              return <SettingRow key={name} icon={detail.icon} title={detail.label} description={detail.description}>{detail.available ? <a className="connection-button" href="/explore"><Copy size={15} />Open Explore</a> : <button disabled className="connection-button"><PlugsConnected size={15} />Planned</button>}</SettingRow>;
            })}
          </Panel>

          <Panel className="settings-panel">
            <div id="data" className="settings-anchor" />
            <PanelHeader number="06" title="Data and privacy" meta="DEVICE ONLY" />
            <SettingRow icon={<HardDrives size={19} />} title="Local backups" description="Keep a recoverable browser copy of drafts, reviews, and settings."><Toggle checked={state.settings.localBackups} onChange={(value) => updateSetting("localBackups", value)} label="Enable local backups" /></SettingRow>
            <SettingRow icon={<Database size={19} />} title="Anonymous diagnostics" description="Share non-content performance and error signals when a backend is connected."><Toggle checked={state.settings.anonymousDiagnostics} onChange={(value) => updateSetting("anonymousDiagnostics", value)} label="Share anonymous diagnostics" /></SettingRow>
            <div className="privacy-note"><ShieldCheck size={21} /><div><strong>Private by default</strong><p>{repository.mode === "supabase" ? "Private project data is protected by membership-scoped RLS. The public MCP server can read only the published Core catalog." : "This demo stores data in local browser storage. Public MCP access reads the published Core catalog, never browser drafts."}</p></div></div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
