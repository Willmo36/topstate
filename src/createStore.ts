export type Reducer<S, A extends Action> = (state: S, action: A) => S;
export type GetState<S> = () => S;
export type Subscriber<S> = (s: S) => void;
export type Dispatcher<S, A extends Action> = (action: A | ActionThunk<S, A>) => void;
export type Action = { type: string };
export type ActionThunk<S, A extends Action> = (
  getState: GetState<S>,
  dispatcher: Dispatcher<S, A>
) => void;

export type Logger<S, A extends Action> = {
  logStart: (action: A) => void;
  logAction: (action: A) => void;
  logState: (state: S, stage: "prev" | "next") => void;
  logEnd: () => void;
};

export const makeDefaultLogger = <S, A extends Action>(): Logger<S, A> => ({
  logStart: (action) => console.group(`action ${action.type}`),
  logAction: (action) => console.info(`action`, action),
  logState: (state, stage) => console.info(`${stage} state`, state),
  logEnd: () => console.groupEnd(),
});

export function createStore<S, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  logger = makeDefaultLogger<S, A>()
) {
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

// type Max = {type: "s", payload: "foo"} | {type: "f", payload: number};
// const store = createStore<number, Max>((s, a) =>s + 1, 1);
// store.dispatch({type: "s", payload: "foo"});
// console.log(store.getState)
