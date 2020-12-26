"use strict";
/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017-2019
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.extractExpectArr = exports.mapTokenStringToHumanString = exports.getExpecting = exports.getQualifierFromWordType = exports.getTokenQualifier = exports.getSentenceToken = exports.getTokenText = void 0;
const debug = require("debugf");
const debuglog = debug('formaterror');
const index_model_1 = require("./model/index_model");
function getTokenText(token, sentence) {
    return getSentenceToken(token, sentence).string;
}
exports.getTokenText = getTokenText;
function getSentenceToken(token, sentence) {
    if (Number.isNaN(token.startOffset) || token.startOffset >= sentence.length) {
        throw Error('access outside of index' + token.startOffset + " / " + sentence.length);
    }
    return sentence[token.startOffset];
}
exports.getSentenceToken = getSentenceToken;
function getTokenQualifier(token, sentence) {
    return getQualifierFromWordType(getSentenceToken(token, sentence).rule.wordType);
}
exports.getTokenQualifier = getTokenQualifier;
function getQualifierFromWordType(wordType) {
    switch (wordType) {
        case index_model_1.IFModel.WORDTYPE.FACT:
            return "the fact";
        case index_model_1.IFModel.WORDTYPE.CATEGORY:
            return "the category";
        case index_model_1.IFModel.WORDTYPE.DOMAIN:
            return "the domain";
        case index_model_1.IFModel.WORDTYPE.OPERATOR:
            return "the operator";
    }
    return "";
}
exports.getQualifierFromWordType = getQualifierFromWordType;
function getExpecting(message) {
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
exports.getExpecting = getExpecting;
function mapTokenStringToHumanString(tokenstring) {
    switch (tokenstring) {
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
exports.mapTokenStringToHumanString = mapTokenStringToHumanString;
function extractExpectArr(message) {
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
exports.extractExpectArr = extractExpectArr;
function formatError(error, sentence) {
    debuglog(() => 'error : ' + JSON.stringify(error));
    if ((error.name === "NotAllInputParsedException") && error.token && (error.token.startOffset !== null)) {
        var tok = getTokenText(error.token, sentence);
        var qualifier = getTokenQualifier(error.token, sentence);
        return { text: `I do not understand ${qualifier} "${tok}" at this position in the sentence.`,
            error: error };
    }
    if ((error.name === "NoViableAltException") && error.token && (Number.isNaN(error.token.startOffset))) {
        var expect = getExpecting(error.message);
        return { text: `Sentence terminated unexpectedly, i expected ${expect}.`,
            error: error };
    }
    //(error.name === "NoViableAltException")
    return { error: error,
        text: JSON.stringify(error)
    };
}
exports.formatError = formatError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9mb3JtYXRlcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxnQ0FBZ0M7QUFDaEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRXRDLHFEQUF5RDtBQUd6RCxTQUFnQixZQUFZLENBQUMsS0FBVyxFQUFFLFFBQTZCO0lBQ25FLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxFQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNuRCxDQUFDO0FBRkQsb0NBRUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUFXLEVBQUUsUUFBNkI7SUFDdkUsSUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7UUFDeEUsTUFBTSxLQUFLLENBQUMseUJBQXlCLEdBQUcsS0FBSyxDQUFDLFdBQVcsR0FBRyxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3hGO0lBQ0QsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFMRCw0Q0FLQztBQUdELFNBQWdCLGlCQUFpQixDQUFDLEtBQVcsRUFBRSxRQUE2QjtJQUN4RSxPQUFPLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDckYsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsUUFBaUI7SUFDdEQsUUFBTyxRQUFRLEVBQUU7UUFDYixLQUFLLHFCQUFPLENBQUMsUUFBUSxDQUFDLElBQUk7WUFDdEIsT0FBTyxVQUFVLENBQUM7UUFDdEIsS0FBSyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRO1lBQzFCLE9BQU8sY0FBYyxDQUFBO1FBQ3pCLEtBQUsscUJBQU8sQ0FBQyxRQUFRLENBQUMsTUFBTTtZQUN4QixPQUFPLFlBQVksQ0FBQTtRQUN2QixLQUFLLHFCQUFPLENBQUMsUUFBUSxDQUFDLFFBQVE7WUFDMUIsT0FBTyxjQUFjLENBQUE7S0FDNUI7SUFDRCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFaRCw0REFZQztBQVNELFNBQWdCLFlBQVksQ0FBQyxPQUFnQjtJQUN6QyxnQkFBZ0I7SUFDaEIsZ0ZBQWdGO0lBQ2hGLGFBQWE7SUFDYixjQUFjO0lBQ2QsMENBQTBDO0lBQzFDLElBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlGLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0IsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO1FBQ1osT0FBTyxJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ3JCO0lBQ0QsT0FBTyxTQUFTLENBQUMsQ0FBQyxpQ0FBaUM7QUFDdkQsQ0FBQztBQVpELG9DQVlDO0FBRUQsU0FBZ0IsMkJBQTJCLENBQUMsV0FBb0I7SUFDNUQsUUFBTyxXQUFXLEVBQUU7UUFDaEIsS0FBSyxNQUFNO1lBQ1AsT0FBTyxNQUFNLENBQUM7UUFDbEIsS0FBSyxPQUFPO1lBQ1IsT0FBTyxpQkFBaUIsQ0FBQztRQUM3QixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLFNBQVMsQ0FBQztRQUNmLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxRQUFRO1lBQ1QsT0FBTyxRQUFRLENBQUM7S0FDdkI7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBYkQsa0VBYUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxPQUFnQjtJQUM3QyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDLEdBQUcscUJBQXFCLENBQUM7SUFDOUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxLQUFLLElBQUksSUFBSSxFQUFFO1FBQ2xCLGdEQUFnRDtRQUNoRCxzQ0FBc0M7UUFDdEMsc0NBQXNDO1FBQ3RDLHNDQUFzQztRQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzNCO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQWRELDRDQWNDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLEtBQVcsRUFBRSxRQUE2QjtJQUNsRSxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyw0QkFBNEIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsRUFBRztRQUNyRyxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sRUFBRSxJQUFJLEVBQ0wsdUJBQXVCLFNBQVMsS0FBSyxHQUFHLHFDQUFxQztZQUM3RSxLQUFLLEVBQUcsS0FBSyxFQUFFLENBQUM7S0FDM0I7SUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxzQkFBc0IsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRztRQUNwRyxJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sRUFBRSxJQUFJLEVBQ0wsZ0RBQWdELE1BQU0sR0FBRztZQUN6RCxLQUFLLEVBQUcsS0FBSyxFQUFFLENBQUM7S0FDM0I7SUFDRCx5Q0FBeUM7SUFDekMsT0FBTyxFQUFFLEtBQUssRUFBRyxLQUFLO1FBQ2xCLElBQUksRUFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztLQUMvQixDQUFBO0FBQ0wsQ0FBQztBQW5CRCxrQ0FtQkMiLCJmaWxlIjoiZm9ybWF0ZXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGZpbGUgZm9ybWF0ZXJyb3IudHNcclxuICpcclxuICogRm9ybWF0cyAoc29tZSkgcGFyc2VyIGVycm9ycyBpbnRvIGEgaHVtYW4gdW5kZXJzdGFuZGFibGUgdGV4dFxyXG4gKlxyXG4gKiAoYykgZ2VyZCBmb3JzdG1hbm4gMjAxNy0yMDE5XHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnZm9ybWF0ZXJyb3InKTtcclxuXHJcbmltcG9ydCB7IElGTW9kZWwgYXMgSUZNb2RlbCB9IGZyb20gJy4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSwgSUZFckJhc2UgYXMgSUZFckJhc2UgfSBmcm9tICcuL21hdGNoL2VyX2luZGV4JztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUb2tlblRleHQodG9rZW4gOiBhbnksIHNlbnRlbmNlIDogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gZ2V0U2VudGVuY2VUb2tlbih0b2tlbixzZW50ZW5jZSkuc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VudGVuY2VUb2tlbih0b2tlbiA6IGFueSwgc2VudGVuY2UgOiBJRkVyQmFzZS5JU2VudGVuY2UpIDogSUZFckJhc2UuSVdvcmQge1xyXG4gICAgaWYoTnVtYmVyLmlzTmFOKHRva2VuLnN0YXJ0T2Zmc2V0KSB8fCB0b2tlbi5zdGFydE9mZnNldCA+PSBzZW50ZW5jZS5sZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignYWNjZXNzIG91dHNpZGUgb2YgaW5kZXgnICsgdG9rZW4uc3RhcnRPZmZzZXQgKyBcIiAvIFwiICsgc2VudGVuY2UubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzZW50ZW5jZVt0b2tlbi5zdGFydE9mZnNldF07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG9rZW5RdWFsaWZpZXIodG9rZW4gOiBhbnksIHNlbnRlbmNlIDogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gZ2V0UXVhbGlmaWVyRnJvbVdvcmRUeXBlKGdldFNlbnRlbmNlVG9rZW4odG9rZW4sc2VudGVuY2UpLnJ1bGUud29yZFR5cGUgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFF1YWxpZmllckZyb21Xb3JkVHlwZSh3b3JkVHlwZSA6IHN0cmluZykgOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoKHdvcmRUeXBlKSB7XHJcbiAgICAgICAgY2FzZSBJRk1vZGVsLldPUkRUWVBFLkZBQ1QgOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJ0aGUgZmFjdFwiO1xyXG4gICAgICAgIGNhc2UgSUZNb2RlbC5XT1JEVFlQRS5DQVRFR09SWTpcclxuICAgICAgICAgICAgcmV0dXJuIFwidGhlIGNhdGVnb3J5XCJcclxuICAgICAgICBjYXNlIElGTW9kZWwuV09SRFRZUEUuRE9NQUlOOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJ0aGUgZG9tYWluXCJcclxuICAgICAgICBjYXNlIElGTW9kZWwuV09SRFRZUEUuT1BFUkFUT1I6XHJcbiAgICAgICAgICAgIHJldHVybiBcInRoZSBvcGVyYXRvclwiXHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQYXJzZUVycm9yIHtcclxuICAgIHRleHQgOiBzdHJpbmcsXHJcbiAgICBlcnJvciA6IGFueVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwZWN0aW5nKG1lc3NhZ2UgOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIC8vICAgIHJldHVybiBcIkFcIlxyXG4gICAgLy9FcnJvcjogTm9WaWFibGVBbHRFeGNlcHRpb246IEV4cGVjdGluZzogb25lIG9mIHRoZXNlIHBvc3NpYmxlIFRva2VuIHNlcXVlbmNlczpcclxuICAgIC8vICAxLiBbRkFDVF1cclxuICAgIC8vICAyLiBbQW5BTlldXHJcbiAgICAvLyB0b2RvIGV4dHJhY3QgYW5kIGZvcm1hdCBhbHRlcm5hdGl2ZXMuLi5cclxuICAgIHZhciBhcnIgPSBleHRyYWN0RXhwZWN0QXJyKG1lc3NhZ2UpLm1hcChyID0+IG1hcFRva2VuU3RyaW5nVG9IdW1hblN0cmluZyhyKSkuZmlsdGVyKHIgPT4gISFyKTtcclxuICAgIHZhciByZXMgPSBhcnIuam9pbihcIiBvciBhIFwiKTtcclxuICAgIGlmIChyZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiYSBcIiArIHJlcztcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7IC8vICdhIGZhY3Qgb3IgYSBzdHJpbmcgZnJhZ21lbnQnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFwVG9rZW5TdHJpbmdUb0h1bWFuU3RyaW5nKHRva2Vuc3RyaW5nIDogc3RyaW5nICkgOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoKHRva2Vuc3RyaW5nKSB7XHJcbiAgICAgICAgY2FzZSBcIkZBQ1RcIjpcclxuICAgICAgICAgICAgcmV0dXJuIFwiZmFjdFwiO1xyXG4gICAgICAgIGNhc2UgXCJBbkFOWVwiOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJzdHJpbmcgZnJhZ21lbnRcIjtcclxuICAgICAgICBjYXNlICdUSW50ZWdlcic6XHJcbiAgICAgICAgY2FzZSAnSW50ZWdlcic6XHJcbiAgICAgICAgY2FzZSAnMTInOlxyXG4gICAgICAgIGNhc2UgJ05VTUJFUic6XHJcbiAgICAgICAgICAgIHJldHVybiAnbnVtYmVyJztcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0RXhwZWN0QXJyKG1lc3NhZ2UgOiBzdHJpbmcpIDogc3RyaW5nW10ge1xyXG4gICAgZGVidWdsb2cobWVzc2FnZSk7XHJcbiAgICB2YXIgciA9IC9cXGQrXFwuIFxcWyhbXlxcXV0rKVxcXS9nO1xyXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgIHZhciBtYXRjaCA9IHIuZXhlYyhtZXNzYWdlKTtcclxuICAgIHdoaWxlIChtYXRjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnIGhlcmUgJyArIEpTT04uc3RyaW5naWZ5KG1hdGNoKSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnIGhlcmUgIDAgJyArIG1hdGNoWzBdKTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCcgaGVyZSAgMSAnICsgbWF0Y2hbMV0pO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyBoZXJlICAyICcgKyBtYXRjaFsyXSk7XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKG1hdGNoWzFdKTtcclxuICAgICAgICBtYXRjaCA9IHIuZXhlYyhtZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RXJyb3IoZXJyb3IgOiBhbnksIHNlbnRlbmNlIDogSUZFckJhc2UuSVNlbnRlbmNlKSA6IElQYXJzZUVycm9yIHtcclxuICAgIGRlYnVnbG9nKCgpID0+ICdlcnJvciA6ICcgKyBKU09OLnN0cmluZ2lmeShlcnJvcikpO1xyXG4gICAgaWYgKChlcnJvci5uYW1lID09PSBcIk5vdEFsbElucHV0UGFyc2VkRXhjZXB0aW9uXCIpICYmIGVycm9yLnRva2VuICYmIChlcnJvci50b2tlbi5zdGFydE9mZnNldCAhPT0gbnVsbCkgKSB7XHJcbiAgICAgICAgdmFyIHRvayA9IGdldFRva2VuVGV4dChlcnJvci50b2tlbiwgc2VudGVuY2UpO1xyXG4gICAgICAgIHZhciBxdWFsaWZpZXIgPSBnZXRUb2tlblF1YWxpZmllcihlcnJvci50b2tlbixzZW50ZW5jZSk7XHJcbiAgICAgICAgcmV0dXJuIHsgdGV4dCA6XHJcbiAgICAgICAgICAgICAgICBgSSBkbyBub3QgdW5kZXJzdGFuZCAke3F1YWxpZmllcn0gXCIke3Rva31cIiBhdCB0aGlzIHBvc2l0aW9uIGluIHRoZSBzZW50ZW5jZS5gLFxyXG4gICAgICAgICAgICAgICAgZXJyb3IgOiBlcnJvciB9O1xyXG4gICAgfVxyXG4gICAgaWYgKChlcnJvci5uYW1lID09PSBcIk5vVmlhYmxlQWx0RXhjZXB0aW9uXCIpICYmIGVycm9yLnRva2VuICYmIChOdW1iZXIuaXNOYU4oZXJyb3IudG9rZW4uc3RhcnRPZmZzZXQpKSApIHtcclxuICAgICAgICB2YXIgZXhwZWN0ID0gZ2V0RXhwZWN0aW5nKGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybiB7IHRleHQgOlxyXG4gICAgICAgICAgICAgICAgYFNlbnRlbmNlIHRlcm1pbmF0ZWQgdW5leHBlY3RlZGx5LCBpIGV4cGVjdGVkICR7ZXhwZWN0fS5gLFxyXG4gICAgICAgICAgICAgICAgZXJyb3IgOiBlcnJvciB9O1xyXG4gICAgfVxyXG4gICAgLy8oZXJyb3IubmFtZSA9PT0gXCJOb1ZpYWJsZUFsdEV4Y2VwdGlvblwiKVxyXG4gICAgcmV0dXJuIHsgZXJyb3IgOiBlcnJvcixcclxuICAgICAgICB0ZXh0IDogSlNPTi5zdHJpbmdpZnkoZXJyb3IpXHJcbiAgICB9XHJcbn0iXX0=
