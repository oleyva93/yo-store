import { useMemo, useSyncExternalStore } from 'react'
import isEqual from './is-equal'

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
    const prevValues = { ...store }

    const newValue = typeof value === 'function' ? (value as (state: T) => T)(store) : value
    store = { ...store, ...newValue }

    if (!isEqual(prevValues, store)) {
      middleware?.(store, newValue, set, get)
    }

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
    equalityFn?: (currentVAlue: Selector, previousValue: Selector) => boolean,
  ) {
    if (callback) {
      let currentValue = selector?.(api.get()) || api.get()
      const listener = (state: T) => {
        const nextValue = selector?.(state) || state

        const isEqualFn = equalityFn || Object.is

        if (!isEqualFn(nextValue as Selector, currentValue as Selector)) {
          const previousValue = currentValue
          callback((currentValue = nextValue) as Selector, previousValue as Selector)
        }
      }
      return api.subscribe(listener)
    }
    return api.subscribe(selector)
  }

  function useStore<Selector>(selector: (state: T) => Selector, equalityFn = isEqual): Selector {
    const handleSelector = useMemo(() => {
      let hasMemoizedValue = false
      let memoizedValue: Selector

      const memoizedSelector = () => {
        const nextValue = selector(api.get())
        if (!hasMemoizedValue) {
          hasMemoizedValue = true
          memoizedValue = nextValue
        } else if (!equalityFn(memoizedValue, nextValue)) {
          memoizedValue = nextValue
        }

        return memoizedValue
      }

      return memoizedSelector
    }, [equalityFn, selector])

    const state = useSyncExternalStore(api.subscribe, handleSelector, handleSelector)

    return state as Selector
  }

  useStore.subscribe = subscribeWithSelector

  useStore.getState = api.get

  useStore.setState = api.set

  return useStore
}
