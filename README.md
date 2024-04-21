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
import { isEqual } from 'yo-store'
import useNews from "storage/new-storage"

/// subscribe with selector to a specific store change (subscribe function return a unsubscribe function)
// in this case when `selected` is changed then subscribe callback is executed
const unsubscribe = useNews.subscribe(
  (state)=> state.selected
  (selected)=> {
    if(selected?.status === "Active") {
        // do something
    }
})

/// subscribe to any change of storage
const unsubscribe = useNews.subscribe(null, (state)=> {
    if(state.selected?.status === "Active") {
        // do something
    }
})

const unsubscribe = useNews.subscribe(
  (state) => ({ selected: state.selected, filters: state.filters }),
  (filtered) => {
    console.log('your filtered values are: ', filtered)
  },
  isEqual,
)

// you can retrieve state values anywhere
const PAGE_SIZE = useNews.getState().filters.page_size;

// you can use a state selector function.
// this ensures that the component is rerendered only when the selected states change.
function selector(state){
    return { selected: state.selected, setSelected: state.setSelected };
}

function News({ newsObject }){
    const {selected, setSelected} = useNews(selector)

    const newsNameRef = useRef(selected?.name)

    // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
    useEffect(()=> useNews.subscribe((state) => state.selected.name, (name)=> {
      newsNameRef.current = name
    }), []);

    return (
        <div>
            ...
            <h1>{selected?.description}</h1>
            ...
            <button onClick={()=> {
              // you can set the status anywhere
              setSelected(newsObject)
            }}>
              Set News
            </button>

            <button onClick={()=> {
              // you can set the status anywhere
              useNews.setState({ selected: null })
            }}>
              Clear News
            </button>
        </div>
    )
}
```

## No installation :

If you do not want to install it, you can copy and paste the source code into your project.

```tsx
import { useCallback, useSyncExternalStore } from 'react'

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
```

### Solution with vanilla.js: [vanilla.js](https://github.com/oleyva93/yo-store/tree/main/src/solutions/vanilla.js)

### Solution with proxy: [store-with-proxy.js](https://github.com/oleyva93/yo-store/tree/main/src/solutions/store-with-proxy.ts)

[npm-url]: https://www.npmjs.com/package/yo-store
[npm-image]: https://img.shields.io/npm/v/yo-store
[github-license]: https://img.shields.io/github/license/oleyva93/yo-store
[github-license-url]: https://github.com/oleyva93/yo-store/blob/master/LICENSE
[github-build]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/oleyva93/yo-store/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/yo-store
