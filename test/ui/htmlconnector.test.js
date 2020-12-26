/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = '../../js';

const HtmlConnector = require(root + '/ui/htmlconnector.js');

it("testWithIdHook", done => {
  expect.assertions(4);
  var address = { user: 'abc'};
  var out = new HtmlConnector.HTMLConnector({ user : "auser", bot : "bbot"});
  out.startConversation(address, function(err, adr){
    expect(err).toEqual(null);
    expect(adr.user).toEqual('abc');
    expect(adr.conversation.id).toEqual('Convo1');
    expect(adr=== address).toEqual(false);
    done();
  });
})


it("testWithIdHook", done => {

  var out = new HtmlConnector.HTMLConnector({ user : "auser", bot : "bbot"});

  var hook1 = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hook1.a = a;
    hook1.b = b,
    hook1.c = c;
    hook1.cnt += 1;
  },"id1");
  var hook2 = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hook2.a = a;
    hook2.b = b;
    hook2.c = c;
    hook2.cnt += 1;
  },"id2");

  var hookNoID = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hookNoID.a = a;
    hookNoID.b = b;
    hookNoID.c = c;
    hookNoID.cnt += 1;
  });



  out.setQuitHook(function(o) {
    throw new Error("never called");
  });

  var hook3 = { a : 0, cnt : 0};
  out.onEvent(function(arg) {
    hook3.a = arg;
    hook3.cnt += 1;
  });


  out.processMessage("this is the line", { user : "auser", "conversationid" : "convid"});
  expect(hook3.cnt).toEqual(1);
  hook3.a[0].timestamp = "TSXXX"
  expect(hook3.a).toEqual([
  {
    "type": "message",
    "agent": "botbuilder",
    "address": {
      "channelId": "console",
      "user": {
        "id": "auser",
        "name": "auser"
      },
      "bot": {
        "id": "bbot",
        "name": "bbot"
      },
      "conversation": {
        "id": "convid"
      }
    },
    "source": "console",
    "timestamp": "TSXXX",
    "text": "this is the line"
  }
]);

  expect(hook3.a[0].address.user).toEqual({ id :"auser", name : "auser"});
  expect(hook3.a[0].address.conversation.id).toEqual("convid");


  // send to id2
  out.processMessage("this is the line2", "id2");

  expect(hook1.cnt).toEqual(0);
  expect(hook2.cnt).toEqual(0);

  expect(hook3.a[0].address.user).toEqual({ id :"id2", name : "id2"});
  expect(hook3.a[0].address.conversation.id).toEqual("id2");

 hook3.a[0].timestamp = "TSXXX"
  expect(hook3.a).toEqual([
  {
    "type": "message",
    "agent": "botbuilder",
    "address": {
      "channelId": "console",
      "user": {
        "id": "id2",
        "name": "id2"
      },
      "bot": {
        "id": "bbot",
        "name": "bbot"
      },
      "conversation": {
        "id": "id2"
      }
    },
    "source": "console",
    "timestamp": "TSXXX",
    "text": "this is the line2"
  }
]);









  var hookDone = { a : undefined, cnt : 0};

  out.send({}, function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;

  });
  expect(hookDone.cnt).toEqual(1);
  expect(hookDone.a).toEqual(null);
  expect(hook1.cnt).toEqual(0);
  expect(hook2.cnt).toEqual(0);


  // sending messages:
  // a) with id and command
  var msg = {
    text : "here text",
    entities : ["entity0"],
    address : { conversation : { id  : "id2" } }
  }

  hook2 = { a : 0, cnt : 0};
  out.send([msg], function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;

  });
  expect(hookDone.cnt).toEqual(2);
  expect(hookDone.a).toEqual(null);
  expect(hook1.cnt).toEqual(0);
  expect(hook2.cnt).toEqual(1);
  expect(hook2.a).toEqual("here text");
  expect(hook2.b).toEqual("entity0");



 // send no id
  msg = {
    text : "here text2",
    entities : ["entity2"],
    address : { conversation : {  } }
  }
  out.send([msg],function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;
  });


  expect(hook2.cnt).toEqual(1);
  expect(hookNoID.cnt).toEqual(1);

  expect(hookNoID.a).toEqual("here text2");
  expect(hookNoID.b).toEqual("entity2");
  expect(hookNoID.c).toEqual(undefined);

  expect(hookDone.cnt).toEqual(3);
  expect(hookDone.a).toEqual(null);

  done();
});
