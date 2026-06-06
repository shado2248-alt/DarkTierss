import trophyImg from "@assets/images_(1)_1780748732719.png";
import swordImg from "@assets/sword_1780748732738.png";
import axeImg from "@assets/axe_1780748732778.png";
import smpImg from "@assets/images_(2)_1780748732793.jpeg";
import crystalImg from "@assets/images_1780748732807.png";
import uhcImg from "@assets/uhc_1780748732694.png";
import diaImg from "@assets/pot_1780748732662.png";
import nethImg from "@assets/nethop_1780748732641.png";
import maceImg from "@assets/mace_1780748732756.png";

const SLUG_ICONS: Record<string, string> = {
  overall: trophyImg,
  sword: swordImg,
  axe: axeImg,
  smp: smpImg,
  crystal: crystalImg,
  uhc: uhcImg,
  diapot: diaImg,
  nethpot: nethImg,
  mace: maceImg,
};

const NAME_ICONS: Record<string, string> = {
  Overall: trophyImg,
  Sword: swordImg,
  Axe: axeImg,
  SMP: smpImg,
  Crystal: crystalImg,
  UHC: uhcImg,
  DiaPot: diaImg,
  NethPot: nethImg,
  Mace: maceImg,
};

export function getGamemodeIcon(slugOrName: string): string | undefined {
  return SLUG_ICONS[slugOrName.toLowerCase()] ?? NAME_ICONS[slugOrName];
}

export function GamemodeIcon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const src = getGamemodeIcon(name);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`object-contain flex-shrink-0 ${className}`}
    />
  );
}

export { trophyImg };
