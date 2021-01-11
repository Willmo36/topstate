import {
	Action,
	Logger,
	Subscriber,
	ActionThunk,
	GetState,
	Dispatcher,
	Reducer,
	Store,
	ActionHandlers
} from "./types";

export const makeDefaultLogger = <S, A extends Action>(): Logger<S, A> => ({
	logStart: (action) => console.group(`action ${action.type}`),
	logAction: (action) => console.info(`action`, action),
	logState: (state, stage) => console.info(`${stage} state`, state),
	logEnd: () => console.groupEnd()
});

/**
 * Create a Store for the State & Action types
 * @param initialState Initial values of the state
 * @param logger The logging implementation (default provided)
 */
export function createStore<S, A extends Action>(
	initialState: S,
	logger = makeDefaultLogger<S, A>()
): Store<S, A> {
	let state = initialState;
	let subscribers: Subscriber<S>[] = [];
	let reducers: Reducer<S, A>[] = [];

	const isThunk_ = (action: unknown): action is ActionThunk<S, A> =>
		typeof action === "function";

	/**
	 * Return the current state value
	 */
	const getState: GetState<S> = () => state;

	/**
	 * Pass the action to the reducers, updating the state
	 * @param action The action to run the reducers with
	 * @returns void Fire & Forget
	 */
	const dispatch: Dispatcher<S, A> = (action) => {
		if (isThunk_(action)) {
			action(getState, dispatch);
		} else {
			logger.logStart(action);
			logger.logState(state, "prev");
			logger.logAction(action);
			state = reducers.reduce(
				(state_, reducer) => reducer(state_, action),
				state
			);
			logger.logState(state, "next");
			logger.logEnd();
			subscribers.forEach((notify) => notify(state));
		}
	};

	/**
	 * Subscribe to the store. The given callback is ran after every dispatch() call.
	 * @param cb Callback to run after dispatches
	 * @returns Function to deregister the callback
	 */
	const subscribe = (cb: Subscriber<S>) => {
		subscribers.push(cb);
		return () => {
			subscribers = subscribers.filter((cb_) => cb_ !== cb);
		};
	};

	/**
	 * Add a reducer to be ran on dispatches
	 * @param reducer The reducer to be added
	 * @returns Function to remove the given reducer, no longer running it upon dispatches
	 */
	const addReducer = (reducer: Reducer<S, A>) => {
		reducers.push(reducer);
		return () => {
			reducers = reducers.filter((r) => r !== reducer);
		};
	};

	/**
	 * Add a reducer to be ran on dispatches updating a property of State rather than the whole object.
	 * @param key The property of State this reducer is targeting
	 * @param reducer The reducer to be added
	 * @returns Function to remove the given reducer
	 */
	const addSubReducer = <K extends keyof S>(
		key: K,
		reducer: Reducer<S[K], A>
	) => {
		const lifted: Reducer<S, A> = (state, action) => {
			const result = reducer(state[key], action);
			if (result !== state[key]) {
				return { ...state, [key]: result };
			}
			return state;
		};

		reducers.push(lifted);
		return () => {
			reducers = reducers.filter((r) => r !== lifted);
		};
	};

	return {
		getState,
		dispatch,
		subscribe,
		addReducer,
		addSubReducer
	};
}

/**
 * Create a reducer by specifing reducer-per-action-type
 * @example
 * const myReducer = reducerFromHandlers<MyState, MyAction>({
 *  myAction1: (state, action1) => state,
 *  myAction2: (state, action2) => state,
 * })
 */
export const reducerFromHandlers = <S, A extends Action>(
	handlers: ActionHandlers<S, A>
): Reducer<S, A> => (state, action) => {
	const handler: Reducer<S, A> = handlers[action.type] ?? identity;
	return handler(state, action);
};

// helpers
const noop = () => ({});
const identity = <A>(a: A) => a;

/**
 * Noop all logger operations. Useful for testing.
 */
export const createNoopLogger = <S, A extends Action>(): Logger<S, A> => ({
	logAction: noop,
	logEnd: noop,
	logStart: noop,
	logState: noop
});
