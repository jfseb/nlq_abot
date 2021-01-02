/*! copyright gerd forstmann, all rights reserved */
//var debug = require('debug')('appdata.nunit');
//var process = require('process');
var root = '../../js';

//const { doesNotMatch } = require('assert');
//const mongoosex = require("srcHandle");
//mongoosex.Promise = global.Promise;

var fs = require('fs');

var debuglog = require('debugf')('model.test');

var Meta = require(root + '/model/meta.js');
var Model = require(root + '/model/model.js');
var IfMatch = require(root + '/match/ifmatch.js');
var EnumRuleType = IfMatch.EnumRuleType;

/**
 * clear a cache for the defaut mode for coverage
 */
try {
  fs.unlinkSync('./testmodel/_cache.js.zip');
} catch (e) {
  // empty
}

try {
  fs.unlinkSync('./testmodel2/_cache.js.zip');
} catch (e) {
  // empty
}

it('testhasSeenRuleWithFact', async () => {
  var rules =
    [
      {
        word: 'abc',
        matchedString: 'abc',
        category: 'cata',
        bitindex: 1
      }
    ]
    ;
  var res = Model.hasRuleWithFact(rules, 'abc', 'cata', 1);
  expect(res).toEqual(true);
  res = Model.hasRuleWithFact(rules, 'abc', 'catb', 1);
  expect(res).toEqual(false);

});

var _ = require('lodash');

var getModel = require(root + '/model/testmodels.js').getTestModel1;

/*

var srcHandle = require('mongoose_record_replay').instrumentMongoose(require('srcHandle'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  mode);

var aPromise = undefined;
function getModel() {
  if (mode === 'REPLAY') {
    // in replax mode, using a singleton is sufficient
    aPromise = aPromise || Model.loadModelsOpeningConnection(srcHandle, 'mongodb://localhost/testdb');
    return aPromise;
  }
  return Model.loadModelsOpeningConnection(srcHandle, 'mongodb://localhost/testdb');
}
*/

//var getModel() = Model.loadModelsOpeningConnection(srcHandle,'mongodb://localhost/testdb'  );

var cats = ['AppDocumentationLinkKW',
  'AppKey',
  'AppName',
  'ApplicationComponent',
  'ApplicationType',
  'ArtifactId',
  'BSPApplicationURL',
  'BSPName',
  'BSPPackage',
  'BackendCatalogId',
  'BusinessCatalog',
  'BusinessGroupDescription',
  'BusinessGroupName',
  'BusinessRoleName',
  'ExternalReleaseName',
  'FrontendSoftwareComponent',
  'LPDCustInstance',
  'LUNRIndex',
  'Object name length',
  'PrimaryODataPFCGRole',
  'PrimaryODataServiceName',
  'PrimaryTable',
  'QBE',
  'RoleName',
  'SemanticAction',
  'SemanticObject',
  'Shorttext',
  'SoftwareComponent',
  'Table',
  'TableTransportKeySpec',
  'TechnicalCatalog',
  'TechnicalCatalogSystemAlias',
  'TransactionCode',
  'TranslationRelevant',
  'TransportObject',
  'Type',
  'URLParameters',
  'WebDynproApplication',
  '_url',
  'albedo',
  'appId',
  'atomic weight',
  'besitzer',
  'betriebsende',
  'category',
  'category description',
  'category synonyms',
  'client',
  'clientSpecific',
  'columns',
  'detailsurl',
  'devclass',
  'distance',
  'domain',
  'domain description',
  'eccentricity',
  'element name',
  'element number',
  'element properties',
  'element symbol',
  'exactmatch',
  'fiori intent',
  'gründungsjahr',
  'isPublished',
  'mass',
  'nachfolger',
  'object name',
  'object type',
  'orbit radius',
  'orbital period',
  'orbits',
  'radius',
  'recordKey',
  'releaseId',
  'releaseName',
  'sender',
  'sendertyp',
  'showURI',
  'showURIRank',
  'standort',
  'systemId',
  'tcode',
  'transaction description',
  'uri',
  'uri_rank',
  'visual luminosity',
  'visual magnitude',
  'wordindex'];


describe('testdb', () => {
  let theModel;
  beforeAll(async () => {
    theModel = await getModel();
  });
  afterAll(async () => {
    await Model.releaseModel(theModel);
  });


  /**
 * Unit test for sth
 */
  it('testModel', (done) => {
    expect.assertions(3);
    // return getModel().then( (amodel) => {
    debuglog('got model');
    var fullModelHandle = theModel.mongoHandle;
    debuglog('here we are' + Object.keys(fullModelHandle));
    var res = theModel.category.sort();
    var delta1 = _.difference(res, cats);
    expect(delta1).toEqual([]);
    var delta2 = _.difference(cats, res);
    expect(delta2).toEqual([]);
    expect(res).toEqual(cats);
    // Model.releaseModel(amodel);
    done();
  });
  

  it('testFilterRemapCategories', async () => {
    var recs = [{
      a: [{ b: 1, d: 2 }],
      c: 'abc'
    },
    {
      a: [],
      c: 'def'
    },
    {
      a: null,
      c: 'hjl'
    },
    {
      a: undefined,
      c: 'xyz'
    }
    ];

    var mongomap = {
      'catb': { paths: ['a', '[]', 'b'] },
      'catd': { paths: ['a', '[]', 'd'] },
      'catc': { paths: ['c'] }
    };
    var res = Model.filterRemapCategories(mongomap, ['catb', 'catd', 'catc'], recs);
    expect(res).toEqual([
      { 'catb': 1, 'catd': 2, 'catc': 'abc' },
      { 'catb': undefined, 'catd': undefined, 'catc': 'def' },
      { 'catb': undefined, 'catd': undefined, 'catc': 'hjl' },
      { 'catb': undefined, 'catd': undefined, 'catc': 'xyz' }
    ]);
    var res2 = Model.filterRemapCategories(mongomap, ['catd'], recs);
    expect(res2).toEqual([
      { 'catd': 2 },
      { 'catd': undefined },
      { 'catd': undefined },
      { 'catd': undefined }
    ]);
  });

  it('testFilterRemapCategoriesBadCat', async () => {
    var recs = [{
      a: [{ b: 1, d: 2 }],
      c: 'abc'
    },
    {
      a: [],
      c: 'def'
    },
    {
      a: null,
      c: 'hjl'
    },
    {
      a: undefined,
      c: 'xyz'
    }
    ];

    var mongomap = {
      paths: {
        'catb': ['a', '[]', 'b'],
        'catd': ['a', '[]', 'd'],
        'catc': ['c']
      }
    };
    try {
      Model.filterRemapCategories(mongomap, ['NOTPRESENTCAT', 'catb'], recs);
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }

    //test.done()

  });


  /*

  [ '_url',
    'albedo',
    'atomic weight',
    'client',
    'distance',
    'eccentricity',
    'element name',
    'element number',
    'element properties',
    'element symbol',
    'fiori catalog',
    'fiori group',
    'fiori intent',
    'mass',
    'object name',
    'object type',
    'orbit radius',
    'orbital period',
    'orbits',
    'radius',
    'systemId',
    'tool',
    'transaction',
    'unit test',
    'url',
    'visual luminosity',
    'visual magnitude',
    'wiki' ] */

  /*

exports.testModelGetOperator = function (test) {
  test.expect(1);
  var op = Model.getOperator(theModel,'containing');
  test.deepEqual(op,
    {
      'arity': 2,
      'operator' : 'containing',
      'argcategory': [
        [
          'category'
        ],
        [
          '_fragment'
        ]
      ]
    }
  , 'no error');
  test.done();
};
*/



  it('testgetAllRecordCategoriesForTargetCategories1', async () => {
    // getModel().then(theModel => {
    try {

      Model.getDomainCategoryFilterForTargetCategories(theModel, ['element name', 'SemanticObject']);
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.toString()).toEqual(
        'Error: categories "element name" and "SemanticObject" have no common domain.'
      );
    }

    //test.done()
    // Model.releaseModel(theModel);
  }); //.catch(teardown.bind(undefined, test));



  it('testgetAllRecordCategoriesForTargetCategories2', async () => {
    expect.assertions(1);
    //  return getModel().then(theModel => {
    var res = Model.getDomainCategoryFilterForTargetCategories(theModel, ['element name', 'element symbol']);
    expect(res).toEqual({
      domains: ['IUPAC'],
      categorySet:
      {
        'atomic weight': true,
        'element name': true,
        'element number': true,
        'element symbol': true
      }
    });

    //test.done()


    //  Model.releaseModel(theModel);
  });


  it('testgetAllRecordCategoriesForTargetCategory', (done) => {
    expect.assertions(1);
    //return getModel().then(theModel => {
    var res = Model.getDomainCategoryFilterForTargetCategory(theModel, 'element name');
    expect(res).toEqual({
      domains: ['IUPAC', 'Philosophers elements'],
      categorySet:
      {
        'atomic weight': true,
        'element name': true,
        'element number': true,
        'element symbol': true,
        'element properties': true
      }
    });
    //Model.releaseModel(theModel);
    done();
  });

  it('testLoadModelsNoMonbooseThrows', () => {
    try {
      Model.loadModels();
      expect(0).toEqual(1);
    } catch (e) {
      expect(1).toEqual(1);
    }
  });


  it('testgetExpandedRecordsForCategory', (done) => {
    expect.assertions(2);
    // return getModel().then(theModel => {
    return Model.getExpandedRecordsForCategory(theModel, 'Cosmos', 'orbits').then((res) => {
      expect(res.length).toEqual(7);
      res.sort(Model.sortFlatRecords);
      expect(res[0].orbits).toEqual('Alpha Centauri C');
      done();
    });
  });

  it('testgetExpandedRecordsForCategoryMetamodel2', async (done) => {
    expect.assertions(3);
    return Model.getExpandedRecordsForCategory(theModel, 'metamodels', 'category').then((res) => {
      expect(res.length).toEqual(85); // 98);
      res.sort(Model.sortFlatRecords);
      debuglog(() => JSON.stringify(res));
      expect(res[0].category).toEqual('_url');
      expect(res[10].category).toEqual('atomic weight');
      done();
    });
  });

  it('testgetExpandedRecordsFull', (done) => {
    expect.assertions(3);
    //  return getModel().then(theModel => {
    return Model.getExpandedRecordsFirst(theModel, 'Cosmos').then((res) => {
      expect(res.length).toEqual(7);
      res.sort(Model.sortFlatRecords);
      expect(res[0].orbits).toEqual('Sun');
      expect(Object.keys(res[0]).length).toEqual(13);

      done();


      // Model.releaseModel(theModel);
    });
  });


  it('testGetCategoryRec', (done) => {
    expect.assertions(2);
    // return getModel().then(theModel => {
    var mongoHandleRaw = theModel.mongoHandle;
    var r = Model.getCategoryRec(mongoHandleRaw, 'iupacs', 'element number');
    delete r._id;
    debuglog(()=>JSON.stringify(r));
    expect(r).toEqual({ 'type': 'Number', 'category': 'element number', 'category_description': 'weight of the element', 'QBEColumnProps': { 'defaultWidth': 160, 'QBE': true, 'LUNRIndex': true }, 'wordindex': true });
    expect(r.type).toEqual('Number');
    //   Model.releaseModel(theModel);
    done();
    // });
  });

  it('testGetExpandedRecordsFullArray', (done) => {
    expect.assertions(6);
    //  return getModel().then(theModel => {
    var modelname = Model.getModelNameForDomain(theModel.mongoHandle, 'metamodel');
    var model = Model.getModelForDomain(theModel, 'metamodel');
    var mongoMap = theModel.mongoHandle.mongoMaps[modelname];
    Model.checkModelMongoMap(model, 'metamodel', mongoMap, 'domain');

    try {
      Model.checkModelMongoMap(undefined, 'metamodel', mongoMap, 'domain');
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }
    try {
      Model.checkModelMongoMap(model, 'metamodel', undefined, 'domain');
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }
    try {
      Model.checkModelMongoMap(model, 'metamodel', mongoMap, 'domainGIBTSNICH');
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }

    return Model.getExpandedRecordsFirst(theModel, 'metamodel').then((res) => {
      expect(res.length).toEqual(85); // 98);
      res.sort(Model.sortFlatRecords);
      expect(res[0].category).toEqual('_url');
      expect(Object.keys(res[0]).length).toEqual(13);
      done();
    });
  });

  it('testgetExpandedRecordsFullArray2', (done) => {
    expect.assertions(3);
    //  return getModel().then(theModel => {
    return Model.getExpandedRecordsFirst(theModel, 'metamodel').then((res) => {
      expect(res.length).toEqual(85); // 98);
      res.sort(Model.sortFlatRecords);
      expect(res[0].category).toEqual('_url');
      expect(Object.keys(res[0]).length).toEqual(13);

      done();
      //    Model.releaseModel(theModel);
    });
  });

  it('testgetCategoryFilterMultDomains', async () => {
    expect.assertions(1);
    // return getModel().then(theModel => {
    var res = Model.getDomainCategoryFilterForTargetCategories(theModel, ['ApplicationComponent', 'TransactionCode'], true);
    expect(res).toEqual({
      domains: ['Fiori Backend Catalogs', 'FioriBOM'],
      categorySet:
      {
        ApplicationComponent: true,
        BackendCatalogId: true,
        BusinessCatalog: true,
        SemanticAction: true,
        SemanticObject: true,
        SoftwareComponent: true,
        TechnicalCatalogSystemAlias: true,
        TransactionCode: true,
        WebDynproApplication: true,
        devclass: true,
        'fiori intent': true,
        AppDocumentationLinkKW: true,
        AppKey: true,
        AppName: true,
        ApplicationType: true,
        ArtifactId: true,
        BSPApplicationURL: true,
        BSPName: true,
        BSPPackage: true,
        BusinessGroupDescription: true,
        BusinessGroupName: true,
        BusinessRoleName: true,
        ExternalReleaseName: true,
        FrontendSoftwareComponent: true,
        LPDCustInstance: true,
        PrimaryODataPFCGRole: true,
        PrimaryODataServiceName: true,
        RoleName: true,
        TechnicalCatalog: true,
        URLParameters: true,
        appId: true,
        detailsurl: true,
        isPublished: true,
        releaseId: true,
        releaseName: true,
        uri: true,
        uri_rank: true
      }
    });

    //test.done()
  });


  it('testgetCAtegoryFilterOneDomain', async () => {
    expect.assertions(1);
    //return getModel().then(theModel => {
    var res = Model.getDomainCategoryFilterForTargetCategories(theModel, ['ApplicationComponent', 'devclass', 'TransactionCode'], true);
    expect(res).toEqual({
      domains: ['Fiori Backend Catalogs'],
      categorySet:
      {
        ApplicationComponent: true,
        BackendCatalogId: true,
        BusinessCatalog: true,
        SemanticAction: true,
        SemanticObject: true,
        SoftwareComponent: true,
        TechnicalCatalogSystemAlias: true,
        TransactionCode: true,
        WebDynproApplication: true,
        devclass: true,
        'fiori intent': true
      }
    });
    //test.done()
    //Model.releaseModel(theModel);
  });

  it('testModelGetDomainIndex', async () => {
    expect.assertions(1);
    //return getModel().then(theModel => {
    var res = Model.getDomainBitIndex('IUPAC', theModel);
    expect(res).toEqual(0x0010);
    //test.done()
    //Model.releaseModel(theModel);
  });

  it('testModelGetDomainIndexNotPresent', (done) => {
    expect.assertions(1);
    // return getModel().then(theModel => {
    var res = Model.getDomainBitIndex('NOTPRESENT', theModel);
    expect(res).toEqual(0x200);
    done();
  });



  it('testModelGetDomainIndexThrows', async () => {
    var a = [];
    for (var i = 0; i < 32; ++i) {
      a.push('xx');
    }
    try {
      Model.getDomainBitIndex('IUPAC', { domains: a });
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }
  });
});

it('testModelGetDomainIndexSafe', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var res = Model.getDomainBitIndexSafe('IUPAC', theModel);
    expect(res).toEqual(0x0010);
    Model.releaseModel(theModel);
  });
});

it('testModelGetDomainIndexSafeNotPresent', async () => {
  expect.assertions(2);
  return getModel().then(theModel => {
    try {
      var res = Model.getDomainBitIndexSafe('NOTPRESENT', theModel);
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }
    expect(res).toEqual(undefined);

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testModelGetDomainIndexSafeThrows2', async () => {
  var a = [];
  for (var i = 0; i < 33; ++i) {
    a.push('xx');
  }
  a.push('IUPAC');
  try {
    Model.getDomainBitIndexSafe('IUPAC', { domains: a });
    expect(1).toEqual(0);
  } catch (e) {
    expect(1).toEqual(1);
  }

  //test.done()

});

it('testModelGetDomainIndexSafe2', async () => {
  getModel().then(theModel => {
    var res = Model.getDomainBitIndexSafe('IUPAC', theModel);
    expect(res).toEqual(0x0010);
    var res2 = Model.getDomainsForBitField(theModel, 0x0010);
    expect(res2).toEqual('IUPAC');

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testGetModelNameForDomain', async () => {
  getModel().then(theModel => {
    var u = Model.getModelNameForDomain(theModel.mongoHandle, 'FioriBOM');
    expect(u).toEqual('fioriapps');
    var k = Model.getMongooseModelNameForDomain(theModel, 'FioriBOM');
    expect(k).toEqual('fioriapps');
    var coll = Model.getMongoCollectionNameForDomain(theModel, 'FioriBOM');
    expect(coll).toEqual('fioriapps');

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testGetModelNameForDomainNotPresent', async () => {
  getModel().then(theModel => {
    try {
      Model.getModelNameForDomain(theModel, 'FioriNIXDA');
      expect(1).toEqual(0);
    } catch (e) {
      expect(1).toEqual(1);
    }
    Model.releaseModel(theModel);
  });
});


it('testAddSplitSingleWord', async () => {
  var seenIt = {};
  var rules = [];

  var newRule = {
    category: 'stars',
    matchedString: 'AlphaCentauriA',
    type: 0,
    word: 'Alpha Centauri A',
    lowercaseword: 'alphacentauria',
    bitindex: 0x32,
    _ranking: 0.95
  };
  Model.addBestSplit(rules, newRule, seenIt);
  expect(rules.length).toEqual(0);

  //test.done()

});

it('testAddSplitNotCombinable', async () => {
  var seenIt = {};
  var rules = [];
  var newRule = {
    category: 'stars',
    matchedString: 'AlphaCentauriA',
    type: 0,
    word: 'Peter, Paul and Mary',
    lowercaseword: 'Peter, Paul and Mary',
    bitindex: 0x10,
    _ranking: 0.95
  };
  Model.addBestSplit(rules, newRule, seenIt);
  expect(rules.length).toEqual(0);

  //test.done()

});


it('testAddSplit', async () => {
  var seenIt = {};

  var rules = [];

  var newRule = {
    category: 'stars',
    matchedString: 'Alpha Centauri A',
    type: 0,
    word: 'Alpha Centauri A',
    lowercaseword: 'alpha centauri a',
    bitindex: 0x20,
    wordType: 'F',
    bitSentenceAnd: 0x20,
    _ranking: 0.95
  };

  Model.global_AddSplits = true;
  Model.addBestSplit(rules, newRule, seenIt);
  Model.global_AddSplits = false;

  expect(rules[0]).toEqual({
    category: 'stars',
    matchedString: 'Alpha Centauri A',
    bitindex: 32,
    word: 'centauri',
    type: 0,
    lowercaseword: 'centauri',
    bitSentenceAnd: 32,
    wordType: 'F',
    _ranking: 0.95,
    range:
    {
      low: -1,
      high: 1,
      rule: newRule
    }
  });

  //test.done()

});

it('testModelHasDomainIndexinRules', async () => {
  var a = [];
  for (var i = 0; i < 32; ++i) {
    a.push('xx');
  }
  try {
    Model.getDomainBitIndex('IUPAC', { domains: a });
    expect(1).toEqual(0);
  } catch (e) {
    expect(1).toEqual(1);
  }

  //test.done()

});


it('testModelHasDomainIndexInDomains', async () => {
  expect.assertions(10);
  return getModel().then(theModel => {
    // check that every domain has an index which is distinct
    var all = 0;
    theModel.domains.forEach(function (o) {
      var idx = theModel.full.domain[o].bitindex;
      expect(idx !== 0).toEqual(true);
      //console.log(all);
      all = all | idx;
    });
    expect(all).toEqual(0x01FF);
    Model.releaseModel(theModel);
  });
});

it('testModelHasDomainIndexInAllRules', async () => {
  expect.assertions(10);
  return getModel().then(theModel => {
    // check that every domain has an index which is distinct
    var all = 0;
    theModel.domains.forEach(function (o) {
      var idx = theModel.full.domain[o].bitindex;
      expect(idx !== 0).toEqual(true);
      //console.log(all);
      all = all | idx;
    });
    expect(all).toEqual(0x01FF);

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testModelHasNumberRules', async () => {
  getModel().then(theModel => {
    // check that every domain has an index which is distinct
    var all = 0;
    theModel.domains.forEach(function (o) {
      var idx = theModel.full.domain[o].bitindex;
      expect(idx !== 0).toEqual(true);
      //console.log(all);
      all = all | idx;
    });
    var cnt = 0;
    theModel.mRules.forEach((orule) => {
      if (orule.type === EnumRuleType.REGEXP) {
        var m = orule.regexp.exec('123');
        expect(true).toEqual(!!m);
        expect(m[orule.matchIndex]).toEqual('123');
        ++cnt;
      }
    });
    expect(cnt).toEqual(1);
    expect(all).toEqual(0x01FF);

    //test.done()


    Model.releaseModel(theModel);
  });
});

const MetaF = Meta.getMetaFactory();


it('testgetTableColumnsThrows', async () => {
  try {
    Model.getTableColumns({ domains: [] }, 'adomain');
    expect(true).toEqual(false);
  } catch (e) {
    expect(e.toString().indexOf('Domain "adomain') >= 0).toEqual(true);
  }

  //test.done()

});

it('testgetResultAsArrayBad', async () => {
  try {
    Model.getResultAsArray({}, MetaF.Domain('abc'), MetaF.Domain('def'));
    expect(true).toEqual(false);
  } catch (e) {
    expect(e.toString().indexOf('relation') >= 0).toEqual(true);
  }

  //test.done()

});

it('testgetResultAsArrayNotThere', async () => {
  var res = Model.getResultAsArray({
    meta: {
      t3: {
        'domain -:- abc': {
          'relation -:- def': { 'category -:- kkk': {} }
        }
      }
    }
  }, MetaF.Domain('abcd'), MetaF.Relation('def'));
  expect(res).toEqual([]);

  //test.done()

});


it('testgetResultAsArrayOk', async () => {
  var res = Model.getResultAsArray({
    meta: {
      t3: {
        'domain -:- abc': {
          'relation -:- def': { 'category -:- kkk': {} }
        }
      }
    }
  }, MetaF.Domain('abc'), MetaF.Relation('def'));
  expect(res[0].toFullString()).toEqual('category -:- kkk');

  //test.done()

});

it('testgetCategoriesForDomainBadDomain', async () => {
  expect.assertions(1);
  getModel().then(theModel => {
    var u = theModel;
    try {
      Model.getCategoriesForDomain(u, 'notpresent');
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.toString().indexOf('notpresent') >= 0).toEqual(true);
    }

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testgetDomainsForCategoryBadCategory', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    try {
      Model.getDomainsForCategory(u, 'notpresent');
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.toString().indexOf('notpresent') >= 0).toEqual(true);
    }

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testgetAllDomainsBintIndex', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    var res = Model.getAllDomainsBitIndex(u);
    expect(res).toEqual(0x01FF);

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testgetCategoriesForDomain', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    //console.log('here the model ************ ' + JSON.stringify(u.meta.t3,undefined,2));
    var res = Model.getCategoriesForDomain(u, 'Cosmos');
    expect(res).toEqual(['_url',
      'albedo',
      'distance',
      'eccentricity',
      'mass',
      'object name',
      'object type',
      'orbit radius',
      'orbital period',
      'orbits',
      'radius',
      'visual luminosity',
      'visual magnitude']);

    //test.done()


    Model.releaseModel(theModel);
  });

});



it('testgetshowURICategoriesForDomain', async () => {
  expect.assertions(1);
  getModel().then(theModel => {
    var u = theModel;
    //console.log('here the model ************ ' + JSON.stringify(u.meta.t3,undefined,2));
    var res = Model.getShowURICategoriesForDomain(u, 'Cosmos');
    expect(res).toEqual(['_url']);

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testgetshowURIRankCategoriesForDomain', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    //console.log('here the model ************ ' + JSON.stringify(u.meta.t3,undefined,2));
    var res = Model.getShowURIRankCategoriesForDomain(u, 'FioriBOM');
    expect(res).toEqual(['uri_rank']);

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testgetDomainsForCategory', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    //console.log('here the model ************ ' + JSON.stringify(u.meta.t3,undefined,2));
    var res = Model.getDomainsForCategory(u, 'element name');
    expect(res).toEqual(['IUPAC', 'Philosophers elements']);
    Model.releaseModel(theModel);
  });

});

/**
     * rules with exact Only 
     */
it('testModelCheckExactOnly', (done) => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel; 
    var res = u.mRules.filter(function (oRule) {
      return oRule.exactOnly === true;
    });
    expect(res.length).toEqual(176); // 187 /*431*/);
    Model.releaseModel(theModel);
    done();
  });
});

it('testMakeWordMap', async () => {
  var rules = [
    { type: 0, lowercaseword: 'abc', category: '1', bitindex: 0x1 },
    { type: 1, lowercaseword: 'def', category: '2', bitindex: 0x10 },
    { type: 0, lowercaseword: 'klm', category: '4', bitindex: 0x100 },
    { type: 0, lowercaseword: 'abc', category: '3', bitindex: 0x80 },
  ];
  var res = Model.splitRules(rules);

  expect(res).toEqual({
    allRules: [
      { type: 0, lowercaseword: 'abc', category: '1', bitindex: 0x1 },
      { type: 1, lowercaseword: 'def', category: '2', bitindex: 0x10 },
      { type: 0, lowercaseword: 'klm', category: '4', bitindex: 0x100 },
      { type: 0, lowercaseword: 'abc', category: '3', bitindex: 0x80 },
    ],
    wordMap: {
      'abc': {
        bitindex: 0x81,
        rules: [
          { type: 0, lowercaseword: 'abc', category: '1', bitindex: 0x1 },
          { type: 0, lowercaseword: 'abc', category: '3', bitindex: 0x80 }
        ]
      },
      'klm': {
        bitindex: 0x100,
        rules: [
          { type: 0, lowercaseword: 'klm', category: '4', bitindex: 0x100 }
        ]
      }
    },
    nonWordRules: [{ type: 1, lowercaseword: 'def', category: '2', bitindex: 0x10 }],
    wordCache: {}
  });
});


/**
     * Unit test for sth
     */
it('testCategorySorting', async () => {
  var map = {
    'a': { importance: 0.1 }, 'b': { importance: 0.2 },
    'd': { importance: 0.2 }, 'c': { importance: 0.2 }, 'f': {}
  };

  expect(Model.rankCategoryByImportance({}, 'uu', 'ff')).toEqual(1);
  expect(Model.rankCategoryByImportance({ 'uu': {} }, 'uu', 'ff')).toEqual(-1);

  expect(
    Model.rankCategoryByImportance({ 'uu': {}, 'ff': { importance: 1 } }, 'uu', 'ff')
  ).toEqual(98);
  expect(
    Model.rankCategoryByImportance({ 'uu': { importance: 0.1 }, 'ff': { importance: 1 } }, 'uu', 'ff')
  ).toEqual(-0.9);

  var res = Model.sortCategoriesByImportance(map, ['j', 'e', 'f', 'b', 'c', 'd', 'a', 'b', 'h']);
  expect(res).toEqual(['a', 'b', 'b', 'c', 'd', 'f', 'e', 'h', 'j']);

  //test.done()

});


it('testWordCategorizationFactCat', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var earth = theModel.rules.wordMap['earth'];
    expect(earth).toEqual({
      bitindex: 65,
      rules:
        [{
          category: 'element name',
          matchedString: 'earth',
          type: 0,
          word: 'earth',
          bitindex: 64,
          bitSentenceAnd: 64,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'earth'
        },
        {
          category: 'object name',
          matchedString: 'earth',
          type: 0,
          word: 'earth',
          bitindex: 1,
          bitSentenceAnd: 1,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'earth'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });

});

it('testWordCategorizationCategory', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var ename = theModel.rules.wordMap['element name'];
    expect(ename).toEqual({
      bitindex: 112,
      rules:
        [{
          category: 'category',
          matchedString: 'element name',
          type: 0,
          word: 'element name',
          lowercaseword: 'element name',
          bitindex: 16,
          wordType: 'C',
          bitSentenceAnd: 16,
          _ranking: 0.95
        },
        {
          category: 'category',
          matchedString: 'element name',
          type: 0,
          word: 'element name',
          lowercaseword: 'element name',
          bitindex: 64,
          wordType: 'C',
          bitSentenceAnd: 64,
          _ranking: 0.95
        },
        {
          category: 'category',
          matchedString: 'element name',
          type: 0,
          word: 'element name',
          bitindex: 32,
          bitSentenceAnd: 32,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'element name'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testWordCategorizationMetaword_category', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var earth = theModel.rules.wordMap['category'];
    expect(earth).toEqual({
      bitindex: 288,
      rules:
        [{
          category: 'category',
          matchedString: 'category',
          type: 0,
          word: 'category',
          lowercaseword: 'category',
          bitindex: 32,
          wordType: 'C',
          bitSentenceAnd: 32,
          _ranking: 0.95
        },
        {
          category: 'category',
          matchedString: 'category',
          type: 0,
          word: 'category',
          lowercaseword: 'category',
          bitindex: 256,
          wordType: 'C',
          bitSentenceAnd: 256,
          _ranking: 0.95
        },
        {
          category: 'category',
          matchedString: 'category',
          type: 0,
          word: 'category',
          bitindex: 32,
          bitSentenceAnd: 32,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'category'
        },
        {
          category: 'category',
          matchedString: 'category synonyms',
          bitindex: 32,
          bitSentenceAnd: 32,
          wordType: 'C',
          word: 'category',
          type: 0,
          lowercaseword: 'category',
          _ranking: 0.95,
          range:
          {
            low: 0,
            high: 1,
            rule:
            {
              category: 'category',
              matchedString: 'category synonyms',
              type: 0,
              word: 'category synonyms',
              lowercaseword: 'category synonyms',
              bitindex: 32,
              wordType: 'C',
              bitSentenceAnd: 32,
              _ranking: 0.95
            }
          }
        },
        /*
        {
          category: 'category',
          matchedString: 'category synonyms',
          bitindex: 32,
          bitSentenceAnd: 32,
          wordType: 'F',
          word: 'category',
          type: 0,
          lowercaseword: 'category',
          _ranking: 0.95,
          range:
          {
            low: 0,
            high: 1,
            rule:
            {
              category: 'category',
              matchedString: 'category synonyms',
              type: 0,
              word: 'category synonyms',
              bitindex: 32,
              bitSentenceAnd: 32,
              exactOnly: false,
              wordType: 'F',
              _ranking: 0.95,
              lowercaseword: 'category synonyms'
            }
          }
        }
         */
        ]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testWordCategorizationMetaword_Domain', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var earth = theModel.rules.wordMap['domain'];
    expect(earth).toEqual({
      bitindex: 544,
      rules:
        [{
          category: 'category',
          matchedString: 'domain',
          type: 0,
          word: 'domain',
          lowercaseword: 'domain',
          bitindex: 32,
          wordType: 'C',
          bitSentenceAnd: 32,
          _ranking: 0.95
        },
        /*
        {
          category: 'category',
          matchedString: 'domain',
          type: 0,
          word: 'domain',
          bitindex: 32,
          bitSentenceAnd: 32,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'domain'
        }, */
        {
          category: 'meta',
          matchedString: 'domain',
          type: 0,
          word: 'domain',
          bitindex: 512,
          wordType: 'M',
          bitSentenceAnd: 511,
          _ranking: 0.95,
          lowercaseword: 'domain'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});



it('testWordCategorizationDomainSynonyms', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var fbom = theModel.rules.wordMap['fiori bom'];
    expect(fbom).toEqual({
      bitindex: 36,
      rules:
        [{
          category: 'domain',
          matchedString: 'FioriBOM',
          type: 0,
          word: 'fiori bom',
          bitindex: 4,
          bitSentenceAnd: 4,
          wordType: 'D',
          _ranking: 0.95,
          lowercaseword: 'fiori bom'
        },
        {
          category: 'domain',
          matchedString: 'FioriBOM',
          type: 0,
          word: 'fiori bom',
          bitindex: 32,
          bitSentenceAnd: 32,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'fiori bom'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testWordCategorizationCategorySynonyms', async () => {
  getModel().then(theModel => {
    var fbom = theModel.rules.wordMap['primary odata service'];
    expect(fbom).toEqual({
      bitindex: 36,
      rules:
        [{
          category: 'category',
          matchedString: 'PrimaryODataServiceName',
          type: 0,
          word: 'Primary OData Service',
          bitindex: 4,
          bitSentenceAnd: 4,
          wordType: 'C',
          _ranking: 0.95,
          lowercaseword: 'primary odata service'
        },
        {
          category: 'category',
          matchedString: 'PrimaryODataServiceName',
          type: 0,
          word: 'Primary OData Service',
          bitindex: 32,
          bitSentenceAnd: 32,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'primary odata service'
        }
        ]
    });

    //test.done()


    Model.releaseModel(theModel);
  });

});




it('testWordCategorizationOperator', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var op = theModel.rules.wordMap['starting with'];
    expect(op).toEqual({
      bitindex: 512,
      rules:
        [
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
          }
        ]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testWordCategorizationOperatorMoreThan', async () => {
  getModel().then(theModel => {
    var op = theModel.rules.wordMap['more than'];
    expect(op).toEqual({
      bitindex: 512,
      rules:
        [{
          category: 'operator',
          word: 'more than',
          lowercaseword: 'more than',
          type: 0,
          matchedString: 'more than',
          bitindex: 512,
          bitSentenceAnd: 511,
          wordType: 'O',
          _ranking: 0.9
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testWordCategorizationOperatorMoreThanOPAlias', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var op = theModel.rules.wordMap['which has more than'];
    expect(op).toEqual({
      bitindex: 512,
      rules:
        [{
          category: 'operator',
          word: 'which has more than',
          lowercaseword: 'which has more than',
          type: 0,
          matchedString: 'more than',
          bitindex: 512,
          bitSentenceAnd: 511,
          wordType: 'O',
          _ranking: 0.9
        }]
    });
    Model.releaseModel(theModel);
  });
});

it('testWordCategorizationOnlyMultiFactNonFirst', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var op = theModel.rules.wordMap['bremen'];
    expect(op).toEqual({
      bitindex: 2,
      rules:
        [{
          category: 'standort',
          matchedString: 'Bremen',
          type: 0,
          word: 'Bremen',
          bitindex: 2,
          bitSentenceAnd: 2,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'bremen'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testWordCategorizationOperatorMultiFact2', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var op = theModel.rules.wordMap['münchen'];
    expect(op).toEqual({
      bitindex: 2,
      rules:
        [{
          category: 'standort',
          matchedString: 'München',
          type: 0,
          word: 'München',
          bitindex: 2,
          bitSentenceAnd: 2,
          exactOnly: false,
          wordType: 'F',
          _ranking: 0.95,
          lowercaseword: 'münchen'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});




it('testWordCategorizationFactCat2', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var earth = theModel.rules.wordMap['co-fio'];
    expect(earth).toEqual({
      bitindex: 4,
      rules:
        [{
          category: 'ApplicationComponent',
          matchedString: 'CO-FIO',
          type: 0,
          word: 'CO-FIO',
          bitindex: 4,
          bitSentenceAnd: 4,
          wordType: 'F',
          _ranking: 0.95,
          exactOnly: true,
          lowercaseword: 'co-fio'
        }]
    });

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testModelTest2', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;
    try {
      fs.mkdirSync('logs');
    } catch (e) {
      /* empty */
    }
    fs.writeFileSync('logs/model.mRules.json', JSON.stringify(u.mRules, undefined, 2));
    expect(true).toEqual(true);

    //test.done()


    Model.releaseModel(theModel);
  });
});


it('testFindNextLen', async () => {
  var offsets = [0, 0, 0, 0, 0, 0];
  Model.findNextLen(0, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 0, 0, 0, 0, 0]);
  Model.findNextLen(1, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 0, 0, 0, 0, 2]);

  Model.findNextLen(2, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 0, 0, 0, 2, 4]);
  Model.findNextLen(3, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 0, 0, 2, 4, 6]);
  Model.findNextLen(4, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 0, 2, 4, 6, 8]);
  Model.findNextLen(5, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([0, 2, 4, 6, 8, 8]);
  Model.findNextLen(6, ['a', 'a', 'bb', 'bb', 'ccc', 'ccc', 'dddd', 'dddd', '123456', '123456'], offsets);
  expect(offsets).toEqual([2, 4, 6, 8, 8, 10]);

  //test.done()

});




it('testModelGetColumns', async () => {
  expect.assertions(1);
  return getModel().then(theModel => {
    var u = theModel;


    // we expect a rule "domain" -> meta
    //console.log(JSON.stringify(u.rawModels));
    var res = Model.getTableColumns(u, 'IUPAC');
    expect(res).toEqual(['element symbol',
      'element number',
      'element name'
    ]);

    //test.done()


    Model.releaseModel(theModel);
  });
});

it('testdbtestModelHasDomains', async () => {

  expect.assertions(2);
  return getModel().then(theModel => {
    var u = theModel;

    // we expect a rule "domain" -> meta

    var r = u.mRules.filter(function (oRule) {
      return oRule.category === 'meta' && oRule.matchedString === 'domain';
    });
    expect(r.length).toEqual(1);

    var r2 = u.mRules.filter(function (oRule) {
      return oRule.category === 'domain';
    });
    //console.log(JSON.stringify(r2,undefined,2));
    var rx = r2.map(function (oRule) { return oRule.matchedString; });
    // remove duplicates
    rx.sort();
    rx = rx.filter((u, index) => rx[index - 1] !== u);

    expect(rx.sort()).toEqual(['Cosmos',
      'Fiori Backend Catalogs',
      'FioriBOM',
      'IUPAC',
      'Philosophers elements',
      'SAP Transaction Codes',
      'SOBJ Tables',
      'demomdls',
      'metamodel']);

    //test.done()


    Model.releaseModel(theModel);
  });
});


/**
     * Unit test for sth
     */
it('testdbtestModelAppConfigForEveryDomain', (done) => {
  expect.assertions(1);
  jest.setTimeout(20000);
  return getModel().then(theModel => {
    var u = theModel;
    var res = u.mRules.filter(function (oRule) {
      return oRule.lowercaseword === 'applicationcomponent' && oRule.matchedString === 'ApplicationComponent';
    });
    expect(res.length).toEqual(3 /*431*/);
    done();
    Model.releaseModel(theModel);
  });
});