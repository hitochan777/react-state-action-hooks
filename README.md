# react-state-action-hooks
[![CircleCI](https://circleci.com/gh/hitochan777/react-state-action-hooks.svg?style=svg)](https://circleci.com/gh/hitochan777/react-state-action-hooks)
![npm](https://img.shields.io/npm/v/react-state-action-hooks.svg)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

React hooks for managing state with (async) actions.

## Installation

```bash
npm install react-state-action-hooks # for npm users
yarn add react-state-action hooks # for yarn users
```

## Basic Usage
Demo is available on [CodeSandbox](https://codesandbox.io/embed/react-typescript-thsdb?fontsize=14).

First import `useActionState` react hook and `ActionDefs` which is a type definition.

```typescript
import { useActionState, ActionDefs } from "react-state-action-hooks";
```

Define a state and action definition types (or interfaces).
State can be anything from number or string to nested object.
`Actions` is an object each of whose keys is a (async) function that takes arbitrary number of parameters.

```typescript
interface State {
  count: number
}

type Actions = {
  incrementBy: (delta: number) => void;
  asyncReset: (interval: number) => Promise<void>;
  decrementBy: (delta: number) => void;
}
```

Then you can define the actual initial state and action definitions that comform to the types (interfaces) defined above.
Action definition (`actionDefs` in the code below) is an object that has exactly the same keys action `Actions`, but the corresponding value is a function that returns function.
The parameters of the outer function is the same as the ones defined in `Actions`.
The parameters of the innner function is `(state: State, actions: Actions)` and it should return (acynchronously)
a new state or nothing. You can also call as many other acitons as you want inside the action.

```typescript
const initialState: State = {
  count: 0
}

const actionDefs: ActionDefs<State, Actions, {}> = {
  incrementBy: (delta: number) => (state: State) => ({...state, count: state.count + delta}),
  asyncReset: (interval: number) => (state: State) => {
    return new Promise( resolve => {
      setTimeout(() => {
        resolve({
          ...state,
           count: 0
        })
      }, interval)
    });
  },
  decrementBy: (delta: number) => (state: State, actions: Actions) => {
    actions.incrementBy(-1);  
  }
}
```

Then finally in a React stateless component, you can use `state` and `actions` by invoking `useActionState`.

```tsx
const Counter = () => {
  const { state, actions } = useActionState<State, Actions>(initialState, actionDefs)
  return (<div>
    <span>{state.count}</span>
    <button onClick={() => {actions.asyncReset(1000)}}>Reset after 1 sec</button>
    <button onClick={() => {actions.incrementBy(1)}}>+1</button>
    <button onClick={() => {actions.incrementBy(2)}}>+2</button>
    <button onClick={() => {actions.decrementBy(1)}}>-1</button>
  </div>)
}
```

## Advanced Usage

### Using context

`useActionState` can take the third parameter `context` which should be a key-value object, to which
you can pass whatever values you want to have access to in an action.
The context then becomes available as the third parameter of the returned function in an action definition.
Here is an example:

```tsx
interface Context {
  apolloClient: ApolloClient<any>
}

const context = {
  apolloClient
}

const Counter = () => {
  const { state, actions } = useActionState<State, Actions, Context>(initialState, actionDefs, context)
  /* lines below omitted */
}
```

Then the context becomes available in all the functions in action definition.

```tsx
const actionDefs: ActionDefs<State, Actions, Context> = {
  someAction: () => async (state: State, actions: Actions, context: Context) => {
    const { apolloClient } = context
    /* do something with apolloClient */
  }
}
```

## Contribution
Any kinds of contributions are welcome!
Just submit issues or pull requests!

## Author
Hitoshi Otsuki

## License
MIT
