import { useCallback, useSyncExternalStore } from 'react'
export { default as isEqual } from './is-equal'

type GetState<T> = () => T

type SetValueSlice<T> = Partial<T> | ((state: T) => Partial<T>)

type SetState<T> = (value: SetValueSlice<T>) => void

type StoreValues<T> = (set: (value: SetValueSlice<T>) => void, get: GetState<T>) => T

type Middleware<T> = (state: T, newValues: Partial<T>, set: SetState<T>, get: GetState<T>) => void

function storeApi<T>(values: T | StoreValues<T>, middleware?: Middleware<T>) {
  const subscribers = new Set<(data: T) => void>()

  function subscribe(callback: (data: T) => void): () => void {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }
  const get: GetState<T> = () => store

  const set: SetState<T> = (value) => {
    const newValue = typeof value === 'function' ? (value as (state: T) => T)(store) : value
    store = { ...store, ...newValue }

    middleware?.(store, newValue, set, get)

    subscribers.forEach((callback) => callback(store))
  }

  let store = typeof values === 'function' ? (values as StoreValues<T>)(set, get) : values

  return { subscribe, set, get }
}

export default function createStore<T>(values: T | StoreValues<T>, middleware?: Middleware<T>) {
  const api = storeApi(values, middleware)

  // this is a similar implementation to the one in the zustand library (subscribeWithSelector middleware)
  function subscribeWithSelector<Selector>(
    selector: (state: T) => Selector,
    callback?: (currentValue: Selector, previousValue: Selector) => void,
    equalityFn?: (a: any, b: any) => boolean,
  ) {
    if (callback) {
      let currentValue = selector?.(api.get()) || api.get()
      const listener = (state: T) => {
        const nextValue = selector?.(state) || state

        const isEqualFn = equalityFn || Object.is

        if (!isEqualFn(currentValue, nextValue)) {
          const previousValue = currentValue
          callback((currentValue = nextValue) as Selector, previousValue as Selector)
        }
      }
      return api.subscribe(listener)
    }
    return api.subscribe(selector)
  }

  function useStore<Selector>(selector: (state: T) => Selector): Selector {
    const handleSelector = useCallback(() => (selector ? selector?.(api.get()) : api.get()), [selector])

    const state = useSyncExternalStore(api.subscribe, handleSelector, handleSelector)

    return state as Selector
  }

  useStore.subscribe = subscribeWithSelector

  useStore.getState = api.get

  useStore.setState = api.set

  return useStore
}
