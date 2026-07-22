import type { IconVariant } from "./icon";

export interface StyleProfile {
  id: string;
  version: string;
  name: string;
  canvas: {
    width: 24;
    height: 24;
    liveArea: 20;
  };
  geometry: {
    snapUnits: readonly [1, 0.5];
    opticalCorrectionsAllowed: boolean;
  };
  stroke: {
    regularWidth: 2;
    linecap: "round";
    linejoin: "round";
  };
  corners: {
    externalRadius: 2;
    internalRadiusRange: readonly [1, 1.5];
  };
  variants: IconVariant[];
  colorChannels: readonly ["currentColor"];
  duotone: false;
}

export const starterStyleProfile: StyleProfile = {
  id: "style_formaglyph_core",
  version: "1.0.0",
  name: "Formaglyph Core",
  canvas: { width: 24, height: 24, liveArea: 20 },
  geometry: { snapUnits: [1, 0.5], opticalCorrectionsAllowed: true },
  stroke: { regularWidth: 2, linecap: "round", linejoin: "round" },
  corners: { externalRadius: 2, internalRadiusRange: [1, 1.5] },
  variants: ["regular", "solid"],
  colorChannels: ["currentColor"],
  duotone: false,
};
