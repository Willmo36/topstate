export type Reducer<S, A extends Action> = (state: S, action: A) => S;
export type IndexedReducer<S, A extends Action> = Partial<Record<A['type'], Reducer<S, A>>>;
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

export type Store<S, A extends Action> = {
    getState: GetState<S>;
    dispatch: Dispatcher<S, A>;
    subscribe: (cb: Subscriber<S>) => () => void;
}