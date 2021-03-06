---
layout: docs
title:  Typeclass
section: en
position: 6
---

Typeclass is kind of FP design pattern, you may have seen lot of typeclass in Haskell.

In OO, you may usually create a class for a data, and define some methods in the class to operate on data inside.

But in FP we would more likely to separate definition of data and definition of operation.

For Example if we have a data type `Xstream`, we just create the data type

```js
class Xstream<T> {
  value: T
  constructor(v: T) {
    this.value = v
  }
}
```

In OO, if we need Xstream can be map, we probably need it to implement a interface e.g. `Mapable`

```js
interface Mapable<A> {
  map<B>(f: (v:A)=>B): Mapable<B>
}
```

Now we need to **Open** class `Xstream` to implement Mapable, add a new method in.

```js
class Xstream<T> implements Mapable<T> {
  value: T
  constructor(v: T) {
    this.value = v
  }

  map<B>(f: (v: T) => B): Mapable<B> {
    return new Xstream(f(this.value))
  }
}
```

What if we need to implement another interface, says Foldable, we need to open it again

```js
class Xstream<T> implements Mapable<T>, Foldable<T> {
   ...
  fold<B>(f:(acc:B,v:T)=>B, base:B):B {
    return f(this.value, base)
  }
}
```

Now you may see the problem, OO class is not open for adding new behavior, while FP typeclass reverse this situation.


# Functor

A Mapable interface in FP is called Functor typeclass, but in FP the relation is reverse, interface should define on datatype

instead of

```js
class Xstream<T> implements Mapable<T> {...}
```

typeclass reverse the order of class and interface, so we have a new class that just implement the Functor instance of Xstream

here's the Functor typeclass

```js
interface Functor<F> {
  map<A, B>(f: (a: A) => B, fa: F<A>): F<B>
}
```

```js
class XstreamFunctor implement Functor<Xstream<any>> {
  map<A, B>(f: (v: A) => B, fa: Xstream<A>): Xstream<B> {
    return new Xstream(f(this.value))
  }
}
```

And we can use the map function from Functor, instead of from Xstream itself

```js
new XstreamFunctor.map((a)=>a+1, new Xstream(1))
```


## Higher Kind Type

The above code won't compile in typescript, because there's no Higher Kind Type(HKT) in Typescript, so in

```js
interface Functor<F> {
  map<A, B>(f: (a: A) => B, fa: F<A>): F<B>
}
```

`F` is a HKT, because `F` is not a specify type, `F<number>` is a type, `F` is something higher than type `F<number>`

similar to Higher Order Function

```js
function a(b){
  return function(){
     b + 1
  }
}
```

`a` is a higher order function, `a(1)` is a normal function.

Fortunately we can mimic HKT in Typescript with literal type, inspired by <https://github.com/gcanti/fp-ts>

We'll need a interface `_<A>` to store all the HKT as a Type Dictionary

```js
interface _<A> { }
```

And `HKT` of all HKT type keys

```js
type HKT = keyof _<any>
```

and `$<F,A>` type to find the HKT in dictionary

```js
type $<F extends HKT, A> = _<A>[F]
```

Welcome to **Type Level Programming**, all above is at type level, which will never compile to js and effect runtime

Let's try implement Functor typeclass again

```js
interface Functor<F extends HKT> {
  map<A, B>(f: (a: A) => B, fa: $<F, A>): $<F, B>
}
```

We can implement Xstream's Functor instance right now

1.  Declare `Xstream` as HKT, with key `"Xstream"`

```js
interface _<A> {
  "Xstream": Xstream<A>
}
```

1.  implements `Functor<"Xstream">`, notice that although `"Xstream"` looks like

a string, but actually it's literal string type. So it's still type safe, any other string place here will cause compiler error.

```js
class XstreamFunctor implements Functor<"Xstream"> {
  map<A, B>(f: (v: A) => B, fa: Xstream<A>): Xstream<B> {
    return new Xstream(f(fa.value))
  }
}
```


## Polymorphism

But, what's the point, we move `map` function from `Xstream` to another class, every time we have to create `XstreamFunctor` 's instance to use `map`

```js
new XstreamFunctor.map(a=>a+1, new Xstream(1))
```

what about polymorphism, what if there's another functor instance `Ystream`.

How can we use just one `map` that can apply to any instance of Functor?

Ideally we should have a `map` function such as:

```js
function map<F extends FunctorInstance, A, B>(f: (v: A) => B, fa: $<F, A>): $<F, B> {
  return new Functor<F>().map(f, fa)
}
```

But Typeclass type system is not good enough to figure out `new Functor<F>`, Typescript can't find class `XstreamFunctor` class from `Functor<"Xstream">`. it break the gap between type and value. In Scala, `implicit` will help you find a value from a type. but how can we find a value from a type?

similar to `_` type, we need a dictionary

```js
namespace Functor {
  const Xstream = new XstreamFunctor
  const Ystream = new YstreamFunctor
}
```

then we can invoke different type of stream by

```js
Functor['Xstream'].map(a=>a+1, new Xstream(1))
Functor['Ystream'].map(a=>a+1, new Ystream(1))
```

but 'Xstream' is string value here, not type. how can we convert a string type to a value?

before that, let's continue implement `map` and see what's missing

```js
type FunctorInstance = keyof typeof Functor
```

In this case `FunctorInstance` is type `'Xstream' | 'Ystream'`

```js
function map<F extends FunctorInstance, A, B>(f: (v: A) => B, fa: $<F, A>): $<F, B> {
  return Functor[F].map(f, fa)
}
```

It still won't compile. `Functor[F]` won't work, as we can't convert string literal type `F` to a string value in TypeScript.

It turn out to be impossible in TypeScript if we think about it. All Type will be wipe out while compile to JS.

There's no way you can get the information of type `F` in JS.

If we think in another way, it is possible to get a type metadata from instance `fa` though.

For example it's easy to get the name of class of `fa`, the constructor name should be `'Xstream'`

```js
function map<F extends FunctorInstance, A, B>(f: (v: A) => B, fa: $<F, A>): $<F, B> {
  return Functor[fa.constructor.name as F].map(f, fa)
}
```

Sadly TypeScript can't compile this either. `Functor[fa.constructor.name as F]` could be `XstreamFunctor` or `YstreamFunctor`, `fa` could be `Xstream` or `Ystream`, the compiler though it could be possible that `Functor[fa.constructor.name as F]` is `XstreamFunctor` and `fa` is `Ystream`

since we are sure that fa is one of `Xstream` and `Ystream`, the dictionary should definitely find the right map for the right type. We could very hacky just turn it to JS and skip stupid TypeScript check.

```js
function map<F extends FunctorInstance, A, B>(f: (v: A) => B, fa: $<F, A>): $<F, B> {
  return (<any>Functor[fa.constructor.name as F]).map(f, fa) as $<F, B>
}
```

Now let us try the polymorphic map on any functor

```js
map<"Xstream", number, number>(a=>a+1, new Xstream(1))
map<"Ystream", number, number>(a=>a+1, new Ystream(1))
```

Everything works fine.

But the code won't work if we minify it. you should already guess that when the code is minify, constructor name will not necessary be `Xstream`, it could be any simple letters.


## Reflect Metadata

One of the proper solution would be tag the data type some meta information using [Reflect Metadata](https://github.com/rbuckton/reflect-metadata), a ECMA proposal not sure what stage it currently is, but anyway it's easy to shim.

I just create two functions

-   `datatype` for tagging constructor as some kind of data type.
-   `kind` to fetch the tag from a instance

```js
function datatype(name: string) {
  return (constructor: Function) => {
    Reflect.defineMetadata('design:type', name, constructor);
  }
}

function kind(target: any) {
  return Reflect.getMetadata('design:type', target.constructor);
}
```

Tagging Xstream

```js
datatype('Xstream')(Xstream)
```

or using decorator syntax when declare class

```js
@datatype('Xstream')
class Xstream<A> {...}
```

Finally, we have a proper polymorphic `map` for any functor instance

```js
function map<F extends FunctorInstance, A, B>(f: (v: A) => B, fa: $<F, A>): $<F, B> {
  return (<any>Functor[kind(fa) as F]).map(f, fa) as $<F, B>
}
```


# Cartesian

With typeclass, now we can simply add another operation for `Xstream`, without changing any existing code.

The following code add a new Cartesian typeclass, which enable Xstream to be able to product.

```js
type CartesianInstances = keyof typeof Cartesian

interface Cartesian<F extends HKT> {
  product<A, B>(fa: $<F, A>, fb: $<F, B>): $<F, [A, B]>
}

namespace Cartesian {
  export let Xstream: Cartesian<"Xstream">
}

function product<F extends CartesianInstances, A, B>(fa: $<F, A>, fb: $<F, B>): $<F, [A, B]> {
  let instance = (<any>Cartesian)[kind(fa)]
  return instance.product(fa, fb) as $<F, [A, B]>
}

// Cartesian Xstream instance
class XstreamCartesian implements Cartesian<"Xstream"> {
  product<A, B>(fa: Xstream<A>, fb: Xstream<B>): Xstream<[A, B]> {
    return new Xstream([fa.value, fb.value] as [A, B])
  }
}

Cartesian.Xstream = new XstreamCartesian

// product of two Xstream
product<"Xstream", number, number>(new Xstream(1), new Xstream(2))
// => Xstream([1,2])
```


# Apply

If your typeclass extends another, just simply do it, for instance Apply will need to extends Cartesian and Functor.

```javascript
interface Apply<F extends HKT> extends Cartesian<F>, Functor<F> {
  ap<A, B>(fab: $<F, (a: A) => B>, fa: $<F, A>): $<F, B>
}

type ApplyInstances = keyof typeof Apply

namespace Apply {
  export let Xstream: Apply<"Xstream">
}

function ap<F extends ApplyInstances, A, B>(fab: $<F, (a: A) => B>, fa: $<F, A>): $<F, B> {
  let instance = (<any>Functor)[kind(fab)]
  return instance.ap(fab, fa) as $<F, B>
}
```

But don't forget to redirect it's function, map from Functor and product from Cartesian.

```js
class XstreamApply implements Apply<"Xstream"> {
  ap<A, B>(fab: Xstream<(a: A) => B>, fa: Xstream<A>): Xstream<B> {
    return new Xstream(fab.value(fa.value))
  }
  map = Functor.Xstream.map
  product = Cartesian.Xstream.product
}
```

One of the most best part of typeclass is, again, unlike OO class, it's very easy to add a new function to a datatype, without change any of existing code.

For instance we need a `ap2` function, you don't need to bother changing any existing Apply or it's instances. Just add `ap2` then all Apply instance will instantly work.

```js
export function ap2<F extends ApplyInstances, A, B, C>(fabc: $<F, (a: A, b: B) => C>, fa: $<F, A>, fb: $<F, B>): $<F, C> {
  let instance: any = Apply[kind(fabc) as F]
  return instance.ap(
    instance.map(
      (f: (a: A, b: B) => C) => (([a, b]: [A, B]) => f(a, b))
      , fabc)
    , instance.product(fa, fb)
  ) as $<F, C>
}
```

```js
ap2<"Xstream", number, number, number>(
  new Xstream((a: number, b: number) => a + b),
  new Xstream(2),
  new Xstream(3)
)
// => Xstream(5)
```

More about Typeclass in TypeScript, [check out the source code in xreact&#x2026;](https://github.com/reactive-react/xreact/tree/6ac7c192cfb5186a74e36593c121901cddd2225d/src/fantasy/typeclasses)
