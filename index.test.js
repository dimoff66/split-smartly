import splitSmartly from './index'

test('simple', () => {
  let string = `love, life (leafes, night), "pleasure,pain"`
  let blocks = [['(', ')']]

  let res = splitSmartly(string, ',', { blocks })
  expect(res).toEqual(['love', 'life (leafes, night)', '"pleasure,pain"'])

  res = splitSmartly(',', { blocks })(string, 1)
  expect(res).toBe(' life (leafes, night)')

})