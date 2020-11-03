export type Selector<S, A> = (s: S) => A;

//extract the result type of the selector
export type SelectorResult<SL> = SL extends Selector<any, infer A> ? A : never;

//"map" a collection of selectors to a collection of their results
export type SelectorResults<S> = {
  [K in keyof S]: SelectorResult<S[K]>;
};

const arrayShallowEquality = <T>(a1: T[], a2: T[]): boolean =>
  a1.length === a2.length && a1.every((a1Val, i) => a1Val == a2[i]);

export const memoizeLastResult = <Args extends any[], R>(
  fn: (...args: Args) => R
): ((...args: Args) => R) => {
  let lastArgs: Args = null;
  let lastResult: R = null;

  const fn2 = (...args: Args): R => {
    if (!arrayShallowEquality(args, lastArgs)) {
      lastResult = fn(...args);
      lastArgs = args;
    }
    return lastResult;
  };

  return fn2;
};

export const createSelector = <S, A>(
  fn: (s: S) => A,
  memoize = memoizeLastResult
): Selector<S, A> => memoize(fn);

export const createCompoundSelector = <S, A>(
  selectors: [...Selector<S, any>[]],
  fn: (...ss: SelectorResults<typeof selectors>) => A,
  memoize = memoizeLastResult
): Selector<S, A> => memoize((state) => {
  const selections = selectors.map((sl) => sl(state));
  return fn(...selections);
});