<script setup lang="ts">
/**
 * Bridges a FormKit `context` to a Vuetify input. This is the headless pattern
 * for FormKit: FormKit owns state/validation/errors, Vuetify owns rendering.
 *
 * Registered as custom input types in src/plugins/formkit.ts, so the form can
 * write <FormKit type="vtext" name="email" ... />.
 *
 * `context` is injected by FormKit and exposes:
 *   context.value         - current value
 *   context.node          - the FormKitNode (input(), store, events, ...)
 *   context.label, etc.
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import type { Component, PropType } from 'vue'
import { VTextField, VTextarea, VSelect, VCheckbox } from 'vuetify/components'
import type { FormKitFrameworkContext } from '@formkit/core'

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true,
  },
})

const node = props.context.node

const model = computed({
  get: () => props.context.value,
  set: (val) => node.input(val),
})

// Surface FormKit's messages as plain strings for Vuetify's :error-messages.
//
// Two kinds of messages need to show as errors here:
//   - type 'validation' -> client-side rule failures (required, email, ...)
//   - type 'error'      -> messages set via node.setErrors() (our DRF backend)
//
// Read from context.messages (NOT node.store): the store keeps every message
// with a raw `visible` flag that ignores validationVisibility, so it would show
// "required" errors before the user ever touches the field. context.messages is
// FormKit's display-gated projection, so it's empty until a message should show.
function collectErrors(): string[] {
  return Object.values(props.context.messages ?? {})
    .filter((m) => m.visible && (m.type === 'validation' || m.type === 'error'))
    .map((m) => String(m.value))
}

// FormKit mutates its messages outside of Vue's reactivity, so a plain
// `computed(() => ...context.messages)` doesn't reliably re-run: it refreshes on
// a full re-render (e.g. a submit) but NOT when a single field's message is
// cleared as the user edits it, leaving a corrected field showing a stale error.
// Instead we rebuild the list on FormKit's own message events, which keeps
// Vuetify in sync exactly.
const errorMessages = ref(collectErrors())
const refresh = () => (errorMessages.value = collectErrors())
const receipts = [
  node.on('message-added', refresh),
  node.on('message-removed', refresh),
  node.on('message-updated', refresh),
]
onBeforeUnmount(() => receipts.forEach((receipt) => node.off(receipt)))

// Map the FormKit input `type` (vtext/vselect/...) straight to a Vuetify
// component. The type is the single source of truth — no separate prop needed.
const componentMap: Record<string, Component> = {
  vtext: VTextField,
  vtextarea: VTextarea,
  vselect: VSelect,
  vcheckbox: VCheckbox,
}
const component = computed<Component>(
  () => componentMap[node.props.type] ?? VTextField,
)
</script>

<template>
  <component
    :is="component"
    v-model="model"
    :label="context.label"
    :type="node.props.inputType"
    :items="node.props.items"
    :error-messages="errorMessages"
    v-bind="node.props.vuetifyProps"
    @blur="context.handlers.blur"
  />
</template>
