import {
	useContext,
	createContext,
	useState,
	useEffect,
	useCallback
} from "react";
import { Selector } from "./selectors";
import { Action, Store } from "./types";

export function createReactBindings<S, A extends Action>() {
	const StoreContext = createContext<Store<S, A> | null>(null);

	/**
	 * Test comment
	 */
	const useStore = () => {
		const store = useContext(StoreContext);
		return assertStoreContextValue(store);
	};

	const useDispatch = () => useStore().dispatch;

	const useSelector = <A>(selector: Selector<S, A>): A => {
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

	const useActionCreator = <B = void>(fn: (b: B) => A) => {
		const dispatch = useDispatch();
		return useCallback(
			(b: B) => {
				dispatch(fn(b));
			},
			[dispatch]
		);
	};

	const useAction = (action: A) => {
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
