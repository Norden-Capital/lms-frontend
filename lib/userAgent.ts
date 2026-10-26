/**
 * "Chrome on Windows" from a browser's long description — for the sessions
 * list, added 2026-10-26. Order matters: Edge and Opera also say "Chrome",
 * and Chrome also says "Safari".
 */
export function deviceName(agent: string | null): string {
  if (!agent) return "Unknown device"

  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /OPR\/|Opera/.test(agent)
      ? "Opera"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Chrome\/|CriOS\//.test(agent)
          ? "Chrome"
          : /Safari\//.test(agent)
            ? "Safari"
            : "A browser"

  const system = /iPhone/.test(agent)
    ? "iPhone"
    : /iPad/.test(agent)
      ? "iPad"
      : /Android/.test(agent)
        ? "Android"
        : /Windows/.test(agent)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(agent)
            ? "Mac"
            : /Linux/.test(agent)
              ? "Linux"
              : null

  return system ? `${browser} on ${system}` : browser
}

/** Whether it reads as a phone or tablet, for the icon. */
export function isMobile(agent: string | null): boolean {
  return Boolean(agent && /iPhone|iPad|Android|Mobile/.test(agent))
}
