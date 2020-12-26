/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var root = '../../js';


var debuglog = require('debug')('indexwords.nunit');

const IndexWords = require(root + '/match/indexwords.js');


const Model = require(root + '/model/index_model.js').Model;

const pg = require('pg');

//var m = Model.loadModels('testmodel2');

//var m0 = Model.loadModels();


var pglocalurl = "postgres://joe:abcdef@localhost:5432/abot";
var dburl = process.env.DATABASE_URL || pglocalurl;

pg.defaults.ssl = true;

it("testLoadWords", done => {
  if (process.env.ABOT_EMAIL_USER) {
    done();
    return;
  }
  if(!process.env.ABOT_INDEXWORDS) {
    done();
    return; // not today
  }
  var fut = IndexWords.dumpWords(dburl, m);
  done();
});


var m0 = {
  rules: {}
}

it("testSimulateLoadWordPGs", done => {
  var cA1 = undefined;
  var cA2 = undefined;
  expect.assertions(2);
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
          expect(2).toEqual(2);
          debuglog('done');
        }
        );
    }
  };
  IndexWords.mockPG(fakePG);
  var fut = IndexWords.insertWord("anurl", "lcword", "matchedSTring", "category",
function() {
  expect(1).toEqual(1);
  debuglog("didi it");
  done();
});


})


it("testSimulateLoadWordsConnectFail", done => {
  var cA1 = undefined;
  var cA2 = undefined;
  var fakePG = {
    connect : function(o, fn) {
      debuglog('connect called');
      fn('connect failed',
        {
          query : function(qa1,qa2, fn) {
            debuglog('queryy called');
            expect(1).toEqual(0);
            cA1 = qa1;
            cA2 = qa2;
            fn(undefined, {
              a: 1234
            }
          );
          }
        }, function(err,o) {
          debuglog('done');
          expect(1).toEqual(2);
        }
        );
    }
  };
  IndexWords.mockPG(fakePG);
  var fut = IndexWords.insertWord("anurl", "lcword", "matchedSTring", "category",
function(err) {
  expect(!!err).toEqual(true);
  done();
});


})


