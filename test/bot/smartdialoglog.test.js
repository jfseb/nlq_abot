var process = require('process');
process.env.NODE_ENV = 'dev';
process.env.DEBUG = '*';
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
  var debuglog = require('debug')('smartdialog');
  debuglog.enabled = true;
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

it('testUpDownWhatIsBSPNameFioriIntentManageLabels', done => {
  testOne('what is the bspname, fiori intent, appname for manage labels', function (conn, res) {
    expect(res).toEqual(
      'The bspname, fiori intent, appname of manage labels are ...\n"n/a", "#ProductLabel-manage" and "Manage Labels"'
    );
    done();
    releaseConnector(conn);
  });
});
