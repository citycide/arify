module.exports = [
  {
    type: 'str',
    typeName: 'string',
    defaultValue: 'hello',
    desc: 'should add a string parameter to the arified function',
    wDef: 'should add a string parameter with a default value'
  },
  {
    type: 'num',
    typeName: 'number',
    defaultValue: 1,
    desc: 'should add a number parameter to the arified function',
    wDef: 'should add a number parameter with a default value'
  },
  {
    type: 'obj',
    typeName: 'object',
    defaultValue: {},
    desc: 'should add an Object parameter to the arified function',
    wDef: 'should add an Object parameter with a default value'
  },
  {
    type: 'arr',
    typeName: 'array',
    defaultValue: [],
    desc: 'should add an Array parameter to the arified function',
    wDef: 'should add an Array parameter with a default value'
  },
  {
    type: 'bln',
    typeName: 'boolean',
    defaultValue: true,
    desc: 'should add a boolean parameter to the arified function',
    wDef: 'should add a boolean parameter with a default value'
  },
  {
    type: 'reg',
    typeName: 'RegExp',
    defaultValue: /^a/,
    desc: 'should add a RegExp parameter to the arified function',
    wDef: 'should add a RegExp parameter with a default value'
  },
  {
    type: 'fun',
    typeName: 'Function',
    defaultValue: () => {},
    desc: 'should add a Function parameter to the arified function',
    wDef: 'should add a Function parameter with a default value'
  },
  {
    type: 'date',
    typeName: 'Date',
    defaultValue: new Date(1996, 9, 13),
    desc: 'should add a Date parameter to the arified function',
    wDef: 'should add a Date parameter with a default value'
  }
]
