import splitSmartly from './index'

const numbersText = `1, 2 (3, 4), "5,6"`
const queryText = 'select love, joy from life where nobody and nothing'

const querySeparators = ['WHERE ', 'SELECT ', 'FROM ']

const splitQuery = splitSmartly(querySeparators, { brackets: true })

test('test add needles modes', () => {
  // MODE NONE
  let res = splitSmartly(numbersText, ',', { brackets: true })
  expect(res).toEqual(['1', '2 (3, 4)', '"5,6"'])

  // MODE SEPARATELY
  res = splitQuery(queryText, { includeSeparatorMode: 'SEPARATELY' })
  expect(res).toEqual(['', 'SELECT ', 'love, joy', 'FROM ', 'life', 'WHERE ', 'nobody and nothing'])

  // MODE LEFT
  res = splitQuery(queryText, { includeSeparatorMode: 'LEFT' })
  expect(res).toEqual([['', 'SELECT '], ['love, joy', 'FROM '], ['life', 'WHERE '], ['nobody and nothing', '']])

  // MODE RIGHT
  res = splitQuery(queryText, { includeSeparatorMode: 'RIGHT' })
  expect(res).toEqual([['SELECT ', 'love, joy'], ['FROM ', 'life'], ['WHERE ', 'nobody and nothing']])

  // MODE ONLY
  res = splitSmartly(
    'sky1 bird1, (sky2, bird2)', 
    /(sky|bird)\d/gi, 
    { brackets: true, includeSeparatorMode: 'ONLY' }
  )
  expect(res).toEqual(['sky1', 'bird1'])

  // TEST REGEXP
  res = splitSmartly('p1: first p2: second p3:third', /p\d:/gi, { includeSeparatorMode: 'RIGHT' })
  expect(res).toEqual([['p1:', 'first'], ['p2:', 'second'], ['p3:', 'third']])
})

test('test call with indexes', () => {
  let res = splitQuery.getIterator(queryText, { includeSeparatorMode: 'SEPARATELY' })
  
  expect(res.getNext()).toBe('')
  expect(res.getNext()).toBe('SELECT ')
  expect(res.getNext()).toBe('love, joy')

  res = splitQuery.getOne(queryText, 2)
  expect(res).toBe('life')

  res = splitQuery.getIndexes(queryText, [1, 3])
  expect(res).toEqual(['love, joy', 'nobody and nothing'])
})

test('test settings props 1', () => {
  let res = splitQuery(queryText, { 
    includeSeparatorMode: 'SEPARATELY' ,
    trimSeparators: true,
    trimResult: false,
    indexes: [1, 2]
  })
  expect(res).toEqual(['SELECT', 'love, joy '])

  // test mentions
  res = splitSmartly
    (querySeparators, { brackets: true, mentions: ['love']}).getIndexes (queryText, [1, 2])
  expect(res).toEqual([ { mentions: ["love"], text: "love, joy" }, { text: 'life' } ])

  res = splitSmartly('8 - 10 * -problems', '-', { 
    check: info => !info.string.endsWith('*') 
  })
  expect(res).toEqual(['8', '10 * -problems'])

  res = splitSmartly('life is long AND love BETWEEN pleasure AND pain', 'AND', { 
    mentions: ' BETWEEN ',
    check: ({ mentions, separator }) => !separator || !mentions
  })
  expect(res).toEqual([{ text: 'life is long'}, { text: 'love BETWEEN pleasure AND pain', mentions: [' BETWEEN ']}])
})

test('test settings props 2', () => {
  let res = splitSmartly('function (param1, param2, param3)', null, { 
    brackets: [['(', ')']], 
    searchWithin: true,
    indexes: 0 
  })
  expect(res).toEqual('param1, param2, param3')
})

const logIt = fn => {
  const exprText = fn.toString().split('\n').slice(1, -1).join('\n').substring(9).replace('Smart', 'Smartly')
  const res = JSON.stringify(fn()).replace(/\\"/g, '@').replace(/"/g, '\'').replace(/@/g, '"')
  console.log('res = ' + exprText + '\n// res: ' + res)
}

const splitSmart = splitSmartly
// logIt(() => splitSmart('select best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT', ignoreCase: false }))
// logIt(() => splitSmart('one / two / "three / four" / five / six', '/'))
// logIt(() => splitSmart('(one / two) / "three / four" / five / six', '/', { brackets: true }))
// logIt(() => splitSmart('(one / two) / "three / four" / <<five / six>>', '/', { brackets: [['(', ')'], ['<<', '>>']] }))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM ']))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'SEPARATELY' }))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' }))
// logIt(() => splitSmart('select best from life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' }))
// logIt(() => splitSmart('life is long AND love BETWEEN pleasure AND pain', 'AND', { 
//   check: ({ string, separator }) => !separator || !string.toUpperCase().includes(' BETWEEN ')
// }))
// logIt(() => splitSmart('Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 'AND', { 
//   mentions: ['STEVE', 'PETER']
// }))
// logIt(() => splitSmart('One | Two | Three | Four', '|', { indexes: [1, 3] }))
