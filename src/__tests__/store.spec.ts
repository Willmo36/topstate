import {
	createReducer,
	createNoopLogger,
	createStore,
	combineReducers
} from "../store";
import { ActionThunk, Logger, Reducer } from "../types";
const identity = <A>(a: A) => a;

describe("store", () => {
	describe("createStore", () => {
		it("should set and get the initial state", () => {
			const initialState = { foo: 1 };
			const store = createStore(initialState, identity);

			expect(store.getState()).toBe(initialState);
		});

		it("should handle a basic action", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const reducer = createReducer<State, Inc>({
				inc: (s) => ({ foo: s.foo + 1 })
			});

			const store = createStore(initial, reducer, createNoopLogger());

			expect(store.getState()).toBe(initial);
			store.dispatch({ type: "inc" });
			expect(store.getState()).toEqual({ foo: 1 });
			store.dispatch({ type: "inc" });
			expect(store.getState()).toEqual({ foo: 2 });
		});

		it("should handle a thunk action", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const reducer = createReducer<State, Inc>({
				inc: (s) => ({ foo: s.foo + 1 })
			});

			const store = createStore(initial, reducer, createNoopLogger());

			const thunk: ActionThunk<State, Inc> = (getState, dispatch) => {
				expect(getState()).toBe(initial);
				dispatch({ type: "inc" });
				expect(getState()).toEqual({ foo: 1 });
				dispatch({ type: "inc" });
				expect(getState()).toEqual({ foo: 2 });
			};

			expect(store.getState()).toBe(initial);
			store.dispatch(thunk);
			expect(store.getState()).toEqual({ foo: 2 });
		});

		it("should invoke logger functions", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const reducer = createReducer<State, Inc>({
				inc: (s) => ({ foo: s.foo + 1 })
			});

			const jestLogger: Logger<State, Inc> = {
				logAction: jest.fn(),
				logEnd: jest.fn(),
				logStart: jest.fn(),
				logState: jest.fn()
			};

			const store = createStore(initial, reducer, jestLogger);

			store.dispatch({ type: "inc" });
			expect(jestLogger.logAction).toHaveBeenCalledTimes(1);
			expect(jestLogger.logEnd).toHaveBeenCalledTimes(1);
			expect(jestLogger.logStart).toHaveBeenCalledTimes(1);
			expect(jestLogger.logState).toHaveBeenCalledTimes(2);
		});

		it("should call subscribers after dispatch", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const reducer = createReducer<State, Inc>({
				inc: (s) => ({ foo: s.foo + 1 })
			});

			const store = createStore(initial, reducer, createNoopLogger());

			const sub1 = jest.fn();
			const sub2 = jest.fn();

			const unsub1 = store.subscribe(sub1);
			const unsub2 = store.subscribe(sub2);

			store.dispatch({ type: "inc" });
			const expected1: State = { foo: 1 };
			expect(sub1).toHaveBeenCalledWith(expected1);
			expect(sub2).toHaveBeenCalledWith(expected1);

			sub1.mockReset();
			sub2.mockReset();
			unsub1();
			store.dispatch({ type: "inc" });
			const expected2: State = { foo: 2 };
			expect(sub1).not.toHaveBeenCalled();
			expect(sub2).toHaveBeenCalledWith(expected2);

			sub1.mockReset();
			sub2.mockReset();
			unsub2();
			store.dispatch({ type: "inc" });
			const expected3: State = { foo: 3 };
			expect(sub1).not.toHaveBeenCalled();
			expect(sub2).not.toHaveBeenCalled();
		});
	});

	describe("createReducer", () => {
		it("should return a reducer handling the given actions", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };

			const incMock = jest.fn((s: State) => ({ foo: s.foo + 1 }));
			const reducer = createReducer<State, Inc>({
				inc: incMock
			});

			const store = createStore(initial, reducer, createNoopLogger());

			store.dispatch({ type: "inc" });
			expect(store.getState()).toEqual({ foo: 1 });
			expect(incMock).toHaveBeenCalledTimes(1);
			store.dispatch({ type: "inc" });
			expect(incMock).toHaveBeenCalledTimes(2);
			expect(store.getState()).toEqual({ foo: 2 });
		});

		it("should return a reducer with fallbacks for unhandled actions", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const reducer = createReducer<State, Inc>({});

			const store = createStore(initial, reducer, createNoopLogger());

			store.dispatch({ type: "inc" });
			expect(store.getState()).toBe(initial);
		});
	});

	describe("createSubReducer", () => {
		it("should return a reducer handling the given actions for a given key", () => {
			type Inc = { type: "inc" };
			type SubState = { bar: number };
			type State = { foo: SubState };

			const initial: State = { foo: { bar: 0 } };

			const incMock = jest.fn((s: State) => ({ foo: { bar: s.foo.bar + 1 } }));
			const reducer = createReducer<State, Inc>({
				inc: incMock
			});

			const store = createStore(initial, reducer, createNoopLogger());

			store.dispatch({ type: "inc" });
			expect(store.getState()).toEqual({ foo: { bar: 1 } });
			expect(incMock).toHaveBeenCalledTimes(1);
			store.dispatch({ type: "inc" });
			expect(incMock).toHaveBeenCalledTimes(2);
			expect(store.getState()).toEqual({ foo: { bar: 2 } });
		});

		it("should return a reducer with fallbacks for unhandled actions", () => {
			type Inc = { type: "inc" };
			type SubState = { bar: number };
			type State = { foo: SubState };

			const initial: State = { foo: { bar: 0 } };
			const reducer = createReducer<State, Inc>({});

			const store = createStore(initial, reducer, createNoopLogger());

			store.dispatch({ type: "inc" });
			expect(store.getState()).toBe(initial);
		});
	});

	describe("combineReducers", () => {
		it("should combine 2 reducers, one with handler, one with fallback", () => {
			type Inc = { type: "inc" };
			type State = { foo: number };

			const initial: State = { foo: 0 };
			const incHandler = jest.fn(identity);
			const reducer1: Reducer<State, Inc> = createReducer<State, Inc>({
				inc: incHandler
			});
			const reducer2: Reducer<State, Inc> = jest.fn(identity);

			const reducer = combineReducers([reducer1, reducer2]);

			const store = createStore(initial, reducer, createNoopLogger());

			store.dispatch({ type: "inc" });

			expect(incHandler).toHaveBeenCalledTimes(1);
			expect(reducer2).toHaveBeenCalled();
		});
	});
});