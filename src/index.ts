import { useState } from 'react';

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

export const useActionState = <
  S,
  A extends Actions,
  C extends { [key: string]: any } = {}
>(
  initialState: S,
  actionDefs: ActionDefs<S, A, C>,
  context: C
): { state: S; actions: A } => {
  const [state, setState] = useState(initialState);
  let futureState: S = state;
  let actions = {} as A;
  const update = (result: S | void) => {
    if (result !== undefined) {
      futureState = result;
      setState(previousState => {
        const newState = { ...previousState, ...futureState };
        console.debug('UPDATE: ', previousState, newState);
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
