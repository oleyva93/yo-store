import { useCallback, useSyncExternalStore } from 'react'

type SetValueSlice<T> = Partial<T> | ((state: T) => Partial<T>)

type StoreValues<T> = (set: (value: SetValueSlice<T>) => void, get: () => T) => T

let modifyingKey: string = ''

export default function createStore<T>(values: T | StoreValues<T>, middleware?: (state: T) => void) {
  const subscribers = new Set<(data: T) => void>()

  function subscribe(callback: (data: T) => void): () => void {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  function externalSubscribe(selector: Function, callback?: Function) {
    let getKey = ''
    let handler = {
      get: function (target: any, prop: string) {
        getKey = prop
        return Reflect.get(target, prop)
      },
    }

    subscribe((state) => {
      if (callback) {
        if (modifyingKey === getKey) {
          return callback(selector(state) || state[getKey as keyof T])
        }
      } else {
        return selector(state)
      }
    })
    if (callback) {
      selector(new Proxy(get(), handler))
    }
  }

  const get: () => T = () => store

  const set = (value: SetValueSlice<T>) => {
    const val = typeof value === 'function' ? value(store) : value

    for (const key in val) {
      store[key] = val[key]
    }

    middleware?.(store)

    subscribers.forEach((callback) => {
      return callback(store)
    })
  }

  let store = new Proxy(typeof values === 'function' ? (values as StoreValues<T>)(set, get) : values, {
    set: (target, proName, value) => {
      modifyingKey = proName as string
      target[proName] = value
      return true
    },
  })

  function useStore<Selector>(selector: (state: T) => Selector): [Selector, typeof set] {
    const handleSelector = useCallback(() => (selector ? selector?.(get()) : get()), [selector])

    const state = useSyncExternalStore(subscribe, handleSelector, handleSelector)

    return [state as Selector, set]
  }

  useStore.subscribe = externalSubscribe

  useStore.getState = get

  useStore.setState = set

  return useStore
}
