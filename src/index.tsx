import { useCallback, useSyncExternalStore } from 'react'

type SetValueSlice<T> = Partial<T> | ((state: T) => Partial<T>)

type StoreValues<T> = (set: (value: SetValueSlice<T>) => void, get: () => T) => T

function storeApi<T>(values: T | StoreValues<T>, middleware?: (state: T) => void) {
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

  return { subscribe, set, get }
}

export default function createStore<T>(values: T | StoreValues<T>, middleware?: (state: T) => void) {
  const api = storeApi(values, middleware)

  function subscribeWithSelector<Selector>() {
    const origSubscribe = api.subscribe
    return (
      callback: (currentValue: Selector | T, previousValue: Selector | T) => void,
      selector?: (state: T) => Selector,
    ) => {
      if (callback) {
        let currentValue = selector?.(api.get()) || api.get()
        const listener = (state: T) => {
          const nextValue = selector?.(state) || state
          if (!Object.is(currentValue, nextValue)) {
            const previousValue = currentValue
            callback((currentValue = nextValue), previousValue)
          }
        }
        return origSubscribe(listener)
      }
      return undefined
    }
  }

  function useStore<Selector>(selector: (state: T) => Selector): [Selector, typeof api.set] {
    const handleSelector = useCallback(() => (selector ? selector?.(api.get()) : api.get()), [selector])

    const state = useSyncExternalStore(api.subscribe, handleSelector, handleSelector)

    return [state as Selector, api.set]
  }

  useStore.subscribe = subscribeWithSelector()

  useStore.getState = api.get

  useStore.setState = api.set

  return useStore
}
