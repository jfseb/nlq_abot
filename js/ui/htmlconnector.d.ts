import * as BotBuilder from '../bot/botbuilder';
declare type IMessage = BotBuilder.IMessage;
declare type Address = BotBuilder.Address;
declare type AnswerHook = (txt: string, cmd: string, id?: string) => void;
export declare class HTMLConnector {
    replyCnt: number;
    answerHooks: Map<string, AnswerHook>;
    quithook: any;
    handler: any;
    quitHook: any;
    answerHook: AnswerHook;
    constructor(options: any);
    setAnswerHook(answerHook: (txt: string, cmd: string, id?: string) => void, id: string): void;
    setQuitHook(quitHook: any): void;
    processMessage(line: string, id: Address): this;
    onEvent: (handler: any) => void;
    send(messages: IMessage[], done: any): void;
    startConversation: (address: Address, cb: (err: any, a: Address) => void) => void;
}
export {};
