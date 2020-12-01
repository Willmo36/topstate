import { act, renderHook } from "@testing-library/react-hooks";
import * as React from "react";
import { createNoopLogger, createStore } from "../store";
import { createReactBindings } from "../createReactBindings";
import { Selector } from "../selectors";

type TestAction = { type: "inc" };
type TestState = {
	foo: number;
};

const {
	StoreContext,
	useDispatch,
	useSelector,
	useStore
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
	it("should provide the store", () => {
		const { result } = renderHook(() => useStore(), { wrapper });
		expect(result.current).toBe(store);
	});

	it("should provide the dispatcher", () => {
		const { result } = renderHook(() => useDispatch(), { wrapper });
		expect(result.current).toBe(store.dispatch);
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
});
