import {POIMarker} from '../types'

export const parseArrayValue = (a: string): string[] => {
  if (!a || !a.trim()) {
    return []
  }

  return a.split(',').map(v => v.trim().toLocaleLowerCase())
}

// eslint-disable-next-line @typescript-eslint/ban-types
type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export const groupBy = (
  items: POIMarker[],
  key: KeysMatching<POIMarker, string>,
): { order: Set<string>; groups: Map<string, Set<POIMarker>> } => {
  const order: Set<string> = new Set()

  const groups: Map<string, Set<POIMarker>> = new Map()

  for (const item of items) {
    const groupKey = item[key] || '__no_group__'
    order.add(groupKey)
    if (groups.has(groupKey)) {
      groups.get(groupKey)?.add(item)
    } else {
      groups.set(groupKey, new Set([item]))
    }
  }

  // // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
  // const groups = items.reduce((result, item) => {
  //   const groupKey = item[key] || '__no_group__'
  //   order.add(groupKey)
  //   return {
  //     ...result,
  //     [groupKey]: [...(result[groupKey] || []), item],
  //   }
  // }, {})
  return {order, groups}
}
