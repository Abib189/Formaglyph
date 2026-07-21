import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Formaglyph root element was not found.");

createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
