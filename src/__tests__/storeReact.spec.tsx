import { act, renderHook } from "@testing-library/react-hooks";
import * as React from "react";
import { createNoopLogger, createStore } from "../store";
import { ActionThunk, Selector } from "../types";
import { createStoreHooks } from "../storeReact";

type TestAction = { type: "inc" };
type TestState = {
  foo: number;
};

const {
  StoreContext,
  useDispatch,
  useSelector,
  useStore,
  useAction,
  useActionCreator,
} = createStoreHooks<TestState, TestAction>();

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

describe("createStoreHooks", () => {
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
        wrapper,
      });
      expect(result.current).toBe(store.getState().foo);
    });

    it("should rerender upon selector result change", () => {
      const initialFoo = store.getState().foo;
      const nextFoo = initialFoo + 1;
      const { result } = renderHook(() => useSelector(fooSelector), {
        wrapper,
      });
      expect(result.current).toBe(initialFoo);

      act(() => {
        store.dispatch({ type: "inc" });
      });

      expect(result.current).toEqual(nextFoo);
    });

    // todo add case ensuring component does NOT rerender upon a selector resulting in same value
  });

  describe("useAction", () => {
    it("should provide a callback thunk to dispatch the action", () => {
      const expected = store.getState().foo + 1;
      const { result } = renderHook(() => useAction({ type: "inc" }), {
        wrapper,
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
        wrapper,
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
