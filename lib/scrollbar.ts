/**
 * Kept as a marker on scroll areas, and empty on purpose.
 *
 * <p>Scrollbars are styled once, globally, in `app/globals.css` — copied from
 * oneBase on 2026-10-19. This used to carry its own rounded, 6px style, and
 * because utility classes outrank the base layer it would have overridden the
 * global one wherever it was used. Emptied rather than removed from its sixteen
 * call sites so that change is one line, not sixteen files.
 */
export const THIN_SCROLLBAR = ""
