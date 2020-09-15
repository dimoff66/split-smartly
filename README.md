# split-smartly

> split strings by separator(s), ignoring text inside quotes and brackets. Can be easily tuned with a lot of flexible options

## What is it for ?
Sometimes we need to split string, ignoring separators inside quotes and/or brackets(or any other symbols).
For in case when we want to parse sql fields list, separated by comma
```sql
SELECT 1 as numberField, "3,4,5" as stringField, MAX(3, 5) as calculatedField
```
Obviously, commas inside string and commas, separated MAX-function parametetrs, should be ignored.
Original split function of String object will not return proper result, so splitSmartly is done to manage such kind of splitting easily and nicely

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm i split-smartly
```

## Import

```js
import splitSmartly from 'split-smartly'
```

## Syntax
```sh
splitSmartly([text[, separators[, options]]])
```

| parameter | description |
| --------- | ----------- |
| text (optional) | The text to be splitted. This parameter can be skipped if we do not need to get the immediate result, but want to get a function, that later can be called by passing a text parameter to it |
| separators | can be string or an array of strings or regular expression, which will be searched to split text |
| options (optional) | an object of options to tune the search and result |


## Return value
- if text parameter is not skipped, function will return an array of results. The format of array items will be depend on options. In a simpliest case it is an array of strings between separators, found in text.
- If text parameter is skipped, function will return another function with separators and options bound to it, so we can call this function any times we want with different text parameter values

## Examples
#### 1 - call without options
Without any options, splitSmartly function by default ignores separators inside quotes (to avoid such behaviour we can set ignoreInsideQuotes option to false)

```js
res = splitSmartly('one _ two _ "three _ four" _ five _ six', '_');
// res: ['one', 'two', '"three _ four"', 'five', 'six']
```

#### 2 - call with brackets option set to true
Set brackets option to true to prevent from searching separators inside brackets (round, square and figure ones)
```js
res = splitSmartly(
  '(one _ two) _ "three _ four" _ five _ six', 
  '_', 
  { brackets: true }
);
// res: ['(one _ two)', '"three _ four"', 'five', 'six']
```

#### 3 - call with brackets option set to arbitrary strings
Strings for bracket option can be assigned in next formats:
- array of tupples [['(', ')'], ['<<', '>>']], where in each tupple first element is opening bracket and second one is closing bracket
- object { '(': ')', '<<': '>>' } where in each key/value pair key is opening bracket and value is closing
- string - it is comma separted string, where each part is pair of brackets, separated with space symbol. In case if opening and closing string has just one character - space symbol can be skipped
'(),<< >>'

```js
res = splitSmartly(
  '(one / two) / "three / four" / <<five / six>>', 
  '/', 
  { brackets: { '(': ')', '<<': '>>' } }
);
// res: [
//  '(one / two)', 
//  '"three / four"', 
//  '<<five / six>>'
// ]
```

#### 4 - call with array of strings as separator parameter
Use array of strings as separators parameter to split text in any position where one of these strings occur
```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM ']);
// res: ['', 'best', 'life']
```

#### 5 - call with regular expression as separator parameter
Use regular expression as separators parameter, so any matches will be used as separators to split string. Do not forget global flag and ignore case flag if it is needed
```js
res = splitSmartly('p1: point first p2: point second',  /p\d:/gi)
// res: ['', 'point first', 'point second']
```

#### 6 - call with setting includeSeparatorMode option
Set includeSeparatorMode option to include separator to result array. It can take one of followed values ('NONE' by default)

- "SEPARATELY" - separator will be returned as distinct element of result array
- "RIGHT" - separator will be returned in tupple together with string right from it
- "LEFT" - separator will be returned in tupple together with string left from it
- 'ONLY' - only separator will be returned. It can be used when we do not need to split string, but just to find matches ignoring quotes and/or brackets
- 'NONE' - only strings between separators will be returned

```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'SEPARATELY' });
// res: ['', 'SELECT ', 'best', 'FROM ', 'life']
```

```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' });
// res: [['SELECT ','best'],['FROM ','life']]
```

```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'ONLY' });
// res: ['SELECT ', 'FROM ']
```

#### 7 - call with separators and text in different cases(upper/lower)
By default ignoreCase option is set to true, so this code will work perfectly well
```js
res = splitSmartly('select best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' });
// res: [['SELECT ','best'],['FROM ','life']]
```
but if we will set it to false, result will be different

```js
res = splitSmartly('select best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT', ignoreCase: false });
// res: [['', 'select best'], ['FROM ', 'life']]
```

#### 8 - call with mentions option
Assign string or array of strings to mentions option to search these strings in each result string. Then function will return array of objects, where property text will have text between separators and if it includes one or more strings from mentions option it will have mentions property with array of found mentions.
```js
res = splitSmartly(
  'Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 
  'AND', 
  { mentions: ['STEVE', 'PETER'] }
 );
// res: [
//  {'text':'Peter loves Mary','mentions':['PETER']},
//  {'text':'Mary loves Johnny'},
//  {'text':'Jonny loves Steve','mentions':['STEVE']}
//]
```

#### 9 - using check option
using callback function as check option we can reject to break string in position of separator occur. Check function get object as parameter, where will be passed the following keys: string, separator, textAfter, mentions

In following we avoid to break string if separator AND is found right after BETWEEN
```js
res = splitSmartly('life is long AND love BETWEEN pleasure AND pain', 'AND', {
  check: ({ separator, string }) => {
    return !string.toUpperCase().includes(' BETWEEN ');
  }
});
// res: ['life is long','love BETWEEN pleasure AND pain']
```

### 10 - getting selected parts if result using indexes option
Set indexes option to numeric value or to array on numbers - to get just some of found strings as result
```js
res = splitSmartly('One | Two | Three | Four', '|', { indexes: [1, 3] });
// res: ['Two','Four']
```

if indexes option set to particular number then function will return just result on this position, not an array
```js
res = splitSmartly('One | Two | Three | Four', '|', { indexes: 2 });
// res: 'Three'
```

### 11 - call with searchWithin option
if this option is set to true, then separators parameter is ignored and in result array we will have strings found between brackets
```js
res = splitSmartly('There is a lot of (hidden things) to discover, which {are not obvious} in our lifes', null, { brackets: { '(': ')', '{': '}' } });
// res: ['hidden things','are not obvious']
```

There is a short syntax for this option
```js
res = splitSmartly.searchWithin(string, { '(': ')', '{': '}' })
```

using this syntax, we can skip second parameter, and in last parameter we can just pass the brackets option in case we have no other options, except brackets


### 12 - creating prepared split function
we can prepare split function with some separators and parameters and later call it to split some text
```js
const splitQuery = splitSmartly(['SELECT ', 'FROM ', 'WHERE '], { brackets: true, includeSeparatorMode: 'RIGHT });

const res1 = splitQuery('select * from nightSky where millionsOfStars')
const res2 = splitQuery('select 1, 2, 3, 10 from numbers where true')
```

also as second parameter we can pass additional options, which will be merged with existing options in prepared function

```js
const splitQuery = splitSmartly(['SELECT ', 'FROM ', 'WHERE '], { brackets: true, includeSeparatorMode: 'RIGHT });

const res1 = splitQuery('select * from nightSky where millionsOfStars', { trimSeparators: true })
```

### 13 - call special functions of prepared function
instead of using prepared function as function we can call some of its props-functions for getting indexes:
* getIndexes - returns results with indexes passed as second parameter
* getOne - returns result from position passed as second parameter
* getFirst - returns first found result

```js
const splitQuery = splitSmartly(['SELECT ', 'FROM ', 'WHERE '], { brackets: true });

const res1 = splitQuery.getFirst('select * from nightSky where millionsOfStars')
// res1: '*'

const res2 = splitQuery.getOne('select * from nightSky where millionsOfStars', 1)
// res2: ['night sky']

const res3 = splitQuery.getIndexes('select * from nightSky where millionsOfStars', [1, 2])
// res3: ['night sky', 'millionsOfStars]
```

### 14 - call with returnIterator option set to true
Set returnIterator option to true if you want to get iterator instead of ready array. It can be useful in case where we have a long long string and need just several first results and the rest is optional.

```js
const resAsIterator = splitQuery('1, 2, 3, 4, 5', ',', { returnIterator: true })
```

This iterator can be use in loops as any iterable object and also has two methods
* getNext()
* getRest()

to get next and all the rest results accordingly
```js
const resAsIterator = splitQuery('1, 2, 3, 4, 5', ',', { returnIterator: true })
const res1 = resAsIterator.getNext() // '1'
const res2 = resAsIterator.getNext() // '2'
const res3 = resAsIterator.getRest() // ['3', '4', '5']
```

TO BE CONTINUED



