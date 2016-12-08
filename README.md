# -:atom_symbol:-> React Most

[![Join the chat at https://gitter.im/jcouyang/react-most](https://badges.gitter.im/jcouyang/react-most.svg)](https://gitter.im/jcouyang/react-most?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A Monadic Reactive Composable State Wrapper for React Component

[![CircleCI](https://circleci.com/gh/reactive-react/react-most.svg?style=svg)](https://circleci.com/gh/reactive-react/react-most)
[![codecov](https://codecov.io/gh/reactive-react/react-most/branch/master/graph/badge.svg)](https://codecov.io/gh/reactive-react/react-most)
[![npm](https://img.shields.io/npm/dm/react-most.svg)](https://www.npmjs.com/package/react-most)
[![npm](https://img.shields.io/npm/v/react-most.svg)](https://www.npmjs.com/package/react-most)
[![greenkeeper.io](https://badges.greenkeeper.io/reactive-react/react-most.svg)](https://greenkeeper.io)

## Install
```
npm install react-most --save
```

## What
`react-most` is simple and only 100 LOC React Higher Order Component. Only dependencies are  `Most` and `React`.

Data flow is simple and unidirectional

![](https://github.com/reactive-react/react-most/wiki/images/react-most-flow.png)

## Terminology
- **Action**: an action can create an Intent and send to an `Intent Stream`
- **Intent Stream**: a time line of all kinds of `Intent` created by `Action`
- **Sink** a time line of transforms of state e.g.`--- currentState => nextState --->`
- **State** simply a react component state

## Quick Start

Sorry we don't have a **book** to document how to use `react-most`, and we don't really need to,
there are only 3 things you should notice when using `react-most`, which can be explained by a simple counter app.

also you can refer to 

- various [Examples](https://github.com/reactive-react/react-most/wiki/examples)
- simple [API](https://github.com/reactive-react/react-most/wiki/api)
- [Best Practice](https://github.com/reactive-react/react-most/wiki/frp-best-practice)
- [Wiki](https://github.com/reactive-react/react-most/wiki)


### 1. Create a simple stateless component
![](https://github.com/reactive-react/react-most/wiki/images/view.png)
```html
const CounterView = props => (
  <div>
    <button onClick={props.actions.dec}>-</button>
    <span>{props.count}</span>
    <button onClick={props.actions.inc}>+</button>
  </div>
)
```
### 2. Define Counter's Behaviour
![](https://github.com/reactive-react/react-most/wiki/images/behavior.png)

1. a counter can have actions of `inc` and `dec`, which will send a object `{type: 'inc'}` or `{type:'dec'}` to `Intent Stream` if it's been call
2. a counter reactivly generate state transform function when recieve intent of type `inc` or `dec`.
```js
const counterable = connect((intent$) => {
  return {
    sink$: intent$.map(intent => {
      switch (intent.type) {
        case 'inc':
          return state => ({ count: state.count + 1 });
        case 'dec':
          return state => ({ count: state.count - 1 });
        default:
          return _ => _;
      }
    }),
    inc: () => ({ type: 'inc' }),
    dec: () => ({ type: 'dec' }),
  }
})
```
### 3. Connect behaviour and view
![](https://github.com/reactive-react/react-most/wiki/images/wrap.png)
```js
const Counter = counterable(CounterView)

render(
  <Most>
    <Counter />
  </Most>
  , document.getElementById('app'));
```

## Features

Redux is awesome, but if you're big fan of Functional Reactive Programming, you would've imagined all user events, actions and data as Streams, then we can map,filter, compose, join on those streams to React state.

### Pure Functional, Declarative & Monadic
Instead of imperative, describe what you want to do with data at certain step, then simply define data transforms and compose them to data flow. No variable, no state, no side effect at all while you are composing data flow.

### Composable and Reusable Sinks
Sinks are composable and reusable, not like reducer in redux, where switch statement are hard to break and compose.

also wrappers are simple functions that you can easily compose
```js
const countBy1 = connect(...)
const countBy2 = connect(...)
const Counter = countBy1(countBy2(CounterView))
// or
const counterable = compose(counterBy1, counterBy2)
const Counter = counterable(CounterView)
```

### Easy to Test, no mocks
Since UI and UI behaviour are loosely coupled, you can simply define a dump react component and test it by passing data. seperately you can test behaviour by giving actions and verifing state.

```js
let {do$, historyStreamOf} = require('../test-utils')
let todolist = TestUtils.renderIntoDocument(
  <Most >
    <RxTodoList history={true}>
    </RxTodoList>
  </Most>
)
let div = TestUtils.findRenderedComponentWithType(todolist, RxTodoList)
do$([()=>div.actions.done(1),
     ()=>div.actions.done(2),
     ()=>div.actions.remove(2),
     ()=>div.actions.done(1)])
return historyStreamOf(div)
  .take$(4)
  .then(state=>
    expect(state).toEqual({todos: [{id: 1, text: 5, done: false}]}))
```

### Async actions
When function is not async such as a Promise, simply convert it to Stream and `flatMap` it
```js
intent$.map(promise=>most.fromPromise)
	.flatMap(value=>dosomething)
```

### Transducers support
[Transducer](https://github.com/cognitect-labs/transducers-js) is another high perfomance functional way to compose data flow other than monadic.

Writing actions in transducers improve reusablity.

### Time Travel
Since we have all action's Stream, we can easyily reproduce all the action anytime, or get snapshot of state stream and going back in time.

you can pass history as 3rd parameter of `connect`
```js
connect(intent$=>[awesome flow], {history:true})(App)
```

connect will populate history stream with all state history

then you get a create action to deal with historyStream.

### Modular and Easy to Extend
if you're from Rx.js, it's easy to switch rx engine into react-most, by simply pass a props named `engine` to `Most` component

```html
import rxEngine from 'react-most/engine/rx'
<Most engine={rxEngine}>
  <App />
</Most>
```

## [More Documents...](https://github.com/jcouyang/react-most/wiki)


## Thanks to...
- [most](https://github.com/cujojs/most)
- [React](http://facebook.github.io/react/)
- [redux](https://github.com/rackt/redux)
- [Om](https://github.com/omcljs/om)
- [Cycle](http://cycle.js.org/)
- [transdux](https://github.com/jcouyang/transdux)
