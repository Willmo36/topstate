export interface Selector<S, A> {
	(s: S): A;
}

//extract the result type of the selector
export type SelectorResult<SL> = SL extends (...args: any) => infer A ? A : never;

//"map" a collection of selectors to a collection of their results
export type SelectorResults<S> = {
	[K in keyof S]: SelectorResult<S[K]>;
};

//Lifts mappable types into Selectors from S
export type LiftToSelector<S, AS> = {
	[K in keyof AS]: Selector<S, AS[K]>;
};

const arrayShallowEquality = <T>(a1: T[], a2: T[]): boolean =>
	a1.length === a2.length && a1.every((a1Val, i) => a1Val == a2[i]);

export const memoizeLastResult = <Args extends any[], R>(fn: (...args: Args) => R): ((...args: Args) => R) => {
	let lastArgs: Args;
	let lastResult: R;

	const fn2 = (...args: Args): R => {
		if (!arrayShallowEquality(args, lastArgs || [])) {
			lastResult = fn(...args);
			lastArgs = args;
			return lastResult;
		}
		return lastResult;
	};

	return fn2;
};

export const createSelector = <S, A>(fn: (s: S) => A, memoize = memoizeLastResult): Selector<S, A> => memoize(fn);

//Todo - add type level tests to ensure createCompoundSelector infers correctly

export const createCompoundSelector = <
	S,
	B,
	A1, //LiftToSelector appears to prevent inference from picking up S. So we make the first dependent selector mandatory
	AN extends any[]
>(
	selectors: [Selector<S, A1>, ...LiftToSelector<S, AN>],
	fn: (...selectorResults: SelectorResults<typeof selectors>) => B,
	memoize = memoizeLastResult
): Selector<S, B> =>
	memoize((state) => {
		const selections = selectors.map((sl) => sl(state));
		//@ts-ignore
		return fn(...selections);
	});
