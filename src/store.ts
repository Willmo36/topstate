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

export function createStore<S, A extends Action>(
	initialState: S,
	reducer: Reducer<S, A>,
	logger = makeDefaultLogger<S, A>()
): Store<S, A> {
	let state = initialState;
	let subscribers: Subscriber<S>[] = [];

	const isThunk_ = (action: unknown): action is ActionThunk<S, A> =>
		typeof action === "function";

	const getState: GetState<S> = () => state;

	const dispatch: Dispatcher<S, A> = (action) => {
		if (isThunk_(action)) {
			action(getState, dispatch);
		} else {
			logger.logStart(action);
			logger.logState(state, "prev");
			logger.logAction(action);
			state = reducer(state, action);
			logger.logState(state, "next");
			logger.logEnd();
			subscribers.forEach((notify) => notify(state));
		}
	};

	const subscribe = (cb: Subscriber<S>) => {
		subscribers.push(cb);
		return () => {
			subscribers = subscribers.filter((cb_) => cb_ !== cb);
		};
	};

	return {
		getState,
		dispatch,
		subscribe
	};
}

/**
 * Create a reducer via the form
 * {
 *  myAction1: (state, action) => state,
 *  myAction2: (state, action) => state,
 * }
 */
export const createReducer = <S, A extends Action>(
	handlers: ActionHandlers<S, A>
): Reducer<S, A> => (state, action) => {
	// @ts-ignore
	const handler: Reducer<S, A> = handlers[action.type] ?? identity;
	return handler(state, action);
};

/**
 * Create a reducer for a child of the State
 * @param key The member of the State these handlers operator on
 * @param handlers Handlers for Action which take and return State[Key]
 */
export const createSubReducer = <State extends Object, A extends Action>(
	key: keyof State,
	handlers: ActionHandlers<State[typeof key], A>
): Reducer<State, A> => (state, action) => {
	// @ts-ignore
	const handler: Reducer<SB, A> = handlers[action.type] ?? identity;
	const s: State = {
		...state,
		[key]: handler(state[key], action)
	};

	return s;
};

/**
 * Combine multiple Reducers<State, A>.
 * All reducers will be ran in the order specificed per dispatch
 * @param reducers Array an reducers to combine
 */
export const combineReducers = <S, A extends Action>(
	reducers: Reducer<S, A>[]
): Reducer<S, A> => (state, action) => {
	return reducers.reduce((ns, rec) => rec(ns, action), state);
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
