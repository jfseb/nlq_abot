/**
 * A helper class to connect the dispatcher to the HTMLConnector
 * maps botbuilder entities to plain strings /JSON objects
 */
'use strict';

/* nonglobal process:true*/

var BotBuilder = require('../bot/botbuilder.js');
var Message = BotBuilder.Message;
var HTMLConnector = (function () {
  function HTMLConnector(options) {
    this.replyCnt = 0;
    this.answerHooks = {};
    this.user = options && options.user || 'user1';
    this.bot = options && options.bot || 'fdevstart';
    //this.conversationID = options && options.conversationid || ('' + Date.now());
  }

  HTMLConnector.prototype.setAnswerHook = function (answerHook, id) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };
  HTMLConnector.prototype.setQuitHook = function (quitHook) {
    this.quitHook = quitHook;
  };
  HTMLConnector.prototype.processMessage = function (line, id) {
    debugger;
    if (typeof id === 'string') {
      id = {
        conversationid : id,
        user : id,
      };
    }
    if (this.handler) {
      var msg = new Message()
        .address({
          channelId: 'console',
          user: { id: id.user, name: id.user },
          bot: { id: this.bot, name: this.bot },
          conversation: { id: id.conversationid }
        })
        .timestamp()
        .text(line);
      this.handler([msg.toMessage()]);
    }
    return this;
  };
  HTMLConnector.prototype.onEvent = function (handler) {
    this.handler = handler;
  };
  HTMLConnector.prototype.send = function (messages, done) {
    for (var i = 0; i < messages.length; i++) {
      if (this.replyCnt++ > 0) {
      //  console.log(' reply ');
      }
      var msg = messages[i];
      if (msg.text) {
        var command = undefined;
        if(msg.entities && msg.entities[0] && msg.entities[0]) {
          command = msg.entities[0];
        }
        if (msg.address && msg.address.conversation && msg.address.conversation.id
        && this.answerHooks[msg.address.conversation.id] ) {
          this.answerHooks[msg.address.conversation.id](msg.text, command, msg.address.conversation.id );
        } else {
          this.answerHook(msg.text, command, this.conversationID);
        }
        //log(msg.text);
      }
      /*
      if (msg.attachments && msg.attachments.length > 0) {
        for (var k = 0; i < msg.attachments.length; i++) {
          if (k > 0) {
            //console.log();
          }
          //renderAttachment(msg.attachments[k]);
        }
      }*/
    }
    done(null);
  };
  HTMLConnector.prototype.startConversation = function (address, cb) {
    var adr = Object.assign({}, address); // utils.clone(address)
    adr.conversation = { id: 'Convo1' };
    cb(null, adr);
  };
  return HTMLConnector;
} ());

exports.HTMLConnector = HTMLConnector;
