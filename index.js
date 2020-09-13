
const prepareSearch = (needles, settings) => {
  const defaultSettings = {
    brackets: [],
    mentions: [],
    ignoreInsideQuotes: true, 
    includeNeedleMode: 'NONE', 
    ignoreCase: true, 
    trimResult: true, 
    trimNeedles: false,
    check: undefined,
    defaultBrackets: [['(', ')'], ['[', ']'], ['{', '}']]
  } 

  const splitSettings = {
    ...defaultSettings, 
    ...settings,

    needles,

    init () {
      if (Array.isArray(this.mentions) || typeof this.mentions === 'string') {
        const mentions = [this.mentions].flat().filter(Boolean)
        this.mentions = mentions.length > 0 && new Set(mentions)
      }
        
      return this
        .createBracketsMap()
        .createBracketsSearch()
        .createneedlesSearch()
    },

    merge (settings) {
      if (!settings) return this 

      settings = {...this, ...settings }
      if (['brackets', 'mentions'].some(prop => prop in settings)) {
        settings.init()
      }

      return settings
    },

    arrayToPattern (arr) {
      prepareSearch.screenedSymbols = 
        prepareSearch.screenedSymbols || 
        new Set('.{}[]^()+*?\\/$|'.split(''))

      const { screenedSymbols } = prepareSearch
      return arr
        .map(string => 
          string.split('').map(s => screenedSymbols.has(s) ? '\\' + s : s).join('')
        )
        .join('|')
    },

    createRegExp (pattern) {
      return RegExp(pattern, 'g')
    },

    createBracketsMap () {
      let { brackets = [], ignoreInsideQuotes } = this 
      if (brackets === true) {
        brackets = this.defaultBrackets
      }
      if (ignoreInsideQuotes) {
        brackets.push([`'`, null, true], [`"`, null, true])
      }

      this.bracketsMap = brackets.reduce((map, [open, close, ignoreMode])=> {
        map[open] = { open, ignoreMode, close: close || open }
        return map
      }, {}) 

      return this
    },

    createBracketsSearch () {
      const patternParts = Object.entries(this.bracketsMap)
        .flatMap(([, { close, open }]) => close !== open ? [open, close] : open)
        .concat(this.mentions ? [...this.mentions] : [])
        .filter(Boolean)

      const pattern = this.arrayToPattern(patternParts)
      this.bracketsSearch = this.createRegExp(pattern)

      return this
    },

    createneedlesSearch () {
      const { needles } = this

      if (typeof needles === 'string' || Array.isArray(needles)) {
        const pattern = this.arrayToPattern([needles].flat().filter(Boolean))
        this.needlesSearch = this.createRegExp(pattern)
      } else {
        this.needlesSearch = needles
      }

      return this
    }
  }

  return splitSettings.init()
}  

const getSplitSmartlyArgs = (args, extraSettings) => {
  if (args.length === 2) {
    if (typeof args[1] === 'string' || Array.isArray(args[1])) 
      args.push({})
    else 
      args.unshift(null)
  }

  else if (args.length < 2) 
    throw new Error('Not enough arguments passed to splitSmartly function!!!')

  else if (args.length > 3) 
    throw new Error('Too much arguments passed to splitSmartly function!!!')

  if (extraSettings) args[2] = {...args[2], extraSettings}

  return args
}

const splitSmartly = (...args) => {
  let [string, needles, settings] = getSplitSmartlyArgs(args)

  const splitSettings = prepareSearch(needles, settings)

  const splitFn = split.bind(splitSettings)
  splitFn.getOne = (string, index, settings = {}) => {
    if (isNaN(index)) 
      throw new Error ('second parameter of `getOne` function should be index')
    
    return splitFn(string, { ...settings, indexes: index })
  }
  
  splitFn.getFirst = (string, settings = {}) => {
    return splitFn(string, { ...settings, indexes: 0 })
  }

  splitFn.getIndexes = (string, indexes, settings = {}) => {
    if (!Array.isArray(indexes)) 
      throw new Error ('second parameter of `getOne` function should be array of indexes')
    
    return splitFn(string, { ...settings, indexes })
  }

  splitFn.getIterator = (string, settings = {}) => {
    return splitFn(string, { ...settings, returnIterator: true })
  }

  return string !== null ? splitFn(string) : splitFn
}

function split (string, settings) {
  const splitSettings = this.merge(settings)
  let res = new SearchResults(string, splitSettings)
  
  if (typeof splitSettings.indexes === 'number') 
    res = res.getNext()

  else if (!splitSettings.returnIterator) 
    res = res.getAll()

  return res
} 



class SearchResults {
  constructor (string, searchSettings) {
    Object.assign(this, { string, searchSettings })
    this.prepareSearch()
  }

  prepareSearch () {
    const { needlesSearch, bracketsSearch, indexes } = this.searchSettings
    const indexesArr = [indexes].flat().filter(Boolean)
    
    Array.from([needlesSearch, bracketsSearch]).forEach(search => { search.lastIndex = 0 })

    Object.assign(this, { 
      brackets: [],
      pipe: [],
      currentMentions: [],
      position: 0,
      isDone: false,
      freeArea: { start: 0, end: undefined },
      lastNeedle: undefined,
      searchString: this.searchSettings.ignoreCase 
        ? this.string.toUpperCase()
        : string,

      indexes: indexesArr.length && {
        values: new Set(indexesArr),
        max: Math.max(...indexesArr), 
        count: 0,
  
        hasIndex () { 
          return this.max === -Infinity || this.values.has(this.count++) 
        },
  
        isOverMax () { 
          return this.max !== -Infinity && this.count > this.max 
        }
      }
    })  
  }

  get pipeIsEmpty () {
    return this.pipe.length === 0
  }

  getMentions (indexFrom, indexTo) {
    const properMentions = [], restMentions = []

    for (const item of this.currentMentions) {
      if (item.index >= indexFrom && item.index < indexTo) 
        properMentions.push(item.mention)
      else 
        restMentions.push(item)
    }
   
    return [properMentions.length && properMentions, restMentions]
  }

  trimResultText (text) {
    return this.searchSettings.trimResult ? text.trim() : text
  }

  trimNeedleText (text) {
    return this.searchSettings.trimNeedles ? text.trim() : text
  }

  checkNeedle (pNeedle) {
    const { string } = this
    const { check, includePositions, mentions } = this.searchSettings

    let [needleText, needlePos] = 
      pNeedle 
        ? [pNeedle[0], pNeedle.index] 
        : ['', string.length]

    let text = string.substring(this.position, needlePos)

    if (!needleText) this.isDone = true

    text = this.trimResultText(text)
    needleText = this.trimNeedleText(needleText)

    let needle = needleText
    if (includePositions) {
      text    = { text, position: this.position }
      needle  = { text: needle, position: needlePos, isNeedle: true }
    }

    let restMentions
    if (mentions) {
      text = typeof text === 'string' ? { text } : text 
      const [properMentions, restItems] = this.getMentions(this.position, needlePos)

      if (properMentions) {
        text.mentions = properMentions 
        restMentions = restItems
      }
    }

    if (check) {
      const position = isNaN(this.tempPosition) ? this.position : this.tempPosition 
      this.tempPosition = needlePos + needleText.length

      const textBefore = this.trimResultText(string.substring(position, needlePos))
      const textAfter = string.substring(needlePos + needleText.length)

      const mentions = this.getMentions(position, needlePos)[0]

      if (!check({ string: textBefore, needle, textAfter, mentions })) return []
      delete this.tempPosition
    } 

    if (restMentions) this.currentMentions = restMentions

    this.position = needlePos + needle.length
    return [text, needle, true]
  }

  pushToPipe (value) {
    if (this.indexes) {
      if (!this.indexes.hasIndex()) 
        return
      
      if (this.indexes.isOverMax()) 
        this.isDone = true
    }

    this.pipe.push(value)
  }

  addToPipe (pNeedle) {
    const { position } = this

    let [text, needle, checked] = this.checkNeedle(pNeedle)
    if (!checked) return false

    switch (this.searchSettings.includeNeedleMode) { 
      case INCLUDE_NEEDLE_SEPARATELY:
        this.pushToPipe(text)
        if (needle) 
          this.pushToPipe(needle)
        break 

      case INCLUDE_NEEDLE_LEFT:
        this.pushToPipe([text, needle])
        break 

      case INCLUDE_NEEDLE_RIGHT:
        const textIsEmpty = !(typeof text === 'object' ? text.text : text)
        if (!textIsEmpty || this.lastNeedle)
          this.pushToPipe([ this.lastNeedle, text ])
        this.lastNeedle = needle
        break
        
      default:
        this.pushToPipe(text)
    }

    return !this.pipeIsEmpty
  }

  findFreeArea () {
    const { searchString: string, brackets, freeArea, searchSettings } = this
    const { bracketsSearch, needlesSearch } = searchSettings 

    while (!freeArea.end) {
      const match = bracketsSearch.exec(string)
      if (!match) {
        if (isNaN(freeArea.start)) return false

        freeArea.end = string.length - 1
        continue
      }
      
      const fragment = match[0]
      const { close, ignoreMode } = brackets[brackets.length - 1] || {}

      let block
      const ACTION_CLOSE = 1, ACTION_OPEN = 2, ACTION_ADD_FRAGMENT = 3

      const action = function getAction() {
        if (fragment === close) 
          return ACTION_CLOSE

        if (ignoreMode) return 

        block = searchSettings.bracketsMap[fragment]
        if (block) 
          return ACTION_OPEN

        if (searchSettings.mentions && searchSettings.mentions.has(fragment)) 
          return ACTION_ADD_FRAGMENT
      } ()

      switch (action) {
        case ACTION_CLOSE:
          if (--brackets.length === 0) {
            freeArea.start = bracketsSearch.lastIndex
            if (needlesSearch && needlesSearch.lastIndex < freeArea.start) 
              needlesSearch.lastIndex = freeArea.start
          }  
          break 

        case ACTION_OPEN:
          brackets.push(block)
          if (brackets.length === 1) 
            freeArea.end = match.index
          break 

        case ACTION_ADD_FRAGMENT:
          this.currentMentions.push({ mention: fragment, index: match.index })
          break    
      }  
    }

    return true
  }

  findNeedle (needle) {
    const { searchString: string, freeArea } = this
    const { needlesSearch } = this.searchSettings
    
    let stopSearching
    while (!stopSearching) {
      needle = needle || needlesSearch.exec(string)
      if (!needle) {
        this.addToPipe()
      }

      else if (needle.index <= freeArea.end) {  
        const isAdded = 
          needle.index >= freeArea.start && 
          this.addToPipe(needle)

        needle = null
        
        if (!isAdded) continue
      } 
      
      else {
        freeArea.start = freeArea.end = undefined
      }

      stopSearching = true
    } 

    return needle
  }

  getNext () {
    let needle
    while (this.pipeIsEmpty && !this.isDone) {
      if (!this.findFreeArea()) 
        this.isDone = true
      else 
        needle = this.findNeedle(needle)  
    }  
    return this.pipeIsEmpty ? null : this.pipe.shift()
  }

  getAll () { return [...this] }

  getRest () {
    const res = []
    let value
    while (null !== (value = this.getNext())) 
      res.push(value)
    return res
  }  

  [Symbol.iterator] () {
    this.prepareSearch()
    const object = this

    return {
      object,

      next () {
        const value = object.getNext()
        if (value === null) return { done: true }

        return { value, done: false }
      }  
    }
  }
}

export const INCLUDE_NEEDLE_NONE = 'NONE' 
export const INCLUDE_NEEDLE_SEPARATELY = 'SEPARATELY'
export const INCLUDE_NEEDLE_LEFT = 'LEFT'
export const INCLUDE_NEEDLE_RIGHT = 'RIGHT'

export default splitSmartly