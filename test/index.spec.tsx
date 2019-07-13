import { renderHook, act } from '@testing-library/react-hooks';

import { useActionState, ActionDefs } from '../src';

type State = {
  red: boolean;
  yellow: boolean;
  blue: boolean;
};

type Actions = {
  setRed: (newRed: boolean) => void;
  setYellow: (newYellow: boolean) => void;
  setBlue: (newBlue: boolean) => void;
  toggleRed: () => void;
  toggleAll: () => void;
  asyncToggleRed: () => Promise<void>;
};

describe('useActionState', () => {
  const initialState = {
    red: false,
    yellow: false,
    blue: true,
  };
  const actionDefs: ActionDefs<State, Actions, {}> = {
    setRed: (newRed: boolean) => (state: State) => ({
      ...state,
      red: newRed,
    }),
    setYellow: (newYellow: boolean) => (state: State) => ({
      ...state,
      yellow: newYellow,
    }),
    setBlue: (newBlue: boolean) => (state: State) => ({
      ...state,
      blue: newBlue,
    }),
    toggleRed: () => (state: State) => ({
      ...state,
      red: !state.red,
    }),
    toggleAll: () => (state: State, actions: Actions) => {
      actions.setRed(!state.red);
      actions.setYellow(!state.yellow);
      actions.setBlue(!state.blue);
    },
    asyncToggleRed: () => async (state: State) => {
      return Promise.resolve({
        ...state,
        red: !state.red,
      });
    },
  };
  it('changes state synchronously (without payload)', () => {
    const { result } = renderHook(() =>
      useActionState(initialState, actionDefs, {})
    );
    act(() => {
      result.current.actions.toggleRed();
    });
    expect(result.current.state).toEqual({
      red: true,
      yellow: false,
      blue: true,
    });
  });

  it('changes state synchronously (with payload)', () => {
    const { result } = renderHook(() =>
      useActionState(initialState, actionDefs, {})
    );
    expect(result.current.state).toEqual({
      red: false,
      yellow: false,
      blue: true,
    });
    act(() => {
      result.current.actions.setRed(true);
    });
    expect(result.current.state).toEqual({
      red: true,
      yellow: false,
      blue: true,
    });
    act(() => {
      result.current.actions.setRed(false);
    });
    expect(result.current.state).toEqual({
      red: false,
      yellow: false,
      blue: true,
    });
  });

  it('changes states sequentially', () => {
    const { result } = renderHook(() =>
      useActionState(initialState, actionDefs, {})
    );
    act(() => {
      result.current.actions.toggleAll();
    });
    expect(result.current.state).toEqual({
      red: true,
      yellow: true,
      blue: false,
    });
  });

  it('changes states asynchronously', async () => {
    const { result } = renderHook(() =>
      useActionState(initialState, actionDefs, {})
    );
    await act((async () => {
      await result.current.actions.asyncToggleRed();
    }) as any);
    expect(result.current.state).toEqual({
      red: true,
      yellow: false,
      blue: true,
    });
  });
});
