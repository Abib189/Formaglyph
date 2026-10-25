// Apply the saved preference before React/CSS paints; never read auth storage here.
try {
  const preference = localStorage.getItem("formaglyph-theme");
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#000000" : "#ffffff");
} catch {
  /* Restricted browser storage falls back to the light theme. */
}
