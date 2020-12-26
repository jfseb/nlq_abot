

var root =  '../../js';
//var debuglog = require('debug')('plainRecoginizer.nunit');

const recognizer = require(root + '/bot/plainrecognizer.js');

it('testParseRuleInt', async done => {
  const res =
    recognizer.parseRule('what is <category> in <A1>');
  expect(res).toEqual({
    type: 1,
    regexp: new RegExp('^what is (.*) in (.*)$', 'i'),
    argsMap: {
      'category': 1,
      'A1': 2
    }
  });
  done();
});



it('testParseRuleGreedy', done => {
  const res =
    recognizer.parseRule('what ((is)|(was)) a <category>? in <A1> and');
  expect(res).toEqual({
    type: 1,
    regexp: /^what ((is)|(was)) a (.*?) in (.*) and$/i,
    argsMap: {
      'category': 4,
      'A1': 5
    }
  });
  done();
});

it('testParseRuleIntParen', done => {
  const res =
    recognizer.parseRule('what (is)|(was) a <category> in <A1> and');
  expect(res).toEqual({
    type: 1,
    regexp: /^what (is)|(was) a (.*) in (.*) and$/i,
    argsMap: {
      'category': 3,
      'A1': 4
    }
  });
  done();
});

it('testParseRuleIntParenWeird', done => {
  const res =
    recognizer.parseRule('what (is)|(was) (a <category>) in <A1> and');
  expect(res).toEqual({
    type: 1,
    regexp: /^what (is)|(was) (a (.*)) in (.*) and$/i,
    argsMap: {
      'category': 4,
      'A1': 5
    }
  });
  done();
});

it('testParseRuleIntArray', done => {
  const res =
    recognizer.parseRule([/^what (is)|(was) (a (.*)) in (.*) and$/i, { 'category': 4, 'A1': 5 }]);
  expect(res).toEqual({
    type: 1,
    regexp: /^what (is)|(was) (a (.*)) in (.*) and$/i,
    argsMap: {
      'category': 4,
      'A1': 5
    }
  });
  done();
});

it('testRecognize', done => {
  const res =
    recognizer.parseRule('what ((is)|(was)) (a <category>) in <A1> and');
  expect(res).toEqual({
    type: 1,
    regexp: /^what ((is)|(was)) (a (.*)) in (.*) and$/i,
    argsMap: {
      'category': 5,
      'A1': 6
    }
  });
  var match = recognizer.recognizeText('What is a ABC AND K in CDEF and', [res]);
  expect(match).toEqual({

    entities: [{
      type: 'category',
      'entity': 'ABC AND K',
      startIndex: 10,
      endIndex: 19
    },
    {
      type: 'A1',
      entity: 'CDEF',
      startIndex: 23,
      endIndex: 27
    }
    ],
    score: 0.9
  });
  done();
});





var fs = require('fs');
var oJSON = JSON.parse(fs.readFileSync('./resources/model/intents.json'));
var oRules = recognizer.parseRules(oJSON);


it('testRecognizerWs', done => {
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'list all applications '
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'applications',
        startIndex: 9,
        endIndex: 21
      }
      ],
      score: 0.9,
      intent: 'ListAll'
    });
    done();
  });
});


it('testTrimValueAdjusting', done => {
  expect(recognizer.trimValueAdjusting('abc ')).toEqual({ deltaStart : 0, value : 'abc'});
  expect(recognizer.trimValueAdjusting('  abc ')).toEqual({ deltaStart : 2, value : 'abc'});
  expect(recognizer.trimValueAdjusting(' \t abc')).toEqual({ deltaStart : 3, value : 'abc'});
  done();
});


it('testRecognizerListallID', done => {
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'list all applications, def, hij and klm in domain XYZ'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({ entities:
    [{
      type: 'categories',
      entity: 'applications, def, hij and klm in domain XYZ',
      startIndex: 9,
      endIndex: 53 }
    ],
    score: 0.9,
    intent: 'ListAll' });
    done();
  });
});


it('testRecognizeSome', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Show me Transaction ABC in UV2 client 130'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'Transaction ABC in UV2 client 130',
        startIndex: 8,
        endIndex: 41
      }
      ],
      score: 0.9,
      intent: 'ShowMe'
    });
    done();
  });
});

it('testRecognizeDescribe', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'describe AB'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'AB',
        startIndex: 9,
        endIndex: 11
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeDescribeUppercase', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Describe AB'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'AB',
        startIndex: 9,
        endIndex: 11
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeTellMeDescribe', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'describe AB'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'AB',
        startIndex: 9,
        endIndex: 11
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});

it('testRecognizeTellMeAb', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Tell me about AB'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'AB',
        startIndex: 14,
        endIndex: 16
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeTellMe', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Tell me about AB in domain Fiori BOM.'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'AB',
        startIndex: 14,
        endIndex: 16
      },
      {
        type: 'D',
        entity: 'Fiori BOM',
        startIndex: 27,
        endIndex: 36
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});



it('testRecognizeTellMeFi', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Tell me about "Fiori intent"?'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: '"Fiori intent"',
        startIndex: 14,
        endIndex: 28
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});

it('testRecognizeWhatIsSimpleA', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'What is a Businesscatalog'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'Businesscatalog',
        startIndex: 10,
        endIndex: 25
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});

it('testRecognizeWhatIsSimpleA', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'What is a Businesscatalog'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'Businesscatalog',
        startIndex: 10,
        endIndex: 25
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeWhatIsComplex', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'What is the element weight for element name silver'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'category',
        entity: 'element weight',
        startIndex: 12,
        endIndex: 26
      },
      {
        type: 'A1',
        entity: 'element name silver',
        startIndex: 31,
        endIndex: 50
      }
      ],
      score: 0.9,
      intent: 'WhatIs'
    });
    done();
  });
});



it('testRecognizeWhatIsSimple', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'What is water'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'water',
        startIndex: 8,
        endIndex: 13
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeTellMeD2', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'Describe ASF SFA in domain Fiori BOM.'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'A1',
        entity: 'ASF SFA',
        startIndex: 9,
        endIndex: 16
      },
      {
        type: 'D',
        entity: 'Fiori BOM',
        startIndex: 27,
        endIndex: 36
      }
      ],
      score: 0.9,
      intent: 'Describe'
    });
    done();
  });
});


it('testRecognizeSomeMore', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'What is the ABC for DEF in KLM'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'category',
        entity: 'ABC',
        startIndex: 12,
        endIndex: 15
      },
      {
        type: 'A1',
        entity: 'DEF in KLM',
        startIndex: 20,
        endIndex: 30
      }
      ],
      score: 0.9,
      intent: 'WhatIs'
    });
    done();
  });
});


it('testRecognizeBuildTable', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'build table with appId, fiori intent, AppNAme, AppplicaitonComponent, BSPName, OData Service, BUsinessCatalog, TechnicalCatalog and ApplicationComponent'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'appId, fiori intent, AppNAme, AppplicaitonComponent, BSPName, OData Service, BUsinessCatalog, TechnicalCatalog and ApplicationComponent',
        startIndex: 17,
        endIndex: 152
      }
      ],
      score: 0.9,
      intent: 'buildtable'
    });
    done();
  });
});




it('testRecognizeListAllBinOp', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'List all ABC starting with DEF'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'ABC starting with DEF',
        startIndex: 9,
        endIndex: 30
      }
      ],
      score: 0.9,
      intent: 'ListAll'
    });
    done();
  });
});

it('testRecognizeListAllBinOpDomain', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'List all ABC starting with DEF in domain UU'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'ABC starting with DEF in domain UU',
        startIndex: 9,
        endIndex: 43
      }
      ],
      score: 0.9,
      intent: 'ListAll'
    });
    done();
  });
});



it('testRecognizeListAllWhere', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'List all ABC where XYZ starts with X'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'ABC where XYZ starts with X',
        startIndex: 9,
        endIndex: 36
      }
      ],
      score: 0.9,
      intent: 'ListAll'
    });
    done();
  });
});

it('testtrimTrailingSentenceDelimiters', done => {
  expect(recognizer.trimTrailingSentenceDelimiters('abc !!!?!')).toEqual('abc');
  expect(recognizer.trimTrailingSentenceDelimiters('abc ')).toEqual('abc');
  expect(recognizer.trimTrailingSentenceDelimiters('defhij " \n !!\n!?!')).toEqual('defhij "');
  expect(recognizer.trimTrailingSentenceDelimiters('defhij')).toEqual('defhij');
  expect(recognizer.trimTrailingSentenceDelimiters('')).toEqual('');

  done();
});

it('testRecognizeListAllWhereTails', done => {
  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);
  var cnt = 0;
  var arr =
  ['?', '???', '!?!', '!', ';', '.'];
  arr.forEach(function(term) {
    var oContext = {
      message: {
        text: 'List all ABC where XYZ starts with X' + term
      }
    };
    Recognizer.recognize(oContext, function (err, res) {
      expect(res).toEqual({
        entities:
        [{
          type: 'categories',
          entity: 'ABC where XYZ starts with X',
          startIndex: 9,
          endIndex: 36
        }
        ],
        score: 0.9,
        intent: 'ListAll'
      });
      cnt = cnt + 1;
      if(cnt === arr.length) {
        done();
      }
    });
  });
});

// TODO
it('testRecognizeWith', done => {

  var oRules = recognizer.parseRules(oJSON);
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);

  var oContext = {
    message: {
      text: 'List all ABC with XYZ starting with X'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities:
      [{
        type: 'categories',
        entity: 'ABC with XYZ starting with X',
        startIndex: 9,
        endIndex: 37
      }
      ],
      score: 0.9,
      intent: 'ListAll'
    });
    done();
  });
});

it('testNormalizeWhitespace', done => {
  expect(
    recognizer.normalizeWhitespace(' This is  \t  not\t"a love song"   and "we do like the USofA  ')
  ).toEqual(' This is not "a love song" and "we do like the USofA ');
  done();
});

it('testCompactQuoted', done => {
  expect(
    recognizer.compactQuoted(' This is not "a love song" and "we do like" the USofA')
  ).toEqual(' This is not <word> and <word> the USofA');
  done();
});

it('testCompactQuotedUnterminated', done => {
  expect(
    recognizer.compactQuoted(' This is not "a love song" and "we do like the USofA')
  ).toEqual(' This is not <word> and "we do like the USofA');

  done();
});

it('testCountCompactWords', done => {
  expect(recognizer.countCompactWords('a b c d e f g h k i l m n')).toEqual(13);
  done();
});


it('testCountCompactWords', done => {

  expect(recognizer.countCompactWords(' a b ')).toEqual(4);
  expect(recognizer.countCompactWords('a,,,,,,,b, , , , ,c ')).toEqual(4);
  done();
});



it('testRecognizeTooLong', done => {
  var ambRules = {
    'Exit': [
      'Quit',
    ]
  };
  var ambiguousRules = recognizer.parseRules(ambRules);
  var Recognizer = new (recognizer.RegExpRecognizer)(ambiguousRules);
  var oContext = {
    message: {
      text: 'This message has too many characters to be procesed by the wosap in his own time frame wiht current limits and more fun to the limit than anyboader else and so on'
    }
  };
  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities: [],
      score: 1,
      intent: 'TooLong'
    });
    done();
  });
});


it('testRecognizeTooLong2', done => {
  var ambRules = {
    'Exit': [
      'QuAAAAA',
    ]
  };
  var ambiguousRules = recognizer.parseRules(ambRules);
  var Recognizer = new (recognizer.RegExpRecognizer)(ambiguousRules);
  var oContext = {
    message: {
      text: 'This messagehastoo many charactersTobaprocesswdfbjoealkdfjaoeslf saladsfsfasfdalkfja slfkjsafsjflskjfslkfj'
      +  'slkfjaslkdfjsalkfjsklfjslfkjasdasflkfdjaslökfjaslkdfjasölfkjassffkjaslökdfjaslkdfjassafldfjsasafadfasdfskjsdlkfjasldkfjaslkdfjsalfkjslkdfjaslkfjslakdfjslkfdjlskdfjslkfjslkfdj'
      +  'slkfjaslkdfjsalkfjsklfjslfkjasdasflkfdjaslökfjaslkdfjasölfkjassffkjaslökdfjaslkdfjassafldfjsasafadfasdfskjsdlkfjasldkfjaslkdfjsalfkjslkdfjaslkfjslakdfjslkfdjlskdfjslkfjslkfdj'
      +  'slkfjaslkdfjsalkfjsklfjslfkjasdasflkfdjaslökfjaslkdfjasölfkjassffkjaslökdfjaslkdfjassafldfjsasafadfasdfskjsdlkfjasldkfjaslkdfjsalfkjslkdfjaslkfjslakdfjslkfdjlskdfjslkfjslkfdj'
    }
  };
  new Promise(function(resolve,reject) {
    Recognizer.recognize(oContext, function (err, res) {
      expect(res.intent).toEqual('TooLong');
      resolve();
    });
  }).then(function() {
    return new Promise(function(resolve,reject) {
      var oContext = {
        message: {
          text: 'This h t m w a a i sl d d d d df  s f f e  af f asf  fs ds fs fs df sf s fs '
        }
      };
      Recognizer.recognize(oContext, function (err, res) {
        expect(res.intent).toEqual('TooLong');
        resolve();
      });
    });
  }
  ).then(function() {
    done();
  });
});



it('testRecognizeNone', done => {
  var Recognizer = new (recognizer.RegExpRecognizer)(oRules);
  var oContext = {
    message: {
      text: 'This is nothing parsed'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities: [],
      score: 0.1,
      intent: 'None'
    });
    done();
  });
});



it('testRecognizeAmbiguous', done => {

  var ambRules = {
    'Exit': [
      'Quit',
      'Leave',
      'Exit',
      'Abandon'
    ],
    'Wrong': [
      'Exit',
      'incorrect',
      'Liar'
    ]
  };
  var ambiguousRules = recognizer.parseRules(ambRules);
  var Recognizer = new (recognizer.RegExpRecognizer)(ambiguousRules);
  var oContext = {
    message: {
      text: 'Exit'
    }
  };

  Recognizer.recognize(oContext, function (err, res) {
    expect(res).toEqual({
      entities: [],
      score: 0.9,
      intent: 'Exit'
    });
    done();
  });
});

