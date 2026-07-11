<script setup lang="ts">
/**
 * Vuetify head for the FormKit `vtextarea` type.
 * Register with createInput(TextareaInput) in the consuming app.
 */
import type { FormKitFrameworkContext } from "@formkit/core"
import type { PropType } from "vue"
import { VTextarea } from "vuetify/components"
import { useFormKitInput } from "./useFormKitInput.js"

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const { node, model, errorMessages } = useFormKitInput(props.context)
</script>

<template>
  <VTextarea
    v-model="model"
    :label="context.label"
    :error-messages="errorMessages"
    :disabled="context.disabled"
    v-bind="node.props.vuetifyProps"
    @blur="context.handlers.blur"
  />
</template>
