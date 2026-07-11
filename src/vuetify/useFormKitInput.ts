/**
 * Shared glue between a FormKit `context` and any Vuetify input component.
 * This is the headless pattern for FormKit: FormKit owns state/validation/
 * errors, Vuetify owns rendering. Each per-type component (TextInput,
 * SelectInput, ...) calls this and binds the results to its Vuetify component.
 *
 * `context` is injected by FormKit and exposes:
 *   context.value  - current value
 *   context.node   - the FormKitNode (input(), store, events, ...)
 *   context.label, context.options, context.disabled, ...
 */
import type { FormKitFrameworkContext } from "@formkit/core"
import { computed, onBeforeUnmount, ref } from "vue"

export function useFormKitInput(context: FormKitFrameworkContext) {
  const node = context.node

  const model = computed({
    get: () => context.value,
    set: (val) => node.input(val),
  })

  // Surface FormKit's messages as plain strings for Vuetify's :error-messages.
  //
  // Two kinds of messages need to show as errors here:
  //   - type 'validation' -> client-side rule failures (required, email, ...)
  //   - type 'error'      -> messages set via node.setErrors() (our DRF backend)
  //
  // Read from context.messages (NOT node.store): the store keeps every message
  // with a raw `visible` flag that ignores validationVisibility, so it would
  // show "required" errors before the user ever touches the field.
  // context.messages is FormKit's display-gated projection, so it's empty until
  // a message should show.
  function collectErrors(): string[] {
    return Object.values(context.messages ?? {})
      .filter((m) => m.visible && (m.type === "validation" || m.type === "error"))
      .map((m) => String(m.value))
  }

  // FormKit mutates its messages outside of Vue's reactivity, so a plain
  // `computed(() => ...context.messages)` doesn't reliably re-run: it refreshes
  // on a full re-render (e.g. a submit) but NOT when a single field's message is
  // cleared as the user edits it, leaving a corrected field showing a stale
  // error. Instead we rebuild the list on FormKit's own message events, which
  // keeps Vuetify in sync exactly.
  const errorMessages = ref(collectErrors())
  const refresh = () => (errorMessages.value = collectErrors())
  const receipts = [
    node.on("message-added", refresh),
    node.on("message-removed", refresh),
    node.on("message-updated", refresh),
  ]
  onBeforeUnmount(() => receipts.forEach((receipt) => node.off(receipt)))

  return { node, model, errorMessages }
}
