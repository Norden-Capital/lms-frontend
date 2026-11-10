/**
 * Settings → Theme (added 2026-11-10). One person's look, saved on their
 * account. Mirrors the backend's Appearance record: the lists here must match
 * the ones there, or a save is refused.
 *
 * <p>Each choice becomes an attribute on <html> (see {@link htmlAttributes}),
 * and globals.css / themes.css do the rest. A cookie holds a copy so the root
 * layout can paint the right look on the first frame, before any API call.
 */

export type Mode = "light" | "dark"
export type Radius = "none" | "small" | "medium" | "large" | "full"

/** Norden is the LMS's own look. The rest: oneBase's palettes, then tweakcn's presets (themes.css). */
export const PALETTES = [
  { id: "default", label: "Norden" },
  { id: "claude", label: "Claude" },
  { id: "caffeine", label: "Caffeine" },
  { id: "darkmatter", label: "Dark Matter" },
  { id: "mono", label: "Mono" },
  { id: "supabase", label: "Supabase" },
  { id: "sage-garden", label: "Sage Garden" },
  { id: "twitter", label: "Twitter" },
  { id: "sunset-horizon", label: "Sunset" },
  { id: "modern-minimal", label: "Modern Minimal" },
  { id: "violet-bloom", label: "Violet Bloom" },
  { id: "t3-chat", label: "T3 Chat" },
  { id: "mocha-mousse", label: "Mocha Mousse" },
  { id: "bubblegum", label: "Bubblegum" },
  { id: "amethyst-haze", label: "Amethyst Haze" },
  { id: "notebook", label: "Notebook" },
  { id: "doom-64", label: "Doom 64" },
  { id: "catppuccin", label: "Catppuccin" },
  { id: "graphite", label: "Graphite" },
  { id: "perpetuity", label: "Perpetuity" },
  { id: "kodama-grove", label: "Kodama Grove" },
  { id: "cosmic-night", label: "Cosmic Night" },
  { id: "tangerine", label: "Tangerine" },
  { id: "quantum-rose", label: "Quantum Rose" },
  { id: "nature", label: "Nature" },
  { id: "bold-tech", label: "Bold Tech" },
  { id: "elegant-luxury", label: "Elegant Luxury" },
  { id: "amber-minimal", label: "Amber Minimal" },
  { id: "neo-brutalism", label: "Neo Brutalism" },
  { id: "solar-dusk", label: "Solar Dusk" },
  { id: "claymorphism", label: "Claymorphism" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "pastel-dreams", label: "Pastel Dreams" },
  { id: "clean-slate", label: "Clean Slate" },
  { id: "ocean-breeze", label: "Ocean Breeze" },
  { id: "retro-arcade", label: "Retro Arcade" },
  { id: "midnight-bloom", label: "Midnight Bloom" },
  { id: "candyland", label: "Candyland" },
  { id: "northern-lights", label: "Northern Lights" },
  { id: "vintage-paper", label: "Vintage Paper" },
  { id: "starry-night", label: "Starry Night" },
  { id: "vercel", label: "Vercel" },
  { id: "soft-pop", label: "Soft Pop" },
] as const
export type Palette = (typeof PALETTES)[number]["id"]

/** `cssVar` is the next/font variable set on <html> in the root layout. */
export const FONTS = [
  { id: "geist", label: "Geist", cssVar: "--font-geist-sans" },
  { id: "inter", label: "Inter", cssVar: "--font-inter" },
  { id: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", cssVar: "--font-ibm-plex-sans" },
  { id: "roboto", label: "Roboto", cssVar: "--font-roboto" },
  { id: "open-sans", label: "Open Sans", cssVar: "--font-open-sans" },
  { id: "poppins", label: "Poppins", cssVar: "--font-poppins" },
  { id: "montserrat", label: "Montserrat", cssVar: "--font-montserrat" },
  { id: "nunito", label: "Nunito", cssVar: "--font-nunito" },
  { id: "outfit", label: "Outfit", cssVar: "--font-outfit" },
  { id: "figtree", label: "Figtree", cssVar: "--font-figtree" },
  { id: "manrope", label: "Manrope", cssVar: "--font-manrope" },
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", cssVar: "--font-plus-jakarta-sans" },
  { id: "space-grotesk", label: "Space Grotesk", cssVar: "--font-space-grotesk" },
] as const
export type Font = (typeof FONTS)[number]["id"]

export type Appearance = {
  mode: Mode
  palette: Palette
  radius: Radius
  font: Font
  /** The grey frame around each card. */
  cardFrame: boolean
}

export const STANDARD_APPEARANCE: Appearance = {
  mode: "light",
  palette: "default",
  radius: "medium",
  font: "geist",
  cardFrame: true,
}

/** Same values as globals.css. */
export const RADII: { id: Radius; label: string; rem: number }[] = [
  { id: "none", label: "None", rem: 0 },
  { id: "small", label: "Small", rem: 0.375 },
  { id: "medium", label: "Medium", rem: 0.625 },
  { id: "large", label: "Large", rem: 0.875 },
  { id: "full", label: "Round", rem: 1.25 },
]

export const APPEARANCE_COOKIE = "lms_appearance"

const ONE_YEAR = 60 * 60 * 24 * 365

function oneOf<T extends string>(value: unknown, list: readonly { id: T }[], fallback: T): T {
  return list.some((item) => item.id === value) ? (value as T) : fallback
}

/** Anything (a cookie, an API answer) into a valid look. Bad parts fall back one by one. */
export function toAppearance(value: unknown): Appearance {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  return {
    mode: raw.mode === "dark" ? "dark" : "light",
    palette: oneOf(raw.palette, PALETTES, STANDARD_APPEARANCE.palette),
    radius: oneOf(raw.radius, RADII, STANDARD_APPEARANCE.radius),
    font: oneOf(raw.font, FONTS, STANDARD_APPEARANCE.font),
    cardFrame: raw.cardFrame !== false,
  }
}

export function parseAppearanceCookie(value: string | undefined): Appearance {
  if (!value) return STANDARD_APPEARANCE
  try {
    return toAppearance(JSON.parse(decodeURIComponent(value)))
  } catch {
    return STANDARD_APPEARANCE
  }
}

export function sameAppearance(a: Appearance, b: Appearance): boolean {
  return (
    a.mode === b.mode &&
    a.palette === b.palette &&
    a.radius === b.radius &&
    a.font === b.font &&
    a.cardFrame === b.cardFrame
  )
}

/** The attributes for <html>. The default of each choice is left off. */
export function htmlAttributes(look: Appearance): Record<string, string | undefined> {
  return {
    "data-palette": look.palette === "default" ? undefined : look.palette,
    "data-radius": look.radius === "medium" ? undefined : look.radius,
    "data-font": look.font === "geist" ? undefined : look.font,
    "data-cards": look.cardFrame ? undefined : "plain",
  }
}

/** In the browser: put a look on the page at once, and keep the cookie in step. */
export function applyAppearance(look: Appearance) {
  const html = document.documentElement
  html.classList.toggle("dark", look.mode === "dark")
  html.style.colorScheme = look.mode
  for (const [name, value] of Object.entries(htmlAttributes(look))) {
    if (value === undefined) html.removeAttribute(name)
    else html.setAttribute(name, value)
  }
}

export function writeAppearanceCookie(look: Appearance) {
  document.cookie = `${APPEARANCE_COOKIE}=${encodeURIComponent(JSON.stringify(look))}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}
