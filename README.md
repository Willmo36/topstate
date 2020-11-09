# TopState
## v0.1

Fully Typed - Redux + Thunks + Reselect + Logging + React bindings

## The What

`TopState` is a library aimed at replicating Redux with common utilities all as one package whilst maintaining full typings across the feature set.

- `redux` - Reducers, actions, dispatchers, stores but no middleware.
- `redux-thunk` - By default, actions can be thunks.
- `reselect` - Memoized selectors
- `redux-logger` - Logging just like original library
- `react-redux` - `useDispatch`, `useSelector`

## The Why

- **TypeScript first -** ensuring `dispatch` is **always** typed and so is consuming state.
- **Bundle together a "minimum" redux** - Of course, this is opinionated. By doing this we can ensure **commonly used additional libraries are fully typed**. Saves a few packages installs if that's your jam.

## The Getting Started

```tsx
import * as React from "react";
import { render } from "react-dom";
import { createIndexedReducer, createStore } from "topstate/lib/createStore";
import { createStoreReactFns } from "topstate/lib/react";

/**
 * The central types of TopState are
 * State & Action
 */

type State = {
  count: number;
};

const inc = { type: "inc" } as const;
const dec = { type: "dec" } as const;

type Action = typeof inc | typeof dec;

/**
 * createIndexedReducer is a helper function to create reducers
 * by handling actions individually.
 * 
 * Fully typed, the `action` will be the member Action
 * specified by the key
 */
const reducer = createIndexedReducer<State, Action>({
    inc: state => ({count: state.count + 1}),

    dec: (state,action) => ({count: state.count - 1}),

    // Won't type check, as this is not a membor of the Action union
    // not_a_action: (state, action) => state
});

/**
 * Create the store, passing initial State and the reducer
 * Notice we also pass the Action union type, locking it in
 */
const store = createStore<State, Action>({ count: 0 }, reducer);

/**
 * We "create" the React bindings, again passing the State & Action types
 * Now all React usages already know of State & Action
 */
const {
  useDispatch,
  useSelector,
  useStore,
  StoreContext,
} = createStoreReactFns<State, Action>();

const App: React.FC = () => {

  // state is of type State already, due to how we created the hook
  const count = useSelector((state) => state.count);

  // dispatch is typed with Action too, ensuring we can't dispatch incorrect actions or payloads
  const dispatch = useDispatch();
  const inc = () => dispatch({ type: "inc" });
  const dec = () => dispatch({ type: "dec" });

  // We cannot do this
  // const not_an_action = () => dispatch({ type: "not_an_action" });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Inc</button>
      <button onClick={dec}>Dec</button>
    </div>
  );
};

/**
 * Provider comes from creating the React bindings.
 * Expects `store` to be Store<State, Action>
 */
render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById("app")
);
```