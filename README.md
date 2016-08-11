# arify

> Let your function focus on its *function*

***arify*** brings function overloading to JavaScript and allows for complex configurations of function arguments with an easy to use, self-documenting syntax. Eliminate those twenty lines of argument validation where you're checking types, lengths, and properties. Just arify them and let them do their thing.

## Installation

`npm i arify`

## Usage

### View from the top:

```javascript
import arify from 'arify'

const arified = arify(v => {
  v.string('one').number('two', 2)
  v.form('one', '?two')
}, args => {
  console.log(args.one, args.two)
})

arified('hello')
// -> 'hello', 2
```

### Now let's break it down:

arify's default export is a function that you use to wrap your own functions.

```javascript
import arify from 'arify'
```

The `arify` function takes a function as its first argument. This function should accept a single argument - typically called `v` - which is an instance of the arify configuration class.

```javascript
const arified = arify(v => {})
```

You add parameters to your function by calling methods on this instance. In the example below, `v.string` is used to add a parameter named `one`. When calling the `arified` function, `one` would be required to be a string.

```javascript
const arified = arify(v => {
  v.string('one')
})
```

But arify isn't quite ready - first we need to specify what forms our function can take. You do this using `v.form`:

```javascript
const arified = arify(v => {
  v.string('one')
  v.form('one')
})
```

Now, we only have one argument in the examples above. But if we had more, we could call `v.form` multiple times:

```javascript
const arified = arify(v => {
  v.string('one')
  v.number('two')
  v.boolean('isEven')

  v.form('one')
  v.form('one', 'two')
  v.form('one', 'isEven')
  v.form('one', 'two', 'isEven')
})
```

But this is getting a little verbose, isn't it? Let's shorten that by using the `?` (optional) modifier. While we're at it, let's also add default values to `v.number` and `v.boolean`. We can also chain our type calls since they return the `v` instance.

```javascript
const arified = arify(v => {
  v.string('one')
   .number('two', 2)
   .boolean('isEven', false)

  v.form('one', '?two', '?isEven')
})
```

And if we want the `one` argument to never be by itself? We can use the `*` (noLone) modifier for that. In the example below, both the `two` and `isEven` arguments are optional, but at least one of them *must* be provided or an error will occur.

```javascript
const arified = arify(v => {
  v.string('one')
   .number('two', 2)
   .boolean('isEven', false)

  v.form('*one', '?two', '?isEven')
})
```

So far, so good. But we haven't actually added the function that's going to use these arguments we've configured. That's what the second argument to the `arify` argument is.

```javascript
const arified = arify(v => {
  v.string('one', 'hello')
   .number('two', 2)
   .boolean('isEven', false)

  v.form('*one', '?two', '?isEven')
}, (args, rest, form) => {
  // args is an object containing all the arguments by name
  // { one: 'hello', two: 2, isEven: false }

  // rest is an array of any extraneous arguments

  // form is an array representing which form was called
  // ['one', 'two', 'isEven']
})
```

For the vast majority of use cases, you'll only need `args` and you can leave `rest` and `form` out completely.

### What type methods are there?

The following methods should be used within the configuration function as shown below.

```javascript
const arified = arify(v => {
  // call your type methods here
}, args => {
  console.log('This function receives those arguments')
})
```

#### Built-in JS types

| type          | method                                      | example                |
|---------------|---------------------------------------------|:----------------------:|
| string        | `v.string` &#124; `v.str`                   | `coming soon`          |
| number        | `v.number` &#124; `v.num`                   | `coming soon`          |
| boolean       | `v.boolean` &#124; `v.bln`                  | `coming soon`          |
| Array         | `v.array` &#124; `v.arr`                    | `coming soon`          |
| Object        | `v.object` &#124; `v.obj`                   | `coming soon`          |
| Function      | `v.function` &#124; `v.fun` &#124; `v.fn`   | `coming soon`          |
| RegExp        | `v.regExp` &#124; `v.reg`                   | `coming soon`          |
| Date          | `v.date`                                    | `coming soon`          |
| any           | `v.any`                                     | `coming soon`          |

#### Custom types

| type      | method    | example                |
|-----------|-----------|:----------------------:|
| type      | `v.type`  | `coming soon`          |
| test      | `v.test`  | `coming soon`          |
| cls       | `v.cls`   | `coming soon`          |
| match     | `v.match` | `coming soon`          |
| add       | `v.add`   | `coming soon`          |

### That's it for the basics
[Click here](https://citycide.github.io/arify) for the full documentation.

## History

arify is based on a previous project called [variadic.js][variadic]. variadic.js was last updated in January of 2014 (2.5 years ago at the time of writing) and since then, a *lot* has changed. In that time, grunt (variadic's build tool) has fallen out of favor and ES2015 / ES6 usage has risen dramatically. Not only is it supported natively in most environments but even when it isn't, transpilation is too easy to pass up.

While building [trilogy][trilogy] I found I was doing a whole lot of argument validation. I toyed with using an API that just accepted a single object containing each argument - simulating named parameters in other languages - but this resulted in super long function declarations and longer-than-necessary function calls because each argument needed the property name in the object. And this still didn't do anything for type-checking or allow for polymorphism (calls with different numbers and types of parameters).

So I came across variadic.js and it provided exactly what I was looking for. But it's had a lack of love for a long time, and I admittedly just wanted to write more ES2015.

Currently, arify is pretty close to a strict rewrite of variadic.js with modern standards. This could change as I come across opportunities for improvement.

variadic.js was already fairly terse, but by rewriting it I was able to:

- Cut the number of lines by 150-200 thanks to ES2015, along with greatly reduced line lengths in general
- Add extensive documentation using JSDoc, both inline and generated HTML
- Remove an awkward jQuery-style prototype aliasing
- Remove unused utility functions

[trilogy]: https://www.github.com/citycide/trilogy

## Similar Projects
Function overloading in JavaScript is clearly a divisive topic. It's a dynamic language so it's not really built for it. Introducing it is not all that popular in terms of having tons of usage, but popular enough that a whole lot of people have built tools to do it. Here are a few I looked at before deciding to add yet another one to the pile by modernizing variadic.js:

- [Overload (mariusGundersen)](https://github.com/mariusGundersen/Overload)
- [Overload (nathggns)](https://github.com/nathggns/Overload)
- [overload-js](https://github.com/JosephClay/overload-js)
- [leFunc](https://github.com/jrf0110/leFunc)
- [over.js](https://github.com/stretchr/over.js)
- [PolymorphicJS](https://github.com/TaikiAkita/PolymorphicJS)
- [Parametric](https://www.npmjs.com/package/parametric)
- [Polymorf](https://www.npmjs.com/package/polymorf)
- [Uber](https://www.npmjs.com/package/uber.js)

## Contributing

I am open to input and discussion about the project. Feel free to open an issue or submit a pull request. For large changes, please open an issue to discuss the revisions first.

## License

MIT

Based on code also licensed under MIT originally written by [@willurd][willurd] for [variadic.js][variadic].

[willurd]: https://github.com/willurd
[variadic]: https://github.com/willurd/variadic.js
