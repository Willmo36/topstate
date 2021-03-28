import {
	Action,
	ActionHandlers,
	ActionThunk,
	AddReducer,
	AddSubReducer,
	Dispatcher,
	GetState,
	Logger,
	Reducer,
	Store,
	Subscribe,
	Subscriber
} from "./types";

/** @ignore */
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
 * @category Start here 
 */
export function createStore<S, A extends Action>(
	initialState: S,
	logger = makeDefaultLogger<S, A>()
): Store<S, A> {
	let state = initialState;
	let subscribers: Subscriber<S, A>[] = [];
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
			subscribers.forEach((notify) => notify(state, action));
		}
	};

	const subscribe: Subscribe<S, A> = (cb) => {
		subscribers.push(cb);
		return () => {
			subscribers = subscribers.filter((cb_) => cb_ !== cb);
		};
	};

	const addReducer: AddReducer<S, A> = (reducer) => {
		reducers.push(reducer);
		return () => {
			reducers = reducers.filter((r) => r !== reducer);
		};
	};

	const addSubReducer: AddSubReducer<S, A> = <K extends keyof S>(
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
 * @category Primary API
 * @typeParam S State type
 * @typeParam A Action type
 * @example ```
 * const myReducer = reducerFromHandlers<MyState, MyAction>({
 * 	myAction1: (state, action1) => state,
 * 	myAction2: (state, action2) => state,
 * });
 * ```
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
 * @ignore
 */
export const createNoopLogger = <S, A extends Action>(): Logger<S, A> => ({
	logAction: noop,
	logEnd: noop,
	logStart: noop,
	logState: noop
});
