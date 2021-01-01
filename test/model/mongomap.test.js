/*! copyright gerd forstmann, all rights reserved */
//var debug = require('debug')('mongomap.test');
var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../js';
//var debuglog = require('debugf')('testdb.mongomap.nunit.js');

var MongoMap = require(root + '/model/mongomap.js');
var Model = require(root + '/model/model.js');
var testmodelPath = './testmodel/';

var Schemaload = require(root + '/modelload/schemaload.js');
var eSchemaSOBJ_Tables = Schemaload.loadExtendedMongooseSchema(testmodelPath, 'sobj_tables');
var eDocSOBJ = Schemaload.loadModelDoc(testmodelPath, 'sobj_tables');
var getModel = require(root + '/model/testmodels.js').getTestModel1;
//var mgnlq_testmodel_replay = require('mgnlq_testmodel2');

//var mode = 'REPLAY';
//if (process.env[ 'MGNLQ_TESTMODEL_REPLAY' ] /*.MGNLQ_TESTMODEL_REPLAY*/ ) {
//  mode = 'RECORD';
//}

//var srcHandle = require(root + '/model/srchandle.js').createSourceHandle(); 
//var srcHandle = require('mongoose_record_replay').instrumentMongoose(require('srcHandle'),
//  './test/data/mongoose_record_replay/testmodel/',
//  mode);

// load distinct values from model

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});

it('testCollectCats', async () => {
  var props = {
    'Object_name_length': {
      'type': 'Number',
      'trim': true,
      '_m_category': 'Object name length'
    }
  };
  var res = MongoMap.collectCategories(props);
  expect(res).toEqual({
    'Object name length' : {
      paths : ['Object_name_length'],
      fullpath : 'Object_name_length',
      shortName : 'Object_name_length'
    }
  });
  //test.done()
});



it('testUnwindsForNonTerminalArrays', async () => {
  var mongoMap = {
    'cat1' :{ paths:  ['cat1']},
    'cat2' : { paths:  ['_mem1', '[]', 'mem3'] }
  };
  var resexpected = [
    { $unwind : { path : '_mem1',
      'preserveNullAndEmptyArrays' : true }
    }];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpected);
  //test.done()
});

it('testUnwindsForNonTerminalArrays2equal', async () => {
  var mongoMap = {
    'cat1' :{ paths:  ['cat1']},
    'cat2' : { paths:  ['_mem1', '[]', 'mem3']},
    'cat3' : { paths:  ['_mem1', '[]', 'mem3']}
  };
  var resexpeted = [
    { $unwind : { path : '_mem1',
      'preserveNullAndEmptyArrays' : true }
    }];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpeted);
  //test.done()
});

it('testUnwindsForNonTerminalArrays2distinct', async () => {
  var mongoMap = {
    'cat1' : { paths: ['cat1']},
    'cat2' : { paths:  ['_mem1', '[]', 'mem3']},
    'cat3' : { paths:  ['_mem2', '_mem3', '[]', 'mem3']}
  };
  var resexpeted = [
    { $unwind : { path : '_mem1',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem2._mem3',
      'preserveNullAndEmptyArrays' : true }
    }
  ];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpeted);
  //test.done()
});


it('testUnwindsForNonTerminalArrays3Deep', async () => {
  var mongoMap = {
    'cat1' :  { paths: ['cat1']},
    'cat2' :  { paths: ['_mem1', '[]', 'mem3', '[]', 'mem4']},
    'cat3' :  { paths: ['_mem2', '_mem3', '[]', 'mem3']}
  };
  var resexpeted = [
    { $unwind : { path : '_mem1',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem1.mem3',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem2._mem3',
      'preserveNullAndEmptyArrays' : true }
    }
  ];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpeted);
  //test.done()
});

it('testGetFirstSegmentThrows', async () => {
  expect.assertions(1);
  try {
    MongoMap.getFirstSegment(['[]','abc']);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  //test.done()
});

it('testGetFirstSegmentThrowsEmpty', async () => {
  expect.assertions(1);
  try {
    MongoMap.getFirstSegment([]);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }

  //test.done()

});


it('testGetFirstSegmentOK', async () => {
  expect.assertions(1);
  expect(MongoMap.getFirstSegment(['abc','def'])).toEqual('abc');

});

it('testUnwindsForNonTerminalArrays3bDeep', async () => {
  var mongoMap = {
    'cat1' : { paths: ['cat1']},
    'cat2' : { paths: ['_mem1', '[]', 'mem3', '[]', 'mem4']},
    'cat4' : { paths : ['_mem1', '[]', 'mem4', '[]', 'memx']},
    'cat3' : { paths: ['_mem2', '_mem3', '[]', 'mem3']}
  };
  var resexpeted = [
    { $unwind : { path : '_mem1',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem1.mem3',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem1.mem4',
      'preserveNullAndEmptyArrays' : true }
    },
    { $unwind : { path : '_mem2._mem3',
      'preserveNullAndEmptyArrays' : true }
    }
  ];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpeted);

  //test.done()

});



it('testGetShortProjectedName', async () => {
  var mongoMap = {
    'cat1' : { paths: ['cat1'], fullpath : 'cat1'},
    'ca T2' : { paths: ['_mem1', '[]', 'mem3', '[]', 'mem4'], fullpath : '_mem1.mem3.mem4'},
    'cat4' : { paths : ['_mem1', '[]', 'mem4', '[]', 'memx']},
    'cat3' : { paths: ['_mem2', '_mem3', '[]', 'mem3']}
  };
  var r = MongoMap.getShortProjectedName(mongoMap, 'cat1');
  expect(r).toEqual('cat1');

  var r2 = MongoMap.getShortProjectedName(mongoMap, 'ca T2');
  expect(r2).toEqual('ca_T2');

  //test.done()

});

it('testUnwindsForNonTerminalArraysEmtpy', async () => {
  var mongoMap = {
    'cat1' : { paths: ['cat1'] },
    'cat2' : { paths: ['_mem1', 'mem3', '[]']},
    'cat3' : { paths:   ['_mem2', '_mem3', 'mem3']}
  };
  var resexpeted = [];
  var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
  expect(res).toEqual(resexpeted);

  //test.done()

});

it('testGetMemberByPath', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 } ]
  };
  expect(MongoMap.getMemberByPath(record, ['abc'])).toEqual(1);

  //test.done()

});

it('testGetMemberByPathObject', async () => {
  var record = {
    abc : 1,
    def : { hij : 2 }
  };
  expect(MongoMap.getMemberByPath(record, ['def','hij'])).toEqual(2);

  //test.done()

});


it('testGetMemberByPathObjectNoArr', async () => {
  var record = {
    abc : 1,
    def : { hij : 2 }
  };
  expect(MongoMap.getMemberByPath(record, ['def', '[]', 'hij'])).toEqual(2);

  //test.done()

});

it('testGetMemberCategories', async () => {
  var record =  {
    '_categories': {
      'exactmatch': true,
      'category_description': 'For GUI based transaction, the transaction code behind intent, a classical R/3 SAPGUi transaction',
      'category': 'TransactionCode',
      '_id': '59289d809f1ae34670303eb8',
      'category_synonyms': [
        'Transactions',
        'TransactionCode',
        'TransactionCodes'
      ]
    }};
  expect(MongoMap.getMemberByPath( record , ['_categories','[]','category'])).toEqual('TransactionCode');

  //test.done()

});

it('testGetMemberNotPresent', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 }, {hij: 3} ]
  };
  expect(MongoMap.getMemberByPath( record , ['nopath','[]','hixx'])).toEqual(undefined);

  //test.done()

});


it('testGetMemberNotPresentDeep', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 } ]
  };
  expect(MongoMap.getMemberByPath( record , ['def','[]','hixx'])).toEqual(undefined);
});


it('testGetMemberByPathThrows', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 }, {hij: 3} ]
  };
  expect(MongoMap.getMemberByPath( record , ['def','[]','hij'])).toEqual([2,3]);

});

it('testGetMemberByPath2', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 } ]
  };
  expect(MongoMap.getFirstMemberByPath(record, ['def','[]','hij'])).toEqual(2);
  expect(MongoMap.getMemberByPath(record, ['def','[]','hij'])).toEqual([2]);
});

it('testGetMemberByPathTerminalArr', async () => {
  var record = {
    abc : 1,
    def : [ { hij : 2 } ],
    hij : [ 'aa', 'bb']
  };
  expect(MongoMap.getMemberByPath(record, ['hij','[]'])).toEqual(['aa', 'bb']);

  //test.done()

});


it('testCollectCatsArrayOfObject', async () => {
  var props = {
    '_something' : [ {
      'Object_name_length': {
        'type': 'Number',
        'trim': true,
        '_m_category': 'Object name length'
      }}
    ]
  };
  var res = MongoMap.collectCategories(props);
  expect(res).toEqual({
    'Object name length' : {
      paths : ['_something', '[]', 'Object_name_length'],
      fullpath : '_something.Object_name_length',
      shortName : 'Object_name_length'
    }
  });

  //test.done()

});


it('testcollectMemberByPath', async () => {
  var recs =  [{'domain':'IUPAC','_categories':[{'category':'element name','category_description':'element name','QBEColumnProps':{'defaultWidth':120,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['name']},{'category':'element symbol','category_description':'element symbol','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['symbol']},{'category':'atomic weight','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':80,'QBE':true},'category_synonyms':['element weight']},{'category':'element number','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true}],'columns':['element symbol','element number','element name']}
  ]; 
  expect(MongoMap.collectMemberByPath( recs[0], ['_categories','[]','category'])).toEqual(['element name', 'element symbol', 'atomic weight', 'element number']);
  expect(MongoMap.collectMemberByPath( recs[0], ['_categories','category','def'])).toEqual([]);
  expect(MongoMap.collectMemberByPath( recs[0], ['_categories','category'])).toEqual(['element name', 'element symbol', 'atomic weight', 'element number']);
  expect(MongoMap.collectMemberByPath( recs[0], ['domain'])).toEqual(['IUPAC']);
  expect(MongoMap.collectMemberByPath( recs[0], ['_categories', 'notthere' ])).toEqual([]);  
  expect(MongoMap.collectMemberByPath( recs[0], ['columns'])).toEqual(['element symbol','element number','element name']);
});




it('testGetMemberByPathMeta', async () => {
  var recs =  [{'domain':'IUPAC','_categories':[{'category':'element name','category_description':'element name','QBEColumnProps':{'defaultWidth':120,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['name']},{'category':'element symbol','category_description':'element symbol','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['symbol']},{'category':'atomic weight','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':80,'QBE':true},'category_synonyms':['element weight']},{'category':'element number','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true}],'columns':['element symbol','element number','element name']}
  ]; 
  expect(MongoMap.getMemberByPath( recs[0], ['_categories','[]','category'])).toEqual(['element name', 'element symbol', 'atomic weight', 'element number']);

});

var getModelHandle = function() {
  return getModel().then( theModel => theModel.mongoHandle);
};

it('testGetDistinctMultivalues', async () => {
  expect.assertions(1);
  return getModelHandle().then( modelHandle =>
    Model.getDistinctValues(modelHandle, 'metamodels' , 'domain synonyms')
  )
    .then( (values) => {
      expect(values).toEqual([ 'fiori bom']);
      //test.done()
    }
    ).catch((err) => {
      console.log('test failed ' + err + '\n' + err.stack);
      expect(0).toEqual(1);

      //test.done()

    });
});

it('testGetDistinctCosmos', async () => {
  expect.assertions(1);
  return getModel().then(
    (theModel) => {
      var modelHandle = theModel.mongoHandle;
      return Model.getDistinctValues(modelHandle, 'cosmos' , 'orbits');
    }).then( (values) => {
    expect(values).toEqual(['Alpha Centauri C', 'Sun', 'n/a']);
  }
  ).catch((err) => {
    console.log('test failed ' + err + '\n' + err.stack);
    expect(0).toEqual(1);

    //test.done()

  });
});


it('testGetDistintObjectName', async () => {
  expect.assertions(1);
  return getModelHandle()
    .then( (modelHandle) =>
      Model.getDistinctValues(modelHandle, 'cosmos' , 'object name')
    )
    .then( (values) => {
      expect(values).toEqual([ 'Alpha Centauri A',
        'Alpha Centauri B',
        'Alpha Centauri C',
        'Mars',
        'Proxima Centauri b',
        'Sun',
        'earth' ]);
    }
    ).catch((err) => {
      console.log('test failed ' + err + '\n' + err.stack);
      expect(0).toEqual(1);
    });
});

it('testCollectCatsArrayOfPLain', async () => {
  var props = {
    '_something' : [
      {
        'type': 'Number',
        'trim': true,
        '_m_category': 'Object name length'
      }
    ]
  };
  var res = MongoMap.collectCategories(props);
  expect(res).toEqual({
    'Object name length' : {
      paths : ['_something', '[]'],
      fullpath : '_something',
      shortName : '_something'
    }
  });
});

it('testMakeIfMap', async () => {
  var res = MongoMap.makeMongoMap(eDocSOBJ, eSchemaSOBJ_Tables);
  expect(res['TransportObject']).toEqual({ paths: ['TransportObject'], fullpath : 'TransportObject', shortName : 'TransportObject'});
  expect(res['Object name length']).toEqual({ paths: ['Object_name_length'], fullpath : 'Object_name_length', shortName : 'Object_name_length'});
  expect(res['Table']).toEqual({ paths: ['_tables', '[]', 'Table'], fullpath : '_tables.Table' , shortName : 'Table'});
  expect(1).toEqual(1);
});
