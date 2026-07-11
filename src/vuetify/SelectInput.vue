<script setup lang="ts">
/**
 * Vuetify head for FormKit select-family types: vselect and the self-loading
 * vdataselect. Register each with createInput(SelectInput) in the consuming app.
 */
import type { FormKitFrameworkContext } from "@formkit/core"
import { computed } from "vue"
import type { PropType } from "vue"
import { VSelect } from "vuetify/components"
import { useFormKitInput } from "./useFormKitInput.js"

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const { node, model, errorMessages } = useFormKitInput(props.context)

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
