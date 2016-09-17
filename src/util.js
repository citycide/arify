export default {
  isFunction: value => typeof value === 'function',
  isObject: value => {
    return value &&
      typeof value === 'object' &&
      typeof value !== 'function' &&
      !Array.isArray(value)
  },
  isRegExp: value => value instanceof RegExp,
  isDefined: value => typeof value !== 'undefined',
  format: (str, ...args) => {
    if (args.length) {
      return str.replace(/\{(\d+)\}/g, (match, index) => args[index])
    }

    return str
  }
}
