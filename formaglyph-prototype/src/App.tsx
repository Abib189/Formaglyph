import { useEffect, useState } from "react";
import { AppHeader, Toast, useRoute } from "./components/Layout";
import { ExplorePage } from "./pages/ExplorePage";
import { CreatePage } from "./pages/CreatePage";
import { ReviewPage } from "./pages/ReviewPage";
import { AppStateProvider } from "./state/AppState";

function FormaglyphApp() {
  const [route, navigate] = useRoute();
  const [dark, setDark] = useState(() => window.localStorage.getItem("formaglyph-theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#ffffff");
    window.localStorage.setItem("formaglyph-theme", dark ? "dark" : "light");
  }, [dark]);

  return <div className="app-frame"><a className="skip-link" href="#main-content">Skip to content</a><AppHeader route={route} onNavigate={navigate} dark={dark} onToggleTheme={() => setDark((current) => !current)} /><div id="main-content">{route === "explore" && <ExplorePage />}{route === "create" && <CreatePage onNavigate={navigate} dark={dark} />}{route === "review" && <ReviewPage />}</div><Toast /></div>;
}

export function App() {
  return <AppStateProvider><FormaglyphApp /></AppStateProvider>;
}
