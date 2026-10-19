import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { App } from "./App";
import "./styles.css";
import "./workbench.css";

const root = document.getElementById("root");
if (!root) throw new Error("Formaglyph root element was not found.");

createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
