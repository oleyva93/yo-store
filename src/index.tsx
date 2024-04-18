import { useCallback, useSyncExternalStore } from 'react'

type SetValueSlice<T> = Partial<T> | ((state: T) => Partial<T>)

type StoreValues<T> = (set: (value: SetValueSlice<T>) => void, get: () => T) => T

export default function createStore<T>(values: T | StoreValues<T>, middleware?: (state: T) => void) {
  const subscribers = new Set<(data: T) => void>()

  function subscribe(callback: (data: T) => void): () => void {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }
  const get: () => T = () => store

  const set = (value: SetValueSlice<T>) => {
    store = {
      ...store,
      ...(typeof value === 'function' ? (value as (state: T) => T)(store) : value),
    }

    middleware?.(store)

    subscribers.forEach((callback) => callback(store))
  }

  let store = typeof values === 'function' ? (values as StoreValues<T>)(set, get) : values

  function useStore<Selector>(selector: (state: T) => Selector): [Selector, typeof set] {
    const handleSelector = useCallback(() => (selector ? selector?.(get()) : get()), [selector])

    const state = useSyncExternalStore(subscribe, handleSelector, handleSelector)

    return [state as Selector, set]
  }

  useStore.subscribe = subscribe

  useStore.getState = get

  useStore.setState = set

  return useStore
}
