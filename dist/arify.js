(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.arify = factory());
}(this, function () { 'use strict';

  var util = {
    isFunction: function (value) { return typeof value === 'function'; },
    isObject: function (value) {
      return value &&
        typeof value === 'object' &&
        typeof value !== 'function' &&
        !Array.isArray(value)
    },
    isRegExp: function (value) { return value instanceof RegExp; },
    isDefined: function (value) { return typeof value !== 'undefined'; },
    format: function (str) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      if (args.length) {
        return str.replace(/\{(\d+)\}/g, function (match, index) { return args[index]; })
      }

      return str
    }
  }

  function arify (setup, fn, context) {
    var instance = new Arify()
    setup(instance)

    instance.validate()

    // This is the function actually called by the end user
    return function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return instance.process(args, fn, context || this)
    }
  }

  arify.error = function (msg) {
    var e = new Error(msg)
    e.name = 'ArifyError'
    throw e
  }

  // an identifier used to match forms
  // every object is unique, ie. {} !== {}
  var exactMatch = {}

  var Arify = function Arify () {
    var this$1 = this;

    Object.assign(this, {
      _parameterNames: [],
      _descriptors: {},
      _forms: [],
      _formMap: {},
      _flags: [
        { name: 'optional', symbol: '?' },
        { name: 'noLone', symbol: '*' }
      ]
    })

    var flagsList = this._flags.map(function (flag) { return ("\\" + (flag.symbol)); }).join('')
    this._flagsRegex = new RegExp(("^([" + flagsList + "]+)"))
    this._flagsMap = {}

    var length = this._flags.length
    for (var i = 0; i < length; i++) {
      var flag = this$1._flags[i]
      this$1._flagsMap[flag.symbol] = flag.name
    }
  };

  Arify.prototype.validate = function validate () {};

  /**
   * @param {string} name
   * @returns {{ noLone: boolean }}
   * @private
   */
  Arify.prototype.getFlags = function getFlags (name) {
      var this$1 = this;

    var flagsObject = {}
    var match = name.match(this._flagsRegex)

    if (!match) return flagsObject

    var flagsList = match[0].split('')
    var length = flagsList.length

    for (var i = 0; i < length; i++) {
      var key = this$1._flagsMap[flagsList[i]]
      flagsObject[key] = true
    }

    return flagsObject
  };

  Arify.prototype.removeFlags = function removeFlags (name) {
    return name.replace(this._flagsRegex, '')
  };

  Arify.prototype.process = function process (args, fn, context) {
    var form = this.getBestMatch(args)

    if (!form) {
      arify.error(util.format(
        "Arguments '{0}' do not match any specified form", args.join(', ')
      ))

      return
    }

    var result = this.processArguments(form, args)
    var names = form.names || []

    return fn.call(context, result.opt, result.rest, names, args)
  };

  Arify.prototype.getBestMatch = function getBestMatch (args) {
      var this$1 = this;

    var forms = this._forms
    var bestMatch
    var bestRating

    var length = forms.length
    for (var i = 0; i < length; i++) {
      var form = forms[i]

      if (form.nonEmpty) {
        if (!args.length) return false
        continue
      }

      var a = this$1.rateForm(form, args)
      if (a === exactMatch) return form

      var b = bestMatch ? bestRating : -1

      if (a !== -1 && a > b) {
        bestMatch = form
        bestRating = a
      }
    }

    return bestMatch
  };

  /**
   *-1 means no match
   *+1 for each non-any matching parameter
   *Symbol if the form exactly matches
   * @returns {number|Symbol}
   * @private
   */
  Arify.prototype.rateForm = function rateForm (form, args) {
      var this$1 = this;

    if (!args.length) {
      if (form.empty) return exactMatch
      return -1
    }

    if (form.empty) return -1
    if (form.any) return 0
    var names = form.names

    var rating = -1
    for (var i = 0; i < names.length; i++) {
      var arg = args[i]
      var name = names[i]
      var desc = this$1._descriptors[name]

      if (!desc) {
        arify.error(util.format('Unknown parameter: {0}', name))
        return -1
      }

      if (!Arify.checkArg(name, desc, arg)) {
        return -1
      } else if (!desc.any) {
        rating += 1
      }
    }

    return rating
  };

  Arify.prototype.processArguments = function processArguments (form, args) {
      var this$1 = this;

    var names = form.names || []
    var result = { opt: {}, rest: args.slice(names.length) }

    for (var prop in this._descriptors) {
      if (!this$1._descriptors.hasOwnProperty(prop)) continue
      var defaultValue = Arify.getDefaultValue(this$1._descriptors[prop])
      if (util.isDefined(defaultValue)) result.opt[prop] = defaultValue
    }

    if (!form.empty) {
      for (var i = 0; i < names.length; i++) {
        result.opt[names[i]] = args[i]
      }
    }

    return result
  };

  Arify.prototype._removeForms = function _removeForms (testFn) {
    var forms = this._forms

    for (var i = forms.length - 1; i >= 0; i--) {
      if (testFn(forms[i])) forms.splice(i, 1)
    }

    return this
  };

  Arify.prototype.forms = function forms () {
    this.form.apply(this, this._parameterNames.map(function (name) { return ("?" + name); }))
  };

  /**
   * `v.form` is the method arify uses to build all the `forms`
   * your function can accept. It can be called multiple times
     * in order to allow the wrapped function to accept multiple
   * forms, or use the `?` (optional) or `*` ('no lone') modifiers
   * to build many forms with a single call.
   *
   * The strings passed to `v.form` should match the descriptor
   * names added via `v.str | obj | num` etc.
   *
   * The arify instance is returned to allow chainable calls.
   *
   * @param {...string} names
   *Any number of strings matching your descriptor names
   *
   * @example
   *
   * const arified = arify(v => {
   * v.str('one')
   *  .num('two')
   *  .obj('opt')
   *
   * // optional 2nd & 3rd arguments by calling `v.form` again
   * v.form('one')
   * v.form('one', 'two')
   * v.form('one', 'two', 'opt')
   *
   * // but you can shorten that to one line
   * v.form('one', '?two', '?opt')
   *
   * // add the `*` 'noLone' modifier to require any second argument
   * v.form('*one', '?two', '?opt')
   * }, args => console.log(args))
   */
  Arify.prototype.form = function form () {
      var this$1 = this;
      var names = [], len = arguments.length;
      while ( len-- ) names[ len ] = arguments[ len ];

    var mapKey = names.join(',')
    var length = names.length

    var i
    var noLoneCount = 0

    if (this._formMap.hasOwnProperty(mapKey)) return this
    if (!names.length) return this.empty()

    for (i = 0; i < length; i++) {
      if (this$1.getFlags(names[i]).noLone) {
        noLoneCount += 1
      }
    }

    if (noLoneCount === length) return this

    // Mark this form as added
    this._formMap[mapKey] = true

    // Add the form
    this._forms.push({
      positional: true,
      names: names.map(this.removeFlags, this)
    })

    // Recursively add more forms if there are optional parameters.
    // Add these forms backwards because we want the first to appear
    // to be the first to match.
    for (i = length - 1; i >= 0; i--) {
      if (this$1.getFlags(names[i]).optional) {
        this$1.form.apply(
          this$1, names.slice(0, i).concat(names.slice(i + 1))
        )
      }
    }

    return this
  };

  /**
   * Require the arified function to be called with exactly
   * zero arguments.
   */
  Arify.prototype.empty = function empty () {
    var mapKey = '*empty'

    if (this._formMap.hasOwnProperty(mapKey)) return this

    this._removeForms(function (form) { return form.nonEmpty || form.empty; })
    this._forms.push({ empty: true })
    this._formMap[mapKey] = true

    return this
  };

  /**
   * Require the arified function to be called with one or
   * more arguments, ie. it cannot be called with no arguments.
   */
  Arify.prototype.nonEmpty = function nonEmpty () {
    var mapKey = '*nonEmpty'

    if (this._formMap.hasOwnProperty(mapKey)) return this

    this._removeForms(function (form) { return form.empty; })
    this._forms.push({ nonEmpty: true })
    this._formMap[mapKey] = true

    return this
  };

  /**
   * Allow any configuration of arguments to an arified function.
   * The `args` argument to the arified function will be null, and
   * any arguments passed to the arified function will instead be
   * found in the `rest` array argument.
   */
  Arify.prototype.anyForm = function anyForm () {
    this._forms.push({ any: true })
    return this
  };

  /**
   * For more advanced type requirements on arguments,
   * use `v.add`. The first argument is the name of the
   * argument as a string. The second is a descriptor -
   * an object describing the requirements.
   *
   * Note that when passing any of the descriptor properties
   * `type`, `cls`, and `test` at the same time, they are used
   * in that order. In other words, `type` takes precedence,
   * then `cls`, and finally `test` if no other is provided.
   *
   * @param {!string} name
   * @param {!Object} descriptor
   * @param {string} [descriptor.type]
   *A string representing a JavaScript type, ie. `'string'`.
   *Used in a `typeof` comparison against the input value.
   * @param {Function} [descriptor.cls]
   *A class or constructor function. Used in an `instanceof`
   *comparison against the input value. Ignored if `type` is
   *specified.
   * @param {Function} [descriptor.test]
   *A boolean-returning function used to test the input value.
   *Return `true` to validate the input, or `false` to reject.
   *Ignored if either of `type` or `cls` are specified.
   * @param {string} descriptor.description
   *A string description that is used if a value doesn't meet the
   *requirements. This should make sense in the sentence 'must be
   *`...`' ie. `a string longer than 10 characters`.
   * @param {*} [descriptor.defaultValue]
   *Provide a default value in the case this argument is not provided.
   *Ignored if `defaultGenerator` is specified.
   * @param {Function} [descriptor.defaultGenerator]
   *A function that returns a value on each call to the wrapped
   *function, ie. `() => new Thing()`. If `defaultGenerator` is
   *specified and `defaultValue` is also provided, the generator
   *will be used while the value is ignored.
   * @param {boolean} [descriptor.any]
   *If `true`, any type will be allowed.
   *
   * @example
   *
   * const arified = arify(v => {
   * v.str('one')
   *  .add('two', {
   *    test: value => Array.isArray(value) && value.length >= 2,
   *    description: 'an array of at least 2 items',
   *    defaultValue: [1, 2],
   *    defaultGenerator: () => Array.from('word')
   *  })
   *
   *  v.form('one', 'two')
   * }, args => console.log(args))
   */
  Arify.prototype.add = function add (name, descriptor) {
    this._descriptors[name] = descriptor
    this._parameterNames.push(name)
    return this
  };

  /**
   * Add an argument to the arified function that is allowed
   * to be of any type.
   *
   * @param {string} name
   * @param {*} [defaultValue]
   *
   * @example
   *
   * const arified = arify(v => {
   * v.any('key1')
   * v.form('key1')
   * }), args => {
   * console.log(`That's valid! :)`)
   * })
   *
   * // all the below would be accepted
   * // and pretty much anything else
   * arified('yo!')
   * arified(2)
   * arified([])
   * arified({})
   * arified(Date.now())
   */
  Arify.prototype.any = function any (name, defaultValue) {
    return this.add(name, {
      any: true,
      description: 'any value',
      defaultValue: defaultValue
    })
  };

  /**
   * Alternate syntax / shorthand for `v.add` with the
   * `type` property.
   *
   * @param {string} name
   * @param {string} type
   * @param {string} description
   * @param {*} [defaultValue]
   *
   * @example
   *
   * // Instead of:
   * v.add('arg', {
   * type: 'string',
   * description: 'a string',
   * defaultValue: 'hello'
   * })
   *
   * // You can do:
   * v.type('arg', 'string', 'a string', 'hello')
   */
  Arify.prototype.type = function type (name, type, description, defaultValue) {
    return this.add(name, {
      type: type,
      description: description,
      defaultValue: defaultValue
    })
  };

  /**
   * Alternate syntax / shorthand for `v.add` with the
   * `test` property. Use for more advanced validation
   * by returning `true` or `false` from the `testFn`
   * function.
   *
   * @param {string} name
   * @param {Function} testFn
   * @param {string} description
   * @param {*} [defaultValue]
   *
   * @example
   *
   * // Instead of:
   * v.add('arg', {
   * test: val => Array.isArray(val) && val.length === 4,
   * description: 'an array of 4 items',
   * defaultValue: [1, 2, 3, 4]
   * })
   *
   * // You can do:
   * v.test('arg', val => Array.isArray(val), 'an array of 4 items', [1, 2, 3, 4])
   */
  Arify.prototype.test = function test (name, testFn, description, defaultValue) {
    return this.add(name, {
      test: testFn,
      description: description,
      defaultValue: defaultValue
    })
  };

  /**
   * Alternate syntax / shorthand for `v.add` with the
   * `cls` property. Use to require a parameter to be an
   * instance of the specified class.
   *
   * @param {string} name
   * @param {Function} cls
   * @param {string} description
   * @param {*} [defaultValue]
   *
   * @example
   *
   * class Person {}
   *
   * // Instead of:
   * v.add('arg', {
   * cls: Person,
   * description: 'a person instance',
   * defaultValue: new Person()
   * })
   *
   * // You can do:
   * v.cls('arg', Person, 'a person instance', new Person())
   */
  Arify.prototype.cls = function cls (name, cls, description, defaultValue) {
    return this.add(name, {
      cls: cls,
      description: description,
      defaultValue: defaultValue
    })
  };

  /**
   * Add an object-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {Object} [defaultValue]
   *
   * @example
   *
   * v.object('options', { overwrite: false })
   *
   * // shorthand alias
   * v.obj('options', { overwrite: false })
   */
  Arify.prototype.object = function object (name, defaultValue) {
    return this.add(name, {
      test: util.isObject,
      description: 'an object',
      defaultValue: defaultValue
    })
  };

  /**
   * Add an array-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {Array} [defaultValue]
   *
   * @example
   *
   * v.array('words', ['hello', 'world'])
   *
   * // shorthand alias
   * v.arr('words', ['hello', 'world'])
   */
  Arify.prototype.array = function array (name, defaultValue) {
    return this.add(name, {
      test: Array.isArray,
      description: 'an array',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a function-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {Function} [defaultValue]
   *
   * @example
   *
   * v.function('log', console.log.bind(console))
   *
   * // shorthand alias
   * v.fun('log', console.log.bind(console))
   * v.fn('log', console.log.bind(console))
   */
  Arify.prototype.function = function function$1 (name, defaultValue) {
    return this.add(name, {
      type: 'function',
      description: 'a function',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a string-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {string} [defaultValue]
   *
   * @example
   *
   * v.string('words', 'hello world')
   *
   * // shorthand alias
   * v.str('words', 'hello world')
   */
  Arify.prototype.string = function string (name, defaultValue) {
    return this.add(name, {
      type: 'string',
      description: 'a string',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a number-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {number} [defaultValue]
   *
   * @example
   *
   * v.number('age', 18)
   *
   * // shorthand alias
   * v.num('age', 18)
   */
  Arify.prototype.number = function number (name, defaultValue) {
    return this.add(name, {
      type: 'number',
      description: 'a number',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a boolean-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {boolean} [defaultValue]
   *
   * @example
   *
   * v.boolean('gotMoney', true)
   *
   * // shorthand alias
   * v.bln('gotMoney', true)
   */
  Arify.prototype.boolean = function boolean (name, defaultValue) {
    return this.add(name, {
      type: 'boolean',
      description: 'a boolean',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a RegExp-typed parameter to the arified function.
   *
   * Don't confuse this with `v.match`, which requires input
   * values to pass `RegExp#test` in order to be valid. Instead,
   * this is an actual argument of the type `RegExp`.
   *
   * @param {string} name
   * @param {RegExp} [defaultValue]
   *
   * @example
   *
   * v.regExp('matcher', /^a/)
   *
   * // shorthand alias
   * v.reg('matcher', /^a/)
   */
  Arify.prototype.regExp = function regExp (name, defaultValue) {
    return this.add(name, {
      test: util.isRegExp,
      description: 'a regular expression',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a date-typed parameter to the arified function.
   *
   * @param {string} name
   * @param {Date} [defaultValue]
   *
   * @example
   *
   * v.date('neverForget', new Date(1996, 9, 13))
   */
  Arify.prototype.date = function date (name, defaultValue) {
    return this.add(name, {
      cls: Date,
      description: 'a date',
      defaultValue: defaultValue
    })
  };

  /**
   * Add a RegExp restriction on a parameter.
   *
   * Don't confuse this with `v.regExp`, which adds an
   * actual parameter of the type `RegExp` to the arified
   * function. Instead, this method requires input values
   * to pass `RegExp#test` in order to be considered valid.
   *
   * @param {string} name
   * @param {RegExp} regExp
   * @param {string} description
   * @param {string} defaultValue
   *
   * @example
   *
   * v.match('identifier', /^a/, 'a string starting with a', 'a balloon')
   */
  Arify.prototype.match = function match (name, regExp, description, defaultValue) {
    return this.add(name, {
      test: function (value) { return regExp.test(value); },
      description: description,
      defaultValue: defaultValue
    })
  };

  /**
   * @param {Object} descriptor
   * @param {Function} descriptor.defaultGenerator
   * @param {*} descriptor.defaultValue
   * @returns {*}
   * @private
   */
  Arify.getDefaultValue = function getDefaultValue (descriptor) {
    if (util.isFunction(descriptor.defaultGenerator)) {
      return descriptor.defaultGenerator()
    } else {
      return descriptor.defaultValue
    }
  };

  Arify.checkArg = function checkArg (name, descriptor, value) {
    if (descriptor.any) return true

    if ('type' in descriptor) {
      return (value !== null && typeof value === descriptor.type)
    }

    if ('cls' in descriptor) {
      return (value instanceof descriptor.cls)
    }

    if ('test' in descriptor) {
      return (descriptor.test(value))
    }

    var str = "Invalid descriptor '{0}'. "
    str += "Must contain a type, cls, or test property for matching arguments."

    var msg = util.format(str, name)
    arify.error(msg)

    return false
  };

  var methods = [
    { alias: 'fn', original: 'function' },
    { alias: 'fun', original: 'function' },
    { alias: 'arr', original: 'array' },
    { alias: 'obj', original: 'object' },
    { alias: 'str', original: 'string' },
    { alias: 'num', original: 'number' },
    { alias: 'reg', original: 'regExp' },
    { alias: 'bln', original: 'boolean' }
  ]

  methods.forEach(function (method) {
    Arify.prototype[method.alias] = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return this[method.original].bind(this).apply(void 0, args)
    }
  })

  return arify;

}));