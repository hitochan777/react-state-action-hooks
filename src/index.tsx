import React, { useState, useContext } from 'react';

type MaybePromise<T> = Promise<T> | T;

export interface Actions {
  [key: string]: (...args: any[]) => MaybePromise<any>;
}

export type MaybeStateReturner<
  S,
  A extends Actions,
  C extends { [key: string]: any }
> = (state: S, actions: A, context: C) => MaybePromise<S | void>;

export type ActionDefs<
  S,
  A extends Actions,
  C extends { [key: string]: any }
> = {
  [K in keyof A]: (...args: Parameters<A[K]>) => MaybeStateReturner<S, A, C>;
};

type Callback<S> = (previousState: S, newState: S) => void;

export const useActionState = <
  S,
  A extends Actions,
  C extends { [key: string]: any } = {}
>(
  initialState: S,
  actionDefs: ActionDefs<S, A, C>,
  context: C,
  callback?: Callback<S>
): { state: S; actions: A } => {
  const [state, setState] = useState(initialState);
  let futureState: S = state;
  let actions = {} as A;
  const update = (result: S | void) => {
    if (result !== undefined) {
      futureState = result;
      setState(previousState => {
        const newState = { ...previousState, ...futureState };
        if (callback) {
          callback(previousState, newState);
        }
        return newState;
      });
    }
  };
  for (const name in actionDefs) {
    const action = actionDefs[name];
    actions[name] = ((...args: Parameters<A[Extract<keyof A, string>]>) => {
      const futureResult = action(...args)(futureState, actions, context);
      if (futureResult instanceof Promise) {
        futureResult.then(result => {
          update(result);
        });
      } else {
        update(futureResult);
      }
    }) as A[typeof name];
  }

  return {
    state,
    actions,
  };
};

type Context<S, A extends Actions> = { state: S; actions: A };

type Bundle<S, A extends Actions> = {
  context: React.Context<Context<S, A>>;
  useStateValue: () => Context<S, A>;
  StateProvider: any;
};

export const createBundle = <S, A extends Actions>(): Bundle<S, A> => {
  const StateContext = React.createContext<{
    state: S;
    actions: A;
  }>({
    state: null as any,
    actions: null as any,
  });

  const useStateValue = () => useContext(StateContext);

  const StateProvider = ({
    initialState,
    actionDefs,
    context,
    callback,
    children,
  }: {
    initialState: S;
    actionDefs: A;
    context: Context<S, A>;
    callback?: Callback<S>;
    children: any;
  }) => {
    const { state, actions } = useActionState<S, A, Context<S, A>>(
      initialState,
      actionDefs,
      context,
      callback
    );

    return (
      <StateContext.Provider value={{ state, actions }}>
        {children}
      </StateContext.Provider>
    );
  };

  return {
    context: StateContext,
    useStateValue,
    StateProvider,
  };
};
