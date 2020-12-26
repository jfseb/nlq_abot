
var root = '../../js';
var debuglog = require('debug')('breakdown.nunit');

const breakdown = require(root + '/match/breakdown.js');

it('testcleanse', async () => {
  const res = breakdown.cleanseString('  system and \n some \t others are ');
  expect(res).toEqual('system and some others are');
  //test.done()
});




it('testIsSplitSingle', async () => {
  const res = breakdown.isCombinableSplit( {
    tokens: ['A']
  });
  expect(res).toEqual(false);

  //test.done()

});

it('testIsSplitEmpty', async () => {
  const res = breakdown.isCombinableSplit( {
    tokens: []
  });
  expect(res).toEqual(false);

  //test.done()

});


it('testIsSplitOk', async () => {
  const res = breakdown.isCombinableSplit( {
    tokens: ['A','B'],
    fusable : [false,true,false]
  });
  expect(res).toEqual(true);

  //test.done()

});

it('testIsSplitNotOk', async () => {
  const res = breakdown.isCombinableSplit( {
    tokens: ['A','B'],
    fusable : [false,false,false]
  });
  expect(res).toEqual(false);

  //test.done()

});

//
// targetIndex = breakdown.isCombinableRange(word.rule.range, fusable, index)
it('testIsCombinableRange', async () => {
  const res = breakdown.isCombinableRangeReturnIndex( { low: -1, high: 1} ,[false,true,true,true,true,false],1);
  expect(res).toEqual(0);

  //test.done()

});

it('testIsCombinableRangeFrontOut', async () => {
  const res = breakdown.isCombinableRangeReturnIndex( { low: -4, high: 1},[false,true,true,true,true,false],0);
  expect(res).toEqual(-1);

  //test.done()

});
it('testIsCombinableRangeEndFits', async () => {
  const res = breakdown.isCombinableRangeReturnIndex( { low: 0, high: 2},[false,true,true,true,true,false],4);
  expect(res).toEqual(-1);

  //test.done()

});


//

it('testCombineTokens', async () => {
  var combinedWord = breakdown.combineTokens({ low: -1, high : 1}, 2, ['A', 'B', 'C', 'D', 'E', 'F' ]);
  expect(combinedWord).toEqual('B C D');

});

it('testIsSplitOk2', async () => {
  const res = breakdown.isCombinableSplit( {
    tokens: ['A','B','C'],
    fusable : [false,true,false,false]
  });
  expect(res).toEqual(false);

  //test.done()

});



it('testIsSplitPeterPaulMary', async () => {
  const res = breakdown.isCombinableSplit( breakdown.tokenizeString('Peter,Paul Mary'));
  expect(res).toEqual(false);

  //test.done()

});



it('testIsSplitPeterPaulMaryBad', async () => {
  const res = breakdown.isCombinableSplit( breakdown.tokenizeString('Peter Paul , Mary'));
  expect(res).toEqual(false);

  //test.done()

});

it('testIsSplitPeterPaulMaryOk', async () => {
  const res = breakdown.isCombinableSplit( breakdown.tokenizeString('Peter Paul Mary'));
  expect(res).toEqual(true);

  //test.done()

});




it('testRecombineQuoted', async () => {
  const res = breakdown.recombineQuoted('A "My quoted string" and some "others"'.split(' '));
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual(['A', '"My quoted string"', 'and', 'some', '"others"']);

  //test.done()

});

it('testRecombineQuotedUnterminated', async () => {
  const res = breakdown.recombineQuoted('A "My quoted string'.split(' '));
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual(['A', '"My', 'quoted', 'string']);

  //test.done()

});


it('testRecombineQuotedSingleQuote', async () => {
  const res = breakdown.recombineQuoted('A " My quoted " string'.split(' '));
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual(['A', '"My quoted"', 'string']);

  //test.done()

});


it('testRecombineQuotedOnly', async () => {
  const res = breakdown.recombineQuoted('"My quoted string"'.split(' '));
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual(['"My quoted string"']);

  //test.done()

});

it('testtrimQuoted', async () => {
  const res = breakdown.trimQuoted('"ABC"');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual('ABC');

  //test.done()

});


it('testtrimQuoted', async () => {
  const res = breakdown.trimQuoted('"Aabc');
  // test.expect(3)
  debuglog(res);
  expect(breakdown.trimQuoted('"Aabc')).toEqual('"Aabc');
  expect(breakdown.trimQuoted('Aabc"')).toEqual('Aabc"');
  expect(breakdown.trimQuoted('""Aabc""')).toEqual('Aabc');
  expect(breakdown.trimQuoted('"')).toEqual('"');
  expect(breakdown.trimQuoted('""')).toEqual('""');
  expect(breakdown.trimQuoted('"""')).toEqual('"""');
  expect(breakdown.trimQuoted('""""')).toEqual('""""');

  //test.done()

});



it('testBreakdown', async () => {
  const res = breakdown.breakdownString('system');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([['system']]);

  //test.done()

});

it('testBreakdownQuotes', async () => {
  const res = breakdown.breakdownString('run "My Fiori"');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([['run', 'My Fiori']]);

  //test.done()

});

it('testBreakdownEB', async () => {
  const res = breakdown.breakdownString('!ABC');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([['!ABC']
  ]);
});
it('testBreakdownEB', async () => {
  const res = breakdown.breakdownString('DE!ABC');
  debuglog(res);
  expect(res).toEqual([['DE!ABC'],
  ]);
});


it('testBreakdownNE', async () => {
  const res = breakdown.breakdownString('!=');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([['!='],
  ]);
});


it('testBreakdownNE', async () => {
  const res = breakdown.breakdownString('ru,n != b !B');
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([
    ['ru,n != b !B'],
    ['ru,n','!= b !B'],
    ['ru,n !=','b !B'],
    ['ru,n','!=', 'b !B'],
    ['ru,n != b','!B'],
    ['ru,n','!= b','!B'],
    ['ru,n !=','b','!B'],
    ['ru,n','!=','b', '!B'],
  ]);
});

it('testBreakDownLimitSpaces', async () => {
  const res = breakdown.breakdownString('A "My q u o t e d" and some "others"', 4);
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([
    ['A', 'My q u o t e d', 'and some', 'others'],
    ['A', 'My q u o t e d', 'and','some', 'others'],
  ]);
  expect(res.length).toEqual(2);

  //test.done()

});

it('testBreakDownLimitSpaces2', async () => {
  const res = breakdown.breakdownString('A B and some', 2);
  // test.expect(3)
  debuglog(res);
  expect(res).toEqual([ [ 'A', 'B and some' ],
    [ 'A B', 'and some' ],
    [ 'A', 'B', 'and some' ],
    [ 'A B and', 'some' ],
    [ 'A', 'B and', 'some' ],
    [ 'A B', 'and', 'some' ],
    [ 'A', 'B', 'and', 'some' ] ]);
  expect(res.length).toEqual(7);

  //test.done()

});


it('testSwallowQuote', async () => {
  const res = breakdown.swallowQuote('abc"hij  klm"',3);
  expect(res).toEqual({ token: 'hij klm', nextpos : 13});

  //test.done()

});


it('testSwallowQuoteUnterminated', async () => {
  const res = breakdown.swallowQuote('abc"hij  klm',3);
  expect(res).toEqual({ token: undefined, nextpos : 3});

  //test.done()

});


it('testSwallowWord', async () => {
  const res = breakdown.swallowWord('   def ',3);
  expect(res).toEqual({ token: 'def', nextpos : 6});

  //test.done()

});

it('testSwallowWordWithQuote', async () => {
  const res = breakdown.swallowWord('   O\'hara   ',3);
  expect(res).toEqual({ token: 'O\'hara', nextpos : 9});

  //test.done()

});


it('testSwallowWordWithEndQuote', async () => {
  const res = breakdown.swallowWord('   O\'hara\' ',3);
  expect(res).toEqual({ token: 'O\'hara', nextpos : 9});

  //test.done()

});

it('testSwallowWordWithEndQuote2', async () => {
  const res = breakdown.swallowWord('   O\'\'Hara ',3);
  expect(res).toEqual({ token: 'O', nextpos : 4});

  //test.done()

});


it('testSwallowWordWithEndQuote3', async () => {
  const res = breakdown.swallowWord('   O\'H\'Hara',3);
  expect(res).toEqual({ token: 'O\'H\'Hara', nextpos : 11});

  //test.done()

});


it('testSwallowWordDots1', async () => {
  const res = breakdown.swallowWord('   a.b.c.',3);
  expect(res).toEqual({ token : 'a.b.c', nextpos : 8});

  //test.done()

});


it('testSwallowWordDots3', async () => {
  const res = breakdown.swallowWord('   . ',3);
  expect(res).toEqual({ token : undefined, nextpos: 3});

  //test.done()

});


it('testSwallowWordDots', async () => {
  const res = breakdown.swallowWord('   .a..',3);
  expect(res).toEqual({ token : '.a..', nextpos : 7});

  //test.done()

});
/**
 * Breakdown a string into tokens, marking elements which are not
 * combinable, but keeping O'Hara together
 */

it('testBreakDotsSlashes', async () => {
  const res = breakdown.tokenizeString('A a.b.c and a/b/c. a/b/c.e/.k and .gitignore?');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual(
    { tokens: [ 'A', 'a.b.c', 'and' ,'a/b/c', 'a/b/c.e/.k', 'and', '.gitignore'],
      fusable : [false,true,true,true, false, true ,true, false]
    }
  );

  //test.done()

});


it('testTokenizeNE', async () => {
  const res = breakdown.tokenizeString('A != B !C');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual(
    { tokens: [ 'A', '!=', 'B' ,'C'],
      fusable : [false,false,true,false,false]
    }
  );

  //test.done()

});

it('testTokenizeNE', async () => {
  const res = breakdown.tokenizeString('A <> B !C');
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual(
    { tokens: [ 'A', '<>', 'B' ,'C'],
      fusable : [false,true,true,false,false]
    }
  );
});

it('testBreakDotsWord', async () => {
  const res = breakdown.tokenizeString('.gitignore');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual({ tokens: [ '.gitignore'],
    fusable : [false,false]
  });

  //test.done()

});


it('testBreakDotsSpaceWordQuotedDot', async () => {
  const res = breakdown.tokenizeString('. gitignore "abc." WDA/WEbdypnro');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual({ tokens: [ 'gitignore', 'abc.','WDA/WEbdypnro'],
    fusable : [false,false,false,false]
  });

  //test.done()

});



/**
 * Breakdown a string into tokens, marking elements which are not
 * combinable, but keeping O'Hara together
 */

it('testBreakDownDirect', async () => {
  const res = breakdown.tokenizeString('A   C0,E%M;F. and What\'s up?in O\'Hara "tod\tay.a t" A?');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual(
    { tokens: [ 'A', 'C0','E%M', 'F', 'and', 'What\'s', 'up', 'in' , 'O\'Hara', 'tod ay.a t', 'A'],
      fusable : [false,true,false,false,false,true,true,false,true,false,false,false]
    }
  );

  //test.done()

});

it('testBreakDownDirect2', async () => {
  const res = breakdown.tokenizeString('A""BCDEF"AND');
  // test.expect(3)
  debuglog(res.tokens.map(function(o,index) {
    return `${res.fusable[index]? ' ' : '|' }`
      + o
      + `${res.fusable[index+1]? ' ' : '|' }`;
  }));
  expect(res.tokens.length+1).toEqual(res.fusable.length);
  expect(res).toEqual({ tokens: [ 'A', 'BCDEF','AND'],
    fusable : [false,false,false,false]
  });
});


it('testMakeMatchPattern', async () => {
  var res = breakdown.makeMatchPattern('abc');
  expect(res).toEqual(undefined);
});


it('testMakeMatchPattern0', async () => {
  var res = breakdown.makeMatchPattern('Life is shorter');
  expect(res).toEqual({ longestToken: 'shorter',
    span: { low : -2, high : 0}});
});

it('testMakeMatchPattern1', async () => {
  var res = breakdown.makeMatchPattern('Lifer is short');
  expect(res).toEqual({ longestToken: 'Lifer',
    span: { low : 0, high : 2} });
});

it('testIsQuoted', async () => {
  expect(breakdown.isQuoted('"AB"')).toEqual(true);
  expect(breakdown.isQuoted('AB')).toEqual(false);
  expect(breakdown.isQuoted('"A"B"')).toEqual(true);
  expect(breakdown.isQuoted('"AB')).toEqual(false);

});


it('testCountSpaces', async () => {
  expect(breakdown.countSpaces('A B C')).toEqual(2);
  expect(breakdown.countSpaces('ABC')).toEqual(0);
  expect(breakdown.countSpaces('AB ')).toEqual(1);

});

it('testBreakdown2', async () => {
  const res = breakdown.breakdownString('system a b');
  expect(res).toEqual([['system a b'],
    ['system', 'a b'],
    ['system a', 'b'],
    ['system', 'a', 'b']]);

  //test.done()

});

it('testBreakdownQuoted', async () => {
  const res = breakdown.breakdownString('system "a" b');
  expect(res).toEqual([['system', 'a', 'b']]);

  //test.done()

});
