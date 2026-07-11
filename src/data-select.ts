import type { FormKitNode, FormKitTypeDefinition } from "@formkit/core"
import { select } from "@formkit/inputs"

/**
 * A `select` input that loads its own options.
 *
 * Pass a loader function as the field's `options`; the input calls it on
 * creation and fills the dropdown when it resolves — so views don't need a
 * reactive `data` object or an `onMounted` fetch just to populate a relation
 * select. Use the `dataSelect()` helper to build the override.
 */

export interface SelectOption {
  value: unknown
  label: string
}

export type OptionsLoader = (node: FormKitNode) => SelectOption[] | Promise<SelectOption[]>

// FormKit stores a function `options` as `node.props.optionsLoader` (and sets
// `options` to `[]`). The stock `select` never calls it — this feature does.
function loadOptionsFeature(node: FormKitNode) {
  node.on("created", async () => {
    const loader = node.props.optionsLoader as OptionsLoader | undefined
    if (typeof loader !== "function") return

    node.props.disabled = true
    try {
      node.props.options = await loader(node)
    } catch {
      node.props.options = []
    } finally {
      node.props.disabled = false
    }
  })
}

export const dataSelectInput: FormKitTypeDefinition = {
  ...select,
  features: [...(select.features ?? []), loadOptionsFeature],
  // Don't share the stock select's memoized schema.
  schemaMemoKey: undefined,
}

/** Leading option for a nullable relation, letting the user clear the value. */
const NONE_OPTION: SelectOption = { value: null, label: "— None —" }

export interface DataSelectConfig {
  /** Empty-state prompt shown as the first, unselectable option. */
  placeholder?: string
  /** Prepend a "— None —" option (value `null`) for optional/nullable relations. */
  nullable?: boolean
  /** Extra options prepended before the loaded ones. */
  prepend?: SelectOption[]
}

/**
 * Pass a loader that resolves to the rows plus which fields map to the option
 * `value` and `label`. The result is memoized, so a select repeated across rows
 * (an order's line items) hits the API once.
 *
 * @example
 * supplier: dataSelect(() => fetchAll(suppliersList), { value: 'id', label: 'name' }, { placeholder: 'Select a supplier…' })
 */
export function dataSelect<T>(
  listFn: () => Promise<T[]>,
  mapping: { value: keyof T; label: keyof T },
  config: DataSelectConfig = {},
): Record<string, unknown> {
  const { nullable, prepend = [], ...fieldProps } = config
  const leading = nullable ? [NONE_OPTION, ...prepend] : prepend

  let cache: Promise<SelectOption[]> | undefined
  const options: OptionsLoader = () =>
    (cache ??= listFn().then((items) => [
      ...leading,
      ...items.map((item) => ({
        value: item[mapping.value],
        label: String(item[mapping.label]),
      })),
    ]))

  return { $formkit: "dataselect", options, ...fieldProps }
}
