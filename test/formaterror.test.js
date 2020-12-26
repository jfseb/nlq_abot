var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
// var Parser = require(root + '/index.js')

var SentenceParser = require(root + '/sentenceparser.js');

var FormatError = require(root + '/formaterror.js');
var Ast = require(root + '/ast.js');

var debuglog = require('debug')('sentenceparser.nunit');

var abot_erbase = require(root + '/match/er_index.js');

var Erbase = abot_erbase.ErBase;

const Model = require(root + '/model/index_model.js').Model;
//var getModel = require('mgnlq_testmodel_replay').getTestModel;
var getModel = require(root+ '/model/testmodels').getTestModel1;

var words = {};

it('testTokenizeStringOrbitWhatis', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var res = Erbase.processString('orbit of the earth', theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'of', 'the', 'FACT']);
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeCatCatCat', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicationComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(
      ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeCatCatCatParse', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(
      ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]
    );
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    expect(Ast.dumpNodeNice(parsingResult)).toEqual({
      'type': 'BINOP',
      'index': -1,
      'children': [
        {
          'type': 'OPAll',
          'index': -1,
          'children': [
            {
              'type': 'LIST',
              'index': -1,
              'children': [
                {
                  'type': 'CAT',
                  'index': 0
                },
                {
                  'type': 'CAT',
                  'index': 1
                },
                {
                  'type': 'CAT',
                  'index': 2
                },
                {
                  'type': 'CAT',
                  'index': 3
                }
              ]
            }
          ]
        },
        {
          'type': 'LIST',
          'index': -1,
          'children': [
            {
              'type': 'OPEqIn',
              'index': -1,
              'children': [
                {
                  'type': 'CAT',
                  'index': 5
                },
                {
                  'type': 'FACT',
                  'index': 6
                }
              ]
            },
            {
              'type': 'OPEqIn',
              'index': -1,
              'children': [
                {
                  'type': 'CAT',
                  'index': 7
                },
                {
                  'type': 'FACT',
                  'index': 8
                }
              ]
            },
            {
              'type': 'OPEqIn',
              'index': -1,
              'children': [
                {
                  'type': 'CATPH',
                  'index': -1
                },
                {
                  'type': 'FACT',
                  'index': 9
                }
              ]
            }
          ]
        }
      ]
    });
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeCatCatCatParseText', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(
      ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]
    );
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeCatCatCatErr', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, ApplicationComponent starting with';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'CAT', 'CAT', 'starting with' ]);
    var resErr = 'abc';
    try {
      SentenceParser.parse(lexingResult, 'catListOpMore');
      expect(1).toEqual(0);
    } catch(e) {
      debuglog(e);
      resErr = FormatError.formatError(e.error_obj, res.sentences[0]);
    }
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + resErr.text);
    expect(resErr.text).toEqual(
      'Sentence terminated unexpectedly, i expected a fact or a string fragment.'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeInterimErr', done => {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, CO-FIO, and ApplicationComponent with';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'CAT', 'FACT', 'and', 'CAT', 'with' ]);
    var resErr;
    try {
      SentenceParser.parse(lexingResult, 'catListOpMore');
    } catch(e) {
      debuglog(e);
      resErr = FormatError.formatError(e.error_obj, res.sentences[0]);
    }
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + resErr.text);
    expect(resErr.text).toEqual('I do not understand the fact "CO-FIO" at this position in the sentence.');
    done();
    Model.releaseModel(theModel);
  });
});

it('testExtractExpect', done => {
  var res = FormatError.extractExpectArr(' one of these possible Token sequences:\n  1. [FACT]\n  2. [AnANY]\nbut found: \'\'');
  expect(res).toEqual(['FACT', 'AnANY']);
  done();
});

it('testAbc', done => {
  var error = [{
    'name': 'NotAllInputParsedException',
    'message': 'Redundant input, expecting EOF but found: FACT',
    'token': {
      'image': 'FACT',
      'startOffset': 2,
      'tokenType': 7
    },
    'resyncedTokens': [],
    'context': {
      'ruleStack': [],
      'ruleOccurrenceStack': []
    }
  }
  ];
  var sentence = [
    undefined,
    undefined,
    {
      'string': 'CO-FIO',
      'matchedString': 'CO-FIO',
      'category': 'ApplicationComponent',
      'rule': {
        'category': 'ApplicationComponent',
        'matchedString': 'CO-FIO',
        'type': 0,
        'word': 'CO-FIO',
        'bitindex': 512,
        'bitSentenceAnd': 512,
        'wordType': 'F',
        '_ranking': 0.95,
        'exactOnly': true,
        'lowercaseword': 'co-fio'
      },
      '_ranking': 0.9974999999999999,
      'reinforce': 1.05
    }
  ];

  var res = FormatError.formatError(error[0], sentence);
  expect(res.text).toEqual('I do not understand the fact "CO-FIO" at this position in the sentence.');
  done();
});

var s = `Error: NoViableAltException: Expecting: one of these possible Token sequences:
  1. [FACT]
  2. [AnANY]
`;


it('testGetQualifierFromWordType', done => {
  var res = FormatError.getExpecting(s);
  expect(res).toEqual('a fact or a string fragment');
  done();
});

it('testGetQualifierFromWordType', done => {
  var res = ['A', 'X', 'F', 'C', 'D', '', 'O', undefined].map(arg => FormatError.getQualifierFromWordType(arg));
  expect(res).toEqual(['', '', 'the fact', 'the category', 'the domain', '', 'the operator', '']);
  done();
});


it('testmapTokenStringToHumanString', done => {
  var res = ['FACT', 'AnANY', '', 'Integer', '12', 'NUMBER', undefined].map(arg => FormatError.mapTokenStringToHumanString(arg));
  expect(res).toEqual(
    ['fact', 'string fragment', undefined, 'number', 'number', 'number', undefined]
  );
  done();
});

var aToken = {
  'string': 'CO-FIO',
  'matchedString': 'CO-FUU',
  'category': 'ApplicationComponent',
  'rule': {
    'category': 'ApplicationComponent',
    'matchedString': 'CO-BAR',
    'type': 0,
    'word': 'CO-XWORD',
    'bitindex': 512,
    'bitSentenceAnd': 512,
    'wordType': 'F',
    '_ranking': 0.95,
    'exactOnly': true,
    'lowercaseword': 'co-ffroombel'
  },
  '_ranking': 0.9974999999999999,
  'reinforce': 1.05
};

it('testGetWordType', done => {
  expect.assertions(3);
  expect(FormatError.getTokenQualifier({ startOffset: 0}, [aToken])).toEqual('the fact');
  expect(FormatError.getSentenceToken({ startOffset: 0}, [aToken])).toEqual(aToken);
  expect(FormatError.getTokenText({ startOffset: 0}, [aToken])).toEqual('CO-FIO');
  done();
});

it('testGetWordTypeBadOffset', done => {
  expect.assertions(4);
  try {
    FormatError.getTokenQualifier({ startOffset: -1}, [aToken]);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  try {
    FormatError.getSentenceToken({ startOffset: Number.NaN}, [aToken]);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  try {
    FormatError.getSentenceToken({ startOffset: 1}, [aToken]);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  try {
    FormatError.getTokenText({ startOffset: 2}, [aToken, aToken]);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  done();
});

it('testUnknownError', done => {
  var error = [{
    'name': 'unknowntype',
    'message': 'Redundant input, expecting EOF but found: FACT',
    'token': {
      'image': 'FACT',
      'startOffset': 2,
      'tokenType': 7
    },
    'resyncedTokens': [],
    'context': {
      'ruleStack': [],
      'ruleOccurrenceStack': []
    }
  }
  ];
  var sentence = [
    undefined,
    undefined,
    {
      'string': 'CO-FIO',
      'matchedString': 'CO-FIO',
      'category': 'ApplicationComponent',
      'rule': {
        'category': 'ApplicationComponent',
        'matchedString': 'CO-FIO',
        'type': 0,
        'word': 'CO-FIO',
        'bitindex': 512,
        'bitSentenceAnd': 512,
        'wordType': 'F',
        '_ranking': 0.95,
        'exactOnly': true,
        'lowercaseword': 'co-fio'
      },
      '_ranking': 0.9974999999999999,
      'reinforce': 1.05
    }
  ];

  var res = FormatError.formatError(error[0], sentence);
  expect(res.text).toEqual(JSON.stringify(error[0]));
  done();
});
