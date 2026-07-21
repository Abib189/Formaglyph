import { useEffect, useState, type ReactNode } from "react";
import { GithubLogo, Moon, Shapes, Sun, X } from "@phosphor-icons/react";
import type { RouteName } from "../domain/types";
import { useAppState } from "../state/AppState";

export function useRoute(): [RouteName, (route: RouteName) => void] {
  const readRoute = (): RouteName => {
    const route = window.location.hash.replace("#", "").split("?")[0];
    return route === "create" || route === "review" ? route : "explore";
  };
  const [route, setRoute] = useState<RouteName>(readRoute);

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#explore");
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextRoute: RouteName) => {
    window.location.hash = nextRoute;
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return [route, navigate];
}

function Brand({ onNavigate }: { onNavigate: (route: RouteName) => void }) {
  return (
    <button className="brand" onClick={() => onNavigate("explore")} aria-label="Go to Formaglyph Explore">
      <span className="brand-mark"><Shapes size={23} weight="regular" /></span>
      <span>Formaglyph</span>
    </button>
  );
}

export function AppHeader({ route, onNavigate, dark, onToggleTheme }: { route: RouteName; onNavigate: (route: RouteName) => void; dark: boolean; onToggleTheme: () => void }) {
  return (
    <header className="app-header">
      <div className="header-primary"><Brand onNavigate={onNavigate} /><span className="system-id">SYS.{route.toUpperCase()} // 001.0</span></div>
      <nav className="main-nav" aria-label="Primary navigation">
        {(["explore", "create", "review"] as RouteName[]).map((item) => (
          <button key={item} className={route === item ? "nav-link active" : "nav-link"} onClick={() => onNavigate(item)}>{item}</button>
        ))}
        <a className="nav-link" href="https://github.com/formaglyph/formaglyph" target="_blank" rel="noreferrer"><GithubLogo size={17} /><span className="nav-github-label">GitHub</span></a>
        <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      </nav>
    </header>
  );
}

export function PageIntro({ number, title, children, aside }: { number: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return <section className="page-intro"><div className="intro-copy"><div className="section-index"><span>{number}</span><i /></div><h1>{title}</h1><p>{children}</p></div>{aside}</section>;
}

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHeader({ number, title, meta, accent = false }: { number: string; title: string; meta?: string; accent?: boolean }) {
  return <header className="panel-header"><div><span>{number}</span><strong>{title}</strong></div>{meta && <span className={accent ? "panel-meta accent" : "panel-meta"}>{accent && <i />}{meta}</span>}</header>;
}

export function PageFooter({ dark }: { dark: boolean }) {
  return <footer className="page-footer"><span>Formaglyph · Open-source AI-native icon system</span><span>MIT assets · Apache-2.0 platform · {dark ? "Dark" : "Light"} mode</span></footer>;
}

export function Toast() {
  const { notice, clearNotice } = useAppState();
  if (!notice) return <div className="sr-only" aria-live="polite" />;
  return (
    <div className={`app-toast ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <span>{notice.message}</span><button onClick={clearNotice} aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  );
}
