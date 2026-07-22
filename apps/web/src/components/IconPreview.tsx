import { GridFour, type Icon } from "@phosphor-icons/react";
import type { PreviewWeight } from "../domain/types";

export function WeightIcon({ Icon: IconComponent, weight = "regular", size = 44, className = "" }: { Icon: Icon; weight?: PreviewWeight; size?: number; className?: string }) {
  return <IconComponent className={className} size={size} weight={weight} aria-hidden="true" />;
}

export function SvgIcon({ svg, size = 44, className = "" }: { svg: string; size?: number; className?: string }) {
  return <span className={`formaglyph-svg ${className}`.trim()} style={{ width: size, height: size }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function ConstructionIcon({ Icon: IconComponent, svg, assetUrl, weight = "regular", iconSize = 96, gridSize = 182 }: { Icon?: Icon; svg?: string; assetUrl?: string; weight?: PreviewWeight; iconSize?: number; gridSize?: number }) {
  return <><GridFour className="grid-asset" size={gridSize} weight="thin" />{svg ? <SvgIcon svg={svg} size={iconSize} /> : assetUrl ? <img className="catalog-asset construction-asset" src={assetUrl} width={iconSize} height={iconSize} alt="" /> : IconComponent ? <WeightIcon Icon={IconComponent} size={iconSize} weight={weight} /> : null}</>;
}
