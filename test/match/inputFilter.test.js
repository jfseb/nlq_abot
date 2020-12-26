/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('inputFilter.nunit');

const inputFilter = require(root + '/match/inputFilter.js');
const InputFilter = inputFilter;

const utils = require('abot_utils');
const Algol = require(root + '/match/algol.js');

const index_model = require(root + '/model/index_model.js');
const Model = index_model.Model;
const IMatch = index_model.IFModel;
const MongoUtils = index_model.MongoUtils;

function setMockDebug() {
  var obj = function(s) {
    //console.log(s);
  };
  obj.enabled = true;
  inputFilter.mockDebug(obj);
}
if(!debuglog.enabled) {
  setMockDebug();
}

var getModel = require(root + '/model/testmodels.js').getTestModel1;

function getRules() {
  return getModel().then(
    (model) => {
      return Promise.resolve([model.rules, model]);
    }
  )
}

function releaseModel(theModel) {
  Model.releaseModel(theModel);
}

const ab = inputFilter;

it("testcountAinB", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1 }, { hijs: 4 })).toEqual(0);
  done();
});

it("testcountAinBOne", done => {
  //  console.log(JSON.stringify(inputFilter, undefined, 2) + "yyyyyyyyyyyyyyyy")
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1 }, { hij: 2 })).toEqual(1);
  done();
});

it("testcountAinBCompareEQ", done => {
  var fut = inputFilter.countAinB;
  expect(
    fut({ abc: 'def', hij: 1 }, { hij: 1 }, function (s1, s2) { return s1 && (s1 === s2); })
  ).toEqual(1);
  done();
});

it("testcountAinBCompareFN", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1, klm: 'U' }, { hij: 1, klm: 'U' },
    function (s1, s2) { return s1 && s1 === s2; })).toEqual(2);
  done();
});

it("testcountAinBCompareMult1", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1, klm: undefined }, { hij: 1, klm: 'U' },
    function (s1, s2) { return s1 && s1 === s2; })).toEqual(1);
  done();
});

it("testcountAinBCompareMult", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return s1 !== undefined && s1 === s2; })).toEqual(2);
  done();
});

it("testcountAinBCompareIgnore", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return s1 !== undefined && s1 === s2; }, 'klm')).toEqual(1);
  done();
});

it("testcountAinBCompareIgnore2", done => {
  var fut = inputFilter.countAinB;
  expect(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return (s1 !== undefined) && (s1 === s2); }, ['klm', 'hij'])).toEqual(0);
  done();
});

it("testspuriouAnotInB", done => {
  var fut = inputFilter.spuriousAnotInB;
  expect(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 }, ['klm', 'hij'])).toEqual(1);
  done();
});

it("testspuriouAnotInBIgnore", done => {
  var fut = inputFilter.spuriousAnotInB;
  expect(
    fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 }, ['abc', ' klm', 'hij'])
  ).toEqual(0);
  done();
});

it("testspuriouAnotInBIgnore2", done => {
  var fut = inputFilter.spuriousAnotInB;
  expect(fut({ abc: 'def', 'u': 1, hij: 1, klm: 0 }, { c: 3, hij: 1, klm: 0 },
    ['abc', ' klm', 'hij'])).toEqual(1);
  done();
});

it("testcompareContext", done => {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  expect(fut(a, b)).toEqual({
    equal: 2,
    different: 1,
    spuriousL: 1,
    spuriousR: 3
  });
  done();
});

it("testcompareContextIgnorePrivate", done => {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', _a: 1, _b: 3, hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, _a: 1, _c: 3, _b: 4, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  expect(fut(a, b)).toEqual({
    equal: 2,
    different: 1,
    spuriousL: 1,
    spuriousR: 3
  });
  done();
});

it("testcompareContextIgnore", done => {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  expect(fut(a, b, ['abc'])).toEqual({
    equal: 2,
    different: 1,
    spuriousL: 0,
    spuriousR: 3
  });
  done();
});

it("test_matchWord", done => {
  const fn = inputFilter.matchWord;

  expect(fn({
    key: 'NoTPresent'
  },
    {
      systemObjectId: 'ClientSideTragetResol',
      systemObjectCategory: 'unit'
    })).toEqual(undefined);
  done();
});

it("test_matchWordAlias", done => {
  const fn = inputFilter.matchWord;
  expect(fn({
    key: 'systemObjectId',
    word: 'CSTR',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  },
    {
      systemObjectId: 'CSTR',
      systemObjectCategory: 'unit'
    })).toEqual({"_weight": {"systemObjectId": 1}, "systemObjectCategory": "unit", "systemObjectId": "ClientSideTargetResolution"});
  done();
});

it("test_matchWordAliasMatchOthersTrue", done => {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'ClientSideTargetResolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit'
  };
  expect(fn(oRule,
    oValue, { matchothers: true })).toEqual(undefined);
  done();
});

it("test_matchWordAliasMatchOthersFalse", done => {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  expect(fn(oRule,
    oValue, { matchothers: false })).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC',
    _weight: {
      'systemObjectId': 1
    }
  });
  done();
});

it("test_matchWordAliasMatchOthersFalseOverride", done => {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  expect(fn(oRule,
    oValue, {
      matchothers: false,
      override: true
    })).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC',
    _weight: {
      'systemObjectId': 1
    }
  });
  done();
});

var oRuleWord = {
  type: 'word',
  key: 'systemObjectId',
  word: 'cstr',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
};

var oRuleWordLong = {
  type: 'word',
  key: 'systemObjectId',
  word: 'ClientSideTargetResolution',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
};

it("test_matchWordAlias", done => {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  expect(res).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC',
    _weight: {
      'systemObjectId': 1
    }
  });
  done();
});

it("test_matchWordAliasDifferentCat", done => {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  expect(res).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC',
    _weight: { 'systemObjectId': 1 }
  }
  /* undefined */);
  done();
});

const enumRULETYPEWORD = 0;
const enumRULETYPEREGEXP = 1;

it("test_applyRulesEqualChoice", done => {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 2).toBeTruthy();
  expect(res[0].keyB).toEqual('CategoryB');
  expect(res[1].keyB).toEqual('CategoryC');
  done();
});

it("test_matchOthersTrue", done => {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: true });
  expect(res === undefined).toBeTruthy();
  done();
});


it("test_checkOneRuleA", done => {
  // prepare
  var aRule =
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    };
  expect.assertions(1);
  // act
  try {
     var res = ab.checkOneRule('abc','abc', true, [], aRule, {});
     expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  done();
});


it("test_checkOneRuleWordA", done => {
  // prepare
  var aRule = {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
  };
  expect.assertions(1);
  // act
  try {
     var res = ab.checkOneRule('abc','abc', true, [], aRule, {});
     expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  done();
});
it("test_checkOneRuleWordAExactFalse", done => {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  // act
  var res = [];
  ab.checkOneRule('Valuea','valuea', false, res, aRule, {});
  expect(res && res.length).toEqual(1);
  done();
});

it("test_checkOneRuleWordAExact", done => {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  expect.assertions(4);
  // act
  var res = [];
  ab.checkOneRule('Valuea','valuea', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRule('VaLUEa','valueB', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];

  ab.checkOneRule('Valuea','valuea', false, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRule('VaLUEa','valuea', false, res, aRule, {});
  expect(res && res.length).toEqual(1);
  done();
});

it("test_checkOneRuleWordAExactOnly", done => {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    exactOnly : true,
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  expect.assertions(5);
  // act
  var res = [];
  ab.checkOneRule('Valueaa','valueaa', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRule('VaLUea','valuea', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRule('VaLUEaa','valueBa', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRule('Valueaa','valueaa', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRule('VaLUEaa','valueaa', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  done();
});


it("test_checkOneRuleWithOffsetA", done => {
  // prepare
  var aRule =
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    };
  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  expect.assertions(1);
  // act
  try {
     var res = ab.checkOneRuleWithOffset('abc','abc', true, aRule, {});
     expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  done();
});


it("test_checkOneRuleWithOffsetWordA", done => {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  expect.assertions(4);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('Valuea','valuea', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEa','valueB', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];

  ab.checkOneRuleWithOffset('Valuea','valuea', false, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEa','valuea', false, res, aRule, {});
  expect(res && res.length).toEqual(1);
  done();
});

it("test_checkOneRuleWithOffsetWordAExactOnly", done => {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    exactOnly : true,
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  expect.assertions(5);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('Valueaa','valueaa', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRuleWithOffset('VaLUea','valuea', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueBa', true, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRuleWithOffset('Valueaa','valueaa', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueaa', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  done();
});

it("test_checkOneRuleWithOffsetWordNumbers", done => {
  // prepare
  var bitIndexAllDomains = 0xFFF;
  var metaBitIndex = 0xFFF;
  var aRule =  {
    category: "number",
    matchedString: "one",
    type: IMatch.EnumRuleType.REGEXP,
    regexp : /(\d+)|(one)|(two)|(three)/,
    matchIndex : 0,
    word: "<number>",
    bitindex: metaBitIndex,
    wordType: IMatch.WORDTYPE.NUMERICARG, // number
    bitSentenceAnd: bitIndexAllDomains,
    _ranking: 0.95
  };
  expect.assertions(5);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('123','123', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('one','one', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('two','two', true, res, aRule, {});
  expect(res && res.length).toEqual(1);
  res = [];
  ab.checkOneRuleWithOffset('four','four', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueaa', false, res, aRule, {});
  expect(res && res.length).toEqual(0);
  done();
});

it("test_matchOthersFalse", done => {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false });
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2));
  expect(res.keyB).toEqual('NothingMatches');
  done();
});

it("test_matchOthersFalseOverride", done => {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false, override: true });
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2));
  expect(res.keyB).toEqual('CategoryB');
  done();
});

/*
exports.test_applyRules = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length > 0, 'found one');
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.done();
};

exports.test_applyRulesEqualChoice = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 2, 'found at least two');
  // console.log(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected');
  test.done();
};

exports.test_applyRulesNotCategoryFit = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 2, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected');
  test.done();
};

exports.test_applyRulesGoodFitInOtherCategory = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];
  var oContext = {
    keyA: 'ValueB',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[0].keyA, 'Synonym', 'category respected');
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done();
};

exports.test_applyRulesLevenBestFitCategory = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymA',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueabc',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymABC',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueabcdefg',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymDEF',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];
  var oContext = {
    keyA: 'valuebbc',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[0].keyA, 'SynonymABC', 'category respected');

  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done();
};
*/

it("test_matchWordAliasOverride", done => {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext, {
    augment: true
  });
  expect(res).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC',
    _weight: {
      'systemObjectId': 1
    }
  });
  done();
});

it("test_matchWordAliasOverrideDifferent", done => {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext, {
    override: true
  });
  expect(res).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC',
    _weight: {
      'systemObjectId': 1
    }
  });
  done();
});

it("test_ruleLevenBeforeFallback", done => {
  // prepare
  // there a
  var aRules = [
    {
      word: 'somewhatfar',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatfar',
        'keyB': 'System3'
      }
    },
    {
      word: 'somewhatclose',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatclose',
        'keyB': 'System2'
      }
    },
    {
      regexp: /^.*$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        _ranking: 0.9
      }
    }
  ];
  var oContext = {
    keyA: 'somewhatcl'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyA).toEqual('somewhatclose');
  expect(res[0].keyB).toEqual('System2');

  oContext = {
    keyA: 'gibts gar nicht'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyA).toEqual('gibts gar nicht');
  expect(res[0].keyB).toEqual(undefined);
  done();
});

it("test_extractArgsMap", done => {
  var res = ab.extractArgsMap(['A', 'B', 'C'], { 2: 'X2', 1: 'X1' });
  expect(res).toEqual({ 'X2': 'C', 'X1': 'B' });
  done();
});
it("test_extractArgsMapUndef", done => {
  var res = ab.extractArgsMap(['A', 'B', 'C'], undefined);
  expect(res).toEqual({});
  done();
});
it("test_extractArgsMapEmptyMatch", done => {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 1: 'X1' });
  expect(res).toEqual({ 'X2': 'C' });
  done();
});
it("test_extractArgsMapOutOfRange", done => {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 4: 'X1' });
  expect(res).toEqual({ 'X2': 'C' });
  done();
});

it("test_matchWordNonMatched", done => {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'Way off the page',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  expect(res).toEqual(undefined);
  done();
});

it("test_matchWordLevenClose", done => {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'ClientSideTrgetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  };
  var res = fn(oRuleWordLong, oContext);
  expect(res).toEqual({
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC',
    _weight: {
      'systemObjectId':  0.9923076923076923
    }
  });
  done();
});

it("test_ruleRegexp", done => {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^[a-z0-9_]{3,3}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    },
    {
      regexp: /^[a-z0-9_]{4,4}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System4'
      }
    }
  ];
  var oContext = {
    keyA: 'ABC'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyA).toEqual('ABC');
  expect(res[0].keyB).toEqual('System3');

  oContext = {
    keyA: 'ABCD'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyA).toEqual('ABCD');
  expect(res[0].keyB).toEqual('System4');
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  oContext = {
    keyA: 'ABCDE'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  expect(res.length === 0).toBeTruthy();
  done();
});

it("test_ruleRegexpExtraction", done => {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^([a-z0-9_]{3,3})clnt(\d{3,3})$/i,
      key: 'keyA',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ];
  var oContext = {
    keyA: 'UV2CLNT123'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyA).toEqual('UV2CLNT123');
  expect(res[0].keyB).toEqual('System3');
  expect(res[0].systemId).toEqual('uv2');
  expect(res[0].client).toEqual('123');
  done();
});

it("test_ruleRegexpExtractionReplacing", done => {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^([a-z0-9_]{3,3})CLNT(\d{3,3})$/i,
      key: 'systemId',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ];
  var oContext = {
    systemId: 'UV2CLNT123'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  expect(res.length >= 1).toBeTruthy();
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  expect(res[0].keyB).toEqual('System3');
  expect(res[0].systemId).toEqual('uv2');
  expect(res[0].client).toEqual('123');
  done();
});
/*
exports.test_matchSthElse = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  // console.log(JSON.stringify(res))
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'xunit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }, ' incorrect result');
  test.done();
};

exports.test_applyRules = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes'
  };
  // act
  var res = ab.applyRules(oContext);
  // test
  debuglog('The end result : ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected');
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok');
  test.done();
};

exports.test_applyRulesWithCategory = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes',
    'systemObjectCategory': 'unit'
  };
  // act
  var res = ab.applyRules(oContext);
  // test
  //console.log(JSON.stringify(res,undefined,2));
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected');
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok');
  test.done();
};
*/

it("testinputFilter", done => {
  const fn = ab.augmentContext;
  expect(fn({
    systemObjectId: 'ClientSideTragetResol',
    systemObjectCategory: 'unit'
  }, [
    {
      type: 1
    }
  ])).toEqual([]);
  done();
});

/*
function getRules() {
  return getModel().then(
    (model) => {
      return Promise.resolve([model.rules, model]);
    }
  )
}
*/


function releaseRules(theModel) {
  Model.releaseModel(theModel);
}


process.on('unhandledRejection', function onError(err) {
  console.log('erbase.nunit.js');
  console.log(err);
  console.log(err.stack);
  throw err;
});
/* old?
var srcHandle = require('mongoose_record_replay').instrumentMongoose(require('srcHandle'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  'REPLAY');

function getRules() {
  return Model.loadModelsOpeningConnection(srcHandle).then(
      (model) => {
        return Promise.resolve([model.rules, model.mongoHandle.srcHandle]);
      }
    )
}

function releaseRules(srcHandle) {
  MongoUtils.disconnect(srcHandle);
}
*/

//const Model = require('fdevsta_monmove').Model;

//var theModel = Model.loadModels();

it("testCategorizeAWordWithOffset", done => {
    getRules().then( (args) => { var [rules,srcHandle] = args;
 var res = inputFilter.categorizeAWord('ApplicationComponent', rules,  'not relevant', {}, {});
  expect(res).toEqual([ { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 4,
       wordType: 'C',
       bitSentenceAnd: 4,
       _ranking: 0.95 },
    _ranking: 0.95 },
  { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 8,
       wordType: 'C',
       bitSentenceAnd: 8,
       _ranking: 0.95 },
    _ranking: 0.95 },
  { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       bitindex: 32,
       bitSentenceAnd: 32,
       exactOnly: false,
       wordType: 'F',
       _ranking: 0.95,
       lowercaseword: 'applicationcomponent' },
    _ranking: 0.95 } ]);
  done();
  releaseRules(srcHandle);
    });
});

it("testCategorizeANumberWordWithOffsectXX", done => {
  getRules().then( (args) => { var [rules,srcHandle] = args;
var res = inputFilter.categorizeAWord('1234', rules,  'not relevant', {}, {});
expect(res).toEqual([ { string: '1234',
matchedString: '1234',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
done();
releaseRules(srcHandle);
  });
});

it("testCategorizeANumber12WordWithOffest", done => {
  getRules().then( (args) => { var [rules,srcHandle] = args;
var res = inputFilter.categorizeAWord('12', rules,  'not relevant', {}, {});
expect(res).toEqual([ { string: '12',
matchedString: '12',
category: 'element number',
rule:
 { category: 'element number',
   matchedString: '12',
   type: 0,
   word: '12',
   bitindex: 16,
   bitSentenceAnd: 16,
   exactOnly: false,
   wordType: 'F',
   _ranking: 0.95,
   lowercaseword: '12' },
_ranking: 0.95 },
{ string: '12',
matchedString: '12',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
done();
releaseRules(srcHandle);
  });
});


it("testCategorizeANumber_One_WordWithOffest", done => {
  getRules().then( (args) => { var [rules,srcHandle] = args;
var res = inputFilter.categorizeAWord('One', rules, 'not relevant', {}, {});
expect(res).toEqual([ ]);
done();
releaseRules(srcHandle);
  });
});

it("testCategorizeANumber_one_WordWithOffest", done => {
  getRules().then( (args) => { var [rules,srcHandle] = args;
var res = inputFilter.categorizeAWord('one', rules, 'not relevant', {}, {});
expect(res).toEqual([ { string: 'one',
matchedString: 'one',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
done();
releaseRules(srcHandle);
  });
});




it("testCategorizeAFioriWordWithOffset", done => {
    getRules().then( (args) => { var [rules,srcHandle] = args;
 var res = inputFilter.categorizeAWord('Fiori', rules,  'not relevant', {}, {});

 var res2 = inputFilter.categorizeAWordWithOffsets('Fiori', rules,  'not relevant', {}, {});

  expect(res).toEqual([]);

  expect(res2).toEqual([ { string: 'Fiori',
    matchedString: 'AppName',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'AppName',
       bitindex: 4,
       bitSentenceAnd: 4,
       wordType: 'C',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'category',
             matchedString: 'AppName',
             type: 0,
             word: 'Fiori App',
             bitindex: 4,
             bitSentenceAnd: 4,
             wordType: 'C',
             _ranking: 0.95,
             lowercaseword: 'fiori app' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'AppName',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'AppName',
       bitindex: 32,
       bitSentenceAnd: 32,
       wordType: 'F',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'category',
             matchedString: 'AppName',
             type: 0,
             word: 'Fiori App',
             bitindex: 32,
             bitSentenceAnd: 32,
             wordType: 'F',
             _ranking: 0.95,
             lowercaseword: 'fiori app' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'FioriBOM',
    category: 'domain',
    rule:
     { category: 'domain',
       matchedString: 'FioriBOM',
       bitindex: 4,
       bitSentenceAnd: 4,
       wordType: 'D',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'domain',
             matchedString: 'FioriBOM',
             type: 0,
             word: 'fiori bom',
             bitindex: 4,
             bitSentenceAnd: 4,
             wordType: 'D',
             _ranking: 0.95,
             lowercaseword: 'fiori bom' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'FioriBOM',
    category: 'domain',
    rule:
     { category: 'domain',
       matchedString: 'FioriBOM',
       bitindex: 32,
       bitSentenceAnd: 32,
       wordType: 'F',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'domain',
             matchedString: 'FioriBOM',
             type: 0,
             word: 'fiori bom',
             bitindex: 32,
             bitSentenceAnd: 32,
             wordType: 'F',
             _ranking: 0.95,
             lowercaseword: 'fiori bom' } } },
    _ranking: 0.95 } ]);

  done();
  releaseRules(srcHandle);
    });
});


process.on('unhandledRejection', function onError(err) {
  console.log('inputFilter.nunit.js');
  console.log(err);
  console.log(err.stack);
  throw err;
});

it("testcompByEqualResultThenRank", done => {
  var tobecompared = [
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":2,"wordType":"C","bitSentenceAnd":2,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":4,"wordType":"C","bitSentenceAnd":4,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","bitindex":16,"bitSentenceAnd":16,"exactOnly":false,"wordType":"F","_ranking":0.95,"lowercaseword":"applicationcomponent"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"Application Component","bitindex":2,"bitSentenceAnd":2,"wordType":"C","_ranking":0.95,"lowercaseword":"application component"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9314523809523809,"levenmatch":0.9804761904761905}];
  expect(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[0])).toEqual(0);
  expect(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[1])).toEqual(-2);
  expect(inputFilter.cmpByResult(tobecompared[0],tobecompared[3])).toEqual(0);
  expect(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[3]) < 0).toEqual(true);
  done();
})



it("testdropLowerRankedEqualResult", done => {
  var tobefiltered = [
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":2,"wordType":"C","bitSentenceAnd":2,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":4,"wordType":"C","bitSentenceAnd":4,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","bitindex":16,"bitSentenceAnd":16,"exactOnly":false,"wordType":"F","_ranking":0.95,"lowercaseword":"applicationcomponent"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"Application Component","bitindex":2,"bitSentenceAnd":2,"wordType":"C","_ranking":0.95,"lowercaseword":"application component"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9314523809523809,"levenmatch":0.9804761904761905}];
    var dropped = tobefiltered[3]._ranking;
  expect(tobefiltered.filter(el => { return el._ranking === dropped}).length).toEqual(1);
  var res = inputFilter.dropLowerRankedEqualResult(tobefiltered);
  expect(res.length + 1).toEqual(tobefiltered.length);
  expect(res.filter(el => { el._ranking === dropped}).length).toEqual(0);
  done();
})



it("testCategorizeAWordWithOffsetCloseBoth", done => {
    getRules().then( (args) => { var [rules,srcHandle] = args;
      // note the typo !
 var res = inputFilter.categorizeAWordWithOffsets('ApplicaitonComponent', rules,  'not relevant', {}, {});
  expect(res).toEqual([ { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 4,
       wordType: 'C',
       bitSentenceAnd: 4,
       _ranking: 0.95 },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 },
  { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 8,
       wordType: 'C',
       bitSentenceAnd: 8,
       _ranking: 0.95 },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 },
  { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       bitindex: 32,
       bitSentenceAnd: 32,
       exactOnly: false,
       wordType: 'F',
       _ranking: 0.95,
       lowercaseword: 'applicationcomponent' },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 } ]);
    releaseRules(srcHandle);
    done();
    });
});

/*
exports.testCategorizeStringBadRule = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  test.expect(2);
  try {
    ab.categorizeString('NavTargetResolu', false,
      [{
        type: -123,
        word: 'walk this way'
      }]);
    test.ok(false, 'do not get here');
  } catch (e) {
    test.ok(e.message.indexOf('walk this way') >= 0);
    test.ok(true, 'got exception');
  }
  test.done();
};
*/

function filterRules(res) {
  var res = res.map( wordexp => wordexp.map( rx => rx.map(
      obj => {
         var r = Object.assign({},obj);
         delete r.rule;
         return r;
      }
  )));
  return res;
}

var mRulesStrict = Model.splitRules( [
  {
    'category': 'category',
    'matchedString': 'unit test',
    'type': 0,
    'word': 'unit test',
    'lowercaseword': 'unit test',
    '_ranking': 0.95
  },
  {
    'category': 'category',
    'matchedString': 'wiki',
    'type': 0,
    'word': 'wiki',
    'lowercaseword': 'wiki',
    '_ranking': 0.95
  },
  {
    'category': 'client',
    'matchedString': '120',
    'type': 0,
    'word': '120',
    'lowercaseword': '120',
    '_ranking': 0.95
  }]
);




it("testExpand0", done => {
  expect(1).toBeTruthy();
  var src = [[
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [{ string: '1', a: 1 },
    { string: '2', a: 1 },
    { string: '3', a: 1 }]
  ]];
  var res = ab.expandMatchArr(src);
  expect(res).toEqual([[{ string: 'a', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '3', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '3', a: 1 }]]);

  done();
});



it("testExpand1", done => {
  expect(1).toBeTruthy();

  var src = [[[{ string: 'cat1 and ab', a: 1 }]],
    [[{ 'string': 'cat1', b1: 1 },
  { 'string': 'cat1', b1: 2 }
    ],
      [{
        string: 'and ab',
        b2: 1
      }]],
    [[{ string: 'cat1 and' }],
      [{ string: 'ab', c21: 1 },
  { string: 'ab', c21: 2 },
  { string: 'ab', c21: 3 }
      ]
    ]
  ];

  var res = ab.expandMatchArr(src);
  expect(res).toEqual([[{ string: 'cat1 and ab', a: 1 }],
  [{ string: 'cat1', b1: 1 }, { string: 'and ab', b2: 1 }],
  [{ string: 'cat1', b1: 2 }, { string: 'and ab', b2: 1 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 1 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 2 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 3 }]]);

  done();
});

it("testExpandMult", done => {
  expect(1).toBeTruthy();

  var src = [[[{
    string: 'cat1 and ab',
    matchedString: 'cat1 and ab',
    category: 'unknown'
  }]],
    [[{ string: 'cat1', matchedString: 'CAT2', category: 'category' },
  { string: 'cat1', matchedString: 'cat1', category: 'unknown' }],
      [{
        string: 'and ab',
        matchedString: 'and ab',
        category: 'unknown'
      }]],
    [[{
      string: 'cat1 and',
      matchedString: 'cat1 and',
      category: 'unknown'
    }],
      [{ string: 'ab', matchedString: 'ab', category: 'CAT1' },
  { string: 'ab', matchedString: 'ab', category: 'unknown' }]],
    [[{ string: 'cat1', matchedString: 'CAT2', category: 'category' },
  { string: 'cat1', matchedString: 'cat1', category: 'unknown' }],
  [{ string: 'and', matchedString: 'and', category: 'unknown' }],
      [{ string: 'ab', matchedString: 'ab', category: 'CAT1' },
  { string: 'ab', matchedString: 'ab', category: 'unknown' }]]];
  // 1 +  2 x 1  + 1 x 2 + 2 x 1 x 2
  var res = ab.expandMatchArr(src);
  expect(res.length).toEqual(9);
  done();
});



it("testExtractCategory", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category' },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki' },
    { string: 'cat', matchedString: 'catalog', category: 'category' },
    { string: 'My cat', matchedString: 'My cat', category: 'wiki' },
    { string: 'in', matchedString: 'in', category: 'filler' },
    { string: 'wiki', matchedString: 'wiki', category: 'category' }
  ];

  var res = ab.extractCategoryMap(sentence);

  expect(res).toEqual({
    'wiki': [{ pos: 0 }, { pos: 5 }],
    'catalog': [{ pos: 2 }]
  });
  done();
});



it("testreinforceSentence", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var res = ab.reinForceSentence(sentence);


  var resline = [
    {
      string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1
    },
    {
      string: 'My wiki',
      matchedString: 'My wiki',
      category: 'wiki',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  expect(res).toEqual(resline);
  done();
});


it("testCalcDistnance", done => {
  var res = InputFilter.calcDistance('literary','life');
  expect(res).toEqual(0.8634945397815913);
  done();
})

it("testreinforceMetaDomainSentence", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'domain', matchedString: 'domain', category: 'meta', _ranking: 1 },
    { string: 'FLP', matchedString: 'FLP', category: 'domain', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var res = ab.reinForceSentence(sentence);


  var resline = [
    {
      string: 'domain', matchedString: 'domain', category: 'meta', _ranking: 1
    },
    {
      string: 'FLP',
      matchedString: 'FLP',
      category: 'domain',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  expect(res).toEqual(resline);
  done();
});


it("testreinforce", done => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];


  var resline = [
    {
      string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1
    },
    {
      string: 'My wiki',
      matchedString: 'My wiki',
      category: 'wiki',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var u = [sentence,
    utils.cloneDeep(sentence),
    utils.cloneDeep(sentence)];



  var res = ab.reinForce(u);
  expect(res[0]).toEqual(resline);
  expect(res[1]).toEqual(resline);
  expect(res[2]).toEqual(resline);
  done();
});


const ratherMaybe =  [ ["what" , "waht"],
["weight", "weigth"] ,
["semantic objects", "semantic object"] ,
["Busines catlog", "BusinessCatalog" ]];

const ratherNot = [
  [ "orbit of", "orbital period" ],
  [ "semantic objects", "semantic action" ],
];

it("testCalcDistanceClasses", done => {
  ratherMaybe.forEach(function(s) {
    var dist = ab.calcDistance(s[0],s[1]);
    expect(dist > Algol.Cutoff_WordMatch).toEqual(true);
  })
  done();
});
