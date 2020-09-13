# split-smartly

> split ignoring quotes and brackets with a lot of flexible options

## What is it for ?
Sometimes we need to split string, ignoring text inside quotes and/or brackets or any other symbols
for example if we want to parse sql query string, where fields separated by comma
SELECT 1 as numberField, "3,4,5" as stringField, MAX(3, 5) as calculatedField
we will not get proper result using standard split function

so splitSmartly function will manage to do it easily and nicely

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
splitSmartly([text[, separators[, options]]])

text | optional - text to split, can be skipped, if we do not want to get result immidiately, but
  want to function, which can be called just later passing any text in it

separators - can be string or an array of strings or regular expression, which will split text

options - an object of options to tune the search


## Return value
- if text parameter is not skipped, function will return an array of results. The format of array items will be depend on options. In a simpliest case it is an array of string between separators.
- If text parameter is skipped, function will return another function with separators and options, bound to it, so we can call this function many times with different text parameter values

## Examples
If we do not provide any options, splitSmartly function ignores separators inside quotes

```js
res = splitSmartly('one / two / "three / four" / five / six', '/');
// res: ['one','two','"three / four"','five','six']
```

If we set option brackets to true it will prevent from searching separators inside 
round, square and figure brackets
```js
res = splitSmartly('(one / two) / "three / four" / five / six', '/', {
  brackets: true
});
// res: ['(one / two)','"three / four"','five','six']
```

If we assign array of tuples to brackets option, it will prevent from searching separator inside any couple of strings, passed to it
```js
res = splitSmartly('(one / two) / "three / four" / <<five / six>>', '/', {
  brackets: [['(', ')'], ['<<', '>>']]
});
// res: ['(one / two)','"three / four"','<<five / six>>']
```

We can use array of strings as separators parameter, so text will be splited in any position
where one of these strings occur
```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM ']);
// res: ['','best','life']
```

we can set includeSeparatorMode option, it will include separator to result array
"SEPARATELY" - separator will be returned as distinct element of result array
"RIGHT" - separator will be returned in tupple together with string right from it
"LEFT" - separator will be returned in tupple together with string left from it

```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM '], {
  includeNeedleMode: 'SEPARATELY'
});
// res: ['','SELECT ','best','FROM ','life']
```

```js
res = splitSmartly('SELECT best FROM life', ['SELECT ', 'FROM '], {
  includeNeedleMode: 'RIGHT'
});
// res: [['SELECT ','best'],['FROM ','life']]
```

By default option ignoreCase set to true, so this code will work exactly the same way as previous
```js
res = splitSmartly('select best from life', ['SELECT ', 'FROM '], {
  includeNeedleMode: 'RIGHT'
});
// res: [['SELECT ','best'],['FROM ','life']]
```

using check parameter we can avoid to break string in certain situations
if function returns false, algorythm searches for a next separator
```js
res = splitSmartly('life is long AND love BETWEEN pleasure AND pain', 'AND', {
  check: ({ separator, string }) => {
    return !separator || !string.toUpperCase().includes(' BETWEEN ');
  }
});
// res: ['life is long','love BETWEEN pleasure AND pain']
```

if mentions parameter set to array of strings or to string, then each item of result array, where at least one of these string is found, will have mentions property with found strings
```js
res = splitSmartly('Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 'AND', {
  mentions: ['STEVE', 'PETER']
});
// res: [{'text':'Peter loves Mary','mentions':['PETER']},{'text':'Mary loves Johnny'},{'text':'Jonny loves Steve','mentions':['STEVE']}]
```

// if we want to get just some indexes of result array we can set indexes option as an array of numbers
```js
res = splitSmartly('One | Two | Three | Four', '|', {
  indexes: [1, 3]
});
// res: ['Two','Four']
```

to be 


