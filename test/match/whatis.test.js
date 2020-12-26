/**
 * @file
 * @module whatis.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
//const { JsxEmit } = require('typescript');
var root = '../../js';
var debuglog = require('debugf')('whatis.test');

const WhatIs = require(root + '/match/whatis.js');
const ListAll = require(root + '/match/listall.js');

const MongoQueries = require(root + '/match/mongoqueries.js');

const Model = require(root + '/model/index_model.js').Model;

//var getModel = require('mgnlq_testmodel_replay').getTestModel1;

var getModel =  require(root + '/model/testmodels.js').getTestModel1;
var getModel2 = require(root + '/model/testmodels.js').getTestModel2;

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


function setMockDebug() {
  var obj = function (s) {
    //console.log(s);
  };
  obj.enabled = true;
  WhatIs.mockDebug(obj);
}
if (!debuglog.enabled) {
  setMockDebug();
}
/*
exports.testCmbByResultTupel = function (test) {
  var aList = [
    {
      _ranking: 1.0,
      results: [{ a: 'ABC'} ]
    },
    {
      _ranking: 0.9,
      results: [{ a: 'ABC'}]
    },
    {
      _ranking: 1.2,
      results: [{ a: 'DEF'}]
    },
    {
      _ranking: 0.3,
      results: [{ a : 'DEF'}]
    },
  ];

  var res = aList.sort(WhatIs.cmpByResultThenRankingTupel);

  test.deepEqual(res[0], { result: ['ABC'], _ranking: 1.0 }, 'sort order');
  test.deepEqual(res[1], { result: ['ABC'], _ranking: 0.9 }, 'sort order 2nd');

  var resx = WhatIs.filterDistinctResultAndSortTupel({ tupelanswers: res });
  res = resx.tupelanswers;

  debuglog(' after filter: ' + JSON.stringify(res));
  res.sort(WhatIs.cmpByRanking);
  debuglog(JSON.stringify(res));
  test.deepEqual(res[0], { result: ['DEF'], _ranking: 1.2 });
  test.deepEqual(res[1], { result: ['ABC'], _ranking: 1.0 });

  test.equal(res.length, 2);
  test.done();
};
*/

it('testlocaleCompareArrays', done => {
  expect(WhatIs.localeCompareArrays([],[])).toEqual(0);
  expect(WhatIs.localeCompareArrays(['A'],['A'])).toEqual(0);
  expect(WhatIs.localeCompareArrays(['A'],['a'])).toEqual(1);
  expect(WhatIs.localeCompareArrays(['A'],['A','B'])).toEqual(1);
  expect(WhatIs.localeCompareArrays(['A','B'],['A'])).toEqual(-1);
  expect(WhatIs.localeCompareArrays(['A','B'],['A','C'])).toEqual(-1);
  expect(WhatIs.localeCompareArrays(['A','C'],['A','B'])).toEqual(+1);
  expect(WhatIs.localeCompareArrays(['A'],['A','B','C'])).toEqual(1);
  expect(WhatIs.localeCompareArrays(['A'],['A','B','C'],['D'])).toEqual(1);
  done();
});
/*
exports.testCmbByResultTupelArrLength = function (test) {
  var aList = [
    {
      _ranking: 1.0,
      result: ['ABC']
    },
    {
      _ranking: 1.0,
      columns: ['a'],
      results: [{ a: 'ABC'}, {a : 'DEF'}, { a: 'KLM'}]
    },
    {
      _ranking: 1.0,
      columns: ['a'],
      results: [{ a: 'ABC'}, { a: 'DEF'}]
    },
    {
      _ranking: 0.3,
      columns: ['a'],
      results: [{ a: 'DEF'}]
    },
  ];

  var res = aList.sort(WhatIs.cmpByResultThenRankingTupel);

  test.deepEqual(res[0], { result: ['ABC', 'DEF', 'KLM'], _ranking: 1.0 }, 'sort order');
  test.deepEqual(res[1], { result: ['ABC','DEF'], _ranking: 1.0 }, 'sort order 2nd');

  var resx = WhatIs.filterDistinctResultAndSortTupel({ tupelanswers: res });
  res = resx.tupelanswers;

  debuglog(' after filter: ' + JSON.stringify(res));
  res.sort(WhatIs.cmpByRankingTupel);
  debuglog(JSON.stringify(res));
  test.deepEqual(res[0], { result: ['ABC', 'DEF', 'KLM'], _ranking: 1.0 });
  test.deepEqual(res[1], { result: ['ABC', 'DEF'], _ranking: 1.0 });

  test.equal(res.length, 4);
  test.done();
};
*/

it('testFilterAcceptingOnly', done => {
  var inp = [
    [
      {
        string: 'unit test',
        matchedString: 'unit test',
        category: 'category',
        _ranking: 1
      },
      {
        string: 'NavTargetResolution',
        matchedString: 'NavTargetResolution',
        category: 'unit test',
        _ranking: 1.1,
        reinforce: 1.1
      }
    ],
    [
      {
        string: 'unit test',
        matchedString: 'unit test',
        category: 'abc',
        _ranking: 1
      },
      {
        string: 'NavTargetResolution',
        matchedString: 'NavTargetResolution',
        category: 'unit test',
        _ranking: 1.1,
        reinforce: 1.1
      }
    ],
    [
      {
        string: 'unit test',
        matchedString: 'unit test',
        category: 'filler',
        _ranking: 1
      },
      {
        string: 'NavTargetResolution',
        matchedString: 'NavTargetResolution',
        category: 'category',
        _ranking: 1.1,
        reinforce: 1.1
      }
    ]
  ];
  var res = WhatIs.filterAcceptingOnly(inp, ['filler', 'category']);
  expect(res).toEqual([inp[2]]);
  done();
});

it('testAnalyzeCategoryElemSingle', done => {
  expect.assertions(1);
  getModel().then(theModel => {
    var res = WhatIs.analyzeCategory('element names', theModel.rules, 'what is unit test wiki for abc');
    expect(res).toEqual('element name');
    Model.releaseModel(theModel);
    done();
  });

});

it('testAnalyzeCategoryElem', done => {
  expect.assertions(1);
  getModel().then(theModel => {
    var res = WhatIs.analyzeCategory('element namess', theModel.rules, 'what is unit test wiki for abc');
    expect(res).toEqual('element name');
    Model.releaseModel(theModel);
    done();
  });
});


it('testAnalyzeCategoryMult', done => {
  expect.assertions(1);
  getModel().then(theModel => {
    //    var res = WhatIs.analyzeCategoryMult('unit test and', theModel.rules, 'what is unit test wiki for abc');
    var res = WhatIs.analyzeCategoryMult('orbits and', theModel.rules, 'what is orbits albedo for sun');
    expect(res).toEqual(['orbits']);
    Model.releaseModel(theModel);
    done();
  });
});


/*
exports.testAnalyzeCategoryMult2 = function (test) {
  var res = WhatIs.analyzeCategoryMult('unit test and wiki', mRules, 'what is unit test wiki for abc');
  test.deepEqual(res, undefined); // ['unit test', 'wiki']);
  test.done();
};
*/

// TODO, this is bullshit, complete cover must be better than sloppy matches!
it('testCategorizeMultElement', done => {
  getModel().then(theModel => {
    var res = WhatIs.analyzeCategoryMult('element name and element number, element symbol', theModel.rules, 'what is unit test and wiki for abc');
    expect(res).toEqual(['element name', 'element number', 'element symbol']);
    Model.releaseModel(theModel);
    done();
  });
});


// TODO, this is bullshit, complete cover must be better than sloppy matches!
it('testAnalyzeCusmos', done => {
  getModel().then(theModel => {
    var res = WhatIs.analyzeContextString('cusmos', theModel.rules);
    delete res.sentences[0][0].rule;
    expect(res.sentences).toEqual([
      [{
        string: 'cusmos',
        matchedString: 'Cosmos',
        category: 'domain',
        _ranking: 0.8913821472645002,
        levenmatch: 0.9382969971205265
      }],
      [{
        string: 'cusmos',
        rule:
        {
          category: 'domain',
          matchedString: 'Cosmos',
          type: 0,
          word: 'Cosmos',
          bitindex: 32,
          bitSentenceAnd: 32,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'cosmos'
        },
        matchedString: 'Cosmos',
        category: 'domain',
        _ranking: 0.8913821472645002,
        levenmatch: 0.9382969971205265
      }]]);
    Model.releaseModel(theModel);
    done();
  });
});


it('testCategorizeMultElement2', done => {
  getModel().then(theModel => {
    var res = WhatIs.analyzeCategoryMultOnlyAndComma('element name and element number, element symbol', theModel.rules, 'what is unit test and wiki for abc');
    expect(res).toEqual(['element name', 'element number', 'element symbol']);
    Model.releaseModel(theModel);
    done();
  });
});


/*
exports.testCategorize = function (test) {
  var res = WhatIs.analyzeCategory('unit test', mRules, 'what is unit test for abc');
  test.equal(res, 'unit test');
  test.done();
};

exports.testCategorizeBad = function (test) {
  var res = WhatIs.analyzeCategory('NavTargetResolution', mRules, 'what is unit test for abc');
  test.equal(res, undefined);
  test.done();
};

/*
exports.testanalyzeOperator = function (test) {
  var res = WhatIs.analyzeOperator('starting with', mRules, 'what is unit test for abc');
  test.equal(res, 'starts with');
  test.done();
};

exports.testanalyzeOperatorBad = function (test) {
  var res = WhatIs.analyzeOperator('ain no op', mRules, 'what is unit test for abc');
  test.equal(res, undefined);
  test.done();
};
*/

/*
export function resolveCategory(category: string, sString: string,
  aRules: Array<IMatch.mRule>, aTools: Array<IMatch.ITool>, records: Array<IMatch.IRecord>): Array<IMatch.IWhatIsAnswer> {
  if (sString.length === 0) {
    return [];
  } else {
*/


/*
exports.testResolveCategory = function (test) {
  var cat = WhatIs.analyzeCategory('url', mRules);
  test.equal(cat, 'url', ' category present');

  var res = WhatIs.resolveCategory(cat, 'unit test NavTargetResolution',
    mRules, records);
  test.deepEqual(res.answers.length, 0);
  test.done();
  / *
  res.answers[0]._ranking = 777;
  res.answers.forEach(function(r) { stripResult(r); });
  test.deepEqual(res.answers,[ { sentence:
  [ {
    string: 'unit',
    matchedString: 'unit',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'test',
    matchedString: 'test',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'NavTargetResolution',
    matchedString: 'NavTargetResolution',
    category: 'unit test',
    _ranking: 1 } ],
    record: { 'unit test': 'NavTargetResolution', url: 'com.sap.NTA' },
    category: 'url',
    result: 'com.sap.NTA',
    _ranking: 777 } ]
    , 'compare result');
  test.done();
  * /
};
*/


/*
exports.testResolveCategoryNoAmb2 = function (test) {
  var cat = WhatIs.analyzeCategory('url', mRules);
  test.equal(cat, 'url', ' category present');
  var res = WhatIs.resolveCategory(cat, 'unit test NavTargetResolution',
    mRules, recordsNoAmb);
  test.equal(res.answers.length, 0, ' resolved length ok');
  test.done();
  return; / *
  res.answers[0]._ranking = 777;
  test.deepEqual(stripResult(res.answers[0]),{ sentence:
  [ {
    string: 'unit',
    matchedString: 'unit',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'test',
    matchedString: 'test',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'NavTargetResolution',
    matchedString: 'NavTargetResolution',
    category: 'unit test',
    _ranking: 1 } ],
    record:
    { 'unit test': 'NavTargetResolution',
      url: 'com.sap.NTA',
      systemId: 'UV2',
      client: '110' },
    category: 'url',
    result: 'com.sap.NTA',
    _ranking: 777 }, 'unit test compare 1');
  var indis = WhatIs.isIndiscriminateResult(res.answers);
  test.equal(indis, undefined, 'correct string');
  test.done();
  * /
};
*/

/*

function stripResult(r) {
  delete r.sentence.forEach(function(s) { delete s.rule;  delete s.span;});
  return r;
}
*/
/*
function doRecognize(cat, str , fn) {
  var res = WhatIs.resolveCategoryOld(cat, str,
    theModel2.rules, theModel2.records);
  debuglog(res.answers.map(o => {
    var u = Object.assign({}, o);
    delete u.record;
    return JSON.stringify(u);
  }).join(' \n**\n'));
  fn(undefined, res);
}
*/

function doRecognizeNew(cat, str, fn) {
  getModel2().then((theModel2) => {
    MongoQueries.listAll(cat + ' with ' + str, theModel2).then(resultWI => {
      debuglog(debuglog ? ('listall result2 >:' + JSON.stringify(resultWI)) : '-');
      var joinresults = ListAll.joinResultsTupel(resultWI);
      debuglog(()=> ' doRecognizeNew 2 ' + JSON.stringify(joinresults));
      //var res = WhatIs.resolveCategory(cat, str,
      //  theModel2.rules);
      debuglog('prior invoke' + resultWI.map(o => {
        var u = Object.assign({}, o);
        return JSON.stringify(u);
      }).join(' \n**\n'));
      fn(undefined, resultWI, theModel2);
    });
  });
}

function doRecognizeMultNew(cats, str, fn) {
  // TODO SHOulD BE TESTMODEL2
  getModel2().then((theModel2) => {
    MongoQueries.listAll(cats.join(' ')+ ' with ' + str, theModel2).then(resultWI => {
      debuglog(debuglog ? ('listall result2 >:' + JSON.stringify(resultWI)) : '-');
      var joinresults = ListAll.joinResultsTupel(resultWI);
      debuglog(()=> JSON.stringify(joinresults));
      //var res = WhatIs.resolveCategory(cat, str,
      //  theModel2.rules);
      debuglog(resultWI.map(o => {
        var u = Object.assign({}, o);
        delete u.record;
        return JSON.stringify(u);
      }).join(' \n**\n'));
      fn(undefined, resultWI, theModel2);
      /*
    var resultArr = WhatIs.resolveCategories(cats, str,
      theModel2);
    debuglog(resultArr.tupelanswers.map(o => {
      var u = Object.assign({}, o);
      delete u.record;
      return JSON.stringify(u);
    }).join(' \n**\n'));
    fn(undefined, resultArr, theModel2);
    */
    });
  });
}

/*
exports.testUpDownWhatIsBSPNameManageLabels = function (test) {
  doRecognize('BSPName', 'manage labels', function(err, res) {
    test.deepEqual(res.answers[0].result,  'n/a' ,' correct results');
    //console.log(JSON.stringify(Object.keys(res.answers[0])));
    test.deepEqual(res.answers[0].category, 'BSPName', ' category');
    test.deepEqual(res.answers[1].sentence[0].matchedString, 'Manage Alerts', ' category');
    test.deepEqual(res.answers.map(o => o.result),
    [ 'n/a', 'FRA_ALERT_MAN'],  'ranking');
    test.deepEqual(res.answers.map(o => o._ranking),
    [ 1.4249999999999998, 1.3383034353080143 ],  'ranking');
    var indis = WhatIs.isIndiscriminateResult(res.answers);
    test.deepEqual(indis, undefined);
    test.done();
  });
};
*/


it('testUpDownWhatIsBSPNameManageLabelsNew', done => {
  jest.setTimeout(200000);
  // jest.setInterval(600000);
  doRecognizeNew('BSPName', 'manage labels', function (err, res, aModel) {
    debuglog( 'here result' );
    debuglog(()=>' here the result '+ JSON.stringify(res,undefined,2));
    expect(res[0].results[0].BSPName).toEqual('n/a');
    expect(res[1].results[0].BSPName).toEqual('FRA_ALERT_MAN');
    expect(res[0].columns[0]).toEqual('BSPName');
    //  test.deepEqual(res.answers[1].sentence[0].matchedString, 'Manage Alerts', ' category');
    /*  test.deepEqual(res.answers.map(o => o.result),
      ['n/a'], 'ranking');
    test.deepEqual(res.answers.map(o => o._ranking),
      [1.3537499999999998]
      //[ 2.1374999999999997, 2.0074551529620215 ]
      , 'ranking');
*/
    var indis = WhatIs.isIndiscriminateResultTupel(res);
    debuglog(()=>'here indis' + JSON.stringify(indis));
    expect(indis).toEqual('Your question does not have a specific answer');
    Model.releaseModel(aModel);
    debuglog('released model');
    done();
  });
});

/*
exports.testUpDownWhatIsBSPNameManageLablesQuote = function (test) {
  doRecognize('BSPName', '"manage labels"', function(err, res) {
    test.deepEqual(res.answers[0].result,  'n/a' ,' correct results');
    //console.log(JSON.stringify(Object.keys(res.answers[0])));
    test.deepEqual(res.answers[0].category, 'BSPName', ' category');
    test.deepEqual(res.answers.length, 1 , 'undefined');
    test.deepEqual(res.answers.map(o => o.result),
    [ 'n/a'],  'ranking');
    test.deepEqual(res.answers.map(o => o._ranking),
    [ 1.4249999999999998 ],  'ranking');
    test.done();
  });
};
*/

//jest.setTimeout(600000);

it('testUpDownWhatIsBSPNameManageLabelQuoteNew', done => {
  //jest.setTimeout(600000);
  doRecognizeNew('BSPName', '"manage labels"', function (err, res, aModel) {
    expect(res[0].results).toEqual([{ BSPName: 'n/a'}]);
    expect(res.length).toEqual(1);
    expect(res[0].columns[0]).toEqual('BSPName');
    expect(res[0].aux.sentence[2].matchedString).toEqual('Manage Labels');
    expect(res.map(o => o.results)).toEqual([[ { BSPName: 'n/a'}]]);
    /*
    test.deepEqual(res.answers.map(o => o._ranking),
      // [ 2.1374999999999997 ]
      [1.3537499999999998]

      , 'ranking');
      */
    var indis = WhatIs.isIndiscriminateResultTupel(res);
    expect(indis).toEqual(undefined);
    Model.releaseModel(aModel);
    done();
  });
});

/*
exports.testWhatIsBSPNameFioriIntentManageLabels = function (test) {
  doRecognizeMult(['BSPName','fiori intent', 'AppName'],'manage labels', function(err, resultArr) {
    test.deepEqual(resultArr.tupelanswers[1].result[0],  'n/a');
    test.deepEqual(resultArr.tupelanswers.map(o => o.result),
      [ [ 'FRA_ALERT_MAN', '#ComplianceAlerts-manage', 'Manage Alerts' ],
  [ 'n/a', '#ProductLabel-manage', 'Manage Labels' ] ],  'result');
    var indis = WhatIs.isIndiscriminateResultTupel(resultArr.tupelanswers);
    test.deepEqual(indis,  'Many comparable results, perhaps you want to specify a discriminating uri,appId,ApplicationComponent,RoleName,ApplicationType,BSPApplicationURL,releaseName,releaseId,BusinessCatalog,TechnicalCatalog,detailsurl,BSPPackage,AppDocumentationLinkKW,BusinessRoleName,BusinessGroupName,BusinessGroupDescription,PrimaryODataServiceName,SemanticObject,FrontendSoftwareComponent,TransactionCodes,PrimaryODataPFCGRole,ExternalReleaseName,ArtifactId,ProjectPortalLink,AppKey or use "list all ..."',
     'indis');
    test.done();
  });
};

exports.testUpWhatIsBSPNameFioriIntentManageLablesQuote = function (test) {
  doRecognizeMult(['BSPName','fiori intent', 'AppName'],'"manage labels"', function(err, resultArr) {
    test.deepEqual(resultArr.tupelanswers[0].result[0],  'n/a');
    test.deepEqual(resultArr.tupelanswers.map(o => o.result),
      [
  [ 'n/a', '#ProductLabel-manage', 'Manage Labels' ] ],  'result');
    var indis = WhatIs.isIndiscriminateResultTupel(resultArr.tupelanswers);
    test.deepEqual(indis, undefined, 'indis');
    test.done();
  });
};
*/

it('testWhatIsBSPNameFioriIntentManageLabelsNew', done => {
  doRecognizeMultNew(['BSPName', 'fiori intent', 'AppName'], 'manage labels', function (err, resultArr, aModel) {
    expect(resultArr[0].results[0]).toEqual(
      { BSPName: 'n/a', 'fiori intent': '#ProductLabel-manage', 'AppName': 'Manage Labels'}
    );
    expect(// .map(o => ListAll.projectResultsToStringArray(o)),
      ListAll.projectFullResultsToFlatStringArray(resultArr)).toEqual([
      ['n/a', '#ProductLabel-manage', 'Manage Labels'],
      // TODO: 2nd result should not be there as it is not close enoough
      //AppNAme filters for it?
      [ 'FRA_ALERT_MAN', '#ComplianceAlerts-manage', 'Manage Alerts' ]
    ]);

    expect(WhatIs.cmpByResultThenRankingTupel(resultArr[0],resultArr[1])).toEqual(1);
    expect(WhatIs.cmpByResultThenRankingTupel(resultArr[1],resultArr[0])).toEqual(-1);
    expect(WhatIs.cmpByResultThenRankingTupel(resultArr[1],resultArr[1])).toEqual(0);
    expect(WhatIs.cmpRecords(resultArr[0].results[0],resultArr[1].results[0])).toEqual(1);
    expect(WhatIs.cmpRecords(resultArr[1].results[0],resultArr[0].results[0])).toEqual(-1);
    expect(WhatIs.cmpRecords(resultArr[1].results[0],resultArr[1].results[0])).toEqual(0);

    var indis = WhatIs.isIndiscriminateResultTupel(resultArr);
    expect(indis !== undefined).toEqual(true);
    Model.releaseModel(aModel);
    done();
  });
});

it('testUpWhatIsBSPNameFioriIntentManageLabelsQuoteNew', done => {
  doRecognizeMultNew(['BSPName', 'fiori intent', 'AppName'], '"manage labels"', function (err, resultArr, aModel) {
    expect(resultArr[0].results[0].BSPName).toEqual('n/a');
    expect(// resultArr.map(o => o.results),
      ListAll.projectFullResultsToFlatStringArray(resultArr)).toEqual([
      ['n/a', '#ProductLabel-manage', 'Manage Labels']]);
    var indis = WhatIs.isIndiscriminateResultTupel(resultArr);
    expect(indis).toEqual(undefined);
    Model.releaseModel(aModel);
    done();
  });
});


/*
exports.testResolveCategoryAmb = function (test) {
  var cat = WhatIs.analyzeCategory('url', mRules);
  test.equal(cat, 'url', ' category present');
  var res = WhatIs.resolveCategory(cat, 'unit test NavTargetResolution',
    mRules, recordsAmb);
  //TODO
  //console.log(JSON.stringify(res.answers,undefined, 2));
  test.equal(res.answers.length, 0);
  / *
  res.answers[0]._ranking = 777;
  res.answers[1]._ranking = 777;
  test.deepEqual(stripResult(res.answers[1]), { sentence:
  [ {
    string: 'unit',
    matchedString: 'unit',
    category: 'fiori catalog',
    _ranking: 0.5 },
  { string: 'test',
    matchedString: 'test',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'NavTargetResolution',
    matchedString: 'NavTargetResolution',
    category: 'unit test',
    _ranking: 1 } ],
    record:
    { 'unit test': 'NavTargetResolution',
      url: 'com.sap.NTAUV2120',
      systemId: 'UV2',
      client: '120' },
    category: 'url',
    result: 'com.sap.NTAUV2120',
    _ranking: 777 }, ' result 1');
  test.deepEqual(stripResult(res.answers[0]), { sentence:
  [ {
    string: 'unit',
    matchedString: 'unit',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'test',
    matchedString: 'test',
    category: 'transaction',
    _ranking: 0.7 },
  { string: 'NavTargetResolution',
    matchedString: 'NavTargetResolution',
    category: 'unit test',
    _ranking: 1 } ],
    record:
    { 'unit test': 'NavTargetResolution',
      url: 'com.sap.NTAUV2110',
      systemId: 'UV2',
      client: '110' },
    category: 'url',
    result: 'com.sap.NTAUV2110',
    _ranking: 777 },
   'result 0');
  var dmp = WhatIs.dumpWeightsTop(res.answers, { top: 3 });
  var indis = WhatIs.isIndiscriminateResult(res.answers);
  test.equal(indis, 'Many comparable results, perhaps you want to specify a discriminating client', 'correct string for indiscriminate ');
  test.equal(dmp.indexOf('category'), 32, 'correct dump');
  * /
  test.done();
};
*/




