// import * as dlsh from '../../src/ts/utils/damerauLevenshtein.js'


var root = '../../js';


var DialogLogger = require(root + '/utils/dialoglogger.js');

//var dlsh = dl.levenshteinDamerau;

var debug = require('debug');
const debuglog = debug('dialoglogger.nunit');

it('testLogger', done => {
  expect.assertions(4);

  var cA1 = undefined;
  var cA2 = undefined;
  var fakePG = {
    connect : function(o, fn) {
      debuglog('connect called');
      fn(undefined /*undef*/,
        {
          query : function(qa1,qa2, fn) {
            debuglog('queryy called');
            cA1 = qa1;
            cA2 = qa2;
            fn(undefined, {
              a: 1234
            }
            );
          }
        }, function(err,o) {
          debuglog('done');
          expect(2).toEqual(2);
        }
      );
    }
  };

  /*
 botid : (session.message && session.message.address && session.message.address.bot && session.message.address.bot.id ) || this.name,
    userid: session.message.address
    && session.message.address.user
    && session.message.address.user.id || "",
    message: session.message.text,
    response : answer.response,
    action : answer.action,

    intent: answer.intent,

    conversationid: session.message.address
    && session.message.address.conversation
    && session.message.address.conversation.id || "",
*/

  var answer = {
    session : {
      message : {
        timestamp : new Date().toISOString(),
        address : {
          user : 'theUSER',
          conversation : {
            id : 'TheID'
          }
        }
      }
    },
    intent : 'AnIntent',
    response : 'TheResponse',
    action : 'TheAction'
  };
  /*
  session : builder.Session,
  intent : string,
  response : string,
  action? : string,
  result? : any,
  */

  DialogLogger.logger('LOGID','theurl', fakePG)(
    answer,
    function(err, res) {
      debuglog('callback');
      expect(1).toEqual(1);
      expect(cA1).toEqual(
        'INSERT INTO logconv (botid,userid,message,response,action,intent,conversationid,meta,delta) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9)'
      );
      cA2[8] = 1234;
      expect(cA2).toEqual([ 'LOGID',
        '',
        'undefined',
        'TheResponse',
        'TheAction',
        'AnIntent',
        'TheID',
        {},
        1234 ]);
      done();
    },
    true
  );
});

it('testLoggerInactive', done => {
  expect.assertions(1);
  var fakePG = {
    connect : function(o, fn) {
      throw new Error('abc');
    }
  };

  var answer = {
    session : {
      message : {
        address : {
          user : 'theUSER',
          conversation : {
            id : 'TheID'
          }
        }
      }
    },
    intent : 'AnIntent',
    response : 'TheResponse',
    action : 'TheAction'
  };
  /*
  session : builder.Session,
  intent : string,
  response : string,
  action? : string,
  result? : any,
  */

  DialogLogger.logger('LOGID','theurl', fakePG)(
    answer,
    function(err, res) {
      debuglog('done');
      throw new Error('never here');
    }
  );
  expect(1).toEqual(1);
  done();
});



/*



export function logAnswer(answer: IAnswer, callback : (err: any, res?: any) => void ) {
  "use strict";
  callback = callback || (function() {});
  var session = answer.session;
  var pg = this.pg;
  debuglog("here user id of message session.message.address " +
  JSO
  // test.expect(3);
  test.deepEqual(fn('abcdef', '').toFixed(2), '0.63', 'empty b');
  test.deepEqual(fn('', '').toFixed(2), '1.00', 'both empty');
  test.deepEqual(fn('abc', 'abc').toFixed(2), '1.00', 'a is a');
  test.deepEqual(fn('', 'abc').toFixed(2), '0.63', ' empty a');
  test.deepEqual(fn('abcdef', 'abcde').toFixed(2),  '0.98', 'a is a');
  test.deepEqual(fn('abcdef', 'abcdef').toFixed(2),  '1.00', 'a is a');
  test.deepEqual(fn('hijk', 'abcd').toFixed(2), '0.41', 'a is a');
  test.deepEqual(fn('fabcde', 'abcdef').toFixed(2), '0.93', 'shift');
  test.deepEqual(fn('abc', 'acb').toFixed(2), '0.77', ' abc acb');
  test.deepEqual(fn('Shell.controller.js', 'Shell').toFixed(2), '0.58', 'Shell.controller.js, Shell');
  test.deepEqual(fn('Emma3', 'Shell').toFixed(2), '0.40', ' Emma3, Shell');
  test.done();
};
*/
