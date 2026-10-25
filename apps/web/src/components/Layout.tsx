import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { List } from "@phosphor-icons/react/List";
import { Moon } from "@phosphor-icons/react/Moon";
import { SignOut } from "@phosphor-icons/react/SignOut";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { Sun } from "@phosphor-icons/react/Sun";
import { X } from "@phosphor-icons/react/X";
import type { RouteName } from "../domain/types";
import { useAppState } from "../state/AppState";
import { useAuthState } from "../state/AuthState";
import { isSupabaseMode } from "../services/dataMode";
import { Dialog } from "./Dialog";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { NavigationIndicator } from "./NavigationIndicator";
import { motionTiming, useWorkbenchReducedMotion } from "./WorkbenchMotion";

export function RouteLoading({ label = "Loading page" }: { label?: string }) {
  return (
    <main className="page-shell route-loading" aria-label={label}>
      <div />
      <div />
      <div />
    </main>
  );
}

function Brand({ dark }: { dark: boolean }) {
  return (
    <Link className="brand" to="/explore" aria-label="Formaglyph — Explore">
      <img
        src={`/brand/formaglyph-symbol-small-${dark ? "white" : "black"}.svg`}
        width="24"
        height="24"
        alt=""
      />
      <img
        className="brand-wordmark"
        src={`/brand/formaglyph-wordmark-${dark ? "white" : "black"}.svg`}
        width="148"
        height="32"
        alt="Formaglyph"
      />
    </Link>
  );
}

export function AppHeader({
  route,
  dark,
  onToggleTheme,
  signedIn = false,
  onSignOut,
}: {
  route: RouteName;
  onNavigate: (route: RouteName) => void;
  dark: boolean;
  onToggleTheme: () => void;
  signedIn?: boolean;
  onSignOut?: () => Promise<void>;
}) {
  const { project, role } = useAppState();
  const { user } = useAuthState();
  const location = useLocation();
  const slug = location.pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "core";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const account = useRef<HTMLDetailsElement>(null);
  const projectMenu = useRef<HTMLDetailsElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (account.current) account.current.open = false;
    if (projectMenu.current) projectMenu.current.open = false;
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (account.current && !account.current.contains(event.target as Node))
        account.current.open = false;
      if (
        projectMenu.current &&
        !projectMenu.current.contains(event.target as Node)
      )
        projectMenu.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const links = [
    { name: "Explore", to: "/explore", active: route === "explore" },
    {
      name: "Workspace",
      to: `/projects/${slug}/workspace`,
      active: route === "workspace" || route === "create",
    },
    {
      name: "Review",
      to: `/projects/${slug}/review`,
      active: route === "review",
    },
  ];
  const signOut = async () => {
    setSigningOut(true);
    setSignOutError("");
    try {
      await onSignOut?.();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const accountContent = (
    <>
      <div className="account-menu-identity">
        <strong>
          {!isSupabaseMode ? "Local demonstration" : "Signed in as"}
        </strong>
        <span>{user?.email ?? "Not signed in"}</span>
        <small>
          {project?.name ?? "No active project"} ·{" "}
          {project?.role ?? (isSupabaseMode ? "Access not loaded" : role)}
        </small>
      </div>
      <Link to={`/projects/${slug}/settings`}>
        <SlidersHorizontal size={16} />
        Settings
      </Link>
      <button onClick={onToggleTheme}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
        {dark ? "Light appearance" : "Dark appearance"}
      </button>
      <a
        href="https://github.com/Abib189/Formaglyph"
        target="_blank"
        rel="noreferrer"
      >
        GitHub repository
      </a>
      {signedIn && isSupabaseMode ? (
        <button disabled={signingOut} onClick={() => void signOut()}>
          <SignOut size={16} />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      ) : !signedIn ? (
        <Link to="/sign-in">Sign in</Link>
      ) : null}
      {signOutError && <p role="alert">{signOutError}</p>}
    </>
  );
  return (
    <>
      <header className="app-header">
        <Brand dark={dark} />
        <nav ref={navigation} className="main-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={`nav-link${link.active ? " active" : ""}`}
              aria-current={link.active ? "page" : undefined}
            >
              {link.name}
            </NavLink>
          ))}
          <NavigationIndicator container={navigation} active={route} />
        </nav>
        <div className="header-context">
          <details
            className="project-menu account-menu"
            ref={projectMenu}
            onKeyDown={(event) => {
              if (event.key === "Escape" && projectMenu.current) {
                projectMenu.current.open = false;
                projectMenu.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary className="project-context">
              {project?.name ??
                (isSupabaseMode ? "Workspace" : "Formaglyph Core")}
              <CaretDown size={12} />
            </summary>
            <div className="account-menu-popover">
              <div className="account-menu-identity">
                <strong>Active project</strong>
                <span>
                  {project?.name ?? "Open Workspace to load project access"}
                </span>
                <small>
                  {project?.role ??
                    (!isSupabaseMode
                      ? "Local demo · admin"
                      : "Access not loaded")}
                </small>
              </div>
              <Link to={`/projects/${slug}/workspace`}>Open Workspace</Link>
              <Link to={`/projects/${slug}/settings#data`}>
                Project settings
              </Link>
            </div>
          </details>
          <details
            className="account-menu"
            ref={account}
            onKeyDown={(event) => {
              if (event.key === "Escape" && account.current) {
                account.current.open = false;
                account.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary aria-label="Account and appearance">
              <span>{user?.email?.split("@")[0] ?? "Account"}</span>
              <CaretDown size={12} />
            </summary>
            <div className="account-menu-popover">{accountContent}</div>
          </details>
        </div>
        <button
          className="mobile-menu-button icon-action"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <List size={22} />
        </button>
      </header>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.to}
            aria-current={link.active ? "page" : undefined}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      {mobileOpen && (
        <Dialog
          title="Navigation"
          onClose={() => setMobileOpen(false)}
          className="navigation-dialog"
        >
          <nav>
            {links.map((link) => (
              <Link key={link.name} to={link.to}>
                {link.name}
              </Link>
            ))}
            <Link to={`/projects/${slug}/create`}>Create icon</Link>
          </nav>
          <div className="mobile-account-menu">{accountContent}</div>
        </Dialog>
      )}
    </>
  );
}

export function PageIntro({
  title,
  children,
  aside,
}: {
  number?: string;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="page-intro">
      <div className="intro-copy">
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      {aside}
    </section>
  );
}

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHeader({
  title,
  meta,
}: {
  number?: string;
  title: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <header className="panel-header">
      <h2>{title}</h2>
      {meta && <span className="panel-meta">{meta}</span>}
    </header>
  );
}

export function PageFooter({ dark }: { dark: boolean }) {
  return (
    <footer className="page-footer">
      <span>Formaglyph · An icon library and release workbench</span>
      <span>
        Source-specific asset licences · {dark ? "Dark" : "Light"} appearance
      </span>
    </footer>
  );
}

export function Toast() {
  const { notice, clearNotice } = useAppState();
  return <><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{notice?.tone !== "error" ? notice?.message : ""}</span><AnimatePresence initial={false}>{notice && (
    <ToastMessage key={`${notice.tone}:${notice.message}`} notice={notice} onDismiss={clearNotice} />
  )}</AnimatePresence></>;
}

function ToastMessage({ notice, onDismiss }: { notice: { tone: string; message: string }; onDismiss: () => void }) {
  const reduced = useWorkbenchReducedMotion();
  const present = useIsPresent();
  return <m.div
      className={`app-toast ${notice.tone}`}
      role={present && notice.tone === "error" ? "alert" : undefined}
      inert={!present} aria-hidden={!present || undefined}
      initial={{ opacity: 0, y: reduced ? 0 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -4 }}
      transition={reduced ? motionTiming.instant : motionTiming.exit}
    >
      <span>{notice.message}</span>
      <button onClick={() => { if (present) onDismiss(); }} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </m.div>;
}
