//const { iteratee } = require('lodash');
var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
// var Parser = require(root + '/index.js')

var SentenceParser = require(root + '/sentenceparser.js');

var Ast = require(root + '/ast.js');

var debuglog = require('debug')('sentenceparser.test');

var mgnlq_er = require(root + '/match/er_index.js');

var Sentence = mgnlq_er.Sentence;

var Erbase = mgnlq_er.ErBase;

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


// const utils = require('abot_utils')

// const inputFiterRules = require(root + '/match/inputFilterRules.js')

// const InputFilter = mgnlq_er.InputFilter

const Model = require(root + '/model/index_model').Model;

//var getModel = require('mgnlq_testmodel_replay').getTestModel;
var getModel = require(root + '/model/testmodels').getTestModel1;

var words = {};

it('testTokenizeStringOrbitWhatis', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
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

it('testTokenizeNumber', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'sender with more than 1234 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'with', 'more than', 'NUMBER', 'CAT']);
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeNE', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    var s = 
    'AppId, BusinessRoleName with BusinessRoleName starting with "SAP_BR" and BusinessRoleName != "SAP_BR_PROD_STWRDSHP_SPECLST"';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'CAT' , 'with', 'CAT', 'starting with', 'ANY', 'and', 'CAT', '!=','ANY']);
    done();
    Model.releaseModel(theModel);
  });
});

// and not is not parsed, as not is not an opertor. 
// TODO: this returns  0 sentences without any error message!?
it('testTokenizeAndNot', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 
    'AppId, BusinessRoleName with BusinessRoleName starting with "SAP_BR" and not BusinessRoleName = "SAP_BR_PROD_STWRDSHP_SPECLST"';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(res.errors.length).toEqual(0);
    expect(res.sentences.length).toEqual(0); 
    done();
    Model.releaseModel(theModel);
  });
});



it('testTokenizeNumberOrElement', done => {
  expect.assertions(3);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'sender with more than 12 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(2).toEqual(res.sentences.length);
    {
      var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
      var sStrings = lexingResult.map(t => t.image);
      debuglog(sStrings.join('\n'));
      expect(sStrings).toEqual(['CAT',  'with', 'more than', 'NUMBER', 'CAT']);
    } 
    {
      lexingResult = SentenceParser.getLexer().tokenize(res.sentences[1]);
      sStrings = lexingResult.map(t => t.image);
      debuglog(sStrings.join('\n'));
      expect(sStrings).toEqual(['FACT', 'with', 'more than', 'NUMBER', 'FACT']);
    }
    done();
    Model.releaseModel(theModel);
  });
});


it('testTokenizeCatCatCat', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicationComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeCatCatCatParse', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
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
  expect.assertions(3);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    expect(res.sentences.length).toEqual(1);
    //console.log(JSON.stringify(res.sentences,undefined,2));
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testTokenizeDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var s = 'domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['domain', 'DOM']);
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseInDomain', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction in domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'CAT', 'in', 'domain', 'DOM']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(3)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  undefined\n  DOM 4\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


it('testParseEndingWith', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject ending with element';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'ending with', 'ANY']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});




it('testParseAndContains2x', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'fiori apps, support component with "fiori app" contains "ampi" and support component contains "FIO"';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT',
      'CAT',
      'with',
      'CAT',
      'containing',
      'ANY',
      'and',
      'CAT',
      'containing',
      'ANY' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(2)\n    OPContains 4(2)\n      CAT 3\n      ANY 5\n    OPContains 8(2)\n      CAT 7\n      ANY 9\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


it('testParseSimpleEndingWith', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'domains ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual(['CAT', 'ending with', 'ANY']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));
    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseWithEndingWith', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'element names, atomic weights with element name ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'CAT', 'with', 'CAT', 'ending with', 'ANY' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(1)\n    OPEndsWith 4(2)\n      CAT 3\n      ANY 5\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseWithEndingWithOne', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'element name ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'ending with', 'ANY' ]);
    var parsingResult = SentenceParser.parse(lexingResult.slice(1), 'opFactAny');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual('OPEndsWith 1(2)\n  undefined\n  ANY 2\n');
    done();
    Model.releaseModel(theModel);
  });
});


var testDataOperators = [
  {
    sentence: 'more than 1234 sender',
    cattokens : ['more than', 'NUMBER', 'CAT'],
    startrule : 'MoreThanLessThanExactly',
    ast : 'OPMoreThan 0(2)\n  NUMBER 1\n  CAT 2\n'
  },
  {
    sentence: 'existing betriebende',
    cattokens :[ 'existing', 'CAT' ],
    startrule : 'MoreThanLessThanExactly',
    ast : 'OPExisting 0(1)\n  CAT 1\n'
  },
  {
    sentence: 'not existing betriebsende',
    cattokens : [ 'not existing', 'CAT' ],
    startrule : 'MoreThanLessThanExactly',
    ast : 'OPNotExisting 0(1)\n  CAT 1\n'
  },
  {
    sentence: 'gründungsjahr < 1950',
    cattokens : ['CAT', '<', 'ANY'],
    startrule : 'catListOpMore',
    ast : 'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPLT 1(2)\n      CAT 0\n      ANY 2\n'
  },
  {
    sentence: 'sender >= 20',
    cattokens : ['CAT', '>=', 'ANY'],
    startrule : 'catListOpMore',
    ast : 'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPGE 1(2)\n      CAT 0\n      ANY 2\n'
  }
];


it('testParseOperators', done => {
  expect.assertions(2 * testDataOperators.length);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    testDataOperators.forEach( (d,index) => {
      var s = d.sentence; //'more than 1234 sender';
      var res = Erbase.processString(s, theModel.rules, words);
      debuglog('res > ' + JSON.stringify(res, undefined, 2));
      var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
      var sStrings = lexingResult.map(t => t.image);
      debuglog(sStrings.join('\n'));
      expect(sStrings).toEqual(d.cattokens);
      //  [ 'more than', 'NUMBER', 'CAT' ]);
      var parsingResult = SentenceParser.parse(lexingResult.slice(0),
        d.startrule ); // 'MoreThanLessThanExactly');
      // /test.deepEqual(parsingResult, {})
      debuglog('\n' + Ast.astToText(parsingResult));

      expect(Ast.astToText(parsingResult)).toEqual(// 'OPMoreThan 0(2)\n  NUMBER 1\n  CAT 2\n'
        d.ast);
    });
    done();
    Model.releaseModel(theModel);
  });
});



it('testParseMoreThanS', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'more than 1234 sender';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'more than', 'NUMBER', 'CAT' ]);
    var parsingResult = SentenceParser.parse(lexingResult.slice(0), 'MoreThanLessThanExactly');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual('OPMoreThan 0(2)\n  NUMBER 1\n  CAT 2\n');
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseMoreThanXXOK', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with less than 3 standort BFBS';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'less than', 'NUMBER', 'CAT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPLessThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseMoreThanXX', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'more than', 'NUMBER', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseMoreThanXX1', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'more than', 'NUMBER', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


// TODO SAME WITH AND!
it('testParseMoreThanMT_MT', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with more than 3 standort , less than 2 sender';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'more than', 'NUMBER', 'CAT',
      'less than' ,
      'NUMBER', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPLessThan 5(2)\n      NUMBER 6\n      CAT 7\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseMoreThan_MT', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'more than', 'NUMBER', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testParseMoreThan_MT_F', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'sender with more than 3 standort, bfbs';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    expect(sStrings).toEqual([ 'CAT', 'with', 'more than', 'NUMBER', 'CAT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    expect(Ast.astToText(parsingResult)).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});

it('testcategoriesStartingWith', done => {
  expect.assertions(7);
  getModel().then((theModel) => {
    var s = 'categories starting with "elem" in domain IUPAC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    //  test.deepEqual(Ast.astToText(parsingResult),
    //  'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(r.sentences.length).toEqual(4);
    expect(r.asts.length).toEqual(4);
    expect(r.errors.length).toEqual(4);
    expect(
      r.asts.map((r, index) => (r) ? index : undefined).filter(a => a !== undefined).join('-')
    ).toEqual('0'); // 0-2
    expect(
      r.errors.map((r, index) => (r) ? index : undefined).filter(a => a !== undefined).join('-')
    ).toEqual('1-2-3');
    debuglog(r.sentences[0]);
    expect(Sentence.simplifyStringsWithBitIndex(r.sentences[0]).join('\n')).toEqual(
      'categories=>category/category C32\nstarting with=>starting with/operator/2 O512\nelem=>elem/any A4096\nin=>in/filler I512\ndomain=>domain/category C32\nIUPAC=>IUPAC/domain F32'
    );
    expect(Ast.astToText(r.asts[0])).toEqual(
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CAT 4\n      FACT 5\n'
    );
    /* expect(Ast.astToText(r.asts[2])).toEqual(
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 5\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    );*/
    done();
    Model.releaseModel(theModel);
  });
});


it('testparseSentenceToAstsCatCatCatParseText', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(Ast.astToText(r.asts[0])).toEqual(
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});



it('testparseCategoriesInDomainAlias', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var s = 'categories in  Fiori BOM';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    debuglog(()=> JSON.stringify(r));

    expect(Ast.astToText(r.asts[0])).toEqual(
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 2\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});



it('testparseSentenceToAstsCatAndCatForSthText', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var s = 'element symbol and atomic weight for gold';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(Ast.astToText(r.asts[0])).toEqual(
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'

      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 2\n  LIST -1(1)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


//"list all SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain',


it('testparseSentenceForFact1WithCatFact', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(r.errors[0]).toEqual(false);
    expect(Ast.astToText(r.asts[0])).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 2\n    OPEqIn -1(2)\n      CAT 4\n      FACT 5\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 6\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


it('testparseSentenceStartingWith', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction with SemanticObject starting with Sup';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(r.errors[0]).toEqual(false);
    expect(Ast.astToText(r.asts[0])).toEqual(
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(1)\n    OPStartsWith 4(2)\n      CAT 3\n      ANY 5\n'
    );
    done();
    Model.releaseModel(theModel);
  });
});


it('testparseSentenceToAstssError', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var s = 'semanticObject, SemanticAction, BSPName with UI5';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    expect(r.errors).toEqual([
      {
        'err_code': 'NO_KNOWN_WORD',
        'text': 'I do not understand "UI5".',
        'context': {
          'tokens': [
            'semanticObject',
            'SemanticAction',
            'BSPName',
            'with',
            'UI5'
          ],
          'token': 'UI5',
          'index': 4
        }
      }
    ]);
    done();
    Model.releaseModel(theModel);
  });
});


var testNumberVs = [
  {
    index : 0,
    sentence : 'element_name with less than 4444 element_number',
    res :[ {  strng : 'CAT with less than NUMBER CAT',
      ast:  'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPLessThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    },
    {  strng : 'CAT with less than NUMBER CAT',
      ast:  'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPLessThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    }]
  },
  {
    index : 1,
    sentence : 'element_name with less than 4 element_number',
    res :[ {  strng : 'CAT with less than FACT CAT',
      parseError : 'found',
      ast: 'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    },
    {  strng : 'CAT with less than FACT CAT',
      parseError : 'Integer',
      ast: 'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    }
    , 
    {  strng : 'CAT with less than FACT CAT',
      parseError : 'Integer',
      ast: 'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    }
    ]
  }
];

it('testNumberVsFact2', done => {
  expect.assertions(15);
  getModel().then((theModel) => {
    testNumberVs.forEach(( tst,index) => {
      var s = tst.sentence; //'element_name with less than 4 element_number';
      debuglog(s);
      var res = Erbase.processString(s, theModel.rules, words);
      debuglog('res > ' + JSON.stringify(res, undefined, 2));
      expect(res.sentences.length).toEqual(tst.res.length);
      for(var i = 0; i < tst.res.length; ++i) {
        var tstid = ''  + index + ' ' + tst.index + '/' + i ;
        var tsti = tst.res[i];
        s = res.sentences[i];
        var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
        var sStrings = lexingResult.map(t => t.image);
        debuglog(tstid + ' strng : ' + sStrings.join('\n'));
        expect(sStrings.join(' ')).toEqual(tsti.strng);
        try { 
          var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
          // /test.deepEqual(parsingResult, {})
          debuglog(index + ' ' +  tst.index + '/' + i  + ' \n ast: ' + JSON.stringify(Ast.astToText(parsingResult)));
          expect(Ast.astToText(parsingResult)).toEqual( tsti.ast
          );
        } catch( e) {
          debuglog(index + ' ' +  tst.index + '/' + i  + ' \n ast err : ' + e  + ' contains ? ' + tsti.parseError);
          expect(!!e).toEqual(!!tsti.parseError);
          expect(JSON.stringify(e).indexOf(tsti.parseError) >= 0).toEqual(true);
        }
      }
      Model.releaseModel(theModel);
      done();
    });
  });
});
    


/*
describe Application Component
list all AppIds for FI-FIO-GL with ApplicationType "Reuse Component"
list all Application Component, BSPName, ODataService, fiori intent for maintain
list all Application Components starting with FIN-
list all ApplicationTypes for #GLAccount-manage
List all appNames in ApplicationComponent PLM-FIO-RCP
list all BSP Urls for ui.ssuite.s2p.mm.pur.po.create.s1
list all categories
list all element names starting with ni
list all element names starting with ni in domain IUPAC
list all example commands
list all fiori intents in FIN-FIO-CCD with ApplicationType Analytical
list all hints
list all intents for FI-FIO-GL with ApplicationType "FPM/WebDynpro"
list all OData Services for retail.store.stockcorrection
List all ODataServices for FI-FIO-GL
make table with AppId, "fiori intent", ApplicationComponent, AppName, BusinessRoleName, BSPName
Show me #RequestForQuotation-manage
what are the sanitation facilities in tuvalu
what is the "ui5 component name" for fiori intent #RequestForQuotation-manage
what is the ApplicationComponent for sap.cus.sd.lib.processflow
what is the ApplicationType for #ControllingDocument-setControllingArea
What is the BSPName for Fiori App "Manage Labels"
what is the element name for element number 117
What is the TransactionCode for Fiori App "Manage Labels"
*/
