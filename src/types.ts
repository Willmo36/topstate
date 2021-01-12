/**
 * The base type for a tagged union via the `type` property.
 */
export type Action = { type: string };

/**
 * Classical reducer. Takes state & an action returs a new state.
 */
export type Reducer<S, A extends Action> = (state: S, action: A) => S;

/**
 * A record keyed by Actions where the value is a reducer taking that action.
 * See {@link reducerFromHandlers} for usage.
 */
export type ActionHandlers<S, A extends Action> = A extends any
	? Partial<Record<A["type"], Reducer<S, A>>>
	: never;
/**
 * Return the current state value
 */
export type GetState<S> = () => S;

/**
 * Callback to be ran upon state changes
 */
export type Subscriber<S> = (s: S) => void;

/**
 * - Action - Pass the action to the reducers, updating the state, triggering the subscribers.
 * - ActionThunk - Execute the thunk, passing {@link Dispatcher} & {@link GetState}
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
 * The core data type, Store.
 * @returns Functions for interacting with the store.
 * See documentation for more info on each of them.
 */
export type Store<S, A extends Action> = {
	getState: GetState<S>;
	dispatch: Dispatcher<S, A>;
	/**
	 * Subscribe to the store. The given callback is ran after every dispatch() call.
	 * @param cb Callback to run after dispatches
	 * @returns Function to deregister the callback
	 */
	subscribe: (cb: Subscriber<S>) => () => void;
	/**
	 * Add a reducer to be ran on dispatches
	 * @param reducer The reducer to be added
	 * @returns Function to remove the given reducer, no longer running it upon dispatches
	 */
	addReducer: (reducer: Reducer<S, A>) => () => void;
	/**
	 * Add a reducer to be ran on dispatches updating a property of State rather than the whole object.
	 * @param key The property of State this reducer is targeting
	 * @param reducer The reducer to be added
	 * @returns Function to remove the given reducer
	 */
	addSubReducer: <K extends keyof S>(
		key: K,
		reducer: Reducer<S[K], A>
	) => () => void;
};

export interface Selector<S, A> {
	(s: S): A;
}

// extract the result type of the selector
export type SelectorResult<SL> = SL extends (...args: any) => infer A
	? A
	: never;

// "map" a collection of selectors to a collection of their results
export type SelectorResults<S> = {
	[K in keyof S]: SelectorResult<S[K]>;
};

// Lifts mappable types into Selectors from S
export type LiftToSelector<S, AS> = {
	[K in keyof AS]: Selector<S, AS[K]>;
};

export type Memoize = <Args extends any[], R>(
	fn: (...args: Args) => R
) => (...args: Args) => R;
