

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var Parser = require(root + '/index.js');

function parseInput(text,startrule) {
  var lexingResult = Parser.SelectLexer.tokenize(text);
  console.log( lexingResult.tokens.map(tok => {
    return tok.image + ' /  ' + tok.tokenType;
  }).join('\n') );
  return parseGivenTokens(lexingResult.tokens, startrule);
}
function parseGivenTokens(tokens, startrule) {
  const parser = new Parser.SelectParser(tokens);
  var res = parser[startrule]();
  console.log('here res: ' + JSON.stringify(res));
  if (parser.errors.length > 0) {
    throw new Error('parsing error in  input' + JSON.stringify(parser.errors));
  }
  return res;
}

var inputText = 'LisT ALL CAT, CAT';
var result = parseInput(inputText,'listAll');
console.log('here result' + JSON.stringify(result));
console.log(Object.keys(result).join('\n')); //.selectClause());

var inputToks = [
  { image : 'LIST' , tokenType:  2},
  { image : 'ALL' , tokenType:    3},
  { image : 'CAT' , tokenType:    9},
  { image : ',' , tokenType:    7},
  { image : 'CAT ' , tokenType:  9}
];
var res = parseGivenTokens(inputToks, 'listAll');
console.log('here result2' + JSON.stringify(res));
