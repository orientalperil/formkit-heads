/**
 * Ready-made FormKit wiring for the Vuetify head. Consuming apps can skip the
 * per-type `createInput(...)` boilerplate and use these helpers instead.
 */
import { dataSelectInput } from "../data-select.js"
import CheckboxInput from "./CheckboxInput.vue"
import SelectInput from "./SelectInput.vue"
import TextareaInput from "./TextareaInput.vue"
import TextInput from "./TextInput.vue"
import type { FormKitLibrary, FormKitOptions } from "@formkit/core"
import type { DefaultConfigOptions } from "@formkit/vue"
import { createInput, defaultConfig } from "@formkit/vue"

/**
 * Build the `inputs` object for a FormKit config: the Vuetify bridge types
 * (`vtext`, `vnumber`, `vemail`, `vtextarea`, `vselect`, `vcheckbox`) plus the
 * self-loading `dataSelect`.
 *
 * Pass `overrides` to add your own types or replace any of the defaults; they're
 * spread last, so a key you provide wins.
 *
 * @example
 * defaultConfig({ inputs: vuetifyInputs({ myField: createInput(MyComp) }) })
 */
export function vuetifyInputs(overrides: FormKitLibrary = {}): FormKitLibrary {
  // vtext/vnumber/vemail share one definition; TextInput derives the HTML
  // input `type` from the FormKit type name at runtime.
  const text = createInput(TextInput, { props: ["vuetifyProps", "inputType"] })

  return {
    vtext: text,
    vnumber: text,
    vemail: text,
    vtextarea: createInput(TextareaInput, { props: ["vuetifyProps"] }),
    vselect: createInput(SelectInput, { props: ["vuetifyProps", "items"] }),
    // Same head as vselect; the extra props/features make it fetch its own
    // options. Keyed `dataSelect` to match the dataSelect() field helper.
    dataSelect: createInput(SelectInput, {
      props: [
        "vuetifyProps",
        ...(Array.isArray(dataSelectInput.props) ? dataSelectInput.props : []),
      ],
      features: dataSelectInput.features,
    }),
    vcheckbox: createInput(CheckboxInput, { props: ["vuetifyProps"] }),
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
