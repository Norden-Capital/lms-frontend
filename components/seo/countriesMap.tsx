"use client"

import { useState } from "react"
import { geoNaturalEarth1, geoPath } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import worldAtlas from "world-atlas/countries-110m.json"

import { count } from "@/lib/format"

/**
 * Visits by country on a world map — copied from oneBase on 2026-10-26, drawn
 * in this app's colours. Darker blue means more visits; grey means none.
 *
 * <p>The map shows where; the list beside it carries the numbers. Hovering a
 * country names it and its visits on the line above the map, so nothing moves.
 *
 * <p>The shapes are worked out once, when the file loads, not on every hover.
 */

// Natural Earth, not Mercator: Mercator makes the far north look huge.
// A fixed drawing size; the SVG scales with its viewBox.
const WIDTH = 820
const HEIGHT = 380

/** Antarctica — never has a visit, and would be a white bar at the bottom. */
const ANTARCTICA = "010"

const topology = worldAtlas as unknown as Topology<{ countries: GeometryCollection }>

const projected = (feature(topology, topology.objects.countries) as FeatureCollection<Geometry>).features.filter(
  (shape) => String(shape.id) !== ANTARCTICA
)

const toPath = geoPath(geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: projected }))

type Shape = {
  /** The index — three shapes (N. Cyprus, Somaliland, Kosovo) have no id. */
  key: string
  /** ISO 3166-1 numeric, or "" when the shape has none. */
  atlasId: string
  name: string
  d: string
}

const SHAPES: Shape[] = projected
  .map((shape: Feature<Geometry>, index: number) => ({
    key: String(index),
    atlasId: shape.id == null ? "" : String(shape.id),
    name: (shape.properties as { name?: string } | null)?.name ?? "",
    d: toPath(shape) ?? "",
  }))
  .filter((shape) => shape.d !== "")

/** Five shades, as how much blue is mixed into the card colour. */
const STEPS = [22, 40, 58, 78, 100] as const

/** No visits: a soft grey. The theme's `muted` is near white and hides the land. */
const NO_DATA = "color-mix(in oklch, var(--muted-foreground) 16%, var(--card))"

function fillFor(step: number): string {
  return `color-mix(in oklch, var(--info) ${step}%, var(--card))`
}

/** Which shade a country gets, against the busiest one. -1 is none. */
function bandFor(sessions: number, max: number): number {
  if (sessions <= 0 || max <= 0) return -1
  return Math.min(STEPS.length - 1, Math.floor((sessions / max) * STEPS.length))
}

export type CountryRow = {
  country: string
  /** ISO 3166-1 numeric — what the map's shapes are keyed on. */
  atlasId: string
  sessions: number
  organicSessions: number
}

function CountriesMap({ rows, note }: { rows: readonly CountryRow[]; note: string }) {
  // The hovered shape, not the pointer: state changes once per country.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const byAtlasId = new Map(rows.map((row) => [row.atlasId, row]))
  const max = rows.reduce((highest, row) => Math.max(highest, row.sessions), 0)

  const hovered = hoveredKey === null ? null : SHAPES.find((shape) => shape.key === hoveredKey)
  const hoveredRow = hovered ? byAtlasId.get(hovered.atlasId) : undefined

  return (
    <div className="min-w-0">
      {/* One line, always filled, so the map never moves under the pointer. */}
      <div className="flex min-w-0 items-center justify-between gap-3 text-[0.7rem]">
        <p className="min-w-0 truncate text-muted-foreground">{note}</p>
        <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          {hovered ? (
            <>
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: hoveredRow ? fillFor(100) : "var(--muted-foreground)" }}
              />
              <span className="font-medium">{hovered.name}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {count(hoveredRow?.sessions ?? 0)} visits
                {hoveredRow ? ` · ${count(hoveredRow.organicSessions)} from search` : ""}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Hover a country</span>
          )}
        </p>
      </div>

      <div className="mt-4 min-w-0" onMouseLeave={() => setHoveredKey(null)}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Visits by country. ${rows.map((row) => `${row.country}, ${count(row.sessions)}`).join(". ")}.`}
        >
          {SHAPES.map((shape) => {
            const row = byAtlasId.get(shape.atlasId)
            const band = row ? bandFor(row.sessions, max) : -1
            return (
              <path
                key={shape.key}
                d={shape.d}
                fill={band < 0 ? NO_DATA : fillFor(STEPS[band])}
                stroke="var(--card)"
                strokeWidth={0.5}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoveredKey(shape.key)}
                // Guarded: moving into a neighbour fires this after its enter.
                onMouseLeave={() => setHoveredKey((current) => (current === shape.key ? null : current))}
              />
            )
          })}

          {/* The hovered outline, drawn again on top so no neighbour hides it. */}
          {hovered ? (
            <path
              d={hovered.d}
              fill="none"
              stroke="color-mix(in oklch, var(--muted-foreground) 45%, var(--card))"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
              className="pointer-events-none"
            />
          ) : null}
        </svg>
      </div>

      {/* The key, so a shade has a meaning. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.65rem] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>Fewer</span>
          <span className="flex overflow-hidden rounded-[3px]">
            {STEPS.map((step) => (
              <span key={step} aria-hidden className="size-2.5" style={{ background: fillFor(step) }} />
            ))}
          </span>
          <span>
            More · up to <span className="font-mono tabular-nums">{count(max)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: NO_DATA }} />
          <span>No visits</span>
        </div>
      </div>
    </div>
  )
}

export { CountriesMap }
