/**
 * this emulates the Microsoft BotBuilder SDK V3.
 */
/**
 * @file
 * @module jfseb.nlq_abot.botbuilder
 * @copyright (c) 2016-2109 Gerd Forstmann
 */
interface Conversation {
    id: string;
}
export interface User {
    id: string;
}
export interface Bot {
    id: string;
}
export interface IEntity {
    startIndex: number;
    entity: string;
    type: string;
    endIndex: number;
    score: number;
}
export declare class EntityRecognizer {
    static findEntity(entities: IEntity[], type: string): any;
}
export interface IRecognizeContext {
    message: IMessage;
}
export interface IIntentRecognizerResult {
    intent: string;
    score: number;
    entities: IEntity[];
}
export interface IIntentRecognizer {
    recognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void;
}
export interface Address {
    bot: Bot;
    conversation: Conversation;
    user: User;
}
export interface IMessage {
    address: Address;
    type?: string;
    agent?: string;
    source: string;
    text: string;
    timestamp: string;
    entities?: string[];
}
export declare class Message {
    _theMsg: IMessage;
    constructor(s: Session);
    toMessage(): IMessage;
    address(adr: Address): Message;
    text(txt: string): Message;
    timestamp(): Message;
    addEntity(o: any): Message;
}
declare type stringOrMessage = string | Message;
export declare class Prompts {
    static text(session: Session, a: string): void;
}
export interface EndDialogArg {
    response: any;
}
export interface UserData {
    count: number;
}
export interface Session {
    message: IMessage;
    dialogData: any;
    userData: UserData;
    send(arg: stringOrMessage): void;
    endDialogWithResult(arg: EndDialogArg): any;
    beginDialog(match: string, a: number): any;
}
export interface IConnector {
    onEvent(fn: (msgs: IMessage[]) => void): void;
    send(messages: IMessage[], fn: (a: any) => void): any;
}
export declare class UniversalBot {
    _dialogs: Map<string, IntentDialog>;
    _connector: IConnector;
    _onEvent(msgs: IMessage[]): void;
    constructor(connector: IConnector);
    dialog(path: string, dialog: IntentDialog): void;
}
declare type ContinueFunction = (session: Session, args: any, next: () => void) => void;
export declare class IntentDialog {
    _default: (session: Session) => void;
    _matches: Map<string, ContinueFunction[]>;
    _recognizers: {
        recognizers: IIntentRecognizer[];
    };
    constructor(a: {
        recognizers: IIntentRecognizer[];
    });
    _processMessage(msg: IMessage, connector: IConnector): void;
    onBegin(cb: (session: Session) => void): void;
    onDefault(cb: (session: Session) => void): void;
    matches(intent: string, sess: ContinueFunction[]): void;
}
export {};
