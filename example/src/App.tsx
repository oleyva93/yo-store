import { useEffect } from 'react'

import createStore, { isEqual } from '../../src/index'

interface StoreData {
  name: string
  lastName: string
  age: number
  fullName: () => string
  setFullName: (fullName: string) => void
  incrementAge: () => void
}

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

useStore.subscribe(
  (state) => ({ name: state.name, lastName: state.lastName }),
  (fullName) => {
    console.log('your full name is: ', fullName)
  },
  isEqual,
)

const unsubscribe = useStore.subscribe(
  (state) => state.age,
  (age) => {
    console.log('your age is: ', age)
  },
)

function App() {
  useEffect(() => unsubscribe, [])

  return (
    <>
      <div className='grid gap-4 border border-white p-4'>
        Yo-Store
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
  const store = useStore((state) => ({ incrementAge: state.incrementAge, age: state.age }))

  return (
    <button
      onClick={() => {
        store.incrementAge()
      }}
    >
      Increment Age ({store.age})
    </button>
  )
}

export default App
