import {
  Action,
  Logger,
  Subscriber,
  ActionThunk,
  GetState,
  Dispatcher,
  Reducer,
  Store
} from "./types";

export const makeDefaultLogger = <S, A extends Action>(): Logger<S, A> => ({
  logStart: (action) => console.group(`action ${action.type}`),
  logAction: (action) => console.info(`action`, action),
  logState: (state, stage) => console.info(`${stage} state`, state),
  logEnd: () => console.groupEnd(),
});


export function createStore<S, A extends Action>(
  initialState: S,
  reducer: Reducer<S, A>,

  //todo replace this with redux dev tools
  logger = makeDefaultLogger<S, A>()
): Store<S, A> {
  let state = initialState;
  let subscribers: Subscriber<S>[] = [];

  const isThunk_ = (action: unknown): action is ActionThunk<S, A> =>
    typeof action === "function";

  const getState: GetState<S> = () => state;

  const dispatch: Dispatcher<S, A> = (action) => {
    if (isThunk_(action)) {
      action(getState, dispatch);
    } else {
      logger.logStart(action);
      logger.logState(state, "prev");
      logger.logAction(action);
      state = reducer(state, action);
      logger.logState(state, "next");
      subscribers.forEach((notify) => notify(state));
    }
  };

  const subscribe = (cb: Subscriber<S>) => {
    subscribers.push(cb);
    return () => {
      subscribers = subscribers.filter((cb_) => cb_ !== cb);
    };
  };

  return {
    getState,
    dispatch,
    subscribe,
  };
}


const noop = () => ({})
/**
 * Noop all logger operations. Useful for testing.
 */
export const createNoopLogger = <S, A extends Action>(): Logger<S, A> => ({
    logAction:noop,
    logEnd: noop,
    logStart:noop,
    logState: noop
})