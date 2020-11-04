import { createSelector, createCompoundSelector } from "../selectors";

type TestState = {
  foo: number;
};

describe("selectors", () => {
  describe("createSelector", () => {
    it("should execute the identity function", () => {
      const state: TestState = { foo: 99 };
      const selector = createSelector<TestState, TestState>((s) => s);

      const result = selector(state);

      expect(result).toEqual(state);
    });

    it("should memoize the selector", () => {
      const state: TestState = { foo: 99 };
      const selector = createSelector<TestState, {}>((s) => ({}));

      const result1 = selector(state);
      const result2 = selector(state);

      expect(result1).toEqual({});
      expect(result1).toBe(result2);
    });
  });

  describe("createCompoundSelector", () => {
    it("should execute the identity function", () => {
      const state: TestState = { foo: 100 };
      const selector_a = createSelector<TestState, number>((s) => s.foo);
      const selector_b = createSelector<TestState, number>((s) => s.foo * 2);
      const selector_c = createSelector<TestState, string>(s => "string");

      const selector_ab = createCompoundSelector(
        //eggs should not be working
        [selector_a, selector_b, selector_c, (eggs: number) => eggs],
        // [selector_a, selector_b, selector_c],
        (a,b,c) => a + b + c.length,
      );

      const result = selector_ab(state);

      expect(result).toEqual(state.foo * 3);
    });

    it("should memoize the selector", () => {});
  });
});
