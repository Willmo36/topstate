export type Selector<S, A> = (s: S) => A;

export const map = <S, A, B>(
    aSelector: Selector<S, A>,
    fn: (a: A) => B
): Selector<S, B> => state => fn(aSelector(state));

export const ap = <S, A, B>(
    aSelector: Selector<S, A>,
    abSelector: Selector<S, (a: A) => B>
): Selector<S, B> => state => abSelector(state)(aSelector(state));

export const ap2 = <S, A, B, C>(
    aSelector: Selector<S, A>,
    bSelector: Selector<S, B>,
    ab_c: (a: A) => (b:B) => C
): Selector<S, C> => ap(bSelector, map(aSelector, ab_c))

export const ap3 = <S, A, B, C, D>(
    aSelector: Selector<S, A>,
    bSelector: Selector<S, B>,
    cSelector: Selector<S, C>,
    abc_d: (a: A) => (b:B) => (c: C) => D
): Selector<S, D> => {
    let b = map(aSelector, abc_d);
    let c = ap(bSelector, b);
    return ap(cSelector, c);
}