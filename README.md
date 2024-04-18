# yo-store

[![NPM version][npm-image]][npm-url]
[![Build][github-build]][github-build-url]
![npm-typescript]
[![License][github-license]][github-license-url]

It is a simple state manager in React without context or third-party libraries.


## Installation:

```bash
npm install yo-store
```

or

```bash
yarn add yo-store
```

## Usage :

Add a `storage` to your component:

```tsx

// news-storage.js 
import createStorage from "yo-storage";

const useNews = createStorage((set, get) => ({
    selected: null,
    filters: {
        page: 1,
        page_size: 25,
    }
    getPageSize: ()=> get().filters.page_size
    setSelected: (item)=> set({selected: item})
}));

export default useNews
```

```tsx
// news-list.js 
import useNews from "storage/new-storage"

/// subscribe to any change of storage (subscribe function return a unsubscribe function)
const unsubscribe = useNews.subscribe((state)=> {
    if(state.selected.status === "Active") {
        // set any change with a dispatch function in any place
        useNews.dispatch({selected: undefined})
        // do something
    }
})

// you can use a state selector function.
// this ensures that the component is rerendered only when the selected states change.
function selector(state){
    return state.selected;
}

function News(){
    const selectedNews = useNews(selector)

    useEffect(()=> unsubscribe, []);

    return (
        <div>
            <h1>{selectedNews.name}</h1>
            ...
        </div>
    )
}
```

## No installation :

If you do not want to install it, you can copy and paste the source code into your project.

```tsx
import { useRef, createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from 'react'

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

```

[npm-url]: https://www.npmjs.com/package/yo-store
[npm-image]: https://img.shields.io/npm/v/yo-store
[github-license]: https://img.shields.io/github/license/oleyva93/yo-store
[github-license-url]: https://github.com/oleyva93/yo-store/blob/master/LICENSE
[github-build]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/yo-store