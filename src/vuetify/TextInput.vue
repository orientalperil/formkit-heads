<script setup lang="ts">
/**
 * Vuetify head for FormKit text-family types: vtext, vnumber, vemail.
 * Register each with createInput(TextInput) in the consuming app.
 */
import type { FormKitFrameworkContext } from "@formkit/core"
import { computed } from "vue"
import type { PropType } from "vue"
import { VTextField } from "vuetify/components"
import { useFormKitInput } from "./useFormKitInput.js"

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const { node, model, errorMessages } = useFormKitInput(props.context)

// The FormKit type implies the HTML input `type`. The consumer can still
// override via the `inputType` prop; this only supplies the default.
const inputTypeMap: Record<string, string> = {
  vnumber: "number",
  vemail: "email",
}
const inputType = computed<string | undefined>(
  () => node.props.inputType ?? inputTypeMap[node.props.type],
)
</script>

<template>
  <VTextField
    v-model="model"
    :label="context.label"
    :type="inputType"
    :error-messages="errorMessages"
    :disabled="context.disabled"
    v-bind="node.props.vuetifyProps"
    @blur="context.handlers.blur"
  />
</template>
