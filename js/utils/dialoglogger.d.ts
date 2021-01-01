/**
 * a logger for dialog conversations
 */
import * as builder from '../bot/botbuilder';
export declare var sqlActive: boolean;
export interface ILogEntry {
    botid: string;
    userid: string;
    message: string;
    response: string;
    action: string;
    intent: string;
    conversationId: string;
    /**
     * an result
     **/
    meta: any;
    delta: number;
}
export interface IAnswer {
    session: builder.Session;
    intent: string;
    response: string;
    action?: string;
    result?: any;
}
export declare function assureColumnLengthNotExceeded(obj: ILogEntry): ILogEntry;
export declare function logAnswer(answer: IAnswer, callback: (err: any, res?: any) => void, ForceSqlActive?: boolean): void;
export declare function logger(name: string, dburl: string, pg: any): (a: IAnswer, callback?: (err: any, res?: any) => void) => void;
