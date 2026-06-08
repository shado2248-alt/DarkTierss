import trophyImg from "@assets/images__1_-removebg-preview_1780750268846.png";
import swordImg from "@assets/sword_1780748732738.png";
import axeImg from "@assets/axe_1780748732778.png";
import smpImg from "@assets/images__2_-removebg-preview_1780750268929.png";
import crystalImg from "@assets/images_1780748732807.png";
import uhcImg from "@assets/uhc_1780748732694.png";
import diaImg from "@assets/pot_1780748732662.png";
import nethImg from "@assets/nethop_1780748732641.png";
import maceImg from "@assets/mace_1780748732756.png";
import cartImg from "@assets/hrua_1780883788985.png";
import manhuntImg from "@assets/minecraft-pocket-edition-compass-item-wiki-minecraft_1780883794744.jpg";

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
  cart: cartImg,
  manhunt: manhuntImg,
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
  Cart: cartImg,
  Manhunt: manhuntImg,
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
