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
	logger = makeDefaultLogger<S, A>()
): Store<S, A> {
	let state = initialState;
	let subscribers: Subscriber<S>[] = [];
	let reducers: Reducer<S, A>[] = [];

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
			state = reducers.reduce(
				(state_, reducer) => reducer(state_, action),
				state
			);
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

	const addReducer = (reducer: Reducer<S, A>) => {
		reducers.push(reducer);
		return () => {
			reducers = reducers.filter((r) => r !== reducer);
		};
	};

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
 * Create a reducer via the form
 * {
 *  myAction1: (state, action) => state,
 *  myAction2: (state, action) => state,
 * }
 */
export const reducerFromHandlers = <S, A extends Action>(
	handlers: ActionHandlers<S, A>
): Reducer<S, A> => (state, action) => {
	// @ts-ignore
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
