
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
        const mentions = [this.mentions].flat().filter(Boolean)
        this.mentions = mentions.length > 0 && new Set(mentions)
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

    createSeparatorsSearch () {
      const { separators } = this

      if (typeof separators === 'string' || Array.isArray(separators)) {
        const pattern = this.arrayToPattern([separators].flat().filter(Boolean))
        this.separatorSearch = this.createRegExp(pattern)
      } else {
        this.separatorSearch = separators
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
  let [string, separators, settings] = getSplitSmartlyArgs(args)

  const splitSettings = prepareSearch(separators, settings)

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
    const { separatorSearch, bracketsSearch, indexes } = this.searchSettings
    const indexesArr = [indexes].flat().filter(Boolean)
    
    Array.from([separatorSearch, bracketsSearch]).forEach(search => { search.lastIndex = 0 })

    Object.assign(this, { 
      brackets: [],
      pipe: [],
      currentMentions: [],
      position: 0,
      isDone: false,
      freeArea: { start: 0, end: undefined },
      lastSeparator: undefined,
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

  trimSeparatorText (text) {
    return this.searchSettings.trimSeparators ? text.trim() : text
  }

  checkSeparator (pSeparator) {
    const { string } = this
    const { check, includePositions, mentions } = this.searchSettings

    let [separatorText, separatorPos] = 
      pSeparator 
        ? [pSeparator[0], pSeparator.index] 
        : ['', string.length]

    let text = string.substring(this.position, separatorPos)

    if (!separatorText) this.isDone = true

    text = this.trimResultText(text)
    separatorText = this.trimSeparatorText(separatorText)

    let separator = separatorText
    if (includePositions) {
      text    = { text, position: this.position }
      separator  = { text: separator, position: separatorPos, isSeparator: true }
    }

    let restMentions
    if (mentions) {
      text = typeof text === 'string' ? { text } : text 
      const [properMentions, restItems] = this.getMentions(this.position, separatorPos)

      if (properMentions) {
        text.mentions = properMentions 
        restMentions = restItems
      }
    }

    if (check) {
      const position = isNaN(this.tempPosition) ? this.position : this.tempPosition 
      this.tempPosition = separatorPos + separatorText.length

      const textBefore = this.trimResultText(string.substring(position, separatorPos))
      const textAfter = string.substring(separatorPos + separatorText.length)

      const mentions = this.getMentions(position, separatorPos)[0]

      if (!check({ string: textBefore, separator, textAfter, mentions })) return []
      delete this.tempPosition
    } 

    if (restMentions) this.currentMentions = restMentions

    this.position = separatorPos + separator.length
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
    const { position } = this

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
        
      default:
        this.pushToPipe(text)
    }

    return !this.pipeIsEmpty
  }

  findFreeArea () {
    const { searchString: string, brackets, freeArea, searchSettings } = this
    const { bracketsSearch, separatorSearch } = searchSettings 

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
            if (separatorSearch && separatorSearch.lastIndex < freeArea.start) 
              separatorSearch.lastIndex = freeArea.start
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
      if (!this.findFreeArea()) 
        this.isDone = true
      else 
        separator = this.findSeparator(separator)  
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

export const INCLUDE_SEPARATOR_NONE = 'NONE' 
export const INCLUDE_SEPARATOR_SEPARATELY = 'SEPARATELY'
export const INCLUDE_SEPARATOR_LEFT = 'LEFT'
export const INCLUDE_SEPARATOR_RIGHT = 'RIGHT'

export default splitSmartly