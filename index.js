const screenedSymbols = '.{}[]^()+*?\\/$'.split('').reduce((map, s) => {
  map[s] = '\\' + s
  return map
}, {})

const defaultSettings = {
  blocks: [],
  mentions: [],
  ignoreInsideQuotes: true, 
  includeNeedleMode: 'NONE', 
  ignoreCase: false, 
  trimResult: true, 
  trimNeedles: false,
} 

const prepareSearch = (needles, settings) => {
  settings = {...defaultSettings, ...settings}

  const { blocks, ignoreInsideQuotes, mentions } = settings

  if (ignoreInsideQuotes) 
    blocks.push([`'`, null, true], [`"`, null, true])

  const blocksMap = blocks.reduce((map, [open, close, ignoreMode])=> {
    map[open] = { open, ignoreMode, close: close || open }
    return map
  }, {}) 

  const needlesArray = (typeof needles === 'string' || Array.isArray(needles)) && [needles].flat()
  const blocksArray = blocks.flatMap(v => v.slice(0, 2)).concat(mentions).filter(Boolean)

  let [needlesSearchPattern, blocksSearchPattern] = 
    [needlesArray, blocksArray].map(arr => 
      arr && arr.join('|').split('').map(s => screenedSymbols[s] || s).join('')
    )

  const needlesRegExp = needlesSearchPattern ? new RegExp(needlesSearchPattern, 'g') : needles
  const blocksRegExp = new RegExp(blocksSearchPattern, 'g')

  settings.mentions = mentions.length > 0 && new Set(mentions)

  return { blocksMap, needlesRegExp, blocksRegExp, settings }
}  

const splitSmartly = (...args) => {
  if (args.length === 2) {
    if (typeof args[1] === 'string' || Array.isArray(args[1])) {
      args.push({})
    } else {
      args.unshift(null)
    }
  }

  else if (args.length < 2) 
    throw new Error('Not enough arguments passed to splitSmartly function!!!')

  else if (args.length > 3) 
    throw new Error('Too much arguments passed to splitSmartly function!!!')

  let [string, needles, settings] = args 

  const searchSettings = prepareSearch(needles, settings)

  const splitFn = split.bind(searchSettings)
  splitFn.getIterator = string => splitFn(string, [])

  return string !== null ? splitFn(string) : splitFn
}

function split (string, ...args) {
  if (args.length && args.length === 1) {
    if (typeof args[0] === 'number' || Array.isArray(args[0])) {
      args.push({})
    } else {
      args.unshift(undefined)
    }
  }

  const [indexes, settings] = args
  const indexesParam = indexes !== undefined && [indexes].flat()

  let res = new SearchResults(string, this, indexesParam, settings)
  
  if (typeof indexes === 'number') 
    res = res.getNext()

  else if (!indexes) 
    res = res.getAll()

  return res
} 

class SearchResults {
  constructor (...args) {
    this.incomingArgs = args
    this.prepareSearch()
  }

  prepareSearch () {
    const [string, searchSettings, indexes, incomingSettings] = this.incomingArgs
    const { blocksMap, needlesRegExp: needlesSearch, blocksRegExp: blocksSearch, settings } = searchSettings
    
    needlesSearch.lastIndex = blocksSearch.lastIndex = 0

    Object.assign(this, { 
      string, 
      blocksMap, 
      needlesSearch, 
      blocksSearch, 
      settings: { ...settings, ...incomingSettings },

      blocks: [],
      pipe: [],
      currentMentions: [],
      position: 0,
      isDone: false,
      freeArea: { start: 0, end: undefined },
      lastNeedle: undefined,

      stringForSearch: settings.ignoreCase ? string.toUpperCase() : string,

      indexes: indexes && (new class {
        values = new Set(indexes)
        max = Math.max(...indexes) 
        
        count = 0
  
        hasIndex () { 
          return this.max === -Infinity || this.values.has(this.count++) 
        }
  
        isOverMax () { 
          return this.count > this.max 
        }
      })
    })  
  }

  get pipeIsEmpty () {
    return this.pipe.length === 0
  }

  checkNeedle (pNeedle) {
    const { trimNeedles, trimResult, check } = this.settings 

    let [needle, needlePos] = 
      pNeedle 
        ? [pNeedle[0], pNeedle.index] 
        : ['', this.string.length]

    let text = this.string.substring(this.position, needlePos)

    if (!needle) this.isDone = true

    if (trimResult) text = text.trim()
    if (trimNeedles) needle = needle.trim()

    if (check && !check(text, needle)) return []

    this.position = needlePos + needle.length
    return [text, needle, needlePos, true]
  }

  addToPipe (pNeedle) {
    const { position } = this

    let [text, needle, needlePos, checked] = this.checkNeedle(pNeedle)
    if (!checked) return false

    const { includeNeedleMode, includePositions } = this.settings

    const textIsEmpty = !text

    if (includePositions) {
      text    = { text, position }
      needle  = { text: needle, position: needlePos, isNeedle: true }
    }

    if (this.settings.mentions) {
      text = typeof text === 'string' ? { text } : text 
      text.mentions = this.currentMentions.splice(0)
    }

    switch (includeNeedleMode) { 
      case INCLUDE_NEEDLE_SEPARATELY:
        this.pipe.push(text)
        if (needle) 
          this.pipe.push(needle)
        break 

      case INCLUDE_NEEDLE_LEFT:
        this.pipe.push([text, needle])
        break 

      case INCLUDE_NEEDLE_RIGHT:
        if (!textIsEmpty || this.lastNeedle)
          this.pipe.push([ this.lastNeedle, text ])
        this.lastNeedle = needle
        break
        
      default:
        this.pipe.push(text)
    }
    
    if (this.indexes) {
      if (!this.indexes.hasIndex()) {
        this.pipe = []
      } else if (this.indexes.count === this.indexes.max) {
        this.isDone = true
      }
    }

    return !this.pipeIsEmpty
  }

  findFreeArea () {
    const { needlesSearch, blocksSearch, blocks, blocksMap, 
      freeArea, settings, stringForSearch: string } = this

    while (!freeArea.end) {
      const match = blocksSearch.exec(string)
      if (!match) {
        if (isNaN(freeArea.start)) return false

        freeArea.end = string.length - 1
        continue
      }
      
      const fragment = match[0]
      const { close, ignoreMode } = blocks[blocks.length - 1] || {}

      let block
      const ACTION_CLOSE = 1, ACTION_OPEN = 2, ACTION_ADD_FRAGMENT = 3

      const action = function getAction() {
        if (fragment === close) return ACTION_CLOSE
        if (!ignoreMode) {
          if (block = blocksMap[fragment]) return ACTION_OPEN
          if (settings.mentions && settings.mentions.has(fragment)) return ACTION_ADD_FRAGMENT
        }
      } ()

      switch (action) {
        case ACTION_CLOSE:
          if (--blocks.length === 0) {
            freeArea.start = blocksSearch.lastIndex
            if (needlesSearch && needlesSearch.lastIndex < freeArea.start) {
              needlesSearch.lastIndex = freeArea.start
            }
          }  
          break 

        case ACTION_OPEN:
          blocks.push(block)
          if (blocks.length === 1) freeArea.end = match.index
          break 

        case ACTION_ADD_FRAGMENT:
          this.currentMentions.push(fragment)
          break    
      }
      
    }

    return true
  }

  findNeedle (needle) {
    const { needlesSearch, freeArea, stringForSearch: string } = this
    
    do {
      needle = needle || needlesSearch.exec(string)
      if (!needle) this.addToPipe()
      
      else if (needle.index <= freeArea.end) {  
        const isAdded = 
          needle.index >= freeArea.start && 
          this.addToPipe(needle)

        needle = null
        
        if (!isAdded) continue
      } 
      
      else 
        freeArea.start = freeArea.end = undefined

      break
    } while (true)

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
    while (null !== (value = this.getNext())) res.push(value)
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