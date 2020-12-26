/**
 * @file erbase.test.js
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('erbase.test');

const Erbase = require(root + '/match/erbase.js');

const Sentence = require(root + '/match/sentence.js');

const utils = require('abot_utils');

const InputFilter = require(root + '/match/inputFilter.js');

const Model = require(root + '/model/index_model.js').Model;
const MongoUtils = require(root + '/model/index_model.js').MongoUtils;

var getModel = require(root + '/model/testmodels.js').getTestModel1;

function getRules() {
  return getModel().then(
    (model) => {
      return Promise.resolve([model.rules, model]);
    }
  )
}


function releaseRules(theModel) {
  Model.releaseModel(theModel);
}


process.on('unhandledRejection', function onError(err) {
  console.log('erbase.nunit.js');
  console.log(err);
  console.log(err.stack);
  throw err;
});


//var ptheModelHandle = Model.loadModelHandleP();


//var theModelX = theModel; // Model.loadModels('testmodel',true);


var words = {};

function setMockDebug() {
  var obj = function (s) {
    //console.log(s);
  };
  obj.enabled = true;
  Erbase.mockDebug(obj);
}
if (!debuglog.enabled) {
  setMockDebug();
}


it("testEvaluteRangeRulesToPosition", done => {
  var tokens = ["ABC", "def"];
  var fusable = [false, true, false];

  var innerRule = {
    type: 0,
    matchedString: "AbC DeF",
    lowercaseword: "abc def",
    category: 'uboat',
    _ranking: 777
  };

  var categorizedWords = [
    [],
    [{
      word: "DEF", category: "irrelevant",
      _ranking: 111,
      rule: {
        range: {
          low: -1, high: 0,
          rule: innerRule
        }
      }
    }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens, fusable, categorizedWords);
  expect(categorizedWords).toEqual([[
    {
      string: "ABC def",
      matchedString: "AbC DeF",
      category: "uboat",
      _ranking: 777,
      span: 2,
      rule: innerRule
    }]
    , []
  ]);
  done();
})

var r = [
  { "category": "category", "matchedString": "fiori intent", "bitindex": 4, "word": "intent", "type": 0, "lowercaseword": "intent", "_ranking": 0.95, "range": { "low": -1, "high": 0, "rule": { "category": "category", "matchedString": "fiori intent", "type": 0, "word": "fiori intents", "bitindex": 4, "_ranking": 0.95, "lowercaseword": "fiori intents" } } },
  { "category": "category", "matchedString": "fiori intent", "bitindex": 4, "word": "intent", "type": 0, "lowercaseword": "intent", "_ranking": 0.95, "range": { "low": -1, "high": 0, "rule": { "category": "category", "matchedString": "fiori intent", "type": 0, "word": "fiori intent", "lowercaseword": "fiori intent", "bitindex": 4, "_ranking": 0.95 } } }];


it("testEvaluteRangeRulesToPositionSloppyMatch", done => {
  var tokens = ["ABC", "duf"];
  var fusable = [false, true, false];

  var innerRule = {
    type: 0,
    matchedString: "AbC DeF",
    lowercaseword: "abc def",
    category: 'uboat',
    _ranking: 777
  };

  var categorizedWords = [
    [],
    [{
      word: "DEF", category: "irrelevant",
      _ranking: 111,
      rule: {
        range: {
          low: -1, high: 0,
          rule: innerRule
        }
      }
    }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens, fusable, categorizedWords);
  expect(categorizedWords).toEqual([[{
    string: 'ABC duf',
    rule:
    {
      type: 0,
      matchedString: 'AbC DeF',
      lowercaseword: 'abc def',
      category: 'uboat',
      _ranking: 777
    },
    matchedString: 'AbC DeF',
    category: 'uboat',
    _ranking: 748.8333685768661,
    levenmatch: 0.9637495091079358,
    span: 2
  }],
  []]);
  done();
})



it("testEvaluteRangeRulesToPositionVerySloppyMatch", done => {
  var tokens = ["XXX", "def"];
  var fusable = [false, true, false];

  var innerRule = {
    type: 0,
    matchedString: "AbC DeF",
    lowercaseword: "abc def",
    category: 'uboat',
    _ranking: 777
  };

  var categorizedWords = [
    [],
    [{
      word: "DEF", category: "irrelevant",
      _ranking: 111,
      rule: {
        range: {
          low: -1, high: 0,
          rule: innerRule
        }
      }
    }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens, fusable, categorizedWords);
  expect(categorizedWords).toEqual([[], []]);
  done();
})

//export function evaluateRangeRulesToPosition(tokens: string[], fusable : boolean[], categorizedWords : IMatch.ICategorizedStringRanged[][]) {


function simplifyStrings(res) {
  return res.map(function (r) {
    return r.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') })
  });
}

function simplifyStringsWithBitIndex(res) {
  return res.map(function (r) {
    return Sentence.simplifyStringsWithBitIndex(r);
    //  return r.map(word =>  { return word.string + '=>' +  word.matchedString + '/' + word.category + (word.span? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`})
  });
}

function simplifySentence(res) {
  return res.map(function (r) {
    return r.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') })
  });
}



var getRules2 = getRules;
//var getRulesX = getRules;

//dvar theModel = undefined;


/*

exports.group = {
  setup: function(callback) {
    Model.loadModelHandleP().then(
      (modelHandle) => {
        aModelHandle = modelHandle;
        theModel = aModelHandle.model;
        if(typeof callback === 'function') {
          callback();
        }
      }
    )
  },
  teardown : function(callback) {
    theModel = undefined;
    MongoUtils.disconnect(aModelHandle.srcHandle);
  },
  */

it("testTokenizeStringElNames", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString('elament names b', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.categorizedWords)).toEqual([[],
    ['names=>element name/category C16',
      'names=>element name/category F32',
      'names=>element name/category C64',
      'names=>sender/category C2',
      'names=>sender/category F32'],
    ['b=>B/element symbol F16']]);
    done();
    releaseRules(srcHandle);
  });
});




it("testTokenizeStringElNamesAlpha", done => {

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString('Alpha Cantauri B', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.categorizedWords)).toEqual([[], [], ['B=>B/element symbol']]);
    done();
    releaseRules(srcHandle);
  });
});

function canonicSort(arrofarr) {
  var res = [];
  for (var idx in arrofarr) {
    arrofarr[idx].sort();
  }
  return arrofarr;
}


it("testTokenizeTCodeGRM3", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString(' Application Component, fiori intent, Backendcatalog for GRM3.', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([['Application Component=>ApplicationComponent/category/2 C4',
      'Application Component=>ApplicationComponent/category/2 C8',
      'Application Component=>ApplicationComponent/category/2 F32'],
    ['Component=>ApplicationComponent/category C4',
      'Component=>ApplicationComponent/category C8',
      'Component=>ApplicationComponent/category F32'],
    ['fiori intent=>fiori intent/category/2 C4',
      'fiori intent=>fiori intent/category/2 C8',
      'fiori intent=>fiori intent/category/2 F32'],
    ['intent=>fiori intent/category C4',
      'intent=>fiori intent/category C8',
      'intent=>fiori intent/category F32'],
    ['Backendcatalog=>BackendCatalogId/category C8',
      'Backendcatalog=>BackendCatalogId/category F32'],
    ['for=>for/filler I512'],
    ['GRM3=>GRM3/TransactionCode F4',
      'GRM3=>GRM3/TransactionCode F8',
      'GRM3=>GRM3/appId F4']]);
    done();
    releaseRules(srcHandle);
  });
});

it("testContaining2CCNoAlias", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fiori apps, support component with \"fiori app\" containing \"ampi\" and ApplicationComponent containing \"FIO\"';
    var res = Erbase.processString(s, rules, words );
    // 'SemanticObject, SemanticAction with SemanticObject starting with Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));


    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'fiori apps=>AppName/category/2 C4',
    'support component=>ApplicationComponent/category/2 C4',
    'with=>with/filler I512',
    'fiori app=>AppName/category C4',
    'containing=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category C4',
    'containing=>containing/operator O512',
    'FIO=>FIO/any A4096' ],
  [ 'fiori apps=>AppName/category/2 F32',
    'support component=>ApplicationComponent/category/2 F32',
    'with=>with/filler I512',
    'fiori app=>AppName/category F32',
    'containing=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category F32',
    'containing=>containing/operator O512',
    'FIO=>FIO/any A4096' ] ]);
    done();
    releaseRules(srcHandle);
  });
});

// TODO contains yield empty!
it("testContains2CC", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fiori apps, support component with \"fiori app\" contains \"ampi\" and ApplicationComponent contains \"FIO\"';
    var res = Erbase.processString(s, rules, words );
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'fiori apps=>AppName/category/2 C4',
    'support component=>ApplicationComponent/category/2 C4',
    'with=>with/filler I512',
    'fiori app=>AppName/category C4',
    'contains=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category C4',
    'contains=>containing/operator O512',
    'FIO=>FIO/any A4096' ],
  [ 'fiori apps=>AppName/category/2 F32',
    'support component=>ApplicationComponent/category/2 F32',
    'with=>with/filler I512',
    'fiori app=>AppName/category F32',
    'contains=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category F32',
    'contains=>containing/operator O512',
    'FIO=>FIO/any A4096' ] ]);
    done();
    releaseRules(srcHandle);
  });
});



it("testContaining2XAS", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fioriapps, support component with \"fiori app\" containing "ampi" and  ApplicationComponent containing "FIO"';
{
    var res = Erbase.processString(s, rules, words );
    // 'SemanticObject, SemanticAction with SemanticObject starting with Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));


    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'fioriapps=>AppName/category C4',
    'support component=>ApplicationComponent/category/2 C4',
    'with=>with/filler I512',
    'fiori app=>AppName/category C4',
    'containing=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category C4',
    'containing=>containing/operator O512',
    'FIO=>FIO/any A4096' ],
  [ 'fioriapps=>AppName/category F32',
    'support component=>ApplicationComponent/category/2 F32',
    'with=>with/filler I512',
    'fiori app=>AppName/category F32',
    'containing=>containing/operator O512',
    'ampi=>ampi/any A4096',
    'and=>and/filler I512',
    'ApplicationComponent=>ApplicationComponent/category F32',
    'containing=>containing/operator O512',
    'FIO=>FIO/any A4096' ] ]);

}
done();
    releaseRules(srcHandle);
  });
});


it("testContains2XAC", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fiori apps, support component with \"fiori app\" contains \"ampi\" and ApplicationComponent contains \"FIO\"';
    var res = Erbase.tokenizeString(s, rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([ [ 'fiori apps=>AppName/category/2 C4',
    'fiori apps=>AppName/category/2 F32' ],
  [],
  [ 'support component=>ApplicationComponent/category/2 C4',
    'support component=>ApplicationComponent/category/2 C8',
    'support component=>ApplicationComponent/category/2 F32' ],
  [ 'component=>ApplicationComponent/category C4',
    'component=>ApplicationComponent/category C8',
    'component=>ApplicationComponent/category F32' ],
  [ 'with=>with/filler I512' ],
  [ 'fiori app=>AppName/category C4',
    'fiori app=>AppName/category F32' ],
  [ 'contains=>containing/operator O512' ],
  [],
  [ 'and=>and/filler I512' ],
  [ 'ApplicationComponent=>ApplicationComponent/category C4',
    'ApplicationComponent=>ApplicationComponent/category C8',
    'ApplicationComponent=>ApplicationComponent/category F32' ],
  [ 'contains=>containing/operator O512' ],
  [] ]);
    done();
    releaseRules(srcHandle);
  });
});

it("testContains21xNQ", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fiori apps, support component witj ApplicationComponent contains sdfs';
    var res = Erbase.tokenizeString(s, rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([ [ 'fiori apps=>AppName/category/2 C4',
    'fiori apps=>AppName/category/2 F32' ],
  [],
  [ 'support component=>ApplicationComponent/category/2 C4',
    'support component=>ApplicationComponent/category/2 C8',
    'support component=>ApplicationComponent/category/2 F32' ],
  [ 'component=>ApplicationComponent/category C4',
    'component=>ApplicationComponent/category C8',
    'component=>ApplicationComponent/category F32' ],
  [],
  [ 'ApplicationComponent=>ApplicationComponent/category C4',
    'ApplicationComponent=>ApplicationComponent/category C8',
    'ApplicationComponent=>ApplicationComponent/category F32' ],
  [ 'contains=>containing/operator O512' ],
  [] ]);
    done();
    releaseRules(srcHandle);
  });
});


it("testContains2XACNQ", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'fiori apps, support component with \"fiori app\" contains ampi and ApplicationComponent contains FIO     ApplicationComponent starting with FIO';
    var res = Erbase.tokenizeString(s, rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([ [ 'fiori apps=>AppName/category/2 C4',
    'fiori apps=>AppName/category/2 F32' ],
  [],
  [ 'support component=>ApplicationComponent/category/2 C4',
    'support component=>ApplicationComponent/category/2 C8',
    'support component=>ApplicationComponent/category/2 F32' ],
  [ 'component=>ApplicationComponent/category C4',
    'component=>ApplicationComponent/category C8',
    'component=>ApplicationComponent/category F32' ],
  [ 'with=>with/filler I512' ],
  [ 'fiori app=>AppName/category C4',
    'fiori app=>AppName/category F32' ],
  [ 'contains=>containing/operator O512' ],
  [],
  [ 'and=>and/filler I512' ],
  [ 'ApplicationComponent=>ApplicationComponent/category C4',
    'ApplicationComponent=>ApplicationComponent/category C8',
    'ApplicationComponent=>ApplicationComponent/category F32' ],
  [ 'contains=>containing/operator O512' ],
  [],
  [ 'ApplicationComponent=>ApplicationComponent/category C4',
    'ApplicationComponent=>ApplicationComponent/category C8',
    'ApplicationComponent=>ApplicationComponent/category F32' ],
  [ 'starting with=>starting with/operator/2 O512' ],
  [ 'with=>with/filler I512' ],
  [] ]);
    done();
    releaseRules(srcHandle);
  });
});



it("testTokenizeNE", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString('1, != =', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual(
      [['1=>1/element number F16', '1=>1/number N512'],
      ['!==>!=/operator O512'],
      ['==>=/operator O512']
    ]);
    done();
    releaseRules(srcHandle);
  });
});


it("testTokenizeInteger", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString('1, 1234 .', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([['1=>1/element number F16', '1=>1/number N512'],
    ['1234=>1234/number N512']]);
    done();
    releaseRules(srcHandle);
  });
});

it("testTokenizeIntegers", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString(' Application Component, 1, 2, and, or, 3, 4, 10, 12, 15, 203, 2034, one, two.', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(canonicSort(simplifyStringsWithBitIndex(res.categorizedWords))).toEqual([['Application Component=>ApplicationComponent/category/2 C4',
      'Application Component=>ApplicationComponent/category/2 C8',
      'Application Component=>ApplicationComponent/category/2 F32'],
    ['Component=>ApplicationComponent/category C4',
      'Component=>ApplicationComponent/category C8',
      'Component=>ApplicationComponent/category F32'],
    ['1=>1/element number F16', '1=>1/number N512'],
    ['2=>2/element number F16', '2=>2/number N512'],
    ['and=>and/filler I512'],
    [],
    ['3=>3/element number F16', '3=>3/number N512'],
    ['4=>4/element number F16', '4=>4/number N512'],
    ['10=>10/element number F16', '10=>10/number N512'],
    ['12=>12/element number F16', '12=>12/number N512'],
    ['15=>15/element number F16', '15=>15/number N512'],
    ['203=>203/number N512'],
    ['2034=>2034/number N512'],
    ['one=>one/number N512'],
    ['two=>two/number N512']]);
    done();
    releaseRules(srcHandle);
  });
});


it("testTokenizeCategoriesIn", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.tokenizeString('categories in Fiori BOM', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.categorizedWords)).toEqual([['categories=>category/category C32',
      'categories=>category/category F32',
      'categories=>category/category C256'],
    ['in=>In/element symbol F16', 'in=>in/filler I512'],
    ['Fiori BOM=>FioriBOM/domain/2 D4',
      'Fiori BOM=>FioriBOM/domain/2 F32'],
    []]);
    done();
    releaseRules(srcHandle);
  });
});

it("testProcessStringCatDomainSynonym", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var s = 'categories in Fiori BOM';
    var res = Erbase.processString(s, rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['categories=>category/category C32',
      'in=>in/filler I512',
      'Fiori BOM=>FioriBOM/domain/2 F32'],
    ['categories=>category/category F32',
      'in=>in/filler I512',
      'Fiori BOM=>FioriBOM/domain/2 F32']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringAmbigQuery", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'ApplicationComponent, devclass, BackEndCatalogId for TransactionCode S_ALR_87012394 ';

    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var restok = Erbase.tokenizeString(s, rules, words);
    debuglog('res > ' + JSON.stringify(restok, undefined, 2));
    expect(simplifyStringsWithBitIndex(restok.categorizedWords)).toEqual([['ApplicationComponent=>ApplicationComponent/category C4',
      'ApplicationComponent=>ApplicationComponent/category C8',
      'ApplicationComponent=>ApplicationComponent/category F32'],
    ['devclass=>devclass/category C8',
      'devclass=>devclass/category F32',
      'devclass=>devclass/category C128'],
    ['BackEndCatalogId=>BackendCatalogId/category C8',
      'BackEndCatalogId=>BackendCatalogId/category F32'],
    ['for=>for/filler I512'],
    ['TransactionCode=>TransactionCode/category C4',
      'TransactionCode=>TransactionCode/category C8',
      'TransactionCode=>TransactionCode/category F32'],
    ['S_ALR_87012394=>S_ALR_87012394/appId F4',
      'S_ALR_87012394=>S_ALR_87012394/TransactionCode F4',
      'S_ALR_87012394=>S_ALR_87012394/TransactionCode F8']]);


    var res = Erbase.processString(s, rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['ApplicationComponent=>ApplicationComponent/category C8',
      'devclass=>devclass/category C8',
      'BackEndCatalogId=>BackendCatalogId/category C8',
      'for=>for/filler I512',
      'TransactionCode=>TransactionCode/category C8',
      'S_ALR_87012394=>S_ALR_87012394/TransactionCode F8']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringAmbigQuery", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;
    var s = 'ApplicationComponent, devclass, BackEndCatalogId for TransactionCode S_ALR_87012394 ';

    var res = Erbase.processString(s, rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    Sentence.dumpNiceArr(res.sentences);
    // test a number of Sentence
    res.sentences.forEach(s => {
      Sentence.dumpNice(s);
      Sentence.dumpNiceRuled(s);
      Sentence.dumpNiceBitIndexed(s);
      Sentence.simplifyStringsWithBitIndex(s);
    });

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['ApplicationComponent=>ApplicationComponent/category C8',
      'devclass=>devclass/category C8',
      'BackEndCatalogId=>BackendCatalogId/category C8',
      'for=>for/filler I512',
      'TransactionCode=>TransactionCode/category C8',
      'S_ALR_87012394=>S_ALR_87012394/TransactionCode F8']]);
    done();
    releaseRules(srcHandle);
  });
});

it("testProcessStringelementNames", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('elaement names nickel ', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['elaement names=>element name/category/2 C16',
      'nickel=>nickel/element name F16']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringCatQuery1", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var s = 'ApplicationComponent with ApplicaitonComponent W0052';
    var res = Erbase.processString(s, rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['ApplicationComponent=>ApplicationComponent/category C4',
      'with=>with/filler I512',
      'ApplicaitonComponent=>ApplicationComponent/category C4',
      'W0052=>W0052/appId F4']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringCatQuery", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['SemanticObject=>SemanticObject/category C4',
      'SemanticAction=>SemanticAction/category C4',
      'BSPName=>BSPName/category C4',
      'ApplicationComponent=>ApplicationComponent/category C4',
      'with=>with/filler I512',
      'ApplicaitonComponent=>ApplicationComponent/category C4',
      'CO-FIO=>CO-FIO/ApplicationComponent F4',
      'appId=>appId/category C4',
      'W0052=>W0052/appId F4',
      'SAP_TC_FIN_CO_COMMON=>SAP_TC_FIN_CO_COMMON/TechnicalCatalog F4']]);
    done();
    releaseRules(srcHandle);
  });
});


it("testTokenizeStringStartingWith", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.tokenizeString('SemanticObject, SemanticAction with SemanticObject starting with Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(res.categorizedWords[4]).toEqual([{
      string: 'starting with',
      matchedString: 'starting with',
      category: 'operator',
      rule:
      {
        category: 'operator',
        word: 'starting with',
        lowercaseword: 'starting with',
        type: 0,
        matchedString: 'starting with',
        bitindex: 512,
        bitSentenceAnd: 511,
        wordType: 'O',
        _ranking: 0.9
      },
      _ranking: 0.9,
      span: 2
    }]);

    done();
    releaseRules(srcHandle);
  });
});


it("testProcessStringStartingWith", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('SemanticObject, SemanticAction with SemanticObject starting with Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));


    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['SemanticObject=>SemanticObject/category C4',
      'SemanticAction=>SemanticAction/category C4',
      'with=>with/filler I512',
      'SemanticObject=>SemanticObject/category C4',
      'starting with=>starting with/operator/2 O512',
      'Sup=>Sup/any A4096'],
    ['SemanticObject=>SemanticObject/category C8',
      'SemanticAction=>SemanticAction/category C8',
      'with=>with/filler I512',
      'SemanticObject=>SemanticObject/category C8',
      'starting with=>starting with/operator/2 O512',
      'Sup=>Sup/any A4096'],
    ['SemanticObject=>SemanticObject/category F32',
      'SemanticAction=>SemanticAction/category F32',
      'with=>with/filler I512',
      'SemanticObject=>SemanticObject/category F32',
      'starting with=>starting with/operator/2 O512',
      'Sup=>Sup/any A4096']]);
    expect(res.sentences[0][5]).toEqual({
      string: 'Sup',
      matchedString: 'Sup',
      category: 'any',
      rule:
      {
        category: 'any',
        word: 'Sup',
        lowercaseword: 'sup',
        type: 0,
        matchedString: 'Sup',
        exactOnly: true,
        bitindex: 4096,
        bitSentenceAnd: 4095,
        wordType: 'A',
        _ranking: 0.9
      },
      _ranking: 0.9
    });


    done();
    releaseRules(srcHandle);
  });
});


it("testProcessStringContainsOK", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('SemanticObject contains Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'SemanticObject=>SemanticObject/category C4',
    'contains=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category C8',
    'contains=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category F32',
    'contains=>containing/operator O512',
    'Sup=>Sup/any A4096' ] ]);
    releaseRules(srcHandle);
    done();
  });
});

it("testProcessStringContainingOK", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('SemanticObject containing Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'SemanticObject=>SemanticObject/category C4',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category C8',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category F32',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ] ]);
    releaseRules(srcHandle);
    done();
  });
});


it("testProcessStringContains", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('SemanticObject, SemanticAction with SemanticObject containing Sup', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'SemanticObject=>SemanticObject/category C4',
    'SemanticAction=>SemanticAction/category C4',
    'with=>with/filler I512',
    'SemanticObject=>SemanticObject/category C4',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category C8',
    'SemanticAction=>SemanticAction/category C8',
    'with=>with/filler I512',
    'SemanticObject=>SemanticObject/category C8',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ],
  [ 'SemanticObject=>SemanticObject/category F32',
    'SemanticAction=>SemanticAction/category F32',
    'with=>with/filler I512',
    'SemanticObject=>SemanticObject/category F32',
    'containing=>containing/operator O512',
    'Sup=>Sup/any A4096' ] ]);
    releaseRules(srcHandle);
    done();
  });
});


it("testWithMoreThan3", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.tokenizeString('12 with more than standort', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(res.categorizedWords[0]).toEqual([{
      string: '12',
      matchedString: '12',
      category: 'element number',
      rule:
      {
        category: 'element number',
        matchedString: '12',
        type: 0,
        word: '12',
        bitindex: 16,
        bitSentenceAnd: 16,
        exactOnly: false,
        wordType: 'F',
        _ranking: 0.95,
        lowercaseword: '12'
      },
      _ranking: 0.95
    },
    {
      string: '12',
      matchedString: '12',
      rule:
      {
        category: 'number',
        matchedString: 'one',
        type: 1,
        regexp: {},
        matchIndex: 0,
        word: '<number>',
        bitindex: 512,
        wordType: 'N',
        bitSentenceAnd: 511,
        _ranking: 0.95
      },
      category: 'number',
      _ranking: 0.95
    }]);

    expect(res.categorizedWords[1]).toEqual([ { string: 'with',
    matchedString: 'with',
    category: 'filler',
    rule:
     { category: 'filler',
       type: 0,
       word: 'with',
       lowercaseword: 'with',
       matchedString: 'with',
       exactOnly: true,
       bitindex: 512,
       bitSentenceAnd: 511,
       wordType: 'I',
       _ranking: 0.9 },
    _ranking: 0.9 } ]);
    expect(res.categorizedWords[2]).toEqual([ { string: 'more than',
    matchedString: 'more than',
    category: 'operator',
    rule:
     { category: 'operator',
       word: 'more than',
       lowercaseword: 'more than',
       type: 0,
       matchedString: 'more than',
       bitindex: 512,
       bitSentenceAnd: 511,
       wordType: 'O',
       _ranking: 0.9 },
    _ranking: 0.9,
    span: 2 } ]);
    expect(res.categorizedWords[3]).toEqual([]);
    expect(res.categorizedWords[4]).toEqual([{
      string: 'standort',
      matchedString: 'standort',
      category: 'category',
      rule:
      {
        category: 'category',
        matchedString: 'standort',
        type: 0,
        word: 'standort',
        lowercaseword: 'standort',
        bitindex: 2,
        wordType: 'C',
        bitSentenceAnd: 2,
        _ranking: 0.95
      },
      _ranking: 0.95
    },
    {
      string: 'standort',
      matchedString: 'standort',
      category: 'category',
      rule:
      {
        category: 'category',
        matchedString: 'standort',
        type: 0,
        word: 'standort',
        bitindex: 32,
        bitSentenceAnd: 32,
        exactOnly: false,
        wordType: 'F',
        _ranking: 0.95,
        lowercaseword: 'standort'
      },
      _ranking: 0.95
    }]);
    expect(res.categorizedWords[5]).toEqual(undefined);

    var res = Erbase.processString('12 with more than standort', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ '12=>12/number N512',
    'with=>with/filler I512',
    'more than=>more than/operator/2 O512',
    'standort=>standort/category C2' ],
  [ '12=>12/number N512',
    'with=>with/filler I512',
    'more than=>more than/operator/2 O512',
    'standort=>standort/category F32' ] ]);

    done();
    releaseRules(srcHandle);
  });
});

it("testWithSmallerOp", done => {
  getRules().then((args) => {
    var [rules, model] = args;
    var res = Erbase.processString('sendertyp gründungsjahr < 133434 sender', rules, words, model.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'sendertyp=>sendertyp/category C2',
    'gründungsjahr=>gründungsjahr/category C2',
    '<=></operator O512',
    '133434=>133434/any A4096',
    'sender=>sender/category C2' ] ]);

    done();
    releaseRules(model);
  });
});


it("testWithLessThanxxxx", done => {
  getRules().then((args) => {
    var [rules, model] = args;
    var res = Erbase.processString('12 with less than 13 standort', rules, words, model.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ '12=>12/number N512',
    'with=>with/filler I512',
    'less than=>less than/operator/2 O512',
    '13=>13/number N512',
    'standort=>standort/category C2' ] ]);

    done();
    releaseRules(model);
  });
});


var operatorTestCases = {
  '12 with less than 13 standort': [['12=>12/number N512',
    'with=>with/filler I512',
    'less than=>less than/operator/2 O512',
    '13=>13/number N512',
    'standort=>standort/category C2']],
  "gründungsjahr < 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '<=></operator O512',
  '1972=>1972/any A4096' ] ],
  "gründungsjahr <= 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '<==><=/operator O512',
  '1972=>1972/any A4096' ] ],
  "gründungsjahr != 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '!==>!=/operator O512',
  '1972=>1972/any A4096' ] ],
  "gründungsjahr = 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '==>=/operator O512',
  '1972=>1972/any A4096' ] ],
  "gründungsjahr > 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '>=>>/operator O512',
  '1972=>1972/any A4096' ] ],
  "gründungsjahr > 178344": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '>=>>/operator O512',
  '178344=>178344/any A4096' ] ],
  "gründungsjahr > ADF": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '>=>>/operator O512',
  'ADF=>ADF/any A4096' ] ],
  "gründungsjahr >= 1972": [ [ 'gründungsjahr=>gründungsjahr/category C2',
  '>==>>=/operator O512',
  '1972=>1972/any A4096' ] ],
  "not existing betriebsjahr": [],
  "not existing caesium": [],
  "not existing element name": [['not existing=>not existing/operator/2 O512',
    'element name=>element name/category/2 C16'],
  ['not existing=>not existing/operator/2 O512',
    'element name=>element name/category/2 C64'],
  ['not=>No/element symbol F16',
    'existing=>existing/operator O512',
    'element name=>element name/category/2 C16'],
  ['not existing=>not existing/operator/2 O512',
    'element name=>element number/category/2 C16'],
  ['not=>No/element symbol F16',
    'existing=>existing/operator O512',
    'element name=>element number/category/2 C16'] ],
    "existing betriebsende" : [['existing=>existing/operator O512',
      'betriebsende=>betriebsende/category C2']],
    "order by sendertyp" : [ [ 'order by=>order by/operator/2 O512',
    'sendertyp=>sendertyp/category C2' ] ],
    "order by gründungsjahr" : [ [ 'order by=>order by/operator/2 O512',
    'gründungsjahr=>gründungsjahr/category C2' ] ],
    "order descending by sender" : [ [ 'order descending by=>order descending by/operator/3 O512',
    'sender=>sender/category C2' ] ],
    "order by caesium" : [],
    "order by element number" : [['order by=>order by/operator/2 O512',
      'element number=>element number/category/2 C16'],
    ['order by=>order by/operator/2 O512',
      'element number=>element name/category/2 C16'],
    ['order by=>order by/operator/2 O512',
      'element number=>element name/category/2 C64']]
};


it("testOperators", done => {
  getRules().then((args) => {
    var [rules, model] = args;
    Object.getOwnPropertyNames(operatorTestCases).forEach(key => {
      var sentence = key;
      var result = operatorTestCases[key];
      var res = Erbase.processString(sentence, rules, words, model.operators);
      debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
      expect(simplifyStringsWithBitIndex(res.sentences)).toEqual(result);
    });
    done();
    releaseRules(model);
  });
});
it("testWithMoreThanoNC", done => {
  getRules().then((args) => {
    var [rules, model] = args;
    var res = Erbase.processString('which has more than 13 standort', rules, words, model.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'which has more than=>more than/operator/4 O512',
    '13=>13/number N512',
    'standort=>standort/category C2' ],
  [ 'which has more than=>less than/operator/4 O512',
    '13=>13/number N512',
    'standort=>standort/category C2' ] ]);

    done();
    releaseRules(model);
  });
});

it("testWithMoreThanoNF", done => {
  getRules().then((args) => {
    var [rules, model] = args;
    var res = Erbase.processString('with more than 13 berlin', rules, words, model.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([]);

    done();
    releaseRules(model);
  });
});


it("testWithMoreThan0o2", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.tokenizeString('12 with more than 13 standort', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(res.categorizedWords[0]).toEqual([{
      string: '12',
      matchedString: '12',
      category: 'element number',
      rule:
      {
        category: 'element number',
        matchedString: '12',
        type: 0,
        word: '12',
        bitindex: 16,
        bitSentenceAnd: 16,
        exactOnly: false,
        wordType: 'F',
        _ranking: 0.95,
        lowercaseword: '12'
      },
      _ranking: 0.95
    },
    {
      string: '12',
      matchedString: '12',
      rule:
      {
        category: 'number',
        matchedString: 'one',
        type: 1,
        regexp: {},
        matchIndex: 0,
        word: '<number>',
        bitindex: 512,
        wordType: 'N',
        bitSentenceAnd: 511,
        _ranking: 0.95
      },
      category: 'number',
      _ranking: 0.95
    }]);

    expect(res.categorizedWords[1]).toEqual([ { string: 'with',
    matchedString: 'with',
    category: 'filler',
    rule:
     { category: 'filler',
       type: 0,
       word: 'with',
       lowercaseword: 'with',
       matchedString: 'with',
       exactOnly: true,
       bitindex: 512,
       bitSentenceAnd: 511,
       wordType: 'I',
       _ranking: 0.9 },
    _ranking: 0.9 } ]);
    expect(res.categorizedWords[2]).toEqual([ { string: 'more than',
    matchedString: 'more than',
    category: 'operator',
    rule:
     { category: 'operator',
       word: 'more than',
       lowercaseword: 'more than',
       type: 0,
       matchedString: 'more than',
       bitindex: 512,
       bitSentenceAnd: 511,
       wordType: 'O',
       _ranking: 0.9 },
    _ranking: 0.9,
    span: 2 } ]);
    expect(res.categorizedWords[3]).toEqual([]);
    expect(res.categorizedWords[4]).toEqual([{
      string: '13',
      matchedString: '13',
      category: 'element number',
      rule:
      {
        category: 'element number',
        matchedString: '13',
        type: 0,
        word: '13',
        bitindex: 16,
        bitSentenceAnd: 16,
        exactOnly: false,
        wordType: 'F',
        _ranking: 0.95,
        lowercaseword: '13'
      },
      _ranking: 0.95
    },
    {
      string: '13',
      matchedString: '13',
      rule:
      {
        category: 'number',
        matchedString: 'one',
        type: 1,
        regexp: {},
        matchIndex: 0,
        word: '<number>',
        bitindex: 512,
        wordType: 'N',
        bitSentenceAnd: 511,
        _ranking: 0.95
      },
      category: 'number',
      _ranking: 0.95
    }]);
    expect(res.categorizedWords[5]).toEqual([{
      string: 'standort',
      matchedString: 'standort',
      category: 'category',
      rule:
      {
        category: 'category',
        matchedString: 'standort',
        type: 0,
        word: 'standort',
        lowercaseword: 'standort',
        bitindex: 2,
        wordType: 'C',
        bitSentenceAnd: 2,
        _ranking: 0.95
      },
      _ranking: 0.95
    },
    {
      string: 'standort',
      matchedString: 'standort',
      category: 'category',
      rule:
      {
        category: 'category',
        matchedString: 'standort',
        type: 0,
        word: 'standort',
        bitindex: 32,
        bitSentenceAnd: 32,
        exactOnly: false,
        wordType: 'F',
        _ranking: 0.95,
        lowercaseword: 'standort'
      },
      _ranking: 0.95
    }]);

    var res = Erbase.processString('12 with more than 13 standort', rules, words, srcHandle.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ '12=>12/number N512',
    'with=>with/filler I512',
    'more than=>more than/operator/2 O512',
    '13=>13/number N512',
    'standort=>standort/category C2' ] ]);

    done();
    releaseRules(srcHandle);
  });
});


it("testWithMoreThan", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.tokenizeString('sender, standort with standort more than 12 standorten', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(res.categorizedWords[4]).toEqual([ { string: 'more than',
    matchedString: 'more than',
    category: 'operator',
    rule:
     { category: 'operator',
       word: 'more than',
       lowercaseword: 'more than',
       type: 0,
       matchedString: 'more than',
       bitindex: 512,
       bitSentenceAnd: 511,
       wordType: 'O',
       _ranking: 0.9 },
    _ranking: 0.9,
    span: 2 } ]);

    var res = Erbase.processString('sender, standort with standort more than 12 standorten', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'sender=>sender/category C2',
    'standort=>standort/category C2',
    'with=>with/filler I512',
    'standort=>standort/category C2',
    'more than=>more than/operator/2 O512',
    '12=>12/number N512',
    'standorten=>standort/category C2' ],
  [ 'sender=>sender/category F32',
    'standort=>standort/category F32',
    'with=>with/filler I512',
    'standort=>standort/category F32',
    'more than=>more than/operator/2 O512',
    '12=>12/number N512',
    'standorten=>standort/category F32' ] ]);

    var res = Erbase.processString('sender, standort with standort 12 with more than 14 standrt', rules, words, srcHandle.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([ [ 'sender=>sender/category C2',
    'standort=>standort/category C2',
    'with=>with/filler I512',
    'standort=>standort/category C2',
    '12=>12/number N512',
    'with=>with/filler I512',
    'more than=>more than/operator/2 O512',
    '14=>14/number N512',
    'standrt=>standort/category C2' ] ]);




    var res = Erbase.processString('sender, standort with standort 12 with more than standrt', rules, words, srcHandle.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([]);
    var res = Erbase.processString('sender, standort with standort 12 with more than standort', rules, words, srcHandle.operators);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([]);
    done();
    releaseRules(srcHandle);
  });
});


it("testProcessStringSameDistinct", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('element name with element name starting with ABC', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['element name=>element name/category/2 C16',
      'with=>with/filler I512',
      'element name=>element name/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element name/category/2 F32',
      'with=>with/filler I512',
      'element name=>element name/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element name/category/2 C64',
      'with=>with/filler I512',
      'element name=>element name/category/2 C64',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element number/category/2 C16',
      'with=>with/filler I512',
      'element name=>element number/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element number/category/2 F32',
      'with=>with/filler I512',
      'element name=>element number/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096']]);

    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringAsymmetric", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('element name, element number, element weight with element name starting with ABC', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['element name=>element name/category/2 C16',
      'element number=>element number/category/2 C16',
      'element weight=>atomic weight/category/2 C16',
      'with=>with/filler I512',
      'element name=>element name/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element name/category/2 F32',
      'element number=>element number/category/2 F32',
      'element weight=>atomic weight/category/2 F32',
      'with=>with/filler I512',
      'element name=>element name/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element number/category/2 C16',
      'element number=>element name/category/2 C16',
      'element weight=>atomic weight/category/2 C16',
      'with=>with/filler I512',
      'element name=>element number/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element name=>element number/category/2 F32',
      'element number=>element name/category/2 F32',
      'element weight=>atomic weight/category/2 F32',
      'with=>with/filler I512',
      'element name=>element number/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096']]);

    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringAlmostSameWordDistinct", done => {
  /* test that "element names" and "element name" are suitably close to allow to eliminate distinct interpretations */

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('element names, element number, element weight, \"element name\" with element name starting with \"ABC\"', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['element names=>element name/category/2 C16',
      'element number=>element number/category/2 C16',
      'element weight=>atomic weight/category/2 C16',
      'element name=>element name/category C16',
      'with=>with/filler I512',
      'element name=>element name/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element names=>element name/category/2 F32',
      'element number=>element number/category/2 F32',
      'element weight=>atomic weight/category/2 F32',
      'element name=>element name/category F32',
      'with=>with/filler I512',
      'element name=>element name/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096']]);

    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringAlmostSameWordDistinctReverse", done => {
  /* test that "element names" and "element name" are suitably close to allow to eliminate distinct interpretations */

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('element names, element number, element weight, element name with element name starting with \"ABC\"', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['element names=>element name/category/2 C16',
      'element number=>element number/category/2 C16',
      'element weight=>atomic weight/category/2 C16',
      'element name=>element name/category/2 C16',
      'with=>with/filler I512',
      'element name=>element name/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element names=>element name/category/2 F32',
      'element number=>element number/category/2 F32',
      'element weight=>atomic weight/category/2 F32',
      'element name=>element name/category/2 F32',
      'with=>with/filler I512',
      'element name=>element name/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element names=>element number/category/2 C16',
      'element number=>element name/category/2 C16',   // TODO: eliminate this here or later ( after querying?) as an alternative is present which is equivalent
      'element weight=>atomic weight/category/2 C16',
      'element name=>element number/category/2 C16',
      'with=>with/filler I512',
      'element name=>element number/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element names=>element number/category/2 F32',
      'element number=>element name/category/2 F32',
      'element weight=>atomic weight/category/2 F32',
      'element name=>element number/category/2 F32',
      'with=>with/filler I512',
      'element name=>element number/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096']]);

    done();
    releaseRules(srcHandle);
  });
});




it("testProcessStringDistinctSourceWordsOK", done => {
  /* test that "aliases" are not removed if they are the *best* choice */

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('element weight, atomic weight with element weight starting with \"ABC\"', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['element weight=>atomic weight/category/2 C16',
      'atomic weight=>atomic weight/category/2 C16',
      'with=>with/filler I512',
      'element weight=>atomic weight/category/2 C16',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096'],
    ['element weight=>atomic weight/category/2 F32',
      'atomic weight=>atomic weight/category/2 F32',
      'with=>with/filler I512',
      'element weight=>atomic weight/category/2 F32',
      'starting with=>starting with/operator/2 O512',
      'ABC=>ABC/any A4096']]);

    done();
    releaseRules(srcHandle);
  });
});



it("testProcessStringelementNamesSep", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('elaement,  names nickel ', rules, words);
    debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

    expect(simplifySentence(res.sentences)).toEqual([]);
    done();
    releaseRules(srcHandle);
  });
});




it("testExpandEmtpy", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 0x02 } },
    { string: 'b', a: 1 , rule: { bitSentenceAnd: 0x02 }}],
    [],
    [{ string: '3', a: 1 , rule: { bitSentenceAnd: 0x02 }}]
  ];
  var res = Erbase.expandTokenMatchesToSentences(['a', 'b', 'c'], src);
  expect(res.sentences).toEqual([]);
  done();
});

it("testExpandNoBits", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [{ string: '3', a: 1 }, { string: 'c', a: 1 }]
  ];
  var res = Erbase.expandTokenMatchesToSentences(['a', 'b', 'c'], src);
  expect(res.sentences).toEqual([[{ string: 'a', a: 1 }, { string: '3', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '3', a: 1 }],
  [{ string: 'a', a: 1 }, { string: 'c', a: 1 }],
  [{ string: 'b', a: 1 }, { string: 'c', a: 1 }]]);
  done();
});

it("testExpandWithBits", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 0x02 } },
    { string: 'b', a: 1, rule: { bitSentenceAnd: 0x01 } }],
    [{ string: '3', a: 1, rule: { bitSentenceAnd: 0x02 } }, { string: 'c', a: 1, rule: { bitSentenceAnd: 0x01 } }]
  ];
  var res = Erbase.expandTokenMatchesToSentences2(['a', 'b', 'c'], src);
  expect(res.sentences).toEqual([
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 2 } },
    { string: '3', a: 1, rule: { bitSentenceAnd: 2 } }],
    [{ string: 'b', a: 1, rule: { bitSentenceAnd: 1 } },
    { string: 'c', a: 1, rule: { bitSentenceAnd: 1 } }]]);
  done();
});



it("testExpandSpan", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'a b', a: 1, span: 2 }],
    [],
    [{ string: '3', a: 1 }]
  ];
  var res = Erbase.expandTokenMatchesToSentences([], src);
  expect(res.sentences).toEqual([
    [{ string: 'a b', a: 1, span: 2 }, { string: '3', a: 1 }]]);
  done();
});

it("testExpandEmtpyErrors", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'xx', a: 1 }],
    [],
    [{ string: '3', a: 1 }]
  ];
  var res = Erbase.expandTokenMatchesToSentences(['a', 'b', 'c', 'd'], src);
  expect(res.sentences).toEqual([]);
  expect(res.errors.length).toEqual(1);
  expect(res.errors[0].context.token).toEqual('b');
  done();
});


it("testExpandEmtpy2Errors", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [],
    [],
    [{ string: '3', a: 1 }]
  ];
  var res = Erbase.expandTokenMatchesToSentences(['a', 'b', 'c', 'd', 'e'], src);
  expect(res.sentences).toEqual([]);
  expect(res.errors.length).toEqual(2);
  expect(res.errors[0].context.token).toEqual('b');
  expect(res.errors[1].context.token).toEqual('c');
  done();
});


it("testExpand0", done => {
  expect(1).toBeTruthy();
  var src = [
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 0x02 } },
    { string: 'b', a: 1, rule: { bitSentenceAnd: 0x02 } }],
    [{ string: '1', a: 1, rule: { bitSentenceAnd: 0x02 } },
    { string: '2', a: 1 ,rule: { bitSentenceAnd: 0x02 }},
    { string: '3', a: 1.,rule: { bitSentenceAnd: 0x02 } }]
  ];
  var res = Erbase.expandTokenMatchesToSentences([], src);
  expect(res.sentences).toEqual(
    [[{ string: 'a', a: 1 ,rule: { bitSentenceAnd: 0x02 }}, { string: '1', a: 1,rule: { bitSentenceAnd: 0x02 } }],
    [{ string: 'b', a: 1,rule: { bitSentenceAnd: 0x02 } }, { string: '1', a: 1, rule: { bitSentenceAnd: 0x02 } }],
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 0x02 } }, { string: '2', a: 1, rule: { bitSentenceAnd: 0x02 } }],
    [{ string: 'b', a: 1, rule: { bitSentenceAnd: 0x02 } }, { string: '2', a: 1, rule: { bitSentenceAnd: 0x02 } }],
    [{ string: 'a', a: 1, rule: { bitSentenceAnd: 0x02 } }, { string: '3', a: 1, rule: { bitSentenceAnd: 0x02 } }],
    [{ string: 'b', a: 1, rule: { bitSentenceAnd: 0x02 } }, { string: '3', a: 1, rule: { bitSentenceAnd: 0x02 } }]]
  );
  done();
});


it("testTokenizeStringOrbitBitFiltered", done => {

  getRules().then((args) => {
    var [rules, srcHandle] = args;
    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    //console.log(theModel.rules.wordMap["of"]);
    //var augmentedRules = ErIndex.augmentedRules(theModel.rules);
    var res = Erbase.processString2('orbit of the earth', rules, {});
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.sentences)).toEqual([
      ['orbit=>orbits/category',
        'of=>of/filler',
        'the=>the/filler',
        'earth=>earth/object name']]);
    done();
    releaseRules(srcHandle);
  });
});





it("testTokenizeStringOrbitEbase", done => {


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    // debuglog(JSON.stringify(ifr, undefined, 2))
    //console.log(theModel.mRules);
    var res = Erbase.processString('orbit of the earth', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.sentences)).toEqual([

      /*  [ 'orbit=>orbits/category',
        'of=>of/filler',
        'the=>the/filler',
        'earth=>earth/element name' ], */
      ['orbit=>orbits/category',
        'of=>of/filler',
        'the=>the/filler',
        'earth=>earth/object name']]);
    done();
    releaseRules(srcHandle);
  });
});

//var theModel2 = Model.loadModels('testmodel2',true);


it("testCategorizeWordOffsetIntents", done => {


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var token = "intents";
    var seenIt = InputFilter.categorizeAWordWithOffsets(token, rules, "intents 10", {}, {});
    debuglog(JSON.stringify(seenIt, undefined, 2));
    var filter = seenIt.filter(word => word.rule && word.rule.range && (word.rule.range.low === -1) && word.rule.range.high === 0);
    var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
    expect(filter.length).toEqual(6);
    expect(filter2.length).toEqual(3);
    done();
    releaseRules(srcHandle);
  });
})

it("testCategorizeWordOffsetIntentsSloppy", done => {
  getRules().then((args) => {
    var [rules, srcHandle] = args;


    var token = "intentss";
    var seenIt = InputFilter.categorizeAWordWithOffsets(token, rules, "intents 10", {}, {});
    debuglog(JSON.stringify(seenIt, undefined, 2));
    var filter = seenIt.filter(word => word.rule && word.rule.range && (word.rule.range.low === -1) && word.rule.range.high === 0);
    var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
    expect(filter.length).toEqual(12);
    expect(filter2.length).toEqual(6);
    done();
    releaseRules(srcHandle);
  });
})


it("testCategorizeWordOffsetSemantic", done => {


  getRules2().then((args) => {
    var [rules, srcHandle] = args;

    var token = "semantic";
    var seenIt = InputFilter.categorizeAWordWithOffsets(token, rules, "semantic objects", {}, {});
    debuglog(JSON.stringify(seenIt, undefined, 2));
    var filter = seenIt.filter(word => word.rule && word.rule.range);
    var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
    expect(filter.length).toEqual(4);
    expect(filter2.length).toEqual(0);
    done();
    releaseRules(srcHandle);
  });
})

it("testProcessStringSemantic", done => {

  getRules2().then((args) => {
    var [rules, srcHandle] = args;

    var token = "Semantic OBjects";
    // console.log("all" + JSON.stringify(rx, undefined,2));
    // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
    var res = Erbase.processString('Semantic OBjects', rules, {});
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['Semantic OBjects=>SemanticObject/category/2 C4'],
    ['Semantic OBjects=>SemanticObject/category/2 F32']
    ]);
    done();
    releaseRules(srcHandle);
  });
});

it("testProcessStringOData", done => {
  // console.log("all" + JSON.stringify(rx, undefined,2));
  // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
  /*
  var filtered = theModel2.rules.allRules.filter(rule => rule.type === 0 && rule.word.indexOf('services') === 0
  && rule.range);
  console.log(' filtered ' + JSON.stringify(filtered));
  console.log('wordmap' + JSON.stringify(theModel2.rules.wordMap['services']));

  */

  getRules2().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('OData Services for UI2SHellService', rules, {});
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    debuglog('res > ' + JSON.stringify(res.errors, undefined, 2));
    expect(res.errors[0].text).toEqual('I do not understand "UI2SHellService".');
    expect(simplifyStrings(res.sentences)).toEqual([]);
    done();
    releaseRules(srcHandle);
  });
});


it("testProcessStringODataOK", done => {
  // console.log("all" + JSON.stringify(rx, undefined,2));
  // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
  /*
  var filtered = theModel2.rules.allRules.filter(rule => rule.type === 0 && rule.word.indexOf('services') === 0
  && rule.range && rule.range.rule.matchedString.toLowerCase().indexOf('odata')>= 0);
  //console.log(' filtered ' + JSON.stringify(filtered));
  console.log('wordmap intent' + JSON.stringify(theModel2.rules.wordMap['intent']));
  var filtered2 = theModel2.rules.wordMap['intent'].rules.filter(rule => rule.type === 0 && rule.word.indexOf('intent') === 0
  && rule.range && rule.range.rule.matchedString.toLowerCase().indexOf('fiori')>= 0);
  console.log("filtered wordmap \n" + filtered2.map( (r,index) => '' + index + " " +  JSON.stringify(r)).join("\n"));
  */

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('OData Services for fiori intent', rules, {});
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    debuglog('res > ' + JSON.stringify(res.errors, undefined, 2));

    expect(simplifyStringsWithBitIndex(res.sentences)).toEqual([['OData Services=>PrimaryODataServiceName/category/2 C4',
      'for=>for/filler I512',
      'fiori intent=>fiori intent/category/2 C4'],
    ['OData Services=>PrimaryODataServiceName/category/2 F32',
      'for=>for/filler I512',
      'fiori intent=>fiori intent/category/2 F32']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testCategorizeWordOffset", done => {
  var token = "element";


  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var seenIt = InputFilter.categorizeAWordWithOffsets(token, rules, "element number 10", {}, {});
    debuglog(JSON.stringify(seenIt, undefined, 2));
    var filter = seenIt.filter(word => word.rule && (word.rule.range.low === 0) && word.rule.range.high === 1);
    expect(filter.length > 0).toEqual(true);
    done();
    releaseRules(srcHandle);
  });
})

it("testprocessStringModel2", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);


  getRules2().then((args) => {
    var [rules, srcHandle] = args;

    var words = {};
    var rx = rules.allRules.filter(function (r) {
      return r.lowercaseword === "element";
    });
    // console.log("all" + JSON.stringify(rx, undefined,2));
    // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
    var res = Erbase.processString('element number 10', rules, {});
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.sentences)).toEqual([['element number=>element number/category/2',
      '10=>10/element number'],
    ['element number=>element number/category/2', '10=>10/number'],
    ['element number=>element number/category/2', '10=>10/number'],
    ['element number=>element name/category/2',
      '10=>10/element number'],
    ['element number=>element name/category/2', '10=>10/number'],
    ['element number=>element name/category/2', '10=>10/number'],
    ['element number=>element name/category/2', '10=>10/number']]);
    done();
    releaseRules(srcHandle);
  });
});



it("testTokenizeStringOrbitWhatis", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('orbit of the earth', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.sentences)).toEqual(//  [ 'orbit of=>orbital period/category',
    //    'the=>the/filler',
    //    'earth=>earth/object name' ]
    //  [ 'orbit of the=>orbits/category', 'earth=>earth/element name' ],
    //  [ 'orbit of the=>orbits/category', 'earth=>earth/object name' ]
    [ /*[ 'orbit=>orbits/category',
  'of=>of/filler',
  'the=>the/filler',
  'earth=>earth/element name' ], */
      ['orbit=>orbits/category',
        'of=>of/filler',
        'the=>the/filler',
        'earth=>earth/object name']]);
    done();
    releaseRules(srcHandle);
  });
});

/*
exports.testProcessStringGovernmentType = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Whatis.processString('"Communist state"', theModel2.rules, {});
  console.log("OBject.keys " + Object.keys(theModel2.rules));
  console.log("allrues " + JSON.stringify(theModel2.rules.allRules.filter(function(o) {
    return o.lowercaseword === "communist state";
  })));
  console.log(" here rule wormap exact: " + theModel2.rules.wordMap["communist state"]);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences),
  [ 'orbit of=>orbital period/category/2',
    'the=>the/filler',
    'earth=>earth/element name' ], ' correct exact match');
    test.done();
};
*/


it("testTokenizeStringOrbitCompletelyNothingEbase", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules)

  getRules().then((args) => {
    var [rules, srcHandle] = args;

    var res = Erbase.processString('orbit of Nomacthforthis the earth', rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    expect(simplifyStrings(res.sentences)).toEqual([]);
    expect(res.errors[0].err_code).toEqual("NO_KNOWN_WORD");
    expect(res.errors[0].text).toEqual("I do not understand \"Nomacthforthis\".");
    done();
    releaseRules(srcHandle);
  });
});
