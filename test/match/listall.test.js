/**
 * @file
 * @module toolmatcher.nunit
 * @copyright (c) 2016 Gerd Forstmann
*/

var process = require('process');
var root = '../../js';

const ListAll = require(root + '/match/listall.js');
const ErBase = require(root + '/index_parser.js').ErBase;
const MongoQueries = require(root + '/match/mongoqueries.js');
const Model = require(root + '/model/index_model.js').Model;

var getModel = require(root + '/model/testmodels.js').getTestModel1;

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});

it('testListAllWithContext', done => {
  getModel().then(theModel => {
    // NEW NOT RULES
    ListAll.listAllWithContext('url', 'unit test NavTargetResolution',
      theModel).then((res) => {
      // console.log(JSON.stringify(res));
      // test.deepEqual(ListAll.formatDistinctFromWhatIfResult([]), '');
      var res3 = ListAll.joinResultsFilterDuplicates(res);
      expect(res3).toEqual([]);
      var res2 = ListAll.formatDistinctFromWhatIfResult(res);
      expect(res2).toEqual('');
      done();
    });
    Model.releaseModel(theModel);
  });
});

it('testJoinResultsTupel', done => {
  var result = [{
    // 'sentence': [{ 'string': 'mercury', 'matchedString': 'mercury', 'category': 'element name', '_ranking': 0.95 }],
    'columns': ['element name', 'atomic weight'], 'results': [
      { 'element name': 'mercury', 'atomic weight': '200.592(3)' }]
  }];
  var res = ListAll.joinResultsTupel(result);
  expect(res).toEqual(['"mercury" and "200.592(3)"']);
  done();
});

it('testListAllMultWithCompareOneBadCat', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    ListAll.listAllTupelWithContext(['ApplicationComponent', 'devclass', 'FioriBackendCatalogs'], 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {

      expect(ListAll.flattenToStringArray(res)).toEqual([['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]
      /*
        [['CA', 'n/a', 'n/a'],
        ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'n/a'],
        ['FI-LOC-FI', 'ODATA_GLO_FIN_APP_DESCRIPTORS', 'n/a']] */);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testListAllMultHavingCompareOneBadCat', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    ListAll.listAllTupelWithContext(['ApplicationComponent', 'devclass', 'FioriBackendCatalogs'], 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {

      expect(ListAll.flattenToStringArray(res)).toEqual([['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]
      /*
                  [['CA', 'n/a', 'n/a'],
                  ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'n/a'],
                  ['FI-LOC-FI', 'ODATA_GLO_FIN_APP_DESCRIPTORS', 'n/a']]
                  */);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testListAllMultHavingCompareBECategories', done => {
  //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
  getModel().then(theModel => {
    theModel.rules.wordCache = {};
    ListAll.listAllTupelWithContext(['ApplicationComponent', 'devclass', 'BackendCatalogId'], 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {
      expect(ListAll.flattenToStringArray(res)).toEqual([['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]
      /*
                  [['CA', 'n/a', 'n/a'],
                  ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
                    ['FI-LOC-FI',
                      'ODATA_GLO_FIN_APP_DESCRIPTORS',
                      'SAP_TC_FIN_GLO_AC_BE_APPS']]
                      */);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testListAllMultWithCompareBECategories', done => {
  //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."4
  getModel().then(theModel => {
    theModel.rules.wordCache = {};

    ListAll.listAllTupelWithContext(['ApplicationComponent', 'TechnicalCatalog'], 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {

      expect(ListAll.flattenToStringArray(res)).toEqual([['CA', 'SAP_TC_FIN_ACC_BE_APPS:S4FIN'],
        ['CA', 'SAP_TC_FIN_ACC_BE_APPS:S4FIN']]
      /*
    [['CA', 'n/a', 'n/a'],
    ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
      ['FI-LOC-FI',
        'ODATA_GLO_FIN_APP_DESCRIPTORS',
        'SAP_TC_FIN_GLO_AC_BE_APPS']]*/);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testProjectResultToStringArray', done => {
  var src = {
    columns: ['b', 'a', 'c', 'e'],
    results: [{ a: 1, b: true, c: null, e: 'abc' }
      , { a: -17.5, b: false, c: null, e: 'abc' }
    ]
  };
  var res = ListAll.projectResultsToStringArray(
    src);
  expect('' + src.results[0].c).toEqual('null');
  expect('' + res[0][2]).toEqual('null');
  expect(res).toEqual([['true', '1', 'null', 'abc'],
    ['false', '-17.5', 'null', 'abc']
  ]);
  done();
});

it('testFlattenErrors', done => {
  var r = [{ errors: false }, { errors: { abc: 1 } }];
  var res = ListAll.flattenErrors(r);
  expect(res).toEqual([{ abc: 1 }]);
  done();
});

it('testListAllMultWithCompareBECategories', done => {
  //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."4
  getModel().then(theModel => {
    theModel.rules.wordCache = {};
    ListAll.listAllShowMe('orbits with earth', theModel).then((res) => {
      expect(res.bestURI).toEqual('https://en.wikipedia.org/wiki/Earth');
      done();
      Model.releaseModel(theModel);
    });
  });
});



///// with category set !


it('testListAllMultWithCompareBECategoriesWithSet', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    var cats = ['ApplicationComponent', 'devclass', 'BackendCatalogId'];
    //var categorySet = Model.getDomainCategoryFilterForTargetCategories(theModel, cats, true);
    ListAll.listAllTupelWithContext(cats, 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {

      expect(ListAll.flattenToStringArray(res)).toEqual([
        ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testListAllMultWithCompareBECategoriesWithSetDomain', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    var cats = ['ApplicationComponent', 'devclass', 'BackendCatalogId'];
    //var categoryFilter = Model.getDomainCategoryFilterForTargetCategories(theModel, cats, true);
    ListAll.listAllTupelWithContext(cats, 'TransactionCode S_ALR_87012394',
      theModel).then((res) => {
      expect(ListAll.flattenToStringArray(res)).toEqual([
        ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]);
      done();
      Model.releaseModel(theModel);
    });
  });
});




it('testListAllMultHavingCompareBECategoriesWithSet', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    var cats = ['ApplicationComponent', 'devclass', 'BackendCatalogId'];
    var categorySet = Model.getDomainCategoryFilterForTargetCategories(theModel, cats, true);
    ListAll.listAllTupelWithContext(cats, 'TransactionCode S_ALR_87012394',
      theModel, categorySet).then((res) => {

      expect(ListAll.flattenToStringArray(res)).toEqual([

        ['FI-AR', 'APPL_FIN_APP_DESCRIPTORS', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['FI-LOC-FI',
          'ODATA_GLO_FIN_APP_DESCRIPTORS',
          'SAP_TC_FIN_GLO_AC_BE_APPS']]);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testListAllMultHavingCompareBECategoriesWithSetOrder', done => {
  getModel().then(theModel => {
    //"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."
    var cats = ['devclass', 'ApplicationComponent', 'BackendCatalogId'];
    var categorySet = Model.getDomainCategoryFilterForTargetCategories(theModel, cats, true);
    ListAll.listAllTupelWithContext(cats, 'TransactionCode S_ALR_87012394',
      theModel, categorySet).then((res) => {
      expect(ListAll.flattenToStringArray(res)).toEqual([['APPL_FIN_APP_DESCRIPTORS', 'FI-AR', 'SAP_TC_FIN_ACC_BE_APPS'],
        ['ODATA_GLO_FIN_APP_DESCRIPTORS', 'FI-LOC-FI',

          'SAP_TC_FIN_GLO_AC_BE_APPS']]);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testListAllWithContextDomainOPLike', done => {
  getModel().then(theModel => {
    ListAll.listAllWithContext('Table', 'domain "SOBJ Tables"',
      theModel).then((res) => {
      var res2 = ListAll.formatDistinctFromWhatIfResult(res);
      expect(res2).toEqual(
        '"/UIF/LREPDATTR"; "/UIF/LREPDATTRCD"; "/UIF/LREPDCONT"; "/UIF/LREPDCONTCD"; "/UIF/LREPDEREF"; "/UIF/LREPDEREFCD"; "/UIF/LREPDLTXT"; "/UIF/LREPDLTXTCD"; "/UIF/LREPDREF"; "/UIF/LREPDREFCD"; "/UIF/LREPDSTXT"; "/UIF/LREPDSTXTCD"; "/UIF/LREPDTEXT"; "/UIF/LREPDTEXTCD"; "LTDHTRAW"; "LTDHTTMPL"; "LTR_REPOSITORY"; "SWOTDI"; "SWOTDQ"; "TZS02"'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testIsSignificantDifference', done => {
  expect(ListAll.isSignificantDifference('abcdefs', 'hijlk')).toEqual(true);
  expect(ListAll.isSignificantDifference('abcdef', 'abcdef')).toEqual(false);
  expect(ListAll.isSignificantDifference('abcdefss', 'abcdef')).toEqual(true);
  expect(ListAll.isSignificantDifference('Abcdef', 'abcDefs')).toEqual(false);
  expect(ListAll.isSignificantDifference('abcdef', 'abcdefss')).toEqual(true);
  expect(ListAll.isSignificantDifference('abcdefs', 'abcdef')).toEqual(false);
  done();
});

it('testIsSignificantWord', done => {
  getModel().then(theModel => {
    var procstring = ErBase.processString('element name Nickel in IUPAC', theModel.rules, {});
    //debuglog(JSON.stringify(procstring.sentences));
    //Object.keys(theModel));

    var res = procstring.sentences[0].filter(ListAll.isSignificantWord);
    var r2 = res.map(res => res.matchedString);
    expect(r2).toEqual(['element name', 'nickel', 'In']);
    done();
    Model.releaseModel(theModel);
  });
});

it('testListAllNewFormatELementNames', done => {
  getModel().then(theModel => {
    MongoQueries.listAll('Elements nAmes', theModel).then(res => {
      var nonerror = ListAll.removeErrorsIfOKAnswers(res);
      var nonempty = ListAll.removeEmptyResults(nonerror);
      var res2 = ListAll.resultAsListString(nonempty, theModel);
      expect(res2).toEqual(
        'The query has answers in more than one domain:\nElements nAmes ("element name") in domain "IUPAC"...\n"actinium"\n"aluminium"\n"americium"\n"antimony"\n"argon"\n"arsenic"\n"astatine"\n"barium"\n"berkelium"\n"beryllium"\n"bismuth"\n"bohrium"\n"boron"\n"bromine"\n"cadmium"\n"caesium"\n"calcium"\n"californium"\n"carbon"\n"cerium"\n"chlorine"\n"chromium"\n"cobalt"\n"copernicium"\n"copper"\n"curium"\n"darmstadtium"\n"dubnium"\n"dysprosium"\n"einsteinium"\n"erbium"\n"europium"\n"fermium"\n"flerovium"\n"fluorine"\n"francium"\n"gadolinium"\n"gallium"\n"germanium"\n"gold"\n"hafnium"\n"hassium"\n"helium"\n"holmium"\n"hydrogen"\n"indium"\n"iodine"\n"iridium"\n"iron"\n"krypton"\n"lanthanum"\n"lawrencium"\n"lead"\n"lithium"\n"livermorium"\n"lutetium"\n"magnesium"\n"manganese"\n"meitnerium"\n"mendelevium"\n"mercury"\n"molybdenum"\n"moscovium"\n"neodymium"\n"neon"\n"neptunium"\n"nickel"\n"nihonium"\n"niobium"\n"nitrogen"\n"nobelium"\n"oganesson"\n"osmium"\n"oxygen"\n"palladium"\n"phosphorus"\n"platinum"\n"plutonium"\n"polonium"\n"potassium"\n"praseodymium"\n"promethium"\n"protactinium"\n"radium"\n"radon"\n"rhenium"\n"rhodium"\n"roentgenium"\n"rubidium"\n"ruthenium"\n"rutherfordium"\n"samarium"\n"scandium"\n"seaborgium"\n"selenium"\n"silicon"\n"silver"\n"sodium"\n"strontium"\n"sulfur"\n"tantalum"\n"technetium"\n"tellurium"\n"tennesine"\n"terbium"\n"thallium"\n"thorium"\n"thulium"\n"tin"\n"titanium"\n"tungsten"\n"uranium"\n"vanadium"\n"xenon"\n"ytterbium"\n"yttrium"\n"zinc"\n"zirconium"\n\nElements nAmes ("element name") in domain "Philosophers elements"...\n"earth"\n"fire"\n"water"\n"wind"\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testListAllFilterByRank', done => {
  getModel().then(theModel => {
    MongoQueries.listAll('Elements nAme', theModel).then(res => {
      var nonerror = ListAll.removeErrorsIfOKAnswers(res);
      var nonempty = ListAll.removeEmptyResults(nonerror);
      //     debuglog(() => nonempty.map(answer =>
      //       Sentence.dumpNiceRuled(answer.aux.sentence)).join('\n'));
      var filtered = ListAll.retainOnlyTopRankedPerDomain(nonempty);
      //     debuglog(()=> ' post filter\n' + filtered.map(answer =>
      //      Sentence.dumpNiceRuled(answer.aux.sentence)).join('\n'));

      var res2 = ListAll.resultAsListString(filtered, theModel);
      expect(res2).toEqual(
        'The query has answers in more than one domain:\nElements nAme ("element name") in domain "IUPAC"...\n"actinium"\n"aluminium"\n"americium"\n"antimony"\n"argon"\n"arsenic"\n"astatine"\n"barium"\n"berkelium"\n"beryllium"\n"bismuth"\n"bohrium"\n"boron"\n"bromine"\n"cadmium"\n"caesium"\n"calcium"\n"californium"\n"carbon"\n"cerium"\n"chlorine"\n"chromium"\n"cobalt"\n"copernicium"\n"copper"\n"curium"\n"darmstadtium"\n"dubnium"\n"dysprosium"\n"einsteinium"\n"erbium"\n"europium"\n"fermium"\n"flerovium"\n"fluorine"\n"francium"\n"gadolinium"\n"gallium"\n"germanium"\n"gold"\n"hafnium"\n"hassium"\n"helium"\n"holmium"\n"hydrogen"\n"indium"\n"iodine"\n"iridium"\n"iron"\n"krypton"\n"lanthanum"\n"lawrencium"\n"lead"\n"lithium"\n"livermorium"\n"lutetium"\n"magnesium"\n"manganese"\n"meitnerium"\n"mendelevium"\n"mercury"\n"molybdenum"\n"moscovium"\n"neodymium"\n"neon"\n"neptunium"\n"nickel"\n"nihonium"\n"niobium"\n"nitrogen"\n"nobelium"\n"oganesson"\n"osmium"\n"oxygen"\n"palladium"\n"phosphorus"\n"platinum"\n"plutonium"\n"polonium"\n"potassium"\n"praseodymium"\n"promethium"\n"protactinium"\n"radium"\n"radon"\n"rhenium"\n"rhodium"\n"roentgenium"\n"rubidium"\n"ruthenium"\n"rutherfordium"\n"samarium"\n"scandium"\n"seaborgium"\n"selenium"\n"silicon"\n"silver"\n"sodium"\n"strontium"\n"sulfur"\n"tantalum"\n"technetium"\n"tellurium"\n"tennesine"\n"terbium"\n"thallium"\n"thorium"\n"thulium"\n"tin"\n"titanium"\n"tungsten"\n"uranium"\n"vanadium"\n"xenon"\n"ytterbium"\n"yttrium"\n"zinc"\n"zirconium"\n\nElements nAme ("element name") in domain "Philosophers elements"...\n"earth"\n"fire"\n"water"\n"wind"\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testListAllNewFormatELementNames2', done => {
  getModel().then(theModel => {
    MongoQueries.listAll('element names starting with ni', theModel).then(res => {
      var nonerror = ListAll.removeErrorsIfOKAnswers(res);
      var nonempty = ListAll.removeEmptyResults(nonerror);
      var res2 = ListAll.resultAsListString(nonempty, theModel);
      expect(res2).toEqual(
        'element names starting with ni\n..."nickel"\n"nihonium"\n"niobium"\n"nitrogen"\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});




it('testListAllWithContextDomainLike', done => {
  getModel().then(theModel => {
    ListAll.listAllWithContext('Table', '"SOBJ Tables"',
      theModel).then((res) => {
      var res2 = ListAll.formatDistinctFromWhatIfResult(res);
      expect(res2).toEqual(
        '"/UIF/LREPDATTR"; "/UIF/LREPDATTRCD"; "/UIF/LREPDCONT"; "/UIF/LREPDCONTCD"; "/UIF/LREPDEREF"; "/UIF/LREPDEREFCD"; "/UIF/LREPDLTXT"; "/UIF/LREPDLTXTCD"; "/UIF/LREPDREF"; "/UIF/LREPDREFCD"; "/UIF/LREPDSTXT"; "/UIF/LREPDSTXTCD"; "/UIF/LREPDTEXT"; "/UIF/LREPDTEXTCD"; "LTDHTRAW"; "LTDHTTMPL"; "LTR_REPOSITORY"; "SWOTDI"; "SWOTDQ"; "TZS02"'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testListAllWithContextDomainLikeAmbiguous', done => {
  getModel().then(theModel => {
    ListAll.listAllWithContext('Table', 'SOBJ Tables',
      theModel).then((res) => {
      var res2 = ListAll.formatDistinctFromWhatIfResult(res);
      expect(res2).toEqual(
        '"/UIF/LREPDATTR"; "/UIF/LREPDATTRCD"; "/UIF/LREPDCONT"; "/UIF/LREPDCONTCD"; "/UIF/LREPDEREF"; "/UIF/LREPDEREFCD"; "/UIF/LREPDLTXT"; "/UIF/LREPDLTXTCD"; "/UIF/LREPDREF"; "/UIF/LREPDREFCD"; "/UIF/LREPDSTXT"; "/UIF/LREPDSTXTCD"; "/UIF/LREPDTEXT"; "/UIF/LREPDTEXTCD"; "LTDHTRAW"; "LTDHTTMPL"; "LTR_REPOSITORY"; "SWOTDI"; "SWOTDQ"; "TZS02"'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testGetDistinctDomains', done => {
  var res = [{ domain: 'a' }, { domain: undefined }];
  expect(ListAll.getDistinctOKDomains(res)).toEqual(['a']);
  var res1b = [{ domain: 'a' }, { domain: 'a' }, { domain: undefined }];
  expect(ListAll.getDistinctOKDomains(res1b)).toEqual(['a']);
  var res2 = [{ domain: 'a', errors: {} }, { domain: undefined }];
  expect(ListAll.getDistinctOKDomains(res2)).toEqual([]);
  var res3 = [{ domain: 'a', errors: false }, { domain: 'A', errors: false }, { domain: 'a' }, { domain: 'b' }];
  expect(ListAll.getDistinctOKDomains(res3)).toEqual(['a', 'A', 'b']);
  done();
});

it('testhasOKAnswer', done => {
  var res = [{ domain: 'a' }, { domain: undefined }];
  expect(ListAll.hasOKAnswer(res)).toEqual(true);
  var res2 = [{ domain: 'a', errors: {} }, { domain: undefined }];
  expect(ListAll.hasOKAnswer(res2)).toEqual(false);
  done();
});

it('testFilterOKAnswer', done => {
  expect(ListAll.isOKAnswer({ domain: undefined })).toEqual(false);
  done();
});

it('testremoveErrorsIfOKAnswers', done => {
  var res = [{ domain: 'a' }, { domain: undefined }];
  expect(ListAll.removeErrorsIfOKAnswers(res)).toEqual([{ domain: 'a' }]);
  var res2 = [{ domain: 'a', errors: {} }, { domain: undefined }];
  expect(ListAll.removeErrorsIfOKAnswers(res2)).toEqual([{ domain: 'a', errors: {} }, { domain: undefined }]);
  var res3 = [{ domain: 'a', errors: false }, { domain: 'A', errors: false }, { domain: 'a' }, { domain: undefined }, { domain: 'b', errors: {} }, { domain: 'b' }];
  expect(ListAll.removeErrorsIfOKAnswers(res3)).toEqual([{ domain: 'a', errors: false },
    { domain: 'A', errors: false }, { domain: 'a' }, { domain: 'b' }]);
  done();
});

it('testRemoveEmptyResults', done => {
  var res = [{ domain: 'a', results: [] }, { domain: 'b', results: [{}] }];
  expect(ListAll.removeEmptyResults(res)).toEqual([{ domain: 'b', results: [{}] }]);
  done();
});

/*
exports.testSortMetamodelLast = function(test) {
  var res = [{ domain : 'b', results: []},{ domain: 'metamodel', results: ['a']},
  { domain: 'a', results: [{}]},
  { domain: 'metamodel', results: ['a']},
  ];
  test.deepEqual(ListAll.sortMetamodelsLast(res),[{ domain : 'b', results: [{}]}]);
  test.done();
};
*/

it('testHasEmpty', done => {
  var res = [{ domain: 'b', results: ['x'] }, { domain: 'metamodel', results: ['a'] },
    { domain: 'a', results: [{}] },
    { domain: 'metamodel', results: ['a'] },
  ];
  expect(ListAll.hasEmptyResult(res)).toEqual(false);
  done();
});



it('testRemoveMetamodelsResultIfOthersThrowsEmpty', done => {
  var res = [{ domain: 'b', results: [] }, { domain: 'metamodel', results: ['a'] },
    { domain: 'a', results: [{}] },
    { domain: 'metamodel', results: ['a'] },
  ];
  try {
    ListAll.removeMetamodelResultIfOthers(res);
    expect(0).toEqual(1);
  } catch (e) {
    expect(0).toEqual(0);
  }
  done();
});

it('testRemoveMetamodelsResultIfOthersThrowsError', done => {
  var res = [{ domain: 'b', errors: {}, results: ['a'] }];
  try {
    ListAll.removeMetamodelResultIfOthers(res);
    expect(0).toEqual(1);
  } catch (e) {
    expect(0).toEqual(0);
  }
  done();
});


it('testRemoveMetamodelsResultIfOthersOthers', done => {
  var res = [{ domain: 'b', results: ['x'] }, { domain: 'metamodel', results: ['a'] },
    { domain: 'a', results: [{}] },
    { domain: 'metamodel', results: ['a'] },
  ];
  expect(ListAll.removeMetamodelResultIfOthers(res)).toEqual([{ domain: 'b', results: ['x'] },
    { domain: 'a', results: [{}] }]);
  done();
});

it('testRemoveMetamodelsResultIfOthersOnlyMetamodel', done => {
  var res = [{ domain: 'metamodel', results: ['a'] },
    { domain: 'metamodel', results: [{}] },
    { domain: 'metamodel', results: ['a'] }
  ];
  expect(ListAll.removeMetamodelResultIfOthers(res)).toEqual([{ domain: 'metamodel', results: ['a'] },
    { domain: 'metamodel', results: [{}] },
    { domain: 'metamodel', results: ['a'] }
  ]);
  done();
});

it('testSortByDomains', done => {

  done();
});

/*

exports.testListAllWithCategory = function (test) {
  getModel().then(theModel => {
    ListAll.listAllWithCategory('unit test',
      theModel).then((res) => {
        var res2 = ListAll.joinDistinct('unit test', res);
        test.deepEqual(res2, '"CrossApplcationNavigation"; "NavTargetResolution"; "ShellNavigation"');
        test.done();
        Model.releaseModel(theModel);
      });
  });
};

*/

it('testinferDomain', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'domain FioriBOM');
    expect(domain).toEqual('FioriBOM');
    done();
    Model.releaseModel(theModel);
  });
});

it('testinferDomainBOM', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, '"fiori bom"');
    expect(domain).toEqual('FioriBOM');
    done();
    Model.releaseModel(theModel);
  });
});



it('testinferDomainUndef', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'cannot be analyzed');
    expect(domain).toEqual(undefined);
    done();
    Model.releaseModel(theModel);
  });
});



it('testinferDomain2_2', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'domain related to fiori backend catalogs');
    expect(domain).toEqual('Fiori Backend Catalogs');
    done();
    Model.releaseModel(theModel);
  });
});


it('testinferDomainTwoDomains', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'domain FioriFLP domain wiki');
    expect(domain).toEqual(undefined);
    done();
    Model.releaseModel(theModel);
  });
});

it('testinferDomainDomainByCategory', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'element symbol');

    expect(domain).toEqual('IUPAC');
    done();
    Model.releaseModel(theModel);
  });
});

it('testinferDomainDomainByCategoryAmbiguous', done => {
  getModel().then(theModel => {
    var domain = '';
    try {
      domain = ListAll.inferDomain(theModel, 'element name');
      expect(true).toEqual(true);
    } catch (e) {
      expect(false).toEqual(true);
    }
    expect(domain).toEqual(undefined);
    done();
    Model.releaseModel(theModel);
  });
});

it('testinferDomainTwoDomainsByCategory', done => {
  getModel().then(theModel => {
    var domain = ListAll.inferDomain(theModel, 'element name country');
    expect(domain).toEqual(undefined);
    done();
    Model.releaseModel(theModel);
  });
});

/*
exports.testListAllFilterStringList = function (test) {
  var res = ListAll.filterStringListByOp({
    operator: 'contains'
  }, 'abc', ['', 'abc', 'def abc hij', 'soabc', 'sonothing', 'abbutnotc']);
  test.deepEqual(res, ['abc', 'def abc hij', 'soabc']);
  test.done();
};
*/


it('testListAllRemoveCaseDuplicates', done => {
  var res = ListAll.removeCaseDuplicates(['abC', 'abc', 'Abc', 'ABC', 'abcD', 'ABCD', 'AB', 'a']);
  expect(res).toEqual(['a', 'AB', 'ABC', 'ABCD']);
  done();
});

it('testlikelyPluralDiff', done => {
  expect(ListAll.likelyPluralDiff('element name', 'element names')).toEqual(true);
  expect(ListAll.likelyPluralDiff('element name', '"element names"')).toEqual(true);
  expect(ListAll.likelyPluralDiff('element name', '"element nam"')).toEqual(false);
  expect(ListAll.likelyPluralDiff('element names', '"element name"')).toEqual(false);
  done();
});

it('testListAllFilterStringList', done => {
  var res = ListAll.getCategoryOpFilterAsDistinctStrings({
    operator: 'starting with'
  }, 'aBc', 'cat1', [
    { 'cat1': 'abCAndMore' },
    { 'cat1': 'abCAndSomeMore' },
    { 'cat1': 'abcAndsomemore' },
    { 'cat1': 'abCAndAnything' },
    { 'cat1': 'AbcAndsomemore' },

    {
      'cat1': 'abCAndMore',
      'cat2': 'abcAndMore'
    },
    {
      'cat1': 'nononAndMore',
      'cat2': 'abcAndMore'
    },
    { 'cat0': 'abCAndMore' },
    { 'cat1': 'abCAndMore' },
  ]);
  expect(res).toEqual(['abCAndAnything', 'abCAndMore', 'AbcAndsomemore']);
  done();
});


