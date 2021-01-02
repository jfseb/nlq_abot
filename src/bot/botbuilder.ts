/**
 * this emulates the Microsoft BotBuilder SDK V3. 
 */
/**
 * @file
 * @module jfseb.nlq_abot.botbuilder
 * @copyright (c) 2016-2109 Gerd Forstmann
 */

import * as fs from 'fs';
import { removeListener, send } from 'process';
import * as debug from 'debugf';
let debuglog = debug('botbuilder');

interface BotBuilder {

}

export interface Bot {
  id : string;
}

export interface IEntity {
  startIndex : number;
  entity : string;
  type : string;
  endIndex : number;
  score : number;
}

export class EntityRecognizer {
  static findEntity(entities: IEntity[], type: string) : any {
    for(let en of entities) {
      if(en.type == type ) {
        return en;
      }
    }
    return undefined;
  }
};

export interface IRecognizeContext {
  message : IMessage;
}

export interface IIntentRecognizerResult {
  intent : string; 
  score : number;
  entities : IEntity[];
}

export interface IIntentRecognizer {
  recognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void;
}

export interface Address {
  conversationId: string;
  user : string
}

export interface IMessage {
  address : Address;
  type?:string;
  text : string;
  timestamp : string;
  entities? : string[];
}

export class Message {
  _theMsg : IMessage;
  constructor(s: Session) { 
    this._theMsg = {
      type : "message",
       } as IMessage;
  }
  toMessage() : IMessage {
    return this._theMsg; 
  };
  address(adr: Address) : Message {
    this._theMsg.address = adr;
    return this;
  }
  text(txt:string) : Message {
    this._theMsg.text = txt;
    return this;
  }
  timestamp() : Message {
    this._theMsg.timestamp = new Date().toISOString();
    return this;
  }
  addEntity(o : any) : Message {
    if ( !this._theMsg.entities ) {
      this._theMsg.entities = [];
    }
    this._theMsg.entities.push(o);
    return this;
  }
}

type stringOrMessage = string | Message;

export class Prompts {
  static text(session: Session, a:string) : void {
  }
}


// at the end invoke send(messages, done) on the connector 
// 

export interface EndDialogArg {
  response : any;
}

export interface UserData {
  count : number;
}

export interface Session {
  message : IMessage;
  dialogData : any;
  send(arg : stringOrMessage) : void;
  endDialogWithResult( arg : EndDialogArg);
  beginDialog(match: string, a: number);
}

export interface IConnector {
  onEvent( fn: (msgs: IMessage[]) => void ) : void; 
  send(messages: IMessage[],fn: (a:any) => void);
}

export class UniversalBot {
  _dialogs : Map<string,IntentDialog>; 
  _connector : IConnector;

  // connector calls handler -> 
  // after analysis we whall call _connector.send(messages, done() ) with result in messages .text 

  _onEvent( msgs: IMessage[] ) : void {
    // run messages through all dialogs 
    var self = this;
    this._dialogs.forEach( (id:IntentDialog, key: string) =>{
      msgs.forEach( msg => id._processMessage(msg, self._connector ));
    });
  }

  constructor( connector: IConnector) {
    this._dialogs = new Map<string,IntentDialog>();
    this._connector = connector;
    this._connector.onEvent(this._onEvent.bind(this))
    return this;
  }

  dialog(path: string, dialog : IntentDialog) {
    this._dialogs.set(path,dialog);
  }
}



type ContinueFunction = (session:Session, args:any, next: ()=>void) => void

export class IntentDialog {

  _default : (session:Session)=> void;
  _matches : Map<string, ContinueFunction[]>;
  _recognizers : {recognizers : IIntentRecognizer[]};

  constructor( a : {recognizers : IIntentRecognizer[]}) {
    this._matches = new Map<string, ContinueFunction[]>();
    this._recognizers = a;
  }

  _processMessage( msg: IMessage, connector: IConnector ) {
    var Bfound = { found : false}; 
    var session : Session;
    session = {
      message : msg,
      send(response : stringOrMessage) :void {
        if ( typeof response == "string") {
          connector.send( [{ text : response } as IMessage], (a:any)=>{})
        } else {
          connector.send( [response.toMessage()], (a:any)=>{})
        }
      }
    } as Session;
    this._recognizers.recognizers.forEach( (ir) => {
      var irc: IRecognizeContext;
      irc = { message: msg };
      ir.recognize( irc, (err, result) => {
        var intent = result.intent;
        if ( result.score > 0.1 && intent !== 'None') {
          debuglog(' intent fits' + intent);
          this._matches.get(intent).forEach( a => a(session,result, ()=>{}) );
          Bfound.found = true;
        }
      });
    });
    if ( !Bfound.found) {
      this._default(session);
    }
  }

  onBegin( cb: (session: Session) => void) : void {
  }

  onDefault( cb : (session: Session) => void ) {
    this._default = cb;
  }

  matches( intent: string, sess : ContinueFunction[] ) : void {
    this._matches.set(intent, sess);
  }
}

import * as readline from 'readline';

import { Stream } from 'stream';

export class ConsoleConnector {
  stdin : NodeJS.ReadableStream;
  stdout : NodeJS.WritableStream;
  answerHooks : any;
  answerHook : any;
  quitHook: any;
  replyCnt : number;
  handler : any;

  conversationId : string;
  constructor(options) {
    options = options || {};
    this.stdin = options.stdin || process.stdin; 
    this.stdout = options.stdout || process.stdout;
    this.replyCnt = 0;
    this.conversationId = options && options.conversationId || ('' + Date.now());
    return this;
  }

  listen() {
    var self = this;
    var rl = readline.createInterface( this.stdin, this.stdout); // output: this.stdout } );
    this.answerHook = (txt,cmd, conversationId) => {
      console.log(txt); 
      if ( cmd ) {
        console.log( "cmd " + JSON.stringify(cmd));
      }
      rl.prompt();
    };
    // forever .... 
    rl.setPrompt(">");
    rl.prompt();
    rl.on('close', () => { process.exit(-1);} )
    rl.on('line', (line) => {
      self.processMessage(line, { conversationId : "conv1", user:"nouser" });      
    });
    return this;
  }

  setAnswerHook(answerHook, id) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };
  setQuitHook(quitHook) {
    this.quitHook = quitHook;
  };
  processMessage = function (line, id : Address) {
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
  onEvent(handler) {
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
          this.answerHook(msg.text, command, "singletarget");
        }
      }
    }
    done(null);
  };
  startConversation = function (address : Address, cb) {
    // TODO invoke this at an appropriate time
    var adr = Object.assign({}, address); 
    cb(null, adr);
  };
}
