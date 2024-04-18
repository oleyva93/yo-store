import React, { useRef, createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from 'react'

type StoreData<T> = {
  get: () => T
  set: (value: Partial<T>) => void
  subscribe: (callback: () => void) => () => void
}

type StoreContextType<T> = StoreData<T> | null

type ValueType<T> = Partial<T> | ((state: T) => T)

type ValuesConfig<T> = (set: (value: ValueType<T>) => void, get: () => T) => T

export default function createStore<T>(values: T | ValuesConfig<T>) {
  const subscribers = new Set<(data: T) => void>()

  function subscribe(callback: (data: T) => void) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  function useStoreData(): StoreData<T> {
    const get: () => T = useCallback(() => store.current, [])

    const set = useCallback((value: ValueType<T>) => {
      store.current = {
        ...store.current,
        ...(typeof value === 'function' ? value(store.current) : value),
      }

      subscribers.forEach((callback) => callback(store.current))
    }, [])

    const store = useRef<T>(typeof values === 'function' ? (values as ValuesConfig<T>)(set, get) : values)

    return {
      get,
      set,
      subscribe,
    }
  }

  const StoreContext = createContext<StoreContextType<T>>(null)

  function Provider({ children }: { children: ReactNode }) {
    return <StoreContext.Provider value={useStoreData()}>{children}</StoreContext.Provider>
  }

  function useStore(selector?: (state: T) => any): [T, (value: Partial<T>) => void] {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error('Store not found')
    }

    const handleSelector = useCallback(() => selector?.(store.get()) || store.get(), [selector, store])

    const state = useSyncExternalStore(
      store.subscribe,
      handleSelector,
      handleSelector, // for server side rendering
    )

    return [state, store.set]
  }
  useStore.subscribe = subscribe

  return {
    Provider,
    useStore,
  }
}
