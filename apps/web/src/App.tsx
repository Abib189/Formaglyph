import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppHeader, RouteLoading, Toast } from "./components/Layout";
import { AppStateProvider } from "./state/AppState";
import { AuthStateProvider, useAuthState } from "./state/AuthState";
import { SignInPage } from "./pages/SignInPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { isSupabaseMode } from "./services/dataMode";
import type { RouteName } from "./domain/types";

const ExplorePage = lazy(() => import("./pages/ExplorePage").then((module) => ({ default: module.ExplorePage })));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage").then((module) => ({ default: module.WorkspacePage })));
const CreatePage = lazy(() => import("./pages/CreatePage").then((module) => ({ default: module.CreatePage })));
const ReviewPage = lazy(() => import("./pages/ReviewPage").then((module) => ({ default: module.ReviewPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthState();
  const location = useLocation();
  if (loading) return <RouteLoading label="Restoring session" />;
  if (isSupabaseMode && !user) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  return children;
}

function FormaglyphApp() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { user, signOut } = useAuthState();
  const [dark, setDark] = useState(() => window.localStorage.getItem("formaglyph-theme") === "dark");
  const route = useMemo<RouteName>(() => {
    if (location.pathname.includes("/workspace")) return "workspace";
    if (location.pathname.includes("/create")) return "create";
    if (location.pathname.includes("/review")) return "review";
    if (location.pathname.includes("/settings")) return "settings";
    return "explore";
  }, [location.pathname]);
  const projectSlug = location.pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "core";
  const navigate = (nextRoute: RouteName) => {
    const path = nextRoute === "explore" ? "/explore" : nextRoute === "review" ? `/projects/${projectSlug}/review` : `/projects/${projectSlug}/${nextRoute}`;
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#ffffff");
    window.localStorage.setItem("formaglyph-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    routerNavigate("/sign-in", { replace: true });
  };

  return <div className="app-frame"><a className="skip-link" href="#main-content">Skip to content</a><AppHeader route={route} onNavigate={navigate} dark={dark} onToggleTheme={() => setDark((current) => !current)} signedIn={Boolean(user)} onSignOut={() => void handleSignOut()} /><div id="main-content"><Suspense fallback={<RouteLoading />}><Routes><Route path="/" element={<Navigate to="/explore" replace />} /><Route path="/explore" element={<ExplorePage />} /><Route path="/sign-in" element={<SignInPage />} /><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} /><Route path="/projects/:projectSlug/workspace" element={<RequireAuth><WorkspacePage onNavigate={navigate} dark={dark} /></RequireAuth>} /><Route path="/projects/:projectSlug/create" element={<RequireAuth><CreatePage onNavigate={navigate} dark={dark} /></RequireAuth>} /><Route path="/projects/:projectSlug/review" element={<RequireAuth><ReviewPage /></RequireAuth>} /><Route path="/projects/:projectSlug/review/:proposalId" element={<RequireAuth><ReviewPage /></RequireAuth>} /><Route path="/projects/:projectSlug/settings" element={<RequireAuth><SettingsPage dark={dark} onSetDark={setDark} /></RequireAuth>} /><Route path="*" element={<Navigate to="/explore" replace />} /></Routes></Suspense></div><Toast /></div>;
}

export function App() {
  return <BrowserRouter><AuthStateProvider><AppStateProvider><FormaglyphApp /></AppStateProvider></AuthStateProvider></BrowserRouter>;
}
