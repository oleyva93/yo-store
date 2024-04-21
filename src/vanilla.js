import { useCallback, useSyncExternalStore } from 'react'

function storeApi(values, middleware) {
  const subscribers = new Set()

  function subscribe(callback) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  const get = () => store

  const set = (value) => {
    store = {
      ...store,
      ...(typeof value === 'function' ? value(store) : value),
    }

    middleware?.(store)

    subscribers.forEach((callback) => callback(store))
  }

  let store = typeof values === 'function' ? values(set, get) : values

  return { subscribe, set, get }
}

export default function createStore(values, middleware) {
  const api = storeApi(values, middleware)

  function subscribeWithSelector(selector, callback) {
    if (callback) {
      let currentValue = selector?.(api.get()) || api.get()
      const listener = (state) => {
        const nextValue = selector?.(state) || state
        if (!Object.is(currentValue, nextValue)) {
          const previousValue = currentValue
          callback((currentValue = nextValue), previousValue)
        }
      }
      return api.subscribe(listener)
    }
    return api.subscribe(selector)
  }

  function useStore(selector) {
    const handleSelector = useCallback(() => (selector ? selector?.(api.get()) : api.get()), [selector])

    const state = useSyncExternalStore(api.subscribe, handleSelector, handleSelector)

    return [state, api.set]
  }

  useStore.subscribe = subscribeWithSelector

  useStore.getState = api.get

  useStore.setState = api.set

  return useStore
}
