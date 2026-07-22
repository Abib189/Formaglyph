import type { ReactNode } from "react";
import {
  Check,
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
} from "@phosphor-icons/react";
import type { IntegrationName } from "../domain/types";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { useAppState } from "../state/AppState";
import { repository } from "../services/repositories";

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={checked ? "settings-toggle active" : "settings-toggle"} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingRow({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <div className="setting-row"><div className="setting-row-icon">{icon}</div><div className="setting-row-copy"><strong>{title}</strong><p>{description}</p></div><div className="setting-control">{children}</div></div>;
}

const integrationDetails: Record<IntegrationName, { label: string; description: string; icon: ReactNode }> = {
  github: { label: "GitHub", description: "Prepare pull requests and release assets.", icon: <GithubLogo size={19} /> },
  figma: { label: "Figma", description: "Send reviewed SVGs to a team library.", icon: <FigmaLogo size={19} /> },
  penpot: { label: "Penpot", description: "Sync open design-system components.", icon: <SlidersHorizontal size={19} /> },
};

export function SettingsPage({ dark, onSetDark }: { dark: boolean; onSetDark: (value: boolean) => void }) {
  const { state, updateSetting } = useAppState();

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
            <PanelHeader number="03" title="Generation policy" meta="FUTURE MILESTONE" />
            <div className="adapter-options">
              <button disabled className={state.settings.generationAdapter === "local" ? "active" : ""}><HardDrives size={22} /><span><strong>Local SVG adapter</strong><small>Unavailable until the generation-adapter milestone.</small></span><i /></button>
              <button disabled className={state.settings.generationAdapter === "hosted" ? "active" : ""}><Robot size={22} /><span><strong>Hosted generation</strong><small>Unavailable during the core workflow milestone.</small></span><i /></button>
            </div>
            <SettingRow icon={<ShieldCheck size={19} />} title="Enable hosted generation" description="Planned after SVG sanitization and the original icon library."><Toggle disabled checked={false} onChange={() => undefined} label="Enable hosted generation" /></SettingRow>
            <SettingRow icon={<Check size={19} />} title="Automatic validation" description="Run geometry, naming, provenance, and licence checks after generation."><Toggle checked={state.settings.automaticValidation} onChange={(value) => updateSetting("automaticValidation", value)} label="Enable automatic validation" /></SettingRow>
            <SettingRow icon={<Database size={19} />} title="Retain generation prompts" description="Available after the generation-adapter milestone."><Toggle disabled checked={false} onChange={() => undefined} label="Retain generation prompts" /></SettingRow>
          </Panel>

          <Panel className="settings-panel">
            <div id="agents" className="settings-anchor" />
            <PanelHeader number="04" title="Agents and API" meta="FUTURE MILESTONE" />
            <SettingRow icon={<PlugsConnected size={19} />} title="MCP server" description="Unavailable until the MCP and CLI milestone."><Toggle disabled checked={false} onChange={() => undefined} label="Enable MCP server" /></SettingRow>
            <div className="connection-field"><label>MCP endpoint</label><div><code>Not provisioned</code><button disabled aria-label="MCP endpoint unavailable">Unavailable</button></div><p>No MCP endpoint is running in Milestone 1.</p></div>
            <SettingRow icon={<Key size={19} />} title="API permission" description="REST API keys are not issued in this milestone."><select disabled value="read"><option value="read">Unavailable</option></select></SettingRow>
            <div className="api-key-block"><div><strong>API keys</strong><p>Key issuance begins with the REST API milestone.</p></div><button className="secondary-action" disabled>Unavailable in Milestone 1</button></div>
          </Panel>

          <Panel className="settings-panel settings-unavailable">
            <div id="integrations" className="settings-anchor" />
            <PanelHeader number="05" title="Integrations" meta="FUTURE MILESTONE" />
            {(Object.keys(integrationDetails) as IntegrationName[]).map((name) => {
              const detail = integrationDetails[name];
              const connected = state.settings.integrations[name];
              return <SettingRow key={name} icon={detail.icon} title={detail.label} description={`${detail.description} Unavailable in Milestone 1.`}><button disabled className={connected ? "connection-button connected" : "connection-button"}><PlugsConnected size={15} />Unavailable</button></SettingRow>;
            })}
          </Panel>

          <Panel className="settings-panel">
            <div id="data" className="settings-anchor" />
            <PanelHeader number="06" title="Data and privacy" meta="DEVICE ONLY" />
            <SettingRow icon={<HardDrives size={19} />} title="Local backups" description="Keep a recoverable browser copy of drafts, reviews, and settings."><Toggle checked={state.settings.localBackups} onChange={(value) => updateSetting("localBackups", value)} label="Enable local backups" /></SettingRow>
            <SettingRow icon={<Database size={19} />} title="Anonymous diagnostics" description="Share non-content performance and error signals when a backend is connected."><Toggle checked={state.settings.anonymousDiagnostics} onChange={(value) => updateSetting("anonymousDiagnostics", value)} label="Share anonymous diagnostics" /></SettingRow>
            <div className="privacy-note"><ShieldCheck size={21} /><div><strong>Private by default</strong><p>{repository.mode === "supabase" ? "Private project data is protected by membership-scoped RLS. Hosted generation, telemetry, MCP, and model requests are inactive." : "This demo stores data in local browser storage. Hosted sync, telemetry, and model requests are not active."}</p></div></div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
