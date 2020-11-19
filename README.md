# TopState

### v0.1 WIP

Fully Typed - Redux + Thunks + Reselect + Logging + React bindings

## The What

`TopState` is a library aimed at replicating Redux with common utilities all as one package whilst maintaining full typings across the feature set.

- `redux` - Reducers, actions, dispatchers, stores but no middleware.
- `redux-thunk` - By default, actions can be thunks.
- `reselect` - Memoized selectors
- `redux-logger` - Logging just like original library
- `react-redux` - `useDispatch`, `useSelector`

## The Why

### TypeScript first

The first and foremost requirement across the feature set is everything being correctly typed with as much (useful) inference as possible. A prime example is `dispatch`. The whole flux flow is defined by the `State` object and a union of `Action`s which signal changes to that state object. `Action` is a very important type to this concept and should carried through the API surface. For example, `useDispatch` will automatically be constrained to your `Action` type, no need to respecify at the call site and as such, you cannot dispatch incorrect actions.

### Thunks

It's pretty easy to require async action functionality, so it's baked in. By baking this in, we can ensure `Action` and `getState` are automatically typed from the definition of your `store`.

Another note though, a dedicated "channel" for side effects is very effective for navigating and understanding how, where and why your application has certain effects (as opposed to effects happening at any depth of the component tree).

### Selectors

Computed values, values which are derived from `State`, are very useful to avoid duplication and overlap in your primary `State` model. 

Memoizing at the definition, rather than the usage (by using `React.useMemo`), further enabling expensive computed values. 

Enables Tree skipping. Some application architectures may result in frequent updates deep down in the component tree. Prop drilling is not only verbose but requires the whole tree to recalculate. `useSelector` subscribes directly to the `store`, giving you the option to skip the parent components in the tree if you deem necessary.

### Logger

As mentioned in the Thunks paragraph, a dedicated channel for side effects can be very useful to organize and visualize your application. `redux-logger` showed how useful it is to simply see this information in the console and thus we bundle similar functionality. 

### React

As is the theme, ensuring React bindings are already typed based on your `store`. `useDispatch` already knows your `Action`s, `useSelector` already knows your `State`.

## The Getting Started

```tsx
import * as React from "react";
import { render } from "react-dom";
import { createReducer, createStore, createReactBindings } from "topstate"

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
 * createReducer is a helper function to create reducers
 * by handling actions individually.
 * 
 * Fully typed, the `action` will be the member Action
 * specified by the key
 */
const reducer = createReducer<State, Action>({
    inc: state => ({count: state.count + 1}),

    dec: (state,action) => ({count: state.count - 1}),

    // Won't type check, as this is not a membor of the Action union
    // not_a_action: (state, action) => state
})

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
} = createReactBindings<State, Action>();

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