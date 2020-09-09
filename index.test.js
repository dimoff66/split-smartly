import splitSmartly, { INCLUDE_NEEDLE_SEPARATELY } from './index'

const numbersText = `1, 2 (3, 4), "5,6"`
const queryText = 'select love, joy from life where nobody and nothing'

const queryNeedles = ['WHERE ', 'SELECT ', 'FROM ']

const blocks = [['(', ')']]
const splitQuery = splitSmartly(queryNeedles, { blocks })

test('test add needles modes', () => {

  // MODE NONE
  let res = splitSmartly(numbersText, ',', { blocks })
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
  let res = splitQuery(queryText, [], { 
    includeNeedleMode: INCLUDE_NEEDLE_SEPARATELY, 
    trimNeedles: true, 
    trimResult: false 
  })
  expect(res.getNext()).toBe('')
  expect(res.getNext()).toBe('SELECT')
  expect(res.getNext()).toBe(' love, joy ')

  res = splitQuery(queryText, 2)
  expect(res).toBe('life')

  res = splitQuery(queryText, [1, 3]).getAll()
  expect(res).toEqual(['love, joy', 'nobody and nothing'])
})

test('test different settings props', () => {
  let res = splitSmartly(queryNeedles, { blocks, mentions: ['LOVE']})(queryText, [1, 2]).getAll()
  expect(res).toEqual([ { mentions: ["LOVE"], text: "love, joy" }, { text: 'life' } ])
})