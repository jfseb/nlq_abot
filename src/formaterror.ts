/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017-2019
 */

import * as debug from 'debugf';
const debuglog = debug('formaterror');

import { IFModel as IFModel } from './model/index_model';
import { Sentence as Sentence, IFErBase as IFErBase } from './match/er_index';

export function getTokenText(token : any, sentence : IFErBase.ISentence) {
    return getSentenceToken(token,sentence).string;
}

export function getSentenceToken(token : any, sentence : IFErBase.ISentence) : IFErBase.IWord {
    if(Number.isNaN(token.startOffset) || token.startOffset >= sentence.length) {
        throw Error('access outside of index' + token.startOffset + " / " + sentence.length);
    }
    return sentence[token.startOffset];
}


export function getTokenQualifier(token : any, sentence : IFErBase.ISentence) {
    return getQualifierFromWordType(getSentenceToken(token,sentence).rule.wordType );
}

export function getQualifierFromWordType(wordType : string) : string {
    switch(wordType) {
        case IFModel.WORDTYPE.FACT :
            return "the fact";
        case IFModel.WORDTYPE.CATEGORY:
            return "the category"
        case IFModel.WORDTYPE.DOMAIN:
            return "the domain"
        case IFModel.WORDTYPE.OPERATOR:
            return "the operator"
    }
    return "";
}



export interface IParseError {
    text : string,
    error : any
}

export function getExpecting(message : string) : string {
    //    return "A"
    //Error: NoViableAltException: Expecting: one of these possible Token sequences:
    //  1. [FACT]
    //  2. [AnANY]
    // todo extract and format alternatives...
    var arr = extractExpectArr(message).map(r => mapTokenStringToHumanString(r)).filter(r => !!r);
    var res = arr.join(" or a ");
    if (res.length) {
        return "a " + res;
    }
    return undefined; // 'a fact or a string fragment';
}

export function mapTokenStringToHumanString(tokenstring : string ) : string {
    switch(tokenstring) {
        case "FACT":
            return "fact";
        case "AnANY":
            return "string fragment";
        case 'TInteger':
        case 'Integer':
        case '12':
        case 'NUMBER':
            return 'number';
    }
    return undefined;
}

export function extractExpectArr(message : string) : string[] {
    debuglog(message);
    var r = /\d+\. \[([^\]]+)\]/g;
    var results = [];
    var match = r.exec(message);
    while (match != null) {
        //console.log(' here ' + JSON.stringify(match));
        //console.log(' here  0 ' + match[0]);
        //console.log(' here  1 ' + match[1]);
        //console.log(' here  2 ' + match[2]);
        results.push(match[1]);
        match = r.exec(message);
    }
    return results;
}

export function formatError(error : any, sentence : IFErBase.ISentence) : IParseError {
    debuglog(() => 'error : ' + JSON.stringify(error));
    if ((error.name === "NotAllInputParsedException") && error.token && (error.token.startOffset !== null) ) {
        var tok = getTokenText(error.token, sentence);
        var qualifier = getTokenQualifier(error.token,sentence);
        return { text :
                `I do not understand ${qualifier} "${tok}" at this position in the sentence.`,
                error : error };
    }
    if ((error.name === "NoViableAltException") && error.token && (Number.isNaN(error.token.startOffset)) ) {
        var expect = getExpecting(error.message);
        return { text :
                `Sentence terminated unexpectedly, i expected ${expect}.`,
                error : error };
    }
    //(error.name === "NoViableAltException")
    return { error : error,
        text : JSON.stringify(error)
    }
}