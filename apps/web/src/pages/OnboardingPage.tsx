import { useState, type FormEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { repository } from "../services/repositories";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("My design team");
  const [organizationSlug, setOrganizationSlug] = useState("my-design-team");
  const [projectName, setProjectName] = useState("Formaglyph Core");
  const [projectSlug, setProjectSlug] = useState("core");
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    try { const project = await repository.bootstrapWorkspace({ organizationName, organizationSlug, projectName, projectSlug }); navigate(`/projects/${project.slug}/workspace`, { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Onboarding failed."); }
  };
  return <main className="page-shell auth-page"><PageIntro number="01" title="Create your first project.">This one transaction creates your organization, owner membership, default project, and Formaglyph Core style profile.</PageIntro><Panel className="auth-panel onboarding-panel"><PanelHeader number="02" title="Workspace foundation" meta="ADMIN" accent /><form onSubmit={submit}><label>Organization name<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label><label>Organization slug<input value={organizationSlug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => setOrganizationSlug(event.target.value)} /></label><label>Project name<input value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label><label>Project slug<input value={projectSlug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => setProjectSlug(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-action">Create workspace <ArrowRight size={17} /></button></form></Panel></main>;
}
