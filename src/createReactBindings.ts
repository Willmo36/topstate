import {
	useContext,
	createContext,
	useState,
	useEffect,
	useCallback
} from "react";
import { Action, Store, Selector, StoreReact, UseActionCreator, UseAction, UseSelector, UseDispatch, UseStore } from "./types";

/**
 * Create React Context & Hooks for interacting with the Store
 * Capturing the type parameters so they need not be respecified.
 * @category Start here
 * @example ```
 * //myProj/src/Store.ts
 * export const {useX, useY, useZ} = createReactBindings<MyState, MyAction>();
 * ```
 */
export function createReactBindings<S, A extends Action>(): StoreReact<S, A> {
	const StoreContext = createContext<Store<S, A> | null>(null);

	const useStore: UseStore<S, A> = () => {
		const store = useContext(StoreContext);
		return assertStoreContextValue(store);
	};

	const useDispatch: UseDispatch<S, A> = () => useStore().dispatch;

	const useSelector: UseSelector<S> = <A>(selector: Selector<S, A>): A => {
		const store = useStore();
		const [result, setResult] = useState(selector(store.getState()));
		useEffect(() => {
			const unsubscribe = store.subscribe((state) => {
				setResult(selector(state));
			});

			return () => {
				unsubscribe();
			};
		}, [store]);

		return result;
	};

	const useActionCreator: UseActionCreator<A> = <B = void>(actionCreator: (b: B) => A) => {
		const dispatch = useDispatch();
		return useCallback(
			(b: B) => {
				dispatch(actionCreator(b));
			},
			[dispatch]
		);
	};

	const useAction: UseAction<S, A> = (action) => {
		const dispatch = useDispatch();
		return useCallback(() => {
			dispatch(action);
		}, [dispatch]);
	};

	return {
		useStore,
		useDispatch,
		useSelector,
		useAction,
		useActionCreator,
		StoreContext
	};
}

const assertStoreContextValue = <S>(value: S | null): S => {
	if (value === null) {
		throw new Error(
			"Found no Store when trying to read from the context provider."
		);
	}
	return value;
};
