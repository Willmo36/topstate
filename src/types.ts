import React from "react";

/**
 * The base type for a tagged union via the `type` property.
 * @category Inferred
 */
export type Action = { type: string };

/**
 * Classical reducer. Takes state & an action returs a new state.
 * @category Inferred
 */
export type Reducer<S, A extends Action> = (state: S, action: A) => S;

/**
 * A record keyed by Actions where the value is a reducer taking that action.
 * See {@link reducerFromHandlers} for usage.
 * @category Inferred
 */
export type ActionHandlers<S, A extends Action> = A extends any
  ? Partial<Record<A["type"], Reducer<S, A>>>
  : never;
/**
 * Return the current state value
 * @category Store API
 */
export type GetState<S> = () => S;

/**
 * Callback to be ran upon state changes
 * @ignore
 */
export type Subscriber<S, A extends Action> = (s: S, a: A) => void;

/**
 * - Action - Pass the action to the reducers, updating the state, triggering the subscribers.
 * - ActionThunk - Execute the thunk, passing {@link Dispatcher} & {@link GetState}
 * @category Store API
 * @param action The action to run the reducers with
 * @returns void Fire & Forget
 */
export type Dispatcher<S, A extends Action> = (
  action: A | ActionThunk<S, A>
) => void;

/**
 * A function taking getState and a dispatcher allowing
 * for multiple dispatches and up to date reads.
 * Useful for async patterns. See redux-thunk.
 */
export type ActionThunk<S, A extends Action> = (
  getState: GetState<S>,
  dispatcher: Dispatcher<S, A>
) => void;

/** @ignore */
export type Logger<S, A extends Action> = {
  logStart: (action: A) => void;
  logAction: (action: A) => void;
  logState: (state: S, stage: "prev" | "next") => void;
  logEnd: () => void;
};

/**
 * Subscribe to the store. The given callback is ran after every dispatch() call.
 * @category Store API
 * @param cb Callback to run after dispatches
 * @returns Function to deregister the callback
 */
export type Subscribe<S, A extends Action> = (
  cb: Subscriber<S, A>
) => () => void;

/**
 * Add a reducer to be ran on dispatches
 * @category Store API
 * @param reducer The reducer to be added
 * @returns Function to remove the given reducer, no longer running it upon dispatches
 */
export type AddReducer<S, A extends Action> = (
  reducer: Reducer<S, A>
) => () => void;

/**
 * The core data type, Store.
 * @category Store API
 * @returns Functions for interacting with the store.
 * See documentation for more info on each of them.
 */
/**
 * Add a reducer to be ran on dispatches updating a property of State rather than the whole object.
 * @category Store API
 * @param key The property of State this reducer is targeting
 * @param reducer The reducer to be added
 * @returns Function to remove the given reducer
 */
export type AddSubReducer<S, A extends Action> = <K extends keyof S>(
  key: K,
  reducer: Reducer<S[K], A>
) => () => void;

/** @category Primary API */
export type Store<S, A extends Action> = {
  getState: GetState<S>;
  dispatch: Dispatcher<S, A>;
  subscribe: Subscribe<S, A>;
  addReducer: AddReducer<S, A>;
  addSubReducer: AddSubReducer<S, A>;
};

/**
 * Function from S to A
 */
export type Selector<S, A> = (s: S) => A;

/**
 * Return the A of Selector<S, A>
 * @ignore
 */
export type SelectorResult<SL> = SL extends (...args: any) => infer A
  ? A
  : never;

/**
 * Apply SelectorResult to each member of a collection
 * @ignore
 */
export type SelectorResults<S> = {
  [K in keyof S]: SelectorResult<S[K]>;
};

/**
 * Lift values into selectors from S
 * @ignore
 */
export type LiftToSelector<S, AS> = {
  [K in keyof AS]: Selector<S, AS[K]>;
};

/**
 * Variadic memoize function.
 * Takes and returns a function, prevserving it's type signature
 * whilt applying memoization to it.
 */
export type Memoize = <Args extends any[], R>(
  fn: (...args: Args) => R
) => (...args: Args) => R;

/**
 * @category React
 * @returns The Store from the React Context
 * @example ```
 * const store = useStore();
 * ```
 */
export type UseStore<S, A extends Action> = () => Store<S, A>;
/**
 * @category React
 * @returns The Store.dispatch from the React Context
 * @example ```
 * const dispatch = useDispatch();
 * dispatch(myAction|myThunk);
 * ```
 */
export type UseDispatch<S, A extends Action> = () => Dispatcher<S, A>;

/**
 * Subscribe to the Store and run the selector upon state changes
 * @category React
 * @param selector - The selector to run
 * @example ```
 * const foo = useSelector(fooSelector);
 * ```
 */
export type UseSelector<S> = <A>(selector: Selector<S, A>) => A;

/**
 * Create a callback to dispatch the given action
 * @category React
 * @param action - Once given, this action is set (Not registered in useCallback dependencies). Action to dispatch.
 * @returns React Callback - A callback which will dispatch the given action. Wrapped in useCallback.
 * @example ```
 * const clearFilters = useAction({type: "CLEAR_FILTERS"});
 * clearFilters();
 * ```
 */
export type UseAction<S, A extends Action> = (
  action: A | ActionThunk<S, A>
) => () => void;

/**
 * Create a callback which runs the given action creator and dispatches it's action result
 * @category React
 * @param actionCreator - Once given, this function is set (Not registered in useCallback dependencies).
 * A function which takes any value and returns an action to be dispatched
 * @example ```
 * const setEmailAddress = useActionCreator<string>(
 * 	email => ({type: "SET_EMAIL", email})
 * );
 * setEmailAddress("emailaddress");
 * ```
 */
export type UseActionCreator<A extends Action> = <B = void>(
  actionCreator: (b: B) => A,
  additionalDeps?: any[]
) => (b: B) => void;

/** @category Primary API */
export type StoreReact<S, A extends Action> = {
  useStore: UseStore<S, A>;
  useDispatch: UseDispatch<S, A>;
  useSelector: UseSelector<S>;
  useAction: UseAction<S, A>;
  useActionCreator: UseActionCreator<A>;
  StoreContext: React.Context<Store<S, A> | null>;
};

/**
 * Base shape for Queries
 * @category Query API
 */
export type Query = { tag: string; result: any };

/**
 * @ignore
 */
export type RegisterQueryResponderArgs<Q extends Query> = Q extends any
  ? [Q["tag"], QueryResponder<Q>]
  : [never];

/**
 * Register a handler for a specific query
 * @category Query API
 */
export type RegisterQueryResponder<Q extends Query> = (
  args: RegisterQueryResponderArgs<Q>[0],
  args2: RegisterQueryResponderArgs<Q>[1]
) => () => void;

/**
 * Execute a query with 0+ results
 * @param query - One of your queries minus the .result prop
 * @returns results - 0+ results typed to query.result
 * @category Query API
 */
export type RunQuery<Q extends Query> = (
  query: Omit<Q, "result">
) => Array<Q["result"]>;
export type QueryResponder<Q extends Query> = (
  query: Omit<Q, "result">
) => Q["result"];

/**
 * Collection type for querying and responding
 * @category Query API
 */
export type Inquirier<Q extends Query> = {
  register: RegisterQueryResponder<Q>;
  query: RunQuery<Q>;
};

/**
 * Inquirer functionality exposed via hooks
 * @category Query API
 */
export type InquirerReact<Q extends Query> = {
  QueryContext: React.Context<Inquirier<Q> | null>;
  useInquirierResponder: (
    tag: RegisterQueryResponderArgs<Q>[0],
    cb: RegisterQueryResponderArgs<Q>[1],
    additionalDeps: any[]
  ) => void;
  useInquirierEmitter: () => RunQuery<Q>;
};
