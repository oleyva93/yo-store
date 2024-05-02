import { createContext, useEffect } from 'react'

import createStore, { StoreApiType, isEqual } from '../../src/index'
import { createSelector } from '../../src/with-context'

interface StoreData {
  name: string
  lastName: string
  age: number
  fullName: () => string
  setFullName: (fullName: string) => void
  incrementAge: () => void
}

type InitialState = {
  count: number
  total: number
  setCount: () => void
}

const context = createContext<StoreApiType<InitialState>>({
  get: () => ({ count: 0, total: 0, setCount: () => {} }),
  set: () => {},
  subscribe: () => () => {},
})

const useThisStore = createSelector<InitialState>(context)

const useStore = createStore<StoreData>(
  (set, get) => ({
    name: 'John',
    lastName: 'Doe',
    age: 30,
    fullName: () => `${get().name} ${get().lastName}`,
    setFullName: (fullName: string) => {
      const [name, lastName] = fullName.split(' ')
      set({ name, lastName })
    },
    incrementAge: () => {
      set((state) => ({ age: state.age + 1 }))
    },
  }),

  (state) => {
    console.log('This is a middleware', state)
  },
)

useStore.subscribeWithSelector(
  (state) => ({ name: state.name, lastName: state.lastName }),
  (fullName) => {
    console.log('your full name is: ', fullName)
  },
  isEqual,
)

const unsubscribe = useStore.subscribeWithSelector(
  (state) => state.age,
  (age) => {
    console.log('your age is: ', age)
  },
)

function FullName() {
  const fullName = useStore((state) => ({ name: state.name, lastName: state.lastName }))

  return <div>Your full name is: {JSON.stringify(fullName)}</div>
}

function Counter() {
  const count = useThisStore((state) => state.count)
  const setCount = useThisStore((state) => state.setCount)

  return (
    <div>
      <p>{count}</p>
      <button onClick={setCount}>count</button>
    </div>
  )
}

function Total() {
  const total = useThisStore((state) => state.total)

  console.log('total', total)

  return (
    <div>
      <p>{total}</p>
    </div>
  )
}

function CounterProvider({ children }: { children: React.ReactNode }) {
  const store = createStore<InitialState>(
    (set) => ({
      count: 0,
      total: 99999,
      setCount: () => {
        set((state) => ({ count: state.count + 1 }))
      },
    }),
    (state) => {
      console.log('This is a middleware', state)
    },
  )

  return (
    <context.Provider
      value={{
        get: store.getState,
        set: store.setState,
        subscribe: store.subscribe,
      }}
    >
      {children}
    </context.Provider>
  )
}

function App() {
  useEffect(() => unsubscribe, [])

  return (
    <>
      <FullName />
      <div className='grid gap-4 border border-white p-4'>
        Yo-Store
        <CounterProvider>
          <Counter />
          <Total />
        </CounterProvider>
        <CounterProvider>
          <Counter />
        </CounterProvider>
        <Input name='name' />
        <Input name='lastName' />
        <Value name='name' />
        <Value name='lastName' />
        <Value name='age' />
        <FullNameButton />
        <IncrementAgeButton />
      </div>
    </>
  )
}

function Input({ name }: { name: 'name' | 'lastName' }) {
  const field = useStore((state) => state[name])
  return (
    <div className='p-4 border border-white'>
      <input
        value={field}
        onChange={(e) => {
          useStore.setState({ [name]: e.target.value })
        }}
      ></input>
    </div>
  )
}

function Value({ name }: { name: 'name' | 'lastName' | 'age' }) {
  const field = useStore((state) => state[name])

  return (
    <div className='p-4 border border-white'>
      <div>
        {name}: {field}
      </div>
    </div>
  )
}

function FullNameButton() {
  const setFullName = useStore((state) => state.setFullName)

  return (
    <button
      onClick={() => {
        setFullName('Cat Owner')
      }}
    >
      Change Full Name to Cat Owner
    </button>
  )
}

function IncrementAgeButton() {
  const incrementAge = useStore((state) => state.incrementAge)

  return (
    <button
      onClick={() => {
        incrementAge()
      }}
    >
      Increment Age
    </button>
  )
}

export default App
