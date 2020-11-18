import {
	Action,
	Logger,
	Subscriber,
	ActionThunk,
	GetState,
	Dispatcher,
	Reducer,
	Store,
	IndexedReducer as ActionHandlers
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

export const createSubReducer = <SA extends Object, A extends Action>(
	key: keyof SA,
	handlers: ActionHandlers<SA[typeof key], A>
): Reducer<SA, A> => (state, action) => {
	// @ts-ignore
	const handler: Reducer<SB, A> = handlers[action.type] ?? identity;
	const s: SA = {
		...state,
		[key]: handler(state[key], action)
	};

	return s;
};

export const combineReducers = <S, A extends Action>(
	reducers: Reducer<S, A>[]
): Reducer<S, A> => (state, action) => {
	for (let i = 0; i < reducers.length; i++) {
		const ns = reducers[i](state, action);
		if (ns !== state) {
			return ns;
		}
	}
	return state;
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
