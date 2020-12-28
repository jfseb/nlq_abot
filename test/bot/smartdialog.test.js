var process = require('process');
process.env.NODE_ENV = 'dev';
process.env.DEBUG = '';
jest.resetModules();
var root = '../../js';
//var debuglog = require('debug')('plainRecoginizer.nunit');

var debug = require('debug');
const debuglog = debug('smartdialog.test');

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


var logger = require(root + '/utils/logger');
const SmartDialog = require(root + '/bot/smartdialog.js');
var HTMLConnector = require(root + '/ui/htmlconnector.js');


/*
var mongooseMock = require('mongoose_record_replay').instrumentMongoose(require('srcHandle'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  'REPLAY');
*/

var Model = require(root + '/model/index_model.js').Model;

var getTestModel = require(root + '/model/testmodels.js').getTestModel1;

// Create bot and bind to console
function getBotInstance() {
  var connector = new HTMLConnector.HTMLConnector();
  /** the model is lazily obatained, if it is not obtained, there is no model */
  var res = getTestModel();
  res.then((theModel) => connector.theModel = theModel);

  function getM() {
    //res.then((theModel) => connector.theModel = theModel);
    return res;
  }
  SmartDialog.makeBot(connector, getM);
  return res.then( ()=> connector);
}

function releaseConnector(connector) {
  if(!connector) {
    throw Error('empty connector???? ');
  }
  debuglog('releasing ');
  if (connector.theModel) {
    debuglog('releasing with model');
    Model.releaseModel(connector.theModel);
  }
}

function testOne(str, cb, iconn) {
  var promiseReturningConn = (iconn && Promise.resolve(iconn))  || getBotInstance();
  return promiseReturningConn.then( (conn) => {
    conn.setAnswerHook(cb.bind(undefined, conn));
    conn.processMessage(str, 'unittest');
    return conn;
  });
}

it('testdescribeDontKnowQuotes', done => {
  testOne('describe "ABASDFSR"', function (conn, res) {
    expect(res).toEqual('I don\'t know anything about "ABASDFSR".\n');
    done();
    releaseConnector(conn);
  });
});

//I don't know anything about ""DDF/DDEL_MON"".

it('testUpDownWhatIsBSPNameManageLables', done => {
  testOne('what is the bspname for manage labels', function (conn, res) {
    expect(res).toEqual('The bspname of manage labels is "n/a"\n');
    done();
    releaseConnector(conn);
  });
});


it('testUpDownWhatIsBSPNameManageLablesQuote', done => {
  testOne('what is the bspname for "manage labels"', function (conn, res) {
    expect(res).toEqual('The bspname of "manage labels" is "n/a"\n');
    done();
    releaseConnector(conn);
  });
});


it('testUpDownWhatIsBSPNameFioriIntentManageLabels', done => {
  testOne('what is the bspname, fiori intent, appname for manage labels', function (conn, res) {
    expect(res).toEqual(
      'The bspname, fiori intent, appname of manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
    );
    done();
    releaseConnector(conn);
  });
});

it('testUpDownWhatIsBSPNameFioriIntentManageLablesQuote', done => {
  expect.assertions(1);
  testOne('what is the bspname, fiori intent, appname for "manage labels"', function (conn, res) {
    expect(res).toEqual(
      // 'the bspname, fiori intent, appname for manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
      'The bspname, fiori intent, appname of "manage labels" are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
    );
    done();
    releaseConnector(conn);
  });
});

it('testListAllSemObjFI', done => {
  expect.assertions(1);
  testOne('list all SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain', function (conn, res) {
    expect(res).toEqual(//OK
    //   'the SemanticObject for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain are ...\nGLAccount'
    // 'the bspname, fiori intent, appname for manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
    // 'the SemanticObject for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain are ...\nGLAccount;\nProfitCenter'
      'I did not find any SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain.\n');
    done();
    releaseConnector(conn);
  });
});


it('testListAllSemObjFImanage', done => {
  testOne('list all SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" manage', function (conn, res) {
    expect(res).toEqual(
      //'I did not find any SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" manage.\n'
      //'the SemanticObject for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain are ...\nGLAccount'
      // 'the bspname, fiori intent, appname for manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
      // 'the SemanticObject for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain are ...\nGLAccount;\nProfitCenter'
      'the SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" manage are ...\n"GLAccount"'
    );
    done();
    releaseConnector(conn);
  });
});

it('testUpDWhatisTransactionCodeALR', done => {
  expect.assertions(1);
  testOne('What is the TransactionCodes for S_ALR_87012394 "PrepareTax Report"', function (conn, res) {
    expect(res).toEqual(
      // 'the bspname, fiori intent, appname for manage labels are ...\n"FRA_ALERT_MAN", "#ComplianceAlerts-manage" and "Manage Alerts";\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
      'The TransactionCodes of S_ALR_87012394 "PrepareTax Report" is "S_ALR_87012394"\n'
    );
    done();
    releaseConnector(conn);
  });
});



it('testUpDownListAllBSPName', done => {
  expect.assertions(1);
  testOne('list all bspname, fiori intent, appname for manage labels', function (conn, res) {
    expect(res).toEqual(
      //      'the bspname, fiori intent, appname for manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
      //TODO!!!!????
      // 'the bspname, fiori intent, appname for manage labels are ...\n"FRA_ALERT_MAN", "#ComplianceAlerts-manage" and "Manage Alerts";\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
      'the bspname, fiori intent, appname for manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels";\n"FRA_ALERT_MAN", "#ComplianceAlerts-manage" and "Manage Alerts"'
    );
    done();
    releaseConnector(conn);
  });
});


it('testUpDownListAllBSPNameManageLAables', done => {
  testOne('list all bspname, fiori intent, appname for "manage labels"', function (conn, res) {
    expect(res).toEqual(
      'the bspname, fiori intent, appname for "manage labels" are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
    );
    done();
    releaseConnector(conn);
  });
});


it('testListAllMultipleCategories', done => {
  testOne('List all atomic weight, element name, element symbol for element name silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'the atomic weight, element name, element symbol for element name silver are ...\n"107.8682(2)", "silver" and "Ag"'
    );
    done();
    releaseConnector(conn);
  });
});


/* TODO!

exports.testShowMe1 = function (test) {
  var cnt = 0;
  testOne('start SU01 in', function(conn, res) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    cnt = cnt + 1;
    test.deepEqual((cnt === 1) && (sRes.indexOf('Not enough') < 0), false);
    test.deepEqual((cnt === 2) && (sRes.indexOf('Please provide') < 0), false, 'first call');
    if(cnt === 2) {
      testOne('UV2', function(conn, res) {
        debuglog(JSON.stringify(oRes));
        testOne('120', function(conn, res) {
          debuglog(JSON.stringify(oRes));
          test.releaseConnector(conn); done(); });
      });
    }
  });
};
*/


it('testListAllMultipleCategories', done => {
  testOne('List all atomic weight, element name, element symbol for element name silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'the atomic weight, element name, element symbol for element name silver are ...\n"107.8682(2)", "silver" and "Ag"'
    );
    releaseConnector(conn); done();

  });
});


it('testListAllDomainsOBJ', done => {
  testOne('List all Tables in domain SOBJ Tables', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'the Tables in domain SOBJ Tables are ...\n"/UIF/LREPDATTR";\n"/UIF/LREPDATTRCD";\n"/UIF/LREPDCONT";\n"/UIF/LREPDCONTCD";\n"/UIF/LREPDEREF";\n"/UIF/LREPDEREFCD";\n"/UIF/LREPDLTXT";\n"/UIF/LREPDLTXTCD";\n"/UIF/LREPDREF";\n"/UIF/LREPDREFCD";\n"/UIF/LREPDSTXT";\n"/UIF/LREPDSTXTCD";\n"/UIF/LREPDTEXT";\n"/UIF/LREPDTEXTCD";\n"LTDHTRAW";\n"LTDHTTMPL";\n"LTR_REPOSITORY";\n"SWOTDI";\n"SWOTDQ";\n"TZS02"'
    );
    done();
    releaseConnector(conn);
  });
});


//"list all Transport Tables in domain "SOBJ TAbles"

it('testListAllTablesInDomainsOBJIUPAC', done => {
  testOne('List all Tables in domain IUPAC', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(// TODO NICER ERROR?
      'I don\'t know anything about "Tables in domain IUPAC" ("").\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\'\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\''
    );
    //  'I don\'t know anything about "Tables in domain IUPAC" ("").\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\'\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\'\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\'');
    releaseConnector(conn); done();
  });
});


it('testListAllInDomainsQuoted', done => {
  testOne('List all Tables in domain "SOBJ Tables"', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'the Tables in domain "SOBJ Tables" are ...\n"/UIF/LREPDATTR";\n"/UIF/LREPDATTRCD";\n"/UIF/LREPDCONT";\n"/UIF/LREPDCONTCD";\n"/UIF/LREPDEREF";\n"/UIF/LREPDEREFCD";\n"/UIF/LREPDLTXT";\n"/UIF/LREPDLTXTCD";\n"/UIF/LREPDREF";\n"/UIF/LREPDREFCD";\n"/UIF/LREPDSTXT";\n"/UIF/LREPDSTXTCD";\n"/UIF/LREPDTEXT";\n"/UIF/LREPDTEXTCD";\n"LTDHTRAW";\n"LTDHTTMPL";\n"LTR_REPOSITORY";\n"SWOTDI";\n"SWOTDQ";\n"TZS02"'
    );
    releaseConnector(conn); done();
  });
});

it('testListAllInImplicitDomainQuoted', done => {
  testOne('List all Tables in "SOBJ Tables"', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'the Tables in "SOBJ Tables" are ...\n"/UIF/LREPDATTR";\n"/UIF/LREPDATTRCD";\n"/UIF/LREPDCONT";\n"/UIF/LREPDCONTCD";\n"/UIF/LREPDEREF";\n"/UIF/LREPDEREFCD";\n"/UIF/LREPDLTXT";\n"/UIF/LREPDLTXTCD";\n"/UIF/LREPDREF";\n"/UIF/LREPDREFCD";\n"/UIF/LREPDSTXT";\n"/UIF/LREPDSTXTCD";\n"/UIF/LREPDTEXT";\n"/UIF/LREPDTEXTCD";\n"LTDHTRAW";\n"LTDHTTMPL";\n"LTR_REPOSITORY";\n"SWOTDI";\n"SWOTDQ";\n"TZS02"'
    );
    releaseConnector(conn); done();
  });
});


/*
exports.testListAllCAtegoryInNonDomain = function (test) {
  testOne('List all categories in TWF', function(conn, res) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes,
    'the Tables for "SOBJ Tables" are ...\n/UIF/LREPDATTR;\n/UIF/LREPDATTRCD;\n/UIF/LREPDCONT;\n/UIF/LREPDCONTCD;\n/UIF/LREPDEREF;\n/UIF/LREPDEREFCD;\n/UIF/LREPDLTXT;\n/UIF/LREPDLTXTCD;\n/UIF/LREPDREF;\n/UIF/LREPDREFCD;\n/UIF/LREPDSTXT;\n/UIF/LREPDSTXTCD;\n/UIF/LREPDTEXT;\n/UIF/LREPDTEXTCD;\nLTDHTRAW;\nLTDHTTMPL;\nLTR_REPOSITORY;\nSWOTDI;\nSWOTDQ;\nTZS02'
    , 'correct tables');
    test.releaseConnector(conn); done(); });
};
*/

it('testListAllCAtegoryInDomainNonDomain', done => {
  testOne('List all categories in domain ELOM', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      /*   'the Tables for domain SOBJ Tables are ...\n/UIF/LREPDATTR;\n/UIF/LREPDATTRCD;\n/UIF/LREPDCONT;\n/UIF/LREPDCONTCD;\n/UIF/LREPDEREF;\n/UIF/LREPDEREFCD;\n/UIF/LREPDLTXT;\n/UIF/LREPDLTXTCD;\n/UIF/LREPDREF;\n/UIF/LREPDREFCD;\n/UIF/LREPDSTXT;\n/UIF/LREPDSTXTCD;\n/UIF/LREPDTEXT;\n/UIF/LREPDTEXTCD;\nLTDHTRAW;\nLTDHTTMPL;\nLTR_REPOSITORY;\nTZS02'  */
      /*  'I did not infer a domain restriction from "domain ELOM", all my categories are ...\nAppDocumentationLinkKW;\nAppKey;\nAppName;\nApplicationComponent;\nApplicationType;\nArtifactId;\nBSPApplicationURL;\nBSPName;\nBSPPackage;\nBusinessCatalog;\nBusinessGroupDescription;\nBusinessGroupName;\nBusinessRoleName;\nCategory;\nExternalReleaseName;\nFrontendSoftwareComponent;\nLPDCustInstance;\nObject name length;\nPrimaryODataPFCGRole;\nPrimaryODataServiceName;\nPrimaryTable;\nRoleName;\nSemanticAction;\nSemanticObject;\nShortText;\nTable;\nTableTransportKeySpec;\nTechnicalCatalog;\nTransactionCodes;\nTranslationRelevant;\nTransportObject;\nType;\nURLParameters;\n_url;\nalbedo;\nappId;\natomic weight;\nclient;\nclientSpecific;\ndetailsurl;\ndevclass;\ndistance;\neccentricity;\nelement name;\nelement number;\nelement properties;\nelement symbol;\nfiori catalog;\nfiori group;\nfiori intent;\nisPublished;\nmass;\nobject name;\nobject type;\norbit radius;\norbital period;\norbits;\nradius;\nrecordKey;\nreleaseId;\nreleaseName;\nsystemId;\ntcode;\ntool;\ntransaction;\ntransaction description;\nunit test;\nuri;\nurl;\nvisual luminosity;\nvisual magnitude;\nwiki'
        */
      'I don\'t know anything about "categories in domain ELOM" ("").\nI do not understand "ELOM".'
    );
    releaseConnector(conn); done();
  });
});




it('testMakeTable', done => {
  testOne('make table for element name, element symbol and atomic weight', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'I had to drop "atomic weight". But here you go ...\nCreating and starting table with "element name" and "element symbol"'
    );
    releaseConnector(conn); done();
  });
});


it('testListAllSingleSimple', done => {
  testOne('List all element names with element_number 10', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    // TODO was expect(sRes).toEqual('the element names with element number 10 are ...\n"neon"');
    console.log('>' + sRes + '<');
    expect(sRes).toEqual('the element names with element_number 10 are ...\n"neon"');
    releaseConnector(conn); done();
  });
});

it('testListAllStringEq', done => {
  testOne('List all element_names with element_name barium', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    // TODO was expect(sRes).toEqual('the element names with element number 10 are ...\n"neon"');
    console.log('>' + sRes + '<');
    expect(sRes).toEqual('the element_names with element_name barium are ...\n"barium"');
    releaseConnector(conn); done();
  });
});


it('testListAllElementNumberExplicit2', done => {
  testOne('List all element_names with "element_name" cadmium', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    // TODO was expect(sRes).toEqual('the element names with element number 10 are ...\n"neon"');
    console.log('>' + sRes + '<');
    expect(sRes).toEqual('the element_names with "element_name" cadmium are ...\n'
    + '"cadmium"');
    releaseConnector(conn); 
    done();
  });
});

/* TODO
it('testListAllElementNumberExplicit3', done => {
  testOne('List all element names with "element_number" less than 10', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    // TODO was expect(sRes).toEqual('the element names with element number 10 are ...\n"neon"');
    console.log('>' + sRes + '<');
    expect(sRes).toEqual('I did not finxd any element names with "element_number" 10.\n');
    releaseConnector(conn); done();
  });
});
*/

/* TODO
it('testListAllStringLT', done => {
  testOne('List all element_names with element_name < americium', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    // TODO was expect(sRes).toEqual('the element names with element number 10 are ...\n"neon"');
    console.log('>' + sRes + '<');
    expect(sRes).toEqual('I did not find any element names with element number 10.\n');
    releaseConnector(conn); done();
  });
});
*/



/*
"list all element names with element names less than 10",
"list all element names with \"element numbers\" less than 10",
"list all element names with \"element numbers\" < 10",
"list all element names with \"element numbers\" < \"10\"",
*/


it('testWhatIsNonParseable', done => {
  testOne('What is the atomic weight, element name for element name silver sowasgibts nicht', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      //    'I don\'t know anything about "atomic weight for element name silver sowasgibts nicht" ("").\nI do not understand "sowasgibts".\nI do not understand "nicht".'
      // deepEqual 'I don\'t know anything about "atomic weight for element name silver sowasgibts nicht(Error: "atomic weight for element name silver sowasgibts nicht" is not a category!)'
      //   'I don\'t know anything about "atomic weight, element name" ("atomic weight" and "element name") in relation to "element name silver sowasgibts nicht".\nI do not understand "sowasgibts".\nI do not understand "nicht".' );
      //    'I don\'t know anything about "atomic weight, element name" ("atomic weight" and "element name")" in relation to "element name silver sowasgibts nicht"\nI do not understand "sowasgibts".\nI do not understand "nicht".');
      'I don\'t know anything about "atomic weight, element name" ("atomic weight" and "element name") in relation to "element name silver sowasgibts nicht".\nI do not understand "sowasgibts".\nI do not understand "nicht".'
    );
    done();
    releaseConnector(conn);
  });
});

it('testListAllNonParseableSingleCat', done => {
  testOne('List all atomic weight for element name silver sowasgibts nicht', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(// TODO:
    // deepEqual 'I don\'t know anything about "atomic weight, sowasgibtsgarnicht, element symbol"(Error: "sowasgibtsgarnicht" is not a category!)'
    //    'I don\'t know anything about "atomic weight for element name silver sowasgibts nicht(Error: "atomic weight for element name silver sowasgibts nicht" is not a category!)'
    // 'i did not find any atomic weight for element name silver sowasgibts nicht.\n\nI do not understand "sowasgibts".\nI do not understand "nicht".'
      'I don\'t know anything about "atomic weight for element name silver sowasgibts nicht" ("").\nI do not understand "sowasgibts".\nI do not understand "nicht".');
    done();
    releaseConnector(conn);
  });
});

it('testListAllMultipleCategoriesJunk', done => {
  testOne('List all atomic weight, sowasgibtsgarnicht, element symbol for element name silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      // 'I don\'t know anything about "atomic weight, sowasgibtsgarnicht, element symbol"(Error: "sowasgibtsgarnicht" is not a category!)
      'I don\'t know anything about "atomic weight, sowasgibtsgarnicht, element symbol for element name silver" ("").\nI do not understand "sowasgibtsgarnicht".'
    );
    done();
    releaseConnector(conn);
  });
});

it('testListAllMultipleCategories2', done => {
  testOne('What is the atomic weight and element symbol for gold', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      //  'I don\'t know anything about "atomic weight and element symbol" ("atomic weight" and "element symbol") in relation to "gold".\nError: parsing error in  input[{"name":"NotAllInputParsedException","message":"Redundant input, expecting EOF but found: and"' deepEqual 'The "atomic weight" and "element symbol" of gold are "196.966 569(5)" and "Au"\n'
      //'The "atomic weight" and "element symbol" of gold are "196.966 569(5)" and "Au"\n'
      'The atomic weight and element symbol of gold are ...\n"196.966 569(5)" and "Au"'
    );
    expect(sRes.indexOf('966') >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testListAllMultipleCategoriesBadMix', done => {
  testOne('What is the unit test and element symbol for gold', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(
      'I don\'t know anything about "unit test and element symbol" ("") in relation to "gold".\nI do not understand "unit".\nI do not understand "test".'
    );
    done();
    releaseConnector(conn);
  });
});

it('testListAllMultipleOK2', done => {
  testOne('list all element name, atomic weight for mercury', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(// TODO Horrible wrong!
    //'the element name, atomic weight for mercury are ...\n"mercury" and "200.592(3)"'
      'the element name, atomic weight for mercury are ...\n"mercury" and "200.592(3)";\n"80" and "200.592(3)"');

    done();
    releaseConnector(conn);
  });
});

it('testTooLongWordCount', done => {
  expect.assertions(1);
  testOne('a b c d e f g h i j "k l m n o p" r s t ad so on is very short a', function (conn, oRes) {
    expect(SmartDialog.aResponsesOnTooLong.indexOf(oRes) >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testTooLongSentence', done => {
  expect.assertions(1);
  testOne('ahasdfasdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
    + ' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
    + ' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
    + ' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
    + ' jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj jjjjjjjjjjjjjjjjjjjj'
    + ' llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll',
  function (conn, oRes) {
    expect(SmartDialog.aResponsesOnTooLong.indexOf(oRes) >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testListAllMultipleBadCombine', done => {
  expect.assertions(1);
  testOne('list all element name, wiki for mercury', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes).toEqual(// TODO corresponding testcase and error for cross-domain nofit
    //'I cannot combine "element name, wiki(Error: categories "element name" and "wiki" have no common domain.)'
      'I don\'t know anything about "element name, wiki for mercury" ("").\nI do not understand "wiki".');
    done();
    releaseConnector(conn);
  });
});



it('testShowMe2', done => {
  testOne('What is the element weight for element name silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('107.') >= 0).toEqual(true);
    releaseConnector(conn); done();
  });
});


it('testDomainsListAllIn', done => {
  testOne('list all categories in domain IUPAC', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('wiki') >= 0).toEqual(false);
    expect(sRes.indexOf('element name') >= 0).toEqual(true);
    releaseConnector(conn); done();
  });
});


it('testDomains', done => {
  testOne('list all domains', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('IUPAC') >= 0).toEqual(true);
    expect(sRes.indexOf('FioriBOM') >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});


it('testSuggest', done => {
  testOne('help me', function (conn, oRes) {
    //var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    done();
    releaseConnector(conn);
  });
});


it('testListWithContextDontKnow', done => {
  expect.assertions(1);
  testOne('list abcnames for silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('know anything about "abcnames') >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testListWithContextKnow', done => {
  expect.assertions(1);
  testOne('list all element name for silver', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('silver') >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testEliza', done => {
  testOne('i am sad', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('sad') >= 0).toEqual(true);
    done();
    releaseConnector(conn);
  });
});

it('testListAllNotACat', done => {
  testOne('list all NOTACATEGORY', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'I don\'t know anything about "NOTACATEGORY" ("").\nI do not understand "NOTACATEGORY".'
    );
    releaseConnector(conn); done();
  });
});

//TODO; this should accept undefined and list more!
it('testListAllMultOnlyCat', done => {
  testOne('list all orbits, object type', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(// TODO CHECK
    //    'the orbits, object type are ...\n"null";\n"Alpha Centauri C" and "planet";\n"Sun" and "planet";\n"n/a" and "star, red dwarf"'
    //  'the orbits, object type are ...\n"Alpha Centauri C" and "planet";\n"Sun" and "planet";\n"n/a" and "star, red dwarf";\n"null"'
    //   'the orbits, object type are ...\n"Alpha Centauri C" and "planet";\n"n/a" and "star";\n"n/a" and "star, red dwarf";\n"Sun" and "planet"'
    //    'the orbits, object type are ...\n"Alpha Centauri C" and "planet";\n"n/a" and "star, red dwarf";\n"Sun" and "planet"'
      'the orbits, object type are ...\n"undefined" and "star";\n"Alpha Centauri C" and "planet";\n"Sun" and "planet";\n"n/a" and "star, red dwarf"');
    releaseConnector(conn);
    done(); 
  });
});


it('testListWeirdNoCatError', done => {
  testOne('list all silver', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'I don\'t know anything about "silver" ("").\nError: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\''
    );
    releaseConnector(conn);
    done(); 
  });
});

it('testListWeirdUnknownError', done => {
  testOne('list all NOTANYWHERE', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'I don\'t know anything about "NOTANYWHERE" ("").\nI do not understand "NOTANYWHERE".'
    );
    releaseConnector(conn);
    done();
  });
});


it('testListAllCategories', done => {
  testOne('list all categories', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('orbits') >= 0).toEqual(true);
    expect(sRes.indexOf('FioriBOM') < 0).toEqual(true);
    releaseConnector(conn);
    done();
  });
});

it('testListAllCategoriesInDomain', done => {
  testOne('list all categories in domain FioriBOM', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('orbits') < 0).toEqual(true);
    expect(sRes.indexOf('SemanticObject') >= 0).toEqual(true);
    expect(sRes.indexOf('SemanticAction') >= 0).toEqual(true);
    releaseConnector(conn);
    done();
  });
});

it('testListAllCategoriesInDirectDomainname', done => {
  testOne('list all categories in FioriBOM', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('orbits') < 0).toEqual(true);
    expect(sRes.indexOf('SemanticObject') >= 0).toEqual(true);
    expect(sRes.indexOf('SemanticAction') >= 0).toEqual(true);
    releaseConnector(conn);
    done();
  });
});

it('testListAllCategoriesInDirectSynonym', done => {
  testOne('list all categories in Fiori BOM', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('orbits') < 0).toEqual(true);
    expect(sRes.indexOf('SemanticObject') >= 0).toEqual(true);
    expect(sRes.indexOf('SemanticAction') >= 0).toEqual(true);
    releaseConnector(conn);
    done();
  });
});

it('testListAllCategoriesInDomainSynonym', done => {
  testOne('list all categories in domain Fiori BOM', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('orbits') < 0).toEqual(true);
    expect(sRes.indexOf('SemanticObject') >= 0).toEqual(true);
    expect(sRes.indexOf('SemanticAction') >= 0).toEqual(true);
    releaseConnector(conn);
    done();
  });
});

it('testListAllCategoriesRelatedTo', done => {
  testOne('list all categories related to unit test', function (conn, oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    expect(sRes.indexOf('wiki') < 0).toEqual(true);
    expect(sRes.indexOf('unit test') >= 0).toEqual(true);
    releaseConnector(conn); done();
  });
});

it('testDescribeStupidDomain', done => {
  testOne('describe ABC in domain NODomain', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      //   'I did not infer a domain restriction from "wiki". Specify an existing domain. (List all domains) to get exact names.\n',
      //   'correct error msg');

      'I did not infer a domain restriction from "NODomain". Specify an existing domain. (List all domains) to get exact names.\n'
    );
    done();
    releaseConnector(conn);
  });
});


it('testDescribeCategory', done => {
  testOne('describe category', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('"category" is ' + SmartDialog.metawordsDescriptions['category']);
    releaseConnector(conn);
    done();
  });
});

it('testDescribeCategorySenselessDomain', done => {
  testOne('describe category in domain wiki', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(//      '"in domain "wiki" make no sense when matching a metaword.\n' +
    //      '"category" is ' + SmartDialog.metawordsDescriptions['category']
      'I did not infer a domain restriction from "wiki". Specify an existing domain. (List all domains) to get exact names.\n');
    releaseConnector(conn); done();
  });
});

it('testDescribeOneAtATime', done => {
  testOne('describe silver and gold', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'Whoa, i can only explain one thing at a time, not "silver and gold". Please ask one at a time.'
    );
    releaseConnector(conn); done();
  });
});

it('testDescribeADomain', done => {
  testOne('describe cosmos', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      //  '"cosmos"is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cosmos" has a meaning in one domain "metamodel":\n"cosmos" is a value for category "domain" present in 13(14.8%) of records;\n'
      '"cosmos"is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cosmos" has a meaning in one domain "metamodel":\n"cosmos" is a value for category "domain" present in 13(15.3%) of records;\n'
    );
    releaseConnector(conn); done();
  });
});


it('testDescribeEcc', done => {
  testOne('describe eccentricity', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    const DESCRIBE_ECCEN = '"eccentricity"  is a category in domain "Cosmos"\nIt is present in 2 (28.6%) of records in this domain,\nhaving 2(+1) distinct values.\nPossible values are ...\n"0.0167" or "0.0934"';

    expect(oRes).toEqual(DESCRIBE_ECCEN);
    releaseConnector(conn); done();
  });
});

it('testIsAnyonymous', done => {
  expect(SmartDialog.isAnonymous('ano:abc')).toEqual(true);
  expect(SmartDialog.isAnonymous('somebody')).toEqual(false);
  expect(SmartDialog.isAnonymous('somano:xx')).toEqual(false);
  done();
});



it('testRestrictData', done => {

  expect(SmartDialog.restrictData([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);

  expect(SmartDialog.restrictData([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([1, 2, 3, 4, 5, 6, 7]);

  expect(SmartDialog.restrictData([1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => '' + i))).toEqual(
    [1, 2, 3, 4, 5, 6, 7,].map(i => '' + i).concat('... and 2 more entries for registered users')
  );
  done();
});


it('testDescribe', done => {
  testOne('describe silver', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      '"silver" has a meaning in one domain "IUPAC":\n"silver" is a value for category "element name" present in 1(0.8%) of records;\n'
    );
    releaseConnector(conn); done();
  });
});



it('testDescribeEarth', done => {
  testOne('describe earth', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      '"earth" has a meaning in 2 domains: "Cosmos" and "Philosophers elements"\nin domain "Cosmos" "earth" is a value for category "object name" present in 1(14.3%) of records;\nin domain "Philosophers elements" "earth" is a value for category "element name" present in 1(25.0%) of records;\n'
    );
    releaseConnector(conn); done();
  });
});

it('testListAllDomainContaining', done => {
  testOne('list all domains containing IU', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('the domains containing IU are ...\n"IUPAC"');
    releaseConnector(conn); done();
  });
});


it('testListAllDomainContainingNotPresent', done => {
  testOne('list all domains containing IUNIXDA', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('I did not find any domains containing IUNIXDA.\n');
    releaseConnector(conn); done();
  });
});


it('testBadOP', done => {
  testOne('list all element names overfroombolding ea', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'I don\'t know anything about "element names overfroombolding ea" ("").\nI do not understand "overfroombolding".\nI do not understand "ea".'
    );
    releaseConnector(conn); done();
  });
});



it('testOperatorStartsWith', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all element names starting with ni', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'the element names starting with ni are ...\n"nickel";\n"nihonium";\n"niobium";\n"nitrogen"'
    );
    releaseConnector(conn); done();
  });
});

it('testOperatorStartsWithFI', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all KURUMBA LUBUMBA starting with FI', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'I don\'t know anything about "KURUMBA LUBUMBA starting with FI" ("").\nI do not understand "KURUMBA".\nI do not understand "LUBUMBA".\nI do not understand "FI".'
    );
    releaseConnector(conn); done();
  });
});


it('testOperatorCatEndingUPAC', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories ending with UPA!', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('I did not find any categories ending with UPA.\n');
    releaseConnector(conn); done();
  });
});



it('testTrainMe', done => {
  //logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('I think ABC is related to DEF', function (conn, oRes) {
    expect(SmartDialog.aTrainReplies.indexOf(oRes) >= 0).toEqual(true);
    releaseConnector(conn); done();
  });
});

//"list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394."

it('testListAllWithModelDataCollision', done => {
  //logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394.', function (conn, oRes) {
    expect(oRes).toEqual(
      'the ApplicationComponent, devclass, FioriBackendCatalogs with TransactionCode S_ALR_87012394 are ...\n"FI-AR", "APPL_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_ACC_BE_APPS";\n"FI-LOC-FI", "ODATA_GLO_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_GLO_AC_BE_APPS"'
    );
    releaseConnector(conn); done();
  });
});

it('testListAllWithModelDataCollisionProperCat', done => {
  //logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all ApplicationComponent, devclass, BackendCatalogId for S_ALR_87012394.', function (conn, oRes) {
    expect(oRes).toEqual(
      'the ApplicationComponent, devclass, BackendCatalogId for S_ALR_87012394 are ...\n"FI-AR", "APPL_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_ACC_BE_APPS";\n"FI-LOC-FI", "ODATA_GLO_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_GLO_AC_BE_APPS"'
    );
    releaseConnector(conn); done();
  });
});

it('testListAllWithModelDataCollisionProperCat2', done => {
  //logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all ApplicationComponent, devclass, Fiori Backend Catalog with TransactionCode S_ALR_87012394.', function (conn, oRes) {
    expect(oRes).toEqual(
      'the ApplicationComponent, devclass, Fiori Backend Catalog with TransactionCode S_ALR_87012394 are ...\n"FI-AR", "APPL_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_ACC_BE_APPS";\n"FI-LOC-FI", "ODATA_GLO_FIN_APP_DESCRIPTORS" and "SAP_TC_FIN_GLO_AC_BE_APPS"'
    );
    releaseConnector(conn); done();
  });
});


//list all Application Component, fiori intent, Backendcatalog for GRM3...
it('testListAllWithModelDataCollisionEXample2', done => {
  //logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all Application Component, fiori intent, Backendcatalog for GRM3.', function (conn, oRes) {
    expect(oRes).toEqual(
      'the Application Component, fiori intent, Backendcatalog for GRM3 are ...\n"PS", "#WBSElement-assignToGroupingWBSElementCollectively" and "SAP_TC_PS_BE_APPS"'
    );
    releaseConnector(conn); done();
  });
});


it('testTrainMeKlingon', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('I think Klingon is related to kronos', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(SmartDialog.aTrainNoKlingon.indexOf(oRes) >= 0).toEqual(true);
    releaseConnector(conn); done();
  });
});




it('testOperatorContainingUPAC', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all domains containing "UPA"', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('the domains containing "UPA" are ...\n"IUPAC"');
    releaseConnector(conn); done();
  });
});

it('testOperatorContainingNit', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories containing "lem"', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'the categories containing "lem" are ...\n"element name";\n"element number";\n"element properties";\n"element symbol"'
    );
    releaseConnector(conn); done();
  });
});


it('testOperatorEndingWith', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all domains ending with "ABC"', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual('I did not find any domains ending with "ABC".\n');
    releaseConnector(conn); done();
  });
});


it('testOperatorCategoriesStartsWith', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with elem?', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      //'my categories starting with "elem" are ...\nelement name;\nelement number;\nelement properties;\nelement symbol'
      'the categories starting with elem are ...\n"element name";\n"element number";\n"element properties";\n"element symbol"'
    );
    releaseConnector(conn); done();
  });
});

it('testOperatorStartsWithQuoted', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem"', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'the categories starting with "elem" are ...\n"element name";\n"element number";\n"element properties";\n"element symbol"'
    );
    releaseConnector(conn); done();
  });
});

it('testOperatorStartsWithQuotedInDomain', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain IUPAC', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'the categories starting with "elem" in domain IUPAC are ...\n"element name";\n"element number";\n"element symbol"'
    );
    releaseConnector(conn); done();
  });
});

it('testOperatorStartsWithQuotedInDomainSloppy', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain IUPAD', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      'the categories starting with "elem" in domain IUPAD are ...\n"element name";\n"element number";\n"element symbol"'
    );
    releaseConnector(conn); done();
  });
});


it('testOperatorStartsWithQuotedInNoDomain', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain NONEXSITENT', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      // TODO better error 'I did not infer a domain restriction from "NONEXSITENT". Specify an existing domain. (List all domains) to get exact names.\n'
      'I don\'t know anything about "categories starting with "elem" in domain NONEXSITENT" ("").\nI do not understand "NONEXSITENT".'
    );
    releaseConnector(conn); done();
  });
});

it('testOperatorStartsWithQuotedMemberInDomain', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all element names starting with e in domain IUPAC', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(//TODO SORTING
      'the element names starting with e in domain IUPAC are ...\n"einsteinium";\n"erbium";\n"europium"');
    releaseConnector(conn); done();
  });
});

it('testShowMeQueryOK', done => {
  testOne('show me orbits with earth', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      //  '"cosmos"is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cosmos" has a meaning in one domain "metamodel":\n"cosmos" is a value for category "domain" present in 13(14.8%) of records;\n'
      'starting uri https://en.wikipedia.org/wiki/Earth'
    );
    releaseConnector(conn); done();
  });
});


it('testShowMeBad', done => {
  testOne('show me funny', function (conn, oRes) {
    debuglog(JSON.stringify(oRes));
    expect(oRes).toEqual(
      //  '"cosmos"is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cosmos" has a meaning in one domain "metamodel":\n"cosmos" is a value for category "domain" present in 13(14.8%) of records;\n'
      'I did not get what you want'
    );
    releaseConnector(conn); done();
  });
});


//var debug = require('debug');

var logPerf = logger.perf('perflistall');
//var perflog = debug('perf');


it('testPerfListAll1', done => {
  logPerf('testPerfListAll1');
  testOne('list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning', function (conn, oRes) {
    // var sRes = oRes;
    logPerf('testPerfListAll1');
    debuglog(JSON.stringify(oRes));
    expect(true).toEqual(true);
    releaseConnector(conn); done();
  });
});

it('testPerfListAll2', done => {
  logPerf('testPerfListAll');
  // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all AppNames in FIN-GL Account Manage fiori intent related to unit test', function (conn, oRes) {
    //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    expect(true).toEqual(true);
    releaseConnector(conn); done();
  });
});



