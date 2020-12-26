// run regressions
// this uses testdb2  (mgnlq_testmodel2)

// environment variables
// SET ABOT_WRITE_REGRESS=true   to overwrite input
//
// otherwise data will be written to run/..

// BEWARE, this test runs a significant time!

var process = require('process');
var root = '../../js';
var debug = require('debug');
const debuglog = debug('smartdialog.nunit.regress');

var rootdata = './test/regress/test/';


var fs = require('fs');

function getArg(s) {
  var i = 1;
  debuglog(process.argv.length);
  for(i = 0; i < process.argv.length; i = i + 1) {
    if(process.argv[i] === '-' + s && process.argv[i+1]) {
      return process.argv[i + 1];
    }
  }
  return undefined;
}

var fnin = getArg('i') || 'input';

jest.setTimeout(720000);

var dataS = fs.readFileSync( rootdata + fnin + '.json');
var data = JSON.parse(dataS);

var dataExpS = fs.readFileSync(rootdata + fnin + '.expect.json');
var dataExp = JSON.parse(dataExpS);

//var logger = require(root + '/utils/logger');
const SmartDialog = require(root + '/bot/smartdialog.js');
var HTMLConnector = require(root + '/ui/htmlconnector.js');



function testOne(conn, str,cb) {
  conn.setAnswerHook(cb);
  conn.processMessage(str, 'unittest');
}

var Model = require(root + '/model/index_model.js').Model;
var getTestModel2 = require(root + '/model/testmodels.js').getTestModel2;

// Create bot and bind to console
function getBotInstance() {
  var connector = new HTMLConnector.HTMLConnector();
  /** the model is lazily obatained, if it is not obtained, there is no model */
  var res = getTestModel2();
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

function hasFlag(sFlag) {
  return process.argv.filter(function(sArg) {
    return sArg === '-' + sFlag;
  }).length > 0;
}

var run = new Date().toISOString().replace(/[:.-]/g,'_');

function runNext(conn, context, i, fnRunOne,  cb) {
  debuglog('here i' + i);
  if ( i >= context.maxI) {
    if(cb) {
      cb(undefined);
    }
    return;
  }
  fnRunOne(conn, context, i, runNext.bind(undefined , conn, context, i+1, fnRunOne, cb));
}

function getContext() {
  var context = {
    maxI : data.length,
    input : data,
    expected : dataExp,
    ok : 0,
    bad : 0,
    diffs : [],
    actual : [],
    runtimes :[]
  };
  return context;
}

function runOne(conn, context, i, cb ) {
  var input =  context.input[i];
  var expected = context.expected[i] || '';
  var start = Date.now();
  testOne(conn, input, function(oRes) {
    var sRes = oRes;
    var end = Date.now();
    debuglog(i + ' ' + sRes);
    context.actual[i] = sRes;
    context.runtimes[i] = end - start;
    if(oRes === expected) {
      context.ok += 1;
      debuglog('ok\n');
    } else {
      context.bad += 1;
      var s = '['+ i +'] input : "' + input + '"\n'
       +    '['+ i +'] expect: "' + expected.replace(/[\n]/g,'\\n') + '"\n'
     +    '['+ i +'] actual: "' + oRes.replace(/[\n]/g,'\\n') + '"\n';
      var k = 0;
      for(k = 0; k < oRes.length && k < expected.length && oRes.charAt[k] === expected.charAt[k]; ++k) {
        /* empty */
      }
      debuglog(s);
      debuglog('diff at ' + k + '\n...>' + oRes.substring(Math.max(k-2, 0)) + '\n...>' +
      expected.substring(Math.max(k-2, 0)) + '\n');
      context.diffs.push(s);
    }
    cb();
  });
}

function outFile(s) {
  return  rootdata + 'runs/' + run + '_' + s ;
}

it('testRegress1', done => {
  getBotInstance().then((conn) => {
    var prefix = '';
    if(hasFlag('p')) {
      prefix = 'p';
      run = 'p' + run;
      // performance run;
      console.log('not implemented');
    } else {
      var context = getContext();
      runNext(conn, context, 0 , runOne , function() {
        var rtfull = context.runtimes.reduce(function(prev,curr) {
          return prev + curr;
        }, 0);

        if(!context.diffs.length === 0) {
          console.log(context.diffs.join('\n'));
        }
        if( process.env.ABOT_WRITE_REGRESS) {
          console.log('Errors : ' + context.diffs.length);
        } else {
          expect(context.diffs.length).toEqual(0);
        }
        context.actual.forEach(function(sActual,iIndex) {
          var quest = iIndex +  ` result differs on \n question: >${context.input[iIndex]}<`;
          if( sActual + quest != context.expected[iIndex] + quest) {
            console.log(' differences in \n' + quest + '\n' + sActual + '\n' + context.expected[iIndex]);
          }
          if (! process.env.ABOT_WRITE_REGRESS) {
            expect(sActual + quest).toEqual(context.expected[iIndex] + quest);
          }
        });
        var rtavg = rtfull / context.input.length;
        var summaryCompact = run + '\t' + context.input.length + '\t' + (rtavg/1000).toFixed(2) + '\t' + context.ok + '\t'
        + context.bad + '\t' + fnin + '\n';
        var summary = 'run: ' + run + '\t' + 'size: ' + context.input.length + '\tok: ' + context.ok + '/' + context.bad + '\t'
        + 'avg:' + (rtavg/1000).toFixed(2)  + 's  total:' +  (rtfull/1000).toFixed(2) + 's' + '\t' + fnin + '\n';
        if (process.env.ABOT_WRITE_REGRESS) {
          console.log(summary);
          if (!fs.existsSync(rootdata + 'runs') ) {
            fs.mkdirSync(rootdata + 'runs');
          }
          fs.writeFileSync(outFile('actual.json'), JSON.stringify(context.actual, undefined,2));
          fs.writeFileSync(outFile('diffs.txt'), summary + context.diffs.join('\n'));
          fs.writeFileSync(outFile('rts.txt'), summary + context.runtimes.join('\n'));
          fs.appendFile(rootdata  + 'runs/' + prefix + 'all.txt', summaryCompact, function() {});
          fs.appendFile(rootdata  + 'runs/' + prefix + 'rt_all.txt',
            fnin + '\t' + context.runtimes.map(function(rt) {
              return String('        ' + rt).slice(-7); }).join('\t') + '\n',
            function() {});
        }
        console.log('cleaning up, releasing connector');
        releaseConnector(conn);
        done();
      });
    }
  });
});
