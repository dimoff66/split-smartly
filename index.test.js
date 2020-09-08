import splitSmartly, { INCLUDE_NEEDLE_SEPARATELY } from './index'

const string1 = `one, two (two1, two2), "three,four"`
const string2 = 'SELECT life, love FROM nothing WHERE nobody and something'

const blocks = [['(', ')']]

test('test add needles modes', () => {

  // MODE NONE
  let res = splitSmartly(string1, ',', { blocks })
  expect(res).toEqual(['one', 'two (two1, two2)', '"three,four"'])

  // MODE SEPARATELY
  let needles = ['WHERE ', 'SELECT ', 'FROM ']

  let split = splitSmartly(needles, { blocks })
  res = split(string2, { includeNeedleMode: 'SEPARATELY' })
  expect(res).toEqual(['', 'SELECT ', 'life, love', 'FROM ', 'nothing', 'WHERE ', 'nobody and something'])

  // MODE LEFT
  res = split(string2, { includeNeedleMode: 'LEFT' })
  expect(res).toEqual([['', 'SELECT '], ['life, love', 'FROM '], ['nothing', 'WHERE '], ['nobody and something', '']])

  // MODE RIGHT
  res = split(string2, { includeNeedleMode: 'RIGHT' })
  expect(res).toEqual([['SELECT ', 'life, love'], ['FROM ', 'nothing'], ['WHERE ', 'nobody and something']])
})

test('test call with indexes', () => {
  let needles = ['WHERE ', 'SELECT ', 'FROM ']
  let split = splitSmartly(needles, { blocks })

  let res = split(string2, [], { 
    includeNeedleMode: INCLUDE_NEEDLE_SEPARATELY, 
    trimNeedles: true, 
    trimResult: false 
  })
  expect(res.getNext()).toBe('')
  expect(res.getNext()).toBe('SELECT')
  expect(res.getNext()).toBe(' life, love ')

  res = split(string2, 1)
  expect(res).toBe('nothing')
})