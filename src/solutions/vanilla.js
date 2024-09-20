import { useMemo, useSyncExternalStore } from 'react'
import isEqual from './is-equal'

function storeApi(values, middleware) {
  const subscribers = new Set()

  function subscribe(callback) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  const get = () => store

  const set = (value) => {
    const newValue = typeof value === 'function' ? value(store) : value
    store = { ...store, ...newValue }

    middleware?.(store, newValue, set, get)

    subscribers.forEach((callback) => callback(store))
  }

  let store = typeof values === 'function' ? values(set, get) : values

  return { subscribe, set, get }
}

export default function createStore(values, middleware) {
  const api = storeApi(values, middleware)

  function subscribeWithSelector(selector, callback, equalityFn) {
    if (callback) {
      let currentValue = selector?.(api.get()) || api.get()
      const listener = (state) => {
        const nextValue = selector?.(state) || state

        const isEqualFn = equalityFn || Object.is

        if (!isEqualFn(currentValue, nextValue)) {
          const previousValue = currentValue
          callback((currentValue = nextValue), previousValue)
        }
      }
      return api.subscribe(listener)
    }
    return api.subscribe(selector)
  }

  function useStore(selector, equalityFn = isEqual) {
    const handleSelector = useMemo(() => {
      let hasMemoizedValue = false
      let memoizedValue

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

    return state
  }

  useStore.getState = api.get
  useStore.setState = api.set
  useStore.subscribe = api.subscribe
  useStore.subscribeWithSelector = subscribeWithSelector

  return useStore
}
