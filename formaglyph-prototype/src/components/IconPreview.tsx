import { GridFour, type Icon } from "@phosphor-icons/react";
import type { IconWeight } from "../domain/types";

export function WeightIcon({ Icon: IconComponent, weight = "regular", size = 44, className = "" }: { Icon: Icon; weight?: IconWeight; size?: number; className?: string }) {
  return <IconComponent className={className} size={size} weight={weight} aria-hidden="true" />;
}

export function ConstructionIcon({ Icon: IconComponent, weight = "regular", iconSize = 96, gridSize = 182 }: { Icon: Icon; weight?: IconWeight; iconSize?: number; gridSize?: number }) {
  return <><GridFour className="grid-asset" size={gridSize} weight="thin" /><WeightIcon Icon={IconComponent} size={iconSize} weight={weight} /></>;
}
