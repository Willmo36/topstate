import { act, renderHook } from "@testing-library/react-hooks";
import * as React from "react";
import { createNoopLogger, createStore } from "../store";
import { createReactBindings } from "../createReactBindings";
import { ActionThunk, Selector } from "../types";
import { createSelector } from "../selectors";

type TestAction = { type: "inc" };
type TestState = {
	foo: number;
};

const {
	StoreContext,
	useDispatch,
	useSelector,
	useSelectors,
	useStore,
	useAction,
	useActionCreator
} = createReactBindings<TestState, TestAction>();

const initialState: TestState = { foo: 0 };
const store = createStore<TestState, TestAction>(
	initialState,
	createNoopLogger()
);
store.addReducer((s, a) => {
	switch (a.type) {
		case "inc":
			return { foo: s.foo + 1 };
		default:
			return s;
	}
});

const wrapper = ({ children }: { children: React.ReactChildren }) => (
	<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

describe("react", () => {
	describe("useStore", () => {
		it("should provide the store", () => {
			const { result } = renderHook(() => useStore(), { wrapper });
			expect(result.current).toBe(store);
		});
	});

	describe("useDispatch", () => {
		it("should provide the dispatcher", () => {
			const { result } = renderHook(() => useDispatch(), { wrapper });
			expect(result.current).toBe(store.dispatch);
		});
	});

	describe("useSelector", () => {
		const fooSelector: Selector<TestState, number> = (s) => s.foo;

		it("should consume a selector", () => {
			const { result } = renderHook(() => useSelector(fooSelector), {
				wrapper
			});
			expect(result.current).toBe(store.getState().foo);
		});

		it("should rerender upon selector result change", () => {
			const initialFoo = store.getState().foo;
			const nextFoo = initialFoo + 1;
			const { result } = renderHook(() => useSelector(fooSelector), {
				wrapper
			});
			expect(result.current).toBe(initialFoo);

			act(() => {
				store.dispatch({ type: "inc" });
			});

			expect(result.current).toEqual(nextFoo);
		});

		// todo add case ensuring component does NOT rerender upon a selector resulting in same value
	});

	describe.only("useSelectors", () => {
		const s1: Selector<TestState, 1> = () => 1;
		const s2: Selector<TestState, 2> = () => 2;
		const fooSelector: Selector<TestState, number> = (s) => s.foo;

		it("should consume the selectors", () => {
			const { result } = renderHook(() => useSelectors(s1, s2), { wrapper });
			expect(result.current).toEqual([1, 2]);
		});

		it("should rerender upon any selector result changing", () => {
			const initialFoo = store.getState().foo;
			const nextFoo = initialFoo + 1;
			const { result } = renderHook(() => useSelectors(fooSelector, s1, s2), {
				wrapper
			});
			expect(result.current).toEqual([initialFoo, 1, 2]);

			act(() => {
				store.dispatch({ type: "inc" });
			});

			expect(result.current).toEqual([nextFoo, 1, 2]);
		});

		it("should not rerender upon no select result change", () => {
			const v1 = {};
			const v2 = {};
			const s1 = createSelector<TestState, {}>(() => v1);
			const s2 = createSelector<TestState, {}>(() => v2);
			const { result } = renderHook(() => useSelectors(s1, s2), {
				wrapper
			});
			const [r1a, r1b] = result.current;
			expect(r1a).toBe(v1);
			expect(r1b).toBe(v2);

			act(() => {
				store.dispatch({ type: "inc" });
			});

			const [r2a, r2b] = result.current;
			expect(r2a).toBe(v1);
			expect(r2b).toBe(v2);
		});
	});

	describe("useAction", () => {
		it("should provide a callback thunk to dispatch the action", () => {
			const expected = store.getState().foo + 1;
			const { result } = renderHook(() => useAction({ type: "inc" }), {
				wrapper
			});
			result.current();
			expect(store.getState().foo).toEqual(expected);
		});

		it("should provide a callback to execute the actionthunk", () => {
			const expected1 = store.getState().foo + 1;
			const expected2 = store.getState().foo + 2;
			const thunk: ActionThunk<TestState, TestAction> = (
				getState,
				dispatcher
			) => {
				dispatcher({ type: "inc" });
				expect(getState().foo).toBe(expected1);
				dispatcher({ type: "inc" });
				expect(getState().foo).toBe(expected2);
			};
			const { result } = renderHook(() => useAction(thunk), {
				wrapper
			});
			result.current();
			expect(store.getState().foo).toEqual(expected2);
		});
	});

	describe("useActionCreator", () => {
		it("should provide a callback thunk to dispatch the action", () => {
			const expected = store.getState().foo + 1;
			const { result } = renderHook(
				() => useActionCreator<"inc">((type) => ({ type })),
				{ wrapper }
			);
			result.current("inc");
			expect(store.getState().foo).toEqual(expected);
		});
	});
});
