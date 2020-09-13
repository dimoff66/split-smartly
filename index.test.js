import splitSmartly, { INCLUDE_NEEDLE_SEPARATELY } from './index'

const numbersText = `1, 2 (3, 4), "5,6"`
const queryText = 'select love, joy from life where nobody and nothing'

const queryNeedles = ['WHERE ', 'SELECT ', 'FROM ']

const splitQuery = splitSmartly(queryNeedles, { brackets: true })

test('test add needles modes', () => {

  // MODE NONE
  let res = splitSmartly(numbersText, ',', { brackets: true })
  expect(res).toEqual(['1', '2 (3, 4)', '"5,6"'])

  // MODE SEPARATELY
  res = splitQuery(queryText, { includeNeedleMode: 'SEPARATELY' })
  expect(res).toEqual(['', 'SELECT ', 'love, joy', 'FROM ', 'life', 'WHERE ', 'nobody and nothing'])

  // MODE LEFT
  res = splitQuery(queryText, { includeNeedleMode: 'LEFT' })
  expect(res).toEqual([['', 'SELECT '], ['love, joy', 'FROM '], ['life', 'WHERE '], ['nobody and nothing', '']])

  // MODE RIGHT
  res = splitQuery(queryText, { includeNeedleMode: 'RIGHT' })
  expect(res).toEqual([['SELECT ', 'love, joy'], ['FROM ', 'life'], ['WHERE ', 'nobody and nothing']])
})

test('test call with indexes', () => {
  let res = splitQuery.getIterator(queryText, { includeNeedleMode: INCLUDE_NEEDLE_SEPARATELY })
  
  expect(res.getNext()).toBe('')
  expect(res.getNext()).toBe('SELECT ')
  expect(res.getNext()).toBe('love, joy')

  res = splitQuery.getOne(queryText, 2)
  expect(res).toBe('life')

  res = splitQuery.getIndexes(queryText, [1, 3])
  expect(res).toEqual(['love, joy', 'nobody and nothing'])
})

test('test different settings props', () => {
  let res = splitQuery(queryText, { 
    includeNeedleMode: INCLUDE_NEEDLE_SEPARATELY ,
    trimNeedles: true,
    trimResult: false,
    indexes: [1, 2]
  })
  expect(res).toEqual(['SELECT', ' love, joy '])

  // test mentions
  res = splitSmartly
    (queryNeedles, { brackets: true, mentions: ['LOVE']}).getIndexes (queryText, [1, 2])
  expect(res).toEqual([ { mentions: ["LOVE"], text: "love, joy" }, { text: 'life' } ])

  res = splitSmartly('8 - 10 * -problems', '-', { 
    check: ({ string, needle }) => needle !== '-' || !string.endsWith('*') 
  })
  expect(res).toEqual(['8', '10 * -problems'])

  res = splitSmartly('life is long AND love BETWEEN pleasure AND pain', 'AND', { 
    mentions: ' BETWEEN ',
    check: ({ mentions, needle }) => !needle || !mentions
  })
  expect(res).toEqual([{ text: 'life is long'}, { text: 'love BETWEEN pleasure AND pain', mentions: [' BETWEEN ']}])
})

// const logIt = fn => {
//   const exprText = fn.toString().split('\n').slice(1, -1).join('\n').substring(9).replace('Smart', 'Smartly')
//   const res = JSON.stringify(fn()).replace(/\\"/g, '@').replace(/"/g, '\'').replace(/@/g, '"')
//   console.log('res = ' + exprText + '\n// res: ' + res)
// }

// const splitSmart = splitSmartly
// logIt(() => splitSmart('one / two / "three / four" / five / six', '/'))
// logIt(() => splitSmart('(one / two) / "three / four" / five / six', '/', { brackets: true }))
// logIt(() => splitSmart('(one / two) / "three / four" / <<five / six>>', '/', { brackets: [['(', ')'], ['<<', '>>']] }))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM ']))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM '], { includeNeedleMode: 'SEPARATELY' }))
// logIt(() => splitSmart('SELECT best FROM life', ['SELECT ', 'FROM '], { includeNeedleMode: 'RIGHT' }))
// logIt(() => splitSmart('select best from life', ['SELECT ', 'FROM '], { includeNeedleMode: 'RIGHT' }))
// logIt(() => splitSmart('life is long AND love BETWEEN pleasure AND pain', 'AND', { 
//   check: ({ string, needle }) => !needle || !string.toUpperCase().includes(' BETWEEN ')
// }))
// logIt(() => splitSmart('Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 'AND', { 
//   mentions: ['STEVE', 'PETER']
// }))
// logIt(() => splitSmart('One | Two | Three | Four', '|', { indexes: [1, 3] }))
