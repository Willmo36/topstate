import * as React from "react";
import { Selector } from "./selectors";
import { Action, Store } from "./types";

export function createStoreReactFns<S, A extends Action>() {
	const StoreContext = React.createContext<Store<S, A> | null>(null);

	const useStore = () => {
		const store = React.useContext(StoreContext);
		return assertStoreContextValue(store);
	};

	const useDispatch = () => useStore().dispatch;

	const useSelector = <A>(selector: Selector<S, A>): A => {
		const store = useStore();
		const [result, setResult] = React.useState(selector(store.getState()));
		React.useEffect(() => {
			const unsubscribe = store.subscribe((state) => {
				setResult(selector(state));
			});

			return () => {
				unsubscribe();
			};
		}, [store]);

		return result;
	};

	return { useStore, useDispatch, useSelector, StoreContext };
}

const assertStoreContextValue = <S>(value: S | null): S => {
	if (value === null) {
		throw new Error(
			"Found no Store when trying to read from the context provider."
		);
	}
	return value;
};
