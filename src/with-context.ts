import { useContext, useMemo, useSyncExternalStore } from 'react'
import isEqual from './is-equal'
import { StoreApiType } from './api'

function useContextStore<Selector, T>(
  context: React.Context<StoreApiType<T>>,
  selector: (state: T) => Selector,
  equalityFn = isEqual,
): Selector {
  if (context === undefined) {
    throw new Error(
      'Could not find the store context value. Please make sure the component is wrapped with the provider',
    )
  }

  const store = useContext(context)

  if (store === undefined) {
    throw new Error(
      'Could not find the store context value. Please make sure the component is wrapped with the provider',
    )
  }

  const handleSelector = useMemo(() => {
    let hasMemoizedValue = false
    let memoizedValue: Selector

    const memoizedSelector = () => {
      const str = store.get()

      const nextValue = selector(str)
      if (!hasMemoizedValue) {
        hasMemoizedValue = true
        memoizedValue = nextValue
      } else if (!equalityFn(memoizedValue, nextValue)) {
        memoizedValue = nextValue
      }

      return memoizedValue
    }

    return memoizedSelector
  }, [equalityFn, selector, store])

  const state = useSyncExternalStore(store.subscribe, handleSelector, handleSelector)

  return state as Selector
}

export function createSelector<T>(context: React.Context<StoreApiType<T>>) {
  return function <Selector>(selector: (state: T) => Selector, equalityFn = isEqual) {
    return useContextStore(context, selector, equalityFn)
  }
}
