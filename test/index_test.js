import arify from '../dist/arify'
import tests from './tests'

import chai from 'chai'
import asPromised from 'chai-as-promised'

chai.should()
chai.use(asPromised)

let arified = null
describe('arify', () => {
  tests.forEach(test => {
    it(test.desc, () => {
      ;(arify(v => {
        v[test.type]('one')
        v.form('one')
      }, args => {
        args.one.should.equal(test.defaultValue)
      }))(test.defaultValue)
    })

    it(test.wDef, () => {
      ;(arify(v => {
        v[test.type]('one', test.defaultValue)
        v.form('?one')
      }, args => {
        args.one.should.equal(test.defaultValue)
      }))()
    })
  })

  it('should allow multiple forms by using the optional modifier', () => {
    arified = arify(v => {
      v.str('one').num('two').obj('three')
      v.form('one', '?two', '?three')
    }, args => {})

    ;(() => {
      arified('this is a string')
      arified('hi', 2)
      arified('hi', {})
    }).should.not.throw(Error)
  })

  it('should not allow a lone parameter with the noLone modifier', () => {
    arified = arify(v => {
      v.str('one').num('two').form('*one', '?two')
    }, args => {})

    ;(() => {
      arified('stringing it like a boss')
    }).should.throw(Error)
  })

  it('should throw when there is no matching form', () => {
    arified = arify(v => {
      v.str('one').num('two').form('*one', '?two')
    }, args => {})

    ;(() => {
      arified({})
    }).should.throw(Error)
  })
})
