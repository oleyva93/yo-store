export default function isEqual<T>(a: T, b: T) {
  if (a === b) {
    return true
  }
  if (typeof a !== 'object' || !a || typeof b !== 'object' || !b) {
    return false
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) {
      return false
    }

    for (const aVal of a) {
      if (!b.has(aVal)) {
        return false
      }
    }
    return true
  }

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) {
      return false
    }
    for (const [aKey, aVal] of a) {
      if (!b.has(aKey) || !Object.is(aVal, b.get(aKey))) {
        return false
      }
    }
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }
    if (!Object.is(a[key as keyof T], b[key as keyof T])) {
      return false
    }
  }

  return true
}
