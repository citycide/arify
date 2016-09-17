import arify from '../dist/arify'

import test from 'ava'
import data from './fixtures/data'

data.forEach(scenario => {
  test(scenario.desc, t => {
    ;(arify(v => {
      v[scenario.type]('one')
      v.form('one')
    }, args => {
      t.is(args.one, scenario.defaultValue)
    }))(scenario.defaultValue)
  })

  test(scenario.wDef, t => {
    ;(arify(v => {
      v[scenario.type]('one', scenario.defaultValue)
      v.form('?one')
    }, args => {
      t.is(args.one, scenario.defaultValue)
    }))()
  })
})

test('should allow multiple forms by using the optional modifier', t => {
  const arified = arify(v => {
    v.str('one').num('two').obj('three')
    v.form('one', '?two', '?three')
  }, args => {})

  t.notThrows(() => {
    arified('this is a string')
    arified('hi', 2)
    arified('hi', {})
  })
})

test('should not allow a lone parameter with the noLone modifier', t => {
  const arified = arify(v => {
    v.str('one').num('two').form('*one', '?two')
  }, args => {})

  t.throws(() => {
    arified('stringing it like a boss')
  })
})

test('should throw when there is no matching form', t => {
  const arified = arify(v => {
    v.str('one').num('two').form('*one', '?two')
  }, args => {})

  t.throws(() => {
    arified({})
  })
})
