
const prepareSearch = (separators, settings) => {
  const defaultSettings = {
    brackets: [],
    mentions: [],
    ignoreInsideQuotes: true, 
    includeSeparatorMode: 'NONE', 
    ignoreCase: true, 
    trimResult: true, 
    trimSeparators: false,
    check: undefined,
    defaultBrackets: [['(', ')'], ['[', ']'], ['{', '}']]
  } 

  const splitSettings = {
    ...defaultSettings, 
    ...settings,

    separators,

    init () {
      if (Array.isArray(this.mentions) || typeof this.mentions === 'string') {
        const mentionsMap = 
          [this.mentions].flat().filter(Boolean).reduce((map, keyword) => {
            const key = this.ignoreCase ? keyword.toUpperCase() : keyword
            map[key] = keyword
            return map
          }, {})
        
        this.mentions = !isEmpty(mentionsMap) && mentionsMap
      }
        
      return this
        .createBracketsMap()
        .createBracketsSearch()
        .createSeparatorsSearch()
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
      } else if (typeof brackets === 'object' && !Array.isArray(brackets)) {
        brackets = Object.entries(brackets)
      } else if (typeof brackets === 'string') {
        brackets = brackets
          .split(',')
          .map(pairText => {
            let pair = pairText.trim().split(' ')
            if (pair.length !== 2) {
              if (first(pair).length === 2) {
                pair = first(pair).split('')
              } else {
                throw new Error(`open and close parts of brackets should be separated by space symbol`)
              }
            }
            return pair
          })
      }

      if (ignoreInsideQuotes) {
        brackets.unshift([`'`,,, true], [`"`,,, true])
      }

      this.bracketsMap = brackets.reduce((map, [open, close, ...args])=> {
        if (args.length === 1 && !this.searchWithin) {
          args.unshift(undefined) 
        }
        let [searchLevels = this.searchWithin && 1, ignoreMode] = args
        if (typeof searchLevels === 'number') {
          searchLevels = [searchLevels]
        }
        map[open] = { open, ignoreMode, searchLevels, close: close || open }
        return map
      }, {}) 

      return this
    },

    createBracketsSearch () {
      const patternParts = Object.entries(this.bracketsMap)
        .flatMap(([, { close, open }]) => close !== open ? [open, close] : open)
        .concat(Object.keys(this.mentions || {}))
        .filter(Boolean)

      const pattern = this.arrayToPattern(patternParts)
      this.bracketsSearch = this.createRegExp(pattern)

      return this
    },

    createSeparatorsSearch () {
      const { separators } = this

      if (typeof separators === 'string' || Array.isArray(separators)) {
        const pattern = this.arrayToPattern([separators].flat().filter(Boolean))
        this.separatorSearch = this.createRegExp(pattern)
      } else if (separators) {
        this.separatorSearch = separators
        this.ignoreCase = separators.ignoreCase
      } else {
        this.separatorSearch = /empty/
      }

      return this
    }
  }

  return splitSettings.init()
}  

const getSplitSmartlyArgs = (args, extraSettings) => {
  if (args.length === 3) {
    if(!extraSettings) return args
  } 
  
  else if (args.length === 1) {
    if (typeof args[0] === 'string') {
      args.push(',', {})
    } else if (typeof args[0] === 'object') {
      args.unshift(null, ',')
    }
  }

  else if (args.length === 2) {
    if (typeof args[1] === 'string' || Array.isArray(args[1])) {
      args.push({})
    } else {
      args.unshift(null)
    }  
  }

  else if (args.length > 3) {
    throw new Error('Too much arguments passed to splitSmartly function!!!')
  }

  if (extraSettings) args[2] = { ...args[2], ...extraSettings }

  return args
}

const splitSmartly = (...args) => {
  let [string, separators, settings] = getSplitSmartlyArgs(args)

  const splitSettings = prepareSearch(separators, settings)
  const splitFn = createSplitFunction(splitSettings)

  return string !== null ? splitFn(string) : splitFn
}

splitSmartly.searchWithin = (...args) => {
  if (args.length === 1) {
    if (typeof args[0] === 'string') {
      args.push(null, {})
    } else {
      args.unshift(null)
    }
  }

  if (typeof args[1] !== 'object' || !args[1].brackets) {
    args[1] = { brackets: args[1] }
  }
  
  args.splice(1, 0, null)

  args = getSplitSmartlyArgs(args, { searchWithin: true })
  return splitSmartly(...args)
}

splitSmartly.search = (...args) => {
  args = getSplitSmartlyArgs(args, { includeSeparatorMode: INCLUDE_SEPARATOR_ONLY })
  return splitSmartly(...args)
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

const createSplitFunction = (settings) => {
  const splitFn = split.bind(settings)

  return Object.assign(splitFn, {
    getOne (string, index, settings = {}) {
      if (isNaN(index)) 
        throw new Error ('second parameter of `getOne` function should be index')
      
      return splitFn(string, { ...settings, indexes: index })
    },
  
    getFirst (string, settings = {}) {
      return splitFn(string, { ...settings, indexes: 0 })
    },

    getIndexes (string, indexes, settings = {}) {
      if (!Array.isArray(indexes)) 
        throw new Error ('second parameter of `getOne` function should be array of indexes')
      
      return splitFn(string, { ...settings, indexes })
    },

    getIterator (string, settings = {}) {
      return splitFn(string, { ...settings, returnIterator: true })
    }
  })
}

class SearchResults {
  constructor (string, searchSettings) {
    Object.assign(this, { string, searchSettings })
    this.prepareSearch()
  }

  prepareSearch () {
    const { separatorSearch, bracketsSearch, indexes } = this.searchSettings
    const indexesArr = [indexes].flat().filter(Boolean)
    
    for (const regExp of [separatorSearch, bracketsSearch]) regExp.lastIndex = 0

    Object.assign(this, { 
      brackets: [],
      pipe: [],
      currentMentions: [],
      position: 0,
      isDone: false,
      freeArea: { start: 0, end: undefined },
      lastSeparator: undefined,
      searchString: (this.searchSettings.ignoreCase && 
        !this.searchSettings.separatorSearch.ignoreCase)
          ? this.string.toUpperCase()
          : this.string,

      indexes: !isEmpty(indexesArr) && {
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
    return isEmpty(this.pipe)
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

  trimSeparatorText (text) {
    return this.searchSettings.trimSeparators ? text.trim() : text
  }

  checkSeparator (pSeparator) {
    const { string } = this
    const { check, includePositions, mentions } = this.searchSettings

    let { 
      0: separatorText = '', 
      index: separatorPosition = string.length, 
      searchWithinData } = pSeparator || {}

    const separatorLength = separatorText.length

    const lastPosition = searchWithinData
      ? searchWithinData.openPosition
      : this.position

    let text = string.substring(lastPosition, separatorPosition)
    if (!separatorText) this.isDone = true

    text = this.trimResultText(text)
    separatorText = this.trimSeparatorText(separatorText)

    let separator = searchWithinData 
      ? [searchWithinData.open, searchWithinData.close] 
      : separatorText

    if (includePositions) {
      text    = { text, position: lastPosition }
      separator  = { text: separator, position: separatorPosition, isSeparator: true }
    }

    let restMentions
    if (mentions) {
      text = typeof text === 'string' ? { text } : text 
      const [properMentions, restItems] = this.getMentions(lastPosition, separatorPosition)

      if (properMentions) {
        text.mentions = properMentions 
        restMentions = restItems
      }
    }

    if (check && separatorText) {
      const position = isNaN(this.tempPosition) ? lastPosition : this.tempPosition 
      this.tempPosition = separatorPosition + separatorText.length

      const self = this
      const checkParams = {
        getString: once(() => self.trimResultText(string.substring(position, separatorPosition))),
        getTextAfter: once(() => string.substring(separatorPosition + separatorText.length)),
        getMentions: once(() => self.getMentions(position, separatorPosition)[0]),
        getSeparator: once(() => separatorText),

        get string () { return this.getString() },
        get textAfter () { return this.getTextAfter() },
        get mentions () { return this.getMentions() },
        get separator () { return this.getSeparator() }
      }

      if (!check(checkParams)) return []
      delete this.tempPosition
    } 

    if (restMentions) this.currentMentions = restMentions

    this.position = separatorPosition + separatorLength
    return [text, separator, true]
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

  addToPipe (pSeparator) {
    let [text, separator, checked] = this.checkSeparator(pSeparator)
    if (!checked) return false

    switch (this.searchSettings.includeSeparatorMode) { 
      case INCLUDE_SEPARATOR_SEPARATELY:
        this.pushToPipe(text)
        if (separator) 
          this.pushToPipe(separator)
        break 

      case INCLUDE_SEPARATOR_LEFT:
        this.pushToPipe([text, separator])
        break 

      case INCLUDE_SEPARATOR_RIGHT:
        const textIsEmpty = !(typeof text === 'object' ? text.text : text)
        if (!textIsEmpty || this.lastSeparator)
          this.pushToPipe([ this.lastSeparator, text ])
        this.lastSeparator = separator
        break

      case INCLUDE_SEPARATOR_ONLY:
        if (separator) this.pushToPipe(separator)
        break 
        
      default:
        this.pushToPipe(text)
    }

    return !this.pipeIsEmpty
  }

  findBrackets () {
    const { searchString: string, brackets, freeArea, searchSettings } = this
    const { bracketsSearch, separatorSearch, searchWithin } = searchSettings 

    const condition = searchWithin ? () => this.pipeIsEmpty : () => !freeArea.end

    while (condition()) {
      const match = bracketsSearch.exec(string)
      if (!match) {
        if (searchWithin || isNaN(freeArea.start)) return false

        freeArea.end = string.length - 1
        continue
      }
      
      const fragment = match[0]
      const { close, ignoreMode, searchLevels } = last(brackets) || {}

      let block
      const ACTION_CLOSE = 1, ACTION_OPEN = 2, ACTION_ADD_FRAGMENT = 3, ACTION_NULL = 4

      const action = 
        (fragment === close && ACTION_CLOSE) ||
        (ignoreMode && ACTION_NULL) ||
        ((block = searchSettings.bracketsMap[fragment]) && ACTION_OPEN) ||
        (searchSettings.mentions?.[fragment] && ACTION_ADD_FRAGMENT)
      
      switch (action) {
        case ACTION_CLOSE:
          const bracketData = brackets.pop()
          if (searchWithin) {
            if (searchLevels === true || searchLevels.includes(brackets.length + 1)) {
              this.addToPipe(Object.assign(match, { searchWithinData: bracketData }))
            }
          } else if (isEmpty(brackets)) {
            freeArea.start = match.index
            if (separatorSearch && separatorSearch.lastIndex < freeArea.start) 
              separatorSearch.lastIndex = freeArea.start
          }  
          break 

        case ACTION_OPEN:
          brackets.push({...block, openPosition: match.index + fragment.length })
          if (brackets.length === 1 && !searchWithin) 
            freeArea.end = match.index
          break 

        case ACTION_ADD_FRAGMENT:
          const mention = searchSettings.mentions[fragment]
          this.currentMentions.push({ mention, index: match.index })
          break    
      }  
    }

    return true
  }

  findSeparator (separator) {
    const { searchString: string, freeArea } = this
    const { separatorSearch } = this.searchSettings
    
    let stopSearching
    while (!stopSearching) {
      separator = separator || separatorSearch.exec(string)
      if (!separator) {
        this.addToPipe()
      }

      else if (separator.index <= freeArea.end) {  
        const isAdded = 
          separator.index >= freeArea.start && 
          this.addToPipe(separator)

        separator = null
        
        if (!isAdded) continue
      } 
      
      else {
        freeArea.start = freeArea.end = undefined
      }

      stopSearching = true
    } 

    return separator
  }

  getNext () {
    let separator
    while (this.pipeIsEmpty && !this.isDone) {
      if (!this.findBrackets()) {
        this.isDone = true
      } else if (!this.searchSettings.searchWithin) { 
        separator = this.findSeparator(separator)  
      }
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

const once = fn => {
  let value, hasValue
  return function (...args) {
    if (!hasValue) {
      value = fn(...args)
      hasValue = true
    }
    return value
  }
}

const isEmpty = value => {
  if (!value) return true 

  if (Array.isArray(value)) {
    if (value.length === 0) return true
  }

  else if (typeof value === 'object') {
    if (Object.keys(value).length === 0) return true
  }

  return false
}

const first = value => value[0]
const last = value => value[value.length - 1]

export const INCLUDE_SEPARATOR_NONE = 'NONE' 
export const INCLUDE_SEPARATOR_SEPARATELY = 'SEPARATELY'
export const INCLUDE_SEPARATOR_LEFT = 'LEFT'
export const INCLUDE_SEPARATOR_RIGHT = 'RIGHT'
export const INCLUDE_SEPARATOR_ONLY = 'ONLY'

export default splitSmartly