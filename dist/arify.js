(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('babel-runtime/helpers/typeof'), require('babel-runtime/core-js/object/assign'), require('babel-runtime/helpers/classCallCheck'), require('babel-runtime/helpers/createClass'), require('babel-runtime/core-js/symbol')) :
  typeof define === 'function' && define.amd ? define(['babel-runtime/helpers/typeof', 'babel-runtime/core-js/object/assign', 'babel-runtime/helpers/classCallCheck', 'babel-runtime/helpers/createClass', 'babel-runtime/core-js/symbol'], factory) :
  (global.arify = factory(global._typeof,global._Object$assign,global._classCallCheck,global._createClass,global._Symbol));
}(this, function (_typeof,_Object$assign,_classCallCheck,_createClass,_Symbol) { 'use strict';

  _typeof = 'default' in _typeof ? _typeof['default'] : _typeof;
  _Object$assign = 'default' in _Object$assign ? _Object$assign['default'] : _Object$assign;
  _classCallCheck = 'default' in _classCallCheck ? _classCallCheck['default'] : _classCallCheck;
  _createClass = 'default' in _createClass ? _createClass['default'] : _createClass;
  _Symbol = 'default' in _Symbol ? _Symbol['default'] : _Symbol;

  var util = {
    isFunction: function isFunction(value) {
      return typeof value === 'function';
    },
    isObject: function isObject(value) {
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && typeof value !== 'function' && !Array.isArray(value);
    },
    isRegExp: function isRegExp(value) {
      return value instanceof RegExp;
    },
    isDefined: function isDefined(value) {
      return typeof value !== 'undefined';
    },
    format: function format(str) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (args.length) {
        return str.replace(/\{(\d+)\}/g, function (match, index) {
          return args[index];
        });
      }

      return str;
    }
  };

  function arify(setup, fn, context) {
    var instance = new Arify();
    setup(instance);

    instance.validate();

    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return instance.process(args, fn, context || this);
    };
  }

  arify.error = function (msg) {
    var e = new Error(msg);
    e.name = 'ArifyError';
    throw e;
  };

  var exactMatch = _Symbol();

  var Arify = function () {
    function Arify() {
      _classCallCheck(this, Arify);

      _Object$assign(this, {
        _parameterNames: [],
        _descriptors: {},
        _forms: [],
        _formMap: {},
        _flags: [{ name: 'optional', symbol: '?' }, { name: 'noLone', symbol: '*' }]
      });

      var flagsList = this._flags.map(function (flag) {
        return '\\' + flag.symbol;
      }).join('');
      this._flagsRegex = new RegExp('^([' + flagsList + ']+)');
      this._flagsMap = {};

      var length = this._flags.length;
      for (var i = 0; i < length; i++) {
        var flag = this._flags[i];
        this._flagsMap[flag.symbol] = flag.name;
      }
    }

    _createClass(Arify, [{
      key: 'validate',
      value: function validate() {}
    }, {
      key: 'getFlags',
      value: function getFlags(name) {
        var flagsObject = {};
        var match = name.match(this._flagsRegex);

        if (!match) return flagsObject;

        var flagsList = match[0].split('');
        var length = flagsList.length;

        for (var i = 0; i < length; i++) {
          var key = this._flagsMap[flagsList[i]];
          flagsObject[key] = true;
        }

        return flagsObject;
      }
    }, {
      key: 'removeFlags',
      value: function removeFlags(name) {
        return name.replace(this._flagsRegex, '');
      }
    }, {
      key: 'process',
      value: function process(args, fn, context) {
        var form = this.getBestMatch(args);

        if (!form) {
          arify.error(util.format('Arguments \'{0}\' do not match any specified form', args.join(', ')));

          return;
        }

        var result = this.processArguments(form, args);
        var names = form.names || [];

        return fn.call(context, result.opt, result.rest, names, args);
      }
    }, {
      key: 'getBestMatch',
      value: function getBestMatch(args) {
        var forms = this._forms;
        var bestMatch = void 0;
        var bestRating = void 0;

        var length = forms.length;
        for (var i = 0; i < length; i++) {
          var form = forms[i];

          if (form.nonEmpty) {
            if (!args.length) return false;
            continue;
          }

          var a = this.rateForm(form, args);
          if (a === exactMatch) return form;

          var b = bestMatch ? bestRating : -1;

          if (a !== -1 && a > b) {
            bestMatch = form;
            bestRating = a;
          }
        }

        return bestMatch;
      }
    }, {
      key: 'rateForm',
      value: function rateForm(form, args) {
        if (!args.length) {
          if (form.empty) return exactMatch;
          return -1;
        }

        if (form.empty) return -1;
        if (form.any) return 0;
        var names = form.names;

        var rating = -1;
        for (var i = 0; i < names.length; i++) {
          var arg = args[i];
          var name = names[i];
          var desc = this._descriptors[name];

          if (!desc) {
            arify.error(util.format('Unknown parameter: {0}', name));
            return -1;
          }

          if (!Arify.checkArg(name, desc, arg)) {
            return -1;
          } else if (!desc.any) {
            rating += 1;
          }
        }

        return rating;
      }
    }, {
      key: 'processArguments',
      value: function processArguments(form, args) {
        var names = form.names || [];
        var result = { opt: {}, rest: args.slice(names.length) };

        for (var prop in this._descriptors) {
          if (!this._descriptors.hasOwnProperty(prop)) continue;
          var defaultValue = Arify.getDefaultValue(this._descriptors[prop]);
          if (util.isDefined(defaultValue)) result.opt[prop] = defaultValue;
        }

        if (!form.empty) {
          for (var i = 0; i < names.length; i++) {
            result.opt[names[i]] = args[i];
          }
        }

        return result;
      }
    }, {
      key: '_removeForms',
      value: function _removeForms(testFn) {
        var forms = this._forms;

        for (var i = forms.length - 1; i >= 0; i--) {
          if (testFn(forms[i])) forms.splice(i, 1);
        }

        return this;
      }
    }, {
      key: 'forms',
      value: function forms() {
        this.form.apply(this, this._parameterNames.map(function (name) {
          return '?' + name;
        }));
      }
    }, {
      key: 'form',
      value: function form() {
        for (var _len2 = arguments.length, names = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          names[_key2] = arguments[_key2];
        }

        var mapKey = names.join(',');
        var length = names.length;

        var i = void 0;
        var noLoneCount = 0;

        if (this._formMap.hasOwnProperty(mapKey)) return this;
        if (!names.length) return this.empty();

        for (i = 0; i < length; i++) {
          if (this.getFlags(names[i]).noLone) {
            noLoneCount += 1;
          }
        }

        if (noLoneCount === length) return this;

        this._formMap[mapKey] = true;

        this._forms.push({
          positional: true,
          names: names.map(this.removeFlags, this)
        });

        for (i = length - 1; i >= 0; i--) {
          if (this.getFlags(names[i]).optional) {
            this.form.apply(this, names.slice(0, i).concat(names.slice(i + 1)));
          }
        }

        return this;
      }
    }, {
      key: 'empty',
      value: function empty() {
        var mapKey = '*empty';

        if (this._formMap.hasOwnProperty(mapKey)) return this;

        this._removeForms(function (form) {
          return form.nonEmpty || form.empty;
        });
        this._forms.push({ empty: true });
        this._formMap[mapKey] = true;

        return this;
      }
    }, {
      key: 'nonEmpty',
      value: function nonEmpty() {
        var mapKey = '*nonEmpty';

        if (this._formMap.hasOwnProperty(mapKey)) return this;

        this._removeForms(function (form) {
          return form.empty;
        });
        this._forms.push({ nonEmpty: true });
        this._formMap[mapKey] = true;

        return this;
      }
    }, {
      key: 'anyForm',
      value: function anyForm() {
        this._forms.push({ any: true });
        return this;
      }
    }, {
      key: 'add',
      value: function add(name, descriptor) {
        this._descriptors[name] = descriptor;
        this._parameterNames.push(name);
        return this;
      }
    }, {
      key: 'any',
      value: function any(name, defaultValue) {
        return this.add(name, {
          any: true,
          description: 'any value',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'type',
      value: function type(name, _type, description, defaultValue) {
        return this.add(name, {
          type: _type,
          description: description,
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'test',
      value: function test(name, testFn, description, defaultValue) {
        return this.add(name, {
          test: testFn,
          description: description,
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'cls',
      value: function cls(name, _cls, description, defaultValue) {
        return this.add(name, {
          cls: _cls,
          description: description,
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'object',
      value: function object(name, defaultValue) {
        return this.add(name, {
          test: util.isObject,
          description: 'an object',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'array',
      value: function array(name, defaultValue) {
        return this.add(name, {
          test: Array.isArray,
          description: 'an array',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'function',
      value: function _function(name, defaultValue) {
        return this.add(name, {
          type: 'function',
          description: 'a function',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'string',
      value: function string(name, defaultValue) {
        return this.add(name, {
          type: 'string',
          description: 'a string',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'number',
      value: function number(name, defaultValue) {
        return this.add(name, {
          type: 'number',
          description: 'a number',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'boolean',
      value: function boolean(name, defaultValue) {
        return this.add(name, {
          type: 'boolean',
          description: 'a boolean',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'regExp',
      value: function regExp(name, defaultValue) {
        return this.add(name, {
          test: util.isRegExp,
          description: 'a regular expression',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'date',
      value: function date(name, defaultValue) {
        return this.add(name, {
          cls: Date,
          description: 'a date',
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'match',
      value: function match(name, regExp, description, defaultValue) {
        return this.add(name, {
          test: function test(value) {
            return regExp.test(value);
          },
          description: description,
          defaultValue: defaultValue
        });
      }
    }, {
      key: 'fn',
      value: function fn() {}
    }, {
      key: 'fun',
      value: function fun() {}
    }, {
      key: 'arr',
      value: function arr() {}
    }, {
      key: 'obj',
      value: function obj() {}
    }, {
      key: 'str',
      value: function str() {}
    }, {
      key: 'num',
      value: function num() {}
    }, {
      key: 'reg',
      value: function reg() {}
    }, {
      key: 'bln',
      value: function bln() {}
    }], [{
      key: 'getDefaultValue',
      value: function getDefaultValue(descriptor) {
        if (util.isFunction(descriptor.defaultGenerator)) {
          return descriptor.defaultGenerator();
        } else {
          return descriptor.defaultValue;
        }
      }
    }, {
      key: 'checkArg',
      value: function checkArg(name, descriptor, value) {
        if (descriptor.any) return true;

        if ('type' in descriptor) {
          return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === descriptor.type;
        }

        if ('cls' in descriptor) {
          return value instanceof descriptor.cls;
        }

        if ('test' in descriptor) {
          return descriptor.test(value);
        }

        var str = 'Invalid descriptor \'{0}\'. ';
        str += 'Must contain a type, cls, or test property for matching arguments.';

        var msg = util.format(str, name);
        arify.error(msg);

        return false;
      }
    }]);

    return Arify;
  }();

  var methods = [{ alias: 'fn', original: 'function' }, { alias: 'fun', original: 'function' }, { alias: 'arr', original: 'array' }, { alias: 'obj', original: 'object' }, { alias: 'str', original: 'string' }, { alias: 'num', original: 'number' }, { alias: 'reg', original: 'regExp' }, { alias: 'bln', original: 'boolean' }];

  methods.forEach(function (method) {
    Arify.prototype[method.alias] = function () {
      return this[method.original].bind(this).apply(undefined, arguments);
    };
  });

  return arify;

}));