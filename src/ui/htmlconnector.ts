/**
 * A helper class to connect the dispatcher to the HTMLConnector
 * maps botbuilder entities to plain strings/JSON objects
 */
'use strict';

/* nonglobal process:true*/

import * as BotBuilder from '../bot/botbuilder';
// var BotBuilder = require('../bot/botbuilder.js');
var Message = BotBuilder.Message;
type IMessage = BotBuilder.IMessage;
type Address = BotBuilder.Address;

type AnswerHook = (txt:string, cmd: string, id? : string) => void;

export class HTMLConnector {
  replyCnt : number; 
  answerHooks : Map<string, AnswerHook>;
  quithook: any;
  handler : any;
  quitHook : any;
  answerHook: AnswerHook;
  constructor(options) {
    this.replyCnt = 0;
    this.answerHooks = new Map<string, AnswerHook>();
  }
  setAnswerHook(answerHook : (txt:string, cmd: string, id? : string) => void, id : string) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };
  setQuitHook(quitHook) {
    this.quitHook = quitHook;
  };
  processMessage(line : string , id : Address) {
    if (typeof id === 'string') {
      id = {
        conversationId : id,
        user : id,
      };
    }
    if (this.handler) {
      var msg = new Message(null)
        .address(id)
        .timestamp()
        .text(line);
      this.handler([msg.toMessage()]);
    }
    return this;
  };

  onEvent = function (handler) {
    this.handler = handler;
  };

  send(messages : IMessage[], done) {
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
        if (msg.address && msg.address.conversationId
        && this.answerHooks[msg.address.conversationId] ) {
          this.answerHooks[msg.address.conversationId](msg.text, command, msg.address.conversationId );
        } else {
          this.answerHook(msg.text, command, "noconvid");
        }
      }
    }
    done(null);
  };
  startConversation = function (address: Address, cb : (err:any, a:Address) => void) {
    cb(null, address);
  };
}
