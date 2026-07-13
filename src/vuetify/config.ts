/**
 * Ready-made FormKit wiring for the Vuetify head. Consuming apps can skip the
 * per-type `createInput(...)` boilerplate and use these helpers instead.
 */
import { loaderSelectInput } from "../loader-select.js"
import { buildRepeaterSchema, repeaterFeature, repeaterProps } from "../repeater.js"
import CheckboxInput from "./CheckboxInput.vue"
import SelectInput from "./SelectInput.vue"
import TextareaInput from "./TextareaInput.vue"
import TextInput from "./TextInput.vue"
import type { FormKitLibrary, FormKitOptions, FormKitSchemaNode } from "@formkit/core"
import { select } from "@formkit/inputs"
import type { DefaultConfigOptions } from "@formkit/vue"
import { createInput, defaultConfig } from "@formkit/vue"
import { VBtn } from "vuetify/components"

// `VBtn`-rendered add / remove controls for `vrepeater`, spliced into the
// shared row/`for`/`group` structure by `buildRepeaterSchema`. Each carries
// the same `disabled`/`onClick` expressions as the default `<button>`
// controls in `repeater.ts` — only the rendering differs.
const vuetifyAddControl: FormKitSchemaNode = {
  $cmp: "VBtn",
  props: {
    variant: "tonal",
    class: "formkit-repeater-add",
    disabled: "$max > 0 && $rows.length >= $max",
    onClick: "$handlers.repeaterAdd",
  },
  children: "$addLabel",
}
const vuetifyRemoveControl: FormKitSchemaNode = {
  $cmp: "VBtn",
  props: {
    color: "error",
    variant: "tonal",
    class: "mt-4",
    disabled: "$rows.length <= $min",
    onClick: "$handlers.repeaterRemove($index)",
  },
  children: "$removeLabel",
}

// `vrepeater`'s row class: same base class as the generic default, plus a top
// margin between rows only (not before the first). FormKit's expression
// compiler has no ternary, so this is a `&&`/`||` short-circuit — it yields
// the "mt-6" variant for rows after the first and the plain class for row 0.
const vuetifyRowClass = "$index > 0 && 'formkit-repeater-item mt-6' || 'formkit-repeater-item'"

/**
 * Build the `inputs` object for a FormKit config: the Vuetify bridge types
 * (`vtext`, `vnumber`, `vemail`, `vpassword`, `vtextarea`, `vselect`, `vcheckbox`)
 * plus the self-loading `loaderSelect` and the `repeater` stand-in.
 *
 * Pass `overrides` to add your own types or replace any of the defaults; they're
 * spread last, so a key you provide wins.
 *
 * @example
 * defaultConfig({ inputs: vuetifyInputs({ myField: createInput(MyComp) }) })
 */
export function vuetifyInputs(overrides: FormKitLibrary = {}): FormKitLibrary {
  // vtext/vnumber/vemail/vpassword share one definition; TextInput derives
  // the HTML input `type` from the FormKit type name at runtime.
  const text = createInput(TextInput, { props: ["vuetifyProps", "inputType"] })

  return {
    vtext: text,
    vnumber: text,
    vemail: text,
    vpassword: text,
    vtextarea: createInput(TextareaInput, { props: ["vuetifyProps"] }),
    vselect: createInput(SelectInput, {
      props: ["vuetifyProps", "items", ...(Array.isArray(select.props) ? select.props : [])],
      features: select.features,
    }),
    // Same head as vselect; the extra props/features make it fetch its own
    // options. Keyed `loaderSelect` to match the loaderSelect() field helper.
    vloaderselect: createInput(SelectInput, {
      props: [
        "vuetifyProps",
        ...(Array.isArray(loaderSelectInput.props) ? loaderSelectInput.props : []),
      ],
      features: loaderSelectInput.features,
    }),
    vcheckbox: createInput(CheckboxInput, { props: ["vuetifyProps"] }),
    // Same behavior as the generic `repeater` (formkit-heads' `src/repeater.ts`
    // stand-in for FormKit Pro's repeater) — only the add/remove controls
    // differ, rendered as `VBtn` instead of plain `<button>`.
    vrepeater: createInput(
      buildRepeaterSchema(vuetifyAddControl, vuetifyRemoveControl, vuetifyRowClass),
      {
        type: "list",
        props: repeaterProps,
        features: [repeaterFeature],
        library: { VBtn },
      },
    ),
    ...overrides,
  }
}

/**
 * Build a complete FormKit config wired for the Vuetify heads — a thin wrapper
 * over FormKit's `defaultConfig` that injects {@link vuetifyInputs}.
 *
 * All other options pass straight through. An `inputs` object you supply is
 * merged on top of the Vuetify defaults (your keys win), so you can add or
 * override types without losing the bridge.
 *
 * @example
 * export const formkitConfig = vuetifyFormKitConfig({
 *   plugins: [myPlugin],
 *   inputs: { myField: createInput(MyComp) },
 * })
 */
export function vuetifyFormKitConfig(options: DefaultConfigOptions = {}): FormKitOptions {
  const { inputs, ...rest } = options
  return defaultConfig({
    ...rest,
    inputs: vuetifyInputs(inputs),
  })
}
