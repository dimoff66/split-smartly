# split-smartly

> split strings by separator(s), ignoring text inside quotes and brackets. Can be easily tuned with a lot of flexible options

## What is it for ?
Sometimes we need to split string, ignoring separators inside quotes and/or brackets(or any other symbols).
For example in case when we want to parse sql fields list, separated by comma
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
#### example 1 - call without options
Without any options, splitSmartly function by default ignores separators inside quotes (to avoid such behaviour we can set ignoreInsideQuotes option to false)

```js
res = splitSmartly('one _ two _ "three _ four" _ five _ six', '_');
// res: ['one', 'two', '"three _ four"', 'five', 'six']
```

#### example 2 - call with brackets option set to true
Set brackets option to true to prevent from searching separators inside brackets (round, square and figure ones)
```js
res = splitSmartly('(one _ two) _ "three _ four" _ five _ six', '_', {
  brackets: true
});
// res: ['(one _ two)', '"three _ four"', 'five', 'six']
```

#### example 3 - call with brackets option set to arbitrary strings
Assign array of tupples(tupple is two-elements array) to brackets option to block separator search inside appointed couples of strings
```js
res = splitSmartly('(one / two) / "three / four" / <<five / six>>', '/', {
  brackets: [['(', ')'], ['<<', '>>']]
});
// res: ['(one / two)', '"three / four"', '<<five / six>>']
```

#### example 4 - call with array of strings as separator parameter
Use array of strings as separators parameter to split text in any position where one of these strings occur
```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM ']);
// res: ['', 'best', 'life']
```

#### example 5 - call with regular expression as separator parameter
Use regular expression as separators parameter, so any matches will be used as separators to split string. Do not forget global flag and ignore case flag if it is needed
```js
res = splitSmartly('p1: point first p2: point second',  /p\d:/gi)
// res: ['', 'point first', 'point second']
```

#### example 6 - call with setting includeSeparatorMode option
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

#### example 7 - call with separators and text in different cases(upper/lower)
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

#### example 8 - call with mentions option
Set mentions option as string or array of strings to search them inside text, so found results will have mentions property with strings which each result part consists
```js
res = splitSmartly('Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 'AND', {
  mentions: ['STEVE', 'PETER']
});
// res: [{'text':'Peter loves Mary','mentions':['PETER']},{'text':'Mary loves Johnny'},{'text':'Jonny loves Steve','mentions':['STEVE']}]
```

#### example 9 - using check option
using callback function as check option we can reject to break string in position of separator occur. Check function get object as parameter, where will be passed the following keys: string, separator, textAfter, mentions

In following example we avoid to break string if separator AND is found right after BETWEEN
```js
res = splitSmartly('life is long AND love BETWEEN pleasure AND pain', 'AND', {
  check: ({ separator, string }) => {
    return !string.toUpperCase().includes(' BETWEEN ');
  }
});
// res: ['life is long','love BETWEEN pleasure AND pain']
```

### example 10 - getting selected parts if result using indexes option
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

### example 11 - call with searchWithin option
if this option is set to true, then separators parameter is ignored and in result array we will have strings found between brackets
```js
res = splitSmartly('There is a lot of (hidden things) to discover, which {are not obvious} in our lifes', null, { brackets: [['(', ')'], ['{', '}']] });
// res: ['hidden things','are not obvious']
```

### example 12 - creating prepared split function
we can prepare split function with some separators and parameters and later call it to split some text
```js
const splitQuery = splitSmartly(['SELECT ', 'FROM ', 'WHERE '], { brackets: true, includeSeparatorMode: 'RIGHT });

const res1 = splitQuery('select * from nightSky where millionsOfStars')
const res2 = splitQuery('select 1, 2, 3, 10 from numbers where true')
```

TO BE CONTINUED



