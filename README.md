
# Library goal

Fully typed, maximally inferred flux implementation with a useful feature set. 

## What does this mean?

A flux implementation is often the backbone of an application with a whitelist of events that can effect state. At the core of this is the dispatcher and the reducers. Neither of these pieces should have any **type ambiguity**. The dispatcher should **prevent** us from dispatching incorrect payload shapes and the reducers should not accept `any` as the type of the payload. In addition to this, we try to minimize the number of type parameters needed in order to achieve this.

For example:

- No `useDispatch<Action>`. None of the hooks require `State` or `Action` as they already know.
- No `payload: any` in reducers. The payload is inferred based on action.

---

## Features

`TopState` is a library aimed at replicating Redux with common utilities all as one package whilst maintaining full typings across the feature set.

- `redux` - Reducers, actions, dispatchers, stores but no middleware.
- `redux-thunk` - By default, actions can be thunks.
- `reselect` - Memoized selectors
- `redux-logger` - Logging just like original library
- `react-redux` - `useDispatch`, `useSelector`
- `redux-actions` - `useAction` , `useActionCreator`, `reducerFromHandlers`

---

## Example

```tsx
import * as React from "react";
import { render } from "react-dom";
import { reducerFromHandlers, createStore, createReactBindings } from "topstate"

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
 * Create the store, passing initial State
 * Notice we also pass the Action union type, locking it in
 */
let store = createStore<State, Action>({ count: 0 });

/**
 * reducerFromHandlers is a helper function to create reducers
 * by handling actions individually.
 * 
 * Fully typed, the `action` will be the member Action
 * specified by the key
 */
const reducer = reducerFromHandlers<State, Action>({
  inc: (state, action) => ({count: state.count + 1}),

  dec: (state,action) => ({count: state.count - 1}),

  // Won't type check, as this is not a membor of the Action union
  // not_a_action: (state, action) => state
})

/**
 * register the reducer in the store
 */
const removeReducer = store.addReducer(reducer);

/**
 * We "create" the React bindings, again passing the State & Action types
 * Now all React usages already know of State & Action
 */
const {
  useAction,
  useSelector,
  useStore,
  StoreContext,
} = createReactBindings<State, Action>();

const App: React.FC = () => {

  // state is of type State already, due to how we created the hook
  const count = useSelector((state) => state.count);

  // dispatch is typed with Action too, ensuring we can't dispatch incorrect actions or payloads
  const dispatch = useDispatch();
  const inc = React.useCallback(() => dispatch({ type: "inc" }), [dispatch]);
  // helper for static dispatches
  const dec = useAction({type: "dec" });

  // We cannot do this
  // const not_an_action = () => dispatch({ type: "not_an_action" });
  // const not_an_action = useAction({ type: "not_an_action" });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Inc</button>
      <button onClick={dec}>Dec</button>
    </div>
  );
};

/**
 * Provider comes from creating the React bindings
 */
render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById("app")
);

```

# Licence

The MIT License (MIT)