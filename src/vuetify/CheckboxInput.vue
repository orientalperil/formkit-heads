<script setup lang="ts">
/**
 * Vuetify head for the FormKit `vcheckbox` type.
 * Register with createInput(CheckboxInput) in the consuming app.
 */
import { useFormKitInput } from "./useFormKitInput.js"
import type { FormKitFrameworkContext } from "@formkit/core"
import type { PropType } from "vue"
import { VCheckbox } from "vuetify/components"

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const { node, model, errorMessages } = useFormKitInput(props.context)
</script>

<template>
  <VCheckbox
    v-model="model"
    :label="context.label"
    :error-messages="errorMessages"
    :disabled="context.disabled"
    v-bind="node.props.vuetifyProps"
    @blur="context.handlers.blur"
  />
</template>
