import { Selector, LiftToSelector, SelectorResults, Memoize } from "./types";

const arrayShallowEquality = <T>(a1: T[], a2: T[]): boolean =>
	a1.length === a2.length && a1.every((a1Val, i) => a1Val === a2[i]);

/**
 * @ignore
 */
export const memoizeLastResult = <Args extends any[], R>(
	fn: (...args: Args) => R
): ((...args: Args) => R) => {
	let lastArgs: Args;
	let lastResult: R;

	const fn2 = (...args: Args): R => {
		if (!arrayShallowEquality(args, lastArgs ?? [])) {
			lastResult = fn(...args);
			lastArgs = args;
			return lastResult;
		}
		return lastResult;
	};

	return fn2;
};

/**
 * Memoized function from S to A
 * @param fn Create an A from S
 * @param memoize Defaulted: Memoize implementation
 * @typeParam S State type
 * @typeParam A Result type
 * @example ```
 * const selectFoo = createSelector<{foo: boolean}, boolean>(state => state.foo);
 * ```
 */
export const createSelector = <S, A>(
	fn: (s: S) => A,
	memoize: Memoize = memoizeLastResult
): Selector<S, A> => memoize(fn);

// Todo - add type level tests to ensure createCompoundSelector infers correctly

/**
 * Create a selector from numerous other selectors.
 * Advised to use type inference over supplying these types.
 * @param selectors Selectors whom results shall be passed to fn
 * @param fn Take the results of the given the selectors and return some value B
 * @param memoize Defaulted: Memoize implementation
 * @typeParam S State type
 * @typeParam B Return type
 * @typeParam A1 The return type of the first selector in the given selectors array
 * @typeParam AN The tuple of return types for the remaining selectors
 * @example ```
 * const selectA: Selector<S, A>;
 * const selectB: Selector<S, B>;
 * const selectAB = createCompoundSelector(
 * 	[selectA, selectB],
 * 	(a, b) => ...)
 * );
 * ```
 */
export const createCompoundSelector = <
	S,
	B,
	A1, // LiftToSelector appears to prevent inference from picking up S. So we make the first dependent selector mandatory
	AN extends any[]
>(
	selectors: [Selector<S, A1>, ...LiftToSelector<S, AN>],
	fn: (...selectorResults: SelectorResults<typeof selectors>) => B,
	memoize: Memoize = memoizeLastResult
): Selector<S, B> =>
	memoize((state) => {
		const selections = selectors.map((sl) => sl(state));
		// @ts-ignore
		return fn(...selections);
	});
