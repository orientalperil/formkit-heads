<script setup lang="ts">
/**
 * Vuetify head for FormKit select-family types: vselect and the self-loading
 * vdataselect. Register each with createInput(SelectInput) in the consuming app.
 */
import { useFormKitInput } from "./useFormKitInput.js"
import type { FormKitFrameworkContext } from "@formkit/core"
import type { FormKitOptionsItem } from "@formkit/inputs"
import { computed } from "vue"
import type { PropType } from "vue"
import { VSelect } from "vuetify/components"

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const { node, errorMessages } = useFormKitInput(props.context)

// Vuetify's VSelect reads `items` shaped as { title, value }. FormKit
// select-family inputs (including the self-loading vdataselect) expose their
// choices on `context.options` as { label, value }, and — unlike node.props —
// context.options is reactive, so it updates when the loader resolves. Prefer
// explicit Vuetify `items` when a caller passes them; otherwise bridge options.
const items = computed(() => {
  if (node.props.items) return node.props.items
  const options = props.context.options
  if (!Array.isArray(options)) return undefined
  return options.map((o) =>
    o && typeof o === "object"
      ? { title: (o as { label?: string }).label, value: (o as { value?: unknown }).value }
      : o,
  )
})

// FormKit's `options` feature masks any option whose value isn't a string
// (relation ids, or `null` for a nullable relation) as a synthetic `__mask_N`
// token, stashing the real value in `__original`, so a DOM <option value>
// always stays a string. The native <select> reverses this in its own change
// handler and matches each individual <option> against the real value — but
// VSelect is a single controlled v-model, so `useFormKitInput`'s generic
// pass-through model would leak the masked token into `node.value` (and from
// there into submitted form data).
//
// Mirror the native select instead of bypassing masking: `items` above still
// carries the masked tokens, so translate at the v-model boundary in both
// directions — mask `node.value` on the way out (to match a masked item, so
// VSelect can find the current selection) and unmask VSelect's emitted value
// on the way in (so `node.value` stays real, exactly like the native select).
// Options that were never masked (whose values are already strings) have no
// `__original`, so both directions are the identity and plain selects are
// unaffected.
function optionsList(): FormKitOptionsItem[] {
  const options = props.context.options
  return Array.isArray(options) ? (options as FormKitOptionsItem[]) : []
}
function unmask(token: unknown): unknown {
  const match = optionsList().find((o) => o.value === token)
  return match && "__original" in match ? match.__original : token
}
function mask(real: unknown): unknown {
  const match = optionsList().find((o) => ("__original" in o ? o.__original : o.value) === real)
  return match ? match.value : real
}
const model = computed({
  get: () => mask(props.context.value),
  set: (token) => node.input(unmask(token)),
})
</script>

<template>
  <VSelect
    v-model="model"
    :label="context.label"
    :items="items"
    :error-messages="errorMessages"
    :disabled="context.disabled"
    v-bind="node.props.vuetifyProps"
    @blur="context.handlers.blur"
  />
</template>
