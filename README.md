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
    selected: undefined,
    filters: {
        page: 1,
        page_size: 25,
    }
    getPageSize: ()=> get().filters.page_size
    setSelected: (item)=> set({selected: item})
    getNews: async ()=> fetch(".../news")
}),
(state) => {
  console.log("This is a middleware: ", state)
}
);

export default useNews
```

```tsx
// news-list.js 
import useNews from "storage/new-storage"

/// subscribe to any change of storage (subscribe function return a unsubscribe function)
const unsubscribe = useNews.subscribe((state)=> {
    if(state.selected?.status === "Active") {
        // do something
    }
})

// you can set the status anywhere
useNews.setState({selected: null)

// you can retrieve state values anywhere
const PAGE_SIZE = useNews.getState().filters.page_size;

// you can use a state selector function.
// this ensures that the component is rerendered only when the selected states change.
function selector(state){
    return state.selected;
}

function News(){
    const selectedNews = useNews(selector)

    const newsNameRef = useRef(selectedNews?.name)

    // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
    useEffect(()=> useNews.subscribe((state)=> {
      newsNameRef.current = state.selected?.name
    }), []);

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

  // this is a similar implementation to the one in the zustand library (subscribeWithSelector middleware)
  function subscribeWithSelector() {
    const origSubscribe = api.subscribe

    function subscribe<Selector>(
      selector: (state: T) => Selector,
      callback?: (currentValue: Selector, previousValue: Selector) => void,
    ) {
      if (callback) {
        let currentValue = selector?.(api.get()) || api.get()
        const listener = (state: T) => {
          const nextValue = selector?.(state) || state
          if (!Object.is(currentValue, nextValue)) {
            const previousValue = currentValue
            callback((currentValue = nextValue) as Selector, previousValue as Selector)
          }
        }
        return origSubscribe(listener)
      }
      return origSubscribe(selector)
    }

    return subscribe
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

```

[npm-url]: https://www.npmjs.com/package/yo-store
[npm-image]: https://img.shields.io/npm/v/yo-store
[github-license]: https://img.shields.io/github/license/oleyva93/yo-store
[github-license-url]: https://github.com/oleyva93/yo-store/blob/master/LICENSE
[github-build]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/yo-store