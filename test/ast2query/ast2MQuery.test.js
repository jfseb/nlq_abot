

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';
var mQ = require(root + '/ast2query/ast2MQuery.js');
var Ast = require(root + '/ast.js');
var SentenceParser = require(root + '/sentenceparser.js');

var mongoQ = require(root + '/mongoq.js');

var debuglog = require('debugf')('ast2MQuery');
const Model = require(root + '/model/index_model.js').Model;

var getModel = require(root + '/model/testmodels.js').getTestModel1;

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});



// example replacer function
function replacer2(name, val) {
  // convert RegExp to string
  if ( val && val.constructor === RegExp ) {
    return val.toString();
  } else if ( name === 'str' ) { // 
    return undefined; // remove from result
  } else {
    return val; // return as is
  }
}

var JSONR =  {   
  stringify: function(ar, b, u) {
    return JSON.stringify(ar, replacer2, u);
  }
};

function releaseModel(theModel) {
  Model.releaseModel(theModel);
}

it('testGetCategoryForNodePairEasy', done => {
  var r = mQ.makeMongoName('abc DEF');
  expect(r).toEqual('abc_DEF');
  done();
});



it('testCoerceFactLiteralToType', done => {
  expect(mQ.coerceFactLiteralToType(true, '123')).toEqual(123);
  expect(mQ.coerceFactLiteralToType(true, '-123.A')).toEqual(-123);
  expect(mQ.coerceFactLiteralToType(false, '123')).toEqual('123');
  expect(mQ.coerceFactLiteralToType(true, 'abc123')).toEqual('abc123');
  expect(mQ.coerceFactLiteralToType(false, '123')).toEqual('123');
  done();
});

it('testIsNumericTypeOrHasNumericType', done => {
  expect.assertions(2);
  getModel().then( (theModel) => {
    var mongoHandleRaw = theModel.mongoHandle;
    expect(mQ.isNumericTypeOrHasNumericType(mongoHandleRaw, 'iupacs', 'element number')).toEqual(true);
    expect(mQ.isNumericTypeOrHasNumericType(mongoHandleRaw, 'iupacs', 'element name')).toEqual(false);
    done();
  });
});

var words = {};

it('testGetCategoryForNodePairEasy', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var nodeFact = u.children[1].children[0].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    expect(cat).toEqual('ApplicationComponent');
    done();
    releaseModel(theModel);
  });
});

it('testGetCategoryForNodePairNoCat', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    var nodeCat = u.children[1].children[2].children[0];
    var nodeFact = u.children[1].children[2].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    expect(cat).toEqual('TechnicalCatalog');
    done();
    releaseModel(theModel);
  });
});


it('testGetCategoryForNodeOk', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=> JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var cat =  mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
    expect(cat).toEqual('ApplicationComponent');
    done();
    releaseModel(theModel);
  });
});



it('testGetCategoryForNodeThrows', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1];
    try {
      mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
      expect(0).toEqual(1);
    } catch(e) {
      expect(1).toEqual(1);
    }
    done();
    releaseModel(theModel);
  });
});


it('testAstToMQuerySentenceToAstsCatCatCatParseText', done => {
  expect.assertions(5);
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    debuglog(() => Object.keys(theModel.mongoHandle.mongoMaps).join('\n'));
    debuglog(() =>'collectionname ' + domainPick.collectionName);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);
    expect(match).toEqual(
      { $match : { '$and' :[
        
        {'$eq' : [{ '$eval' :'ApplicationComponent' },  'CO-FIO']},         
        {'$eq' : [{ '$eval' :'appId'},'W0052']} ,        
        {'$eq' : [{ '$eval' :'TechnicalCatalog' },'SAP_TC_FIN_CO_COMMON'] }
      ]
      }
      }
    );
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual(
      { $project: { SemanticObject : 1, SemanticAction : 1, BSPName : 1, ApplicationComponent : 1 }}
    );
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);

    /* test bad nodetypes*/
    var nodeNoList = node;
    try {
      var res1 = mQ.getCategoryList([], nodeNoList,r.sentences[0]);
      expect(res1).toEqual([ 'SemanticObject',
        'SemanticAction',
        'BSPName',
        'ApplicationComponent' ]);
    } catch(e) {
      expect(1).toEqual(0);
    }
    try {
      mQ.makeMongoMatchFromAst(nodeNoList,r.sentences[0],mongoMap, domainPick.collectionName, theModel.mongoHandle);
      expect(1).toEqual(0);
    } catch(e) {
      expect(1).toEqual(1);
    }

    expect(group).toEqual({ $group: ['SemanticObject', 'SemanticAction', 'BSPName', 'ApplicationComponent' ] });
    done();
    releaseModel(theModel);
  });
});


it('testAstToMQueryMultiArray', done => {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'categories starting with elem';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel.mongoHandle.mongoMaps['metamodels'], 'metamodels',theModel.mongoHandle);
    expect(match).toEqual({ $match : { '$and' : [ { '$regex' :[ {'$eval':'_categories.category' },{ '$regex': /^elem/i } ]}]}});
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList,  theModel.mongoHandle.mongoMaps['metamodels']);
    expect(proj).toEqual({ $project: { 'category' : '_categories.category' }});
    var group = mQ.makeMongoGroupFromAst(categoryList, theModel.mongoHandle.mongoMaps['metamodels']);
    expect(group).toEqual({ $group: [ 'category' ] }); 
    done();
    releaseModel(theModel);
  });
});


it('testMakeMongoQueryEndingWith', done => {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'domains ending with ABC';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);
    expect(match).toEqual({ '$match': { '$and' : [ { '$regex': [ {'$eval' : 'domain'}, { '$regex': /abc$/i } ]}]} });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual({ '$project': { domain: 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    expect(group).toEqual(
      { '$group': [ 'domain' ] }
    );
    done();
    releaseModel(theModel);
  });
});


it('testMakeMongoQueryMoreThan', done => {
  getModel().then( (theModel) => {
    var s = 'sender, gründungsjahr with more than 3 standort';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);
    expect(match).toEqual({ '$match':
    { '$and':
       [ { '$expr':
            { '$gt':
               [ { '$ARRAYSIZE_OR_VAL_OR1' : 'standort' },
                 3 ] } } ] } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual({ '$project': { sender: 1, 'gr_ndungsjahr': 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    expect(group).toEqual({ '$group': ['sender', 'gr_ndungsjahr'] });
    done();
    releaseModel(theModel);
  });
});

var fs = require('fs');
var JSONx = JSONR;

it('testParseSomeQueries1', done => {
  getModel().then( (theModel) => {
    var filename = './test/data/sentence_ast_mongoq.json';
    var data = fs.readFileSync(filename, 'utf-8');
    var querylist = JSON.parse( data );

    for( var a in querylist )
    {
      var testrun = querylist[a];
      debuglog(' test nr ' + testrun.nr  + ' query ' + testrun.query );
      var actual = { query : testrun.query };
      debuglog( ' test nr ' + testrun.nr );
      // debuglog(JSON.stringify(ifr, undefined, 2))

      var s = testrun.query; // 'domains ending with ABC';
      var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
      var node = r.asts[0];
      debuglog( JSON.stringify( r ));
      var testId = 'nr:' + testrun.nr + ' ' + testrun.query ;
      debuglog(testId);
      if ( !node )
      {
        if ( !testrun.parseError ) {
          console.log('parseError ' + JSON.stringify(r.errors));
        }
        expect(true).toEqual(!!testrun.parseError);
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          expect(false).toEqual( JSON.stringify(r.errors) + ' does not contain ' + testrun.parseError);
        continue;
      }

      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        expect(r2).toEqual(testrun.astNice);
      debuglog( r2 );
      var nodeFieldList = node.children[0].children[0];
      var nodeFilter = node.children[1];
      var sentence = r.sentences[0];
      var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
      var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
      var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
      var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);

      actual.match = match;

      var match_json = JSONx.stringify( actual.match , undefined, 2 ); // treat regexp
      actual.match_json = JSON.parse( match_json );
      if( JSON.stringify(actual.match_json) != JSON.stringify(testrun.match_json)) {
        console.log('Actual************ ' + actual.match_json); 
      }
      expect(actual.match_json).toEqual(testrun.match_json);
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      expect(actual.projection).toEqual(testrun.projection);
      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      expect(actual.group).toEqual(testrun.group);
    }
    done();
    releaseModel(theModel);
  });
});


it('testParseSomeQueries2', done => {
  getModel().then( (theModel) => {
    var querylist = [ { nr: 111,

      query: 'sender, standort with less than 3 standort order by gründungsjahr',
      'match_json':
        {'$match': {'$and': [{'$expr': {'$lt': [{'$ARRAYSIZE_OR_VAL_OR1': 'standort'}, 3]}}]}}
      ,
      'projection':{
        '$project': {
          'sender': 1,
          'standort': 1
        }
      },
      'group': { $group: [ 'sender', 'standort'] },
      'astNice':'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(2)\n    OPLessThan 3(2)\n      NUMBER 4\n      CAT 5\n    OPOrderBy 6(1)\n      CAT 7\n'
    }];
    for( var a in querylist )
    {
      var testrun = querylist[a];
      console.log(' test nr ' + testrun.nr  + ' query ' + testrun.query );
      var actual = { query : testrun.query };
      debuglog( ' test nr ' + testrun.nr );
      // debuglog(JSON.stringify(ifr, undefined, 2))

      var s = testrun.query; // 'domains ending with ABC';
      var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
      var node = r.asts[0];
      debuglog( JSON.stringify( r ));
      var testId = 'nr:' + testrun.nr + ' ' + testrun.query ;
      if ( !node )
      {
        expect(true).toEqual(!!testrun.parseError);
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          expect(false).toEqual(testId + ' expected  ' + JSON.stringify(r.errors) + ' shall contain ' + testrun.parseError);
        continue;
      }
      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        expect(r2).toEqual(testrun.astNice);
      //console.log( r2 );
      var nodeFieldList = node.children[0].children[0];
      var nodeFilter = node.children[1];
      var sentence = r.sentences[0];
      var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
      var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
      var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
      var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);

      actual.match = match;

      // we avoid 
      var match_json = JSONR.stringify( actual.match , undefined, 2 ); // treat regexp
      actual.match_json = JSON.parse( match_json );
      expect(actual.match_json).toEqual(testrun.match_json);

      //test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      expect(actual.projection).toEqual(testrun.projection);
      //  ,{ '$project': { _id: 0, domain: 1 } });

      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      expect(testrun.group).toEqual(actual.group);

    }
    done();
    releaseModel(theModel);
  });
});


it('testGetNumberArg', done => {
  var res  = mQ.getNumberArg(
    /* ASTNode */
    { type : Ast.ASTNodeType.NUMBER, bearer : { startOffset : 0 } },
    [ { matchedString : '123'}]);
  expect(123).toEqual(res);
  done();
});


/*
it('testMakeProjection', done => {
  var proj  = mQ.makeMongoProjection(
    ['BSPName', 'AppKey']);
  expect(proj).toEqual({
    '$project': { BSPName : 1, AppKey : 1 }
  });
  done();
});
*/

it('testMakeMatch', done => {
  var proj  = mQ.makeMongoMatchF(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }]);
  expect(proj).toEqual({
    $match: {
      BSPName : 'CPM_REUSE_MS1' }});
  done();
});



/*
it('testMakeQuery', done => {
  var query  = mQ.makeMongoQuery(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }],
    ['BSPName', 'AppKey']
  );

  expect(query).toEqual([
    { '$match': { BSPName: 'CPM_REUSE_MS1' } },
    { '$group': ['BSPName', 'AppKey' ] },
    { '$project': {
      BSPName : 1, AppKey : 1 }}
  ]);
  done();
});
*/

it('testaddFilterToMatch0', done => {
  var res = mQ.makeOpFilter('price','$lt', 'val');
  expect(res).toEqual({ '$lt' : [ {$eval : 'price' }, 'val']});
  done();
});

it('testMakeMongoReverseMapFromAst', done => {
  getModel().then( (theModel) => {
    var s = 'object name';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0].children[0].children[0];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], u, sentence);
    var reverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    expect(reverseMap).toEqual({ columns: ['object name'], reverseMap :{ 'object_name' : 'object name' }});
    done();
    releaseModel(theModel);
  });
});
