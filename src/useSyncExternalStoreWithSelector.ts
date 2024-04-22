import * as React from 'react'

import is from './is-equal'

const { useRef, useEffect, useMemo, useDebugValue, useSyncExternalStore } = React

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: (() => Snapshot) | null | undefined,
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  const instRef = useRef<{ hasValue: boolean; value: Selection | null } | null>(null)
  let inst = instRef.current
  if (inst === null) {
    inst = {
      hasValue: false,
      value: null,
    }
    instRef.current = inst
  }

  const [getSelection, getServerSelection] = useMemo(() => {
    let hasMemo = false
    let memoizedSnapshot: Snapshot | undefined
    let memoizedSelection: Selection | undefined
    const memoizedSelector = (nextSnapshot: Snapshot): Selection => {
      if (!hasMemo) {
        hasMemo = true
        memoizedSnapshot = nextSnapshot
        const nextSelection = selector(nextSnapshot)
        if (isEqual !== undefined) {
          if (inst!.hasValue) {
            const currentSelection = inst!.value
            if (isEqual(currentSelection as Selection, nextSelection)) {
              memoizedSelection = currentSelection!
              return currentSelection as Selection
            }
          }
        }
        memoizedSelection = nextSelection
        return nextSelection
      }

      const prevSnapshot = memoizedSnapshot!
      const prevSelection = memoizedSelection!

      if (is(prevSnapshot, nextSnapshot)) {
        return prevSelection
      }

      const nextSelection = selector(nextSnapshot)

      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        return prevSelection
      }

      memoizedSnapshot = nextSnapshot
      memoizedSelection = nextSelection
      return nextSelection
    }

    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot())
    const getServerSnapshotWithSelector =
      getServerSnapshot === undefined ? undefined : () => memoizedSelector(getServerSnapshot?.() as Snapshot)
    return [getSnapshotWithSelector, getServerSnapshotWithSelector]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSnapshot, getServerSnapshot, selector, isEqual])

  const value = useSyncExternalStore(subscribe, getSelection, getServerSelection)

  useEffect(() => {
    inst!.hasValue = true
    inst!.value = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useDebugValue(value)
  return value
}
