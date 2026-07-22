import { useState, type FormEvent } from "react";
import { ArrowRight, EnvelopeSimple } from "@phosphor-icons/react";
import { Navigate, useLocation } from "react-router-dom";
import { PageIntro, Panel, PanelHeader } from "../components/Layout";
import { useAuthState } from "../state/AuthState";

export function SignInPage() {
  const { user, signInWithMagicLink, error } = useAuthState();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? "/projects/core/workspace"} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true);
    try { await signInWithMagicLink(email); setSent(true); } finally { setSubmitting(false); }
  };
  return <main className="page-shell auth-page"><PageIntro number="01" title="Sign in to your workspace.">Formaglyph is invite-only during private beta. Use the email address invited by an administrator.</PageIntro><Panel className="auth-panel"><PanelHeader number="02" title="Email magic link" meta="INVITE ONLY" accent /><form onSubmit={submit}><label>Email address<div className="auth-input"><EnvelopeSimple size={18} /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div></label>{sent && <p className="auth-success">Check your inbox. The secure link returns here and restores your session.</p>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-action" disabled={submitting || sent}>{submitting ? "Sending…" : sent ? "Link sent" : "Send magic link"}<ArrowRight size={17} /></button></form><p className="microcopy">Public account creation is disabled. Ask an administrator for an invitation.</p></Panel></main>;
}
