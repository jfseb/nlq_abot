/**
 * this emulates the Microsoft BotBuilder SDK V3. 
 */
/**
 * @file
 * @module jfseb.nlq_abot.botbuilder
 * @copyright (c) 2016-2109 Gerd Forstmann
 */

import * as fs from 'fs';
import { send } from 'process';

interface BotBuilder {

}

interface Conversation {
  id : string;
}

export interface User {
  id : string;
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
    debugger;
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
  bot: Bot;
  conversation: Conversation;
  user : User;
}

export interface IMessage {
  address : Address;
  type?:string;
  agent? : string;
  source: string;
  text : string;
  timestamp : string;
  entities? : string[];
}

export class Message {
  _theMsg : IMessage;
  constructor(s: Session) { 
    this._theMsg = {
      type : "message",
      agent:"botbuilder", 
    "source" : "console" } as IMessage;
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
  userData : UserData;
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
          debugger;
          this._matches.get(intent).forEach( a => a(session,result, ()=>{}) );
          Bfound.found = true;
        }
      });
    });
    if ( !Bfound.found) {
      debugger;
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