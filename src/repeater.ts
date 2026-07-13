import type { FormKitNode, FormKitSchemaNode } from "@formkit/core"
import { createInput } from "@formkit/vue"

/**
 * A minimal, dependency-free stand-in for FormKit Pro's `repeater` input.
 *
 * `children` passed to the schema node are the per-row fields. This input
 * owns the row list itself and renders add / remove controls, so callers
 * don't need to wire up their own row array, index-based remover, or "add
 * row" button.
 *
 * How it works:
 *  - `type: 'list'` makes the node's value an array of row objects.
 *  - The `for` loop iterates an *internal* tracking array (`$rows`) of stable
 *    keys — NOT the node's own value. Driving the loop from the value would be
 *    circular: removing an item by splicing the value can't destroy the child
 *    group node, so on the next commit the surviving group repopulates the
 *    array.
 *  - Each iteration renders a `group` (keyed by `$row.key`) whose fields come
 *    from the row template (`$slots.default` — the `children` passed to the
 *    node). The parent list auto-assigns each group its array index by render
 *    order, so fields bind to `items[i].product`, `items[i].quantity`, etc.
 *  - Add / remove mutate `$rows`; the value follows as groups mount/unmount.
 *
 * This module is framework-agnostic: its default export renders plain
 * `<button>` controls. `formkit-heads/vuetify` registers a `vrepeater`
 * variant that reuses {@link repeaterFeature} and {@link repeaterProps} but
 * swaps in `VBtn` controls — see `src/vuetify/config.ts`.
 */

export function repeaterFeature(node: FormKitNode) {
  // Defaults for the schema-referenced props (a props array can't set them).
  node.props.min ??= 0
  node.props.max ??= 0
  node.props.addLabel ??= "+ Add item"
  node.props.removeLabel ??= "Remove"

  let nextKey = 0
  const makeRow = () => ({ key: nextKey++ })
  type Ctx = { rows: { key: number }[]; handlers: Record<string, unknown> }

  node.on("created", () => {
    const ctx = node.context as unknown as Ctx

    // Seed one row per existing value item (edit mode), but never below `min`.
    const valueLen = Array.isArray(node.value) ? node.value.length : 0
    const count = Math.max(valueLen, Number(node.props.min ?? 0))
    ctx.rows = Array.from({ length: count }, makeRow)

    ctx.handlers.repeaterAdd = () => {
      ctx.rows = [...ctx.rows, makeRow()]
    }
    // Curried so `$handlers.repeaterRemove($index)` yields a click handler
    // rather than removing during render.
    ctx.handlers.repeaterRemove = (index: number) => () => {
      ctx.rows = ctx.rows.filter((_, i) => i !== index)
    }
  })
}

/** The input's custom props — shared by every rendering variant. */
export const repeaterProps = ["min", "max", "addLabel", "removeLabel"]

/** Plain `<button>` controls used by the default (non-Vuetify) variant. */
const defaultAddControl: FormKitSchemaNode = {
  $el: "button",
  attrs: {
    type: "button",
    class: "formkit-repeater-add",
    disabled: "$max > 0 && $rows.length >= $max",
    onClick: "$handlers.repeaterAdd",
  },
  children: "$addLabel",
}
const defaultRemoveControl: FormKitSchemaNode = {
  $el: "button",
  attrs: {
    type: "button",
    class: "formkit-repeater-remove",
    disabled: "$rows.length <= $min",
    onClick: "$handlers.repeaterRemove($index)",
  },
  children: "$removeLabel",
}

/** Static row class used when a variant doesn't need inter-row spacing baked into the schema. */
const DEFAULT_ROW_CLASS = "formkit-repeater-item"

/**
 * Assemble the repeater's schema tree, splicing in the given add / remove
 * control nodes. Each control must already carry its own `disabled`/`onClick`
 * expression and label reference — see {@link defaultAddControl} for the
 * expressions a control needs to reproduce.
 *
 * Rendering heads call this with their own control nodes (e.g. `VBtn`
 * components) to build a themed variant without duplicating the row/`for`/
 * `group` structure. See `formkit-heads/vuetify`'s `vrepeater` registration.
 *
 * `rowClass` lets a variant compute its own row class (e.g. adding a margin
 * utility between rows) instead of the static default — pass a FormKit
 * expression string, same as any other `attrs` value.
 */
export function buildRepeaterSchema(
  addControl: FormKitSchemaNode,
  removeControl: FormKitSchemaNode,
  rowClass: string = DEFAULT_ROW_CLASS,
): FormKitSchemaNode[] {
  return [
    {
      $el: "div",
      attrs: { class: "formkit-repeater" },
      children: [
        {
          $el: "div",
          for: ["row", "index", "$rows"],
          attrs: { key: "$row.key", class: rowClass },
          children: [{ $formkit: "group", children: "$slots.default" }, removeControl],
        },
        addControl,
      ],
    },
  ]
}

export const repeater = createInput(buildRepeaterSchema(defaultAddControl, defaultRemoveControl), {
  type: "list",
  props: repeaterProps,
  features: [repeaterFeature],
})
