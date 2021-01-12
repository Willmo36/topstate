import {
	useContext,
	createContext,
	useState,
	useEffect,
	useCallback
} from "react";
import { Action, Store, Selector } from "./types";

/**
 * Create React Context & Hooks for interacting with the Store
 * Capturing the type parameters so they need not be respecified.
 * @example ```
 * //myProj/src/Store.ts
 * export const {useX, useY, useZ} = createReactBindings<MyState, MyAction>();
 * ```
 */
export function createReactBindings<S, A extends Action>() {
	const StoreContext = createContext<Store<S, A> | null>(null);

	/**
	 * @returns The Store from the React Context
	 * @example ```
	 * const store = useStore();
	 * ```
	 */
	const useStore = () => {
		const store = useContext(StoreContext);
		return assertStoreContextValue(store);
	};

	/**
	 * @returns The Store.dispatch from the React Context
	 * @example```
	 * const dispatch = useDispatch();
	 * dispatch(myAction|myThunk);
	 * ```
	 */
	const useDispatch = () => useStore().dispatch;

	/**
	 * Subscribe to the Store and run the selector upon state changes
	 * @param selector - The selector to run
	 * @example ```
	 * const foo = useSelector(fooSelector);
	 * ```
	 */
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

	/**
	 * Create a callback which runs the given action creator and dispatches it's action result
	 * @param actionCreator - Once given, this function is set (Not registered in useCallback dependencies).
	 * A function which takes any value and returns an action to be dispatched
	 * @example ```
	 * const setEmailAddress = useActionCreator<string>(
	 * 	email => ({type: "SET_EMAIL", email})
	 * );
	 * setEmailAddress("emailaddress");
	 * ```
	 */
	const useActionCreator = <B = void>(actionCreator: (b: B) => A) => {
		const dispatch = useDispatch();
		return useCallback(
			(b: B) => {
				dispatch(actionCreator(b));
			},
			[dispatch]
		);
	};

	/**
	 * Create a callback to dispatch the given action
	 * @param action - Once given, this action is set (Not registered in useCallback dependencies). Action to dispatch.
	 * @returns React Callback - A callback which will dispatch the given action. Wrapped in useCallback.
	 * @example ```
	 * const clearFilters = useAction({type: "CLEAR_FILTERS"});
	 * clearFilters();
	 * ```
	 */
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
