import type { FormKitSchemaNode } from "@formkit/core"

/**
 * Rewrite a generated FormKit schema's built-in input types to the Vuetify
 * bridge types registered by `formkit-heads/vuetify` (`vtext`, `vselect`, ...),
 * so `<FormKitSchema>` renders Vuetify components instead of the stock
 * Genesis-themed inputs.
 *
 * The generated schema (see `src/client/formkit.gen.ts`) is framework-agnostic
 * and emits standard type names (`text`, `select`, ...). The bridge selects its
 * Vuetify component from the node's *type name*, so the schema has to carry the
 * `v`-prefixed names — this transform is the mapping layer between the two.
 *
 * Every node with a string `$formkit` type is rewritten by prefixing `v`
 * (`text` -> `vtext`, `select` -> `vselect`, ...), except the structural
 * container types in {@link CONTAINER_TYPES}, which are left untouched. Pass
 * `extraTypeMap` to supply explicit mappings for types whose bridge name isn't
 * just the `v`-prefixed original.
 */

/** Structural node types that have no Vuetify bridge and pass through unchanged. */
export const CONTAINER_TYPES: ReadonlySet<string> = new Set(["list", "group", "form"])

/**
 * Map a schema's `$formkit` input types onto the Vuetify bridge types.
 *
 * The input is cloned, so the module-level generated constant is never mutated.
 * Recurses into nested `children` so fields inside repeatable groups are mapped
 * too. Compose it with `applyFieldOverrides` in either order — overrides that set
 * their own type (e.g. `dataSelect`) aren't in the map and pass through
 * unchanged.
 *
 * @example
 * const schema = vuetifyize(applyFieldOverrides(ProductWritableFormKitSchema, overrides))
 */
export function vuetifyize(
  schema: readonly FormKitSchemaNode[],
  extraTypeMap: Record<string, string> = {},
): FormKitSchemaNode[] {
  // Deep-clone plain objects/arrays but pass functions (and other non-plain
  // values) through by reference — `structuredClone` throws on functions, and
  // field overrides like `dataSelect()` inject a function-valued `options`
  // loader we must keep intact.
  const clone = <T>(value: T): T => {
    if (Array.isArray(value)) return value.map(clone) as T
    if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) out[k] = clone(v)
      return out as T
    }
    return value
  }

  const walk = (nodes: FormKitSchemaNode[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue
      const record = node as Record<string, unknown>
      if (typeof record.$formkit === "string") {
        if (record.$formkit in extraTypeMap) {
          record.$formkit = extraTypeMap[record.$formkit]
        } else if (!CONTAINER_TYPES.has(record.$formkit)) {
          record.$formkit = `v${record.$formkit}`
        }
      }
      if (Array.isArray(record.children)) walk(record.children as FormKitSchemaNode[])
    }
  }

  const cloned = clone(schema) as FormKitSchemaNode[]
  walk(cloned)
  return cloned
}
