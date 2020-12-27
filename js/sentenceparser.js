'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.SelectLexer = exports.parseSentenceToAsts = exports.getLexer = exports.makeToken = void 0;
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const er_index_1 = require("./match/er_index");
const debug = require("debugf");
const SelectParser = require("./parser");
const debuglog = debug('sentenceparser');
const FormatError = require("./formaterror");
const chevrotain = require("chevrotain");
const AST = require("./ast");
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
const index_model_1 = require("./model/index_model");
var WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
WhiteSpace.GROUP = Lexer.SKIPPED;
const tokens_1 = require("./tokens");
// whitespace is normally very common so it is placed first to speed up the lexer
var allTokens = Object.keys(tokens_1.Tokens).map(key => tokens_1.Tokens[key]);
function makeToken(t, index, OL) {
    if (!t.rule) {
        throw new Error("Token without rule " + JSON.stringify(t));
    }
    if (t.rule.wordType === index_model_1.IFModel.WORDTYPE.CATEGORY) {
        return { image: "CAT", startOffset: index, bearer: t, tokenType: tokens_1.OperatorLookup.CAT.tokenType };
    }
    ;
    if (t.rule.wordType === 'F') {
        return { image: "FACT", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.FACT.tokenType };
    }
    if (t.rule.wordType === 'N') {
        //console.log( 'tokentype is ' +  T["Integer"].tokenType  +  ' ' + JSON.stringify( T["Integer"] ));
        // TODO i parses as integer -> integer
        return { image: "NUMBER", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.Integer.tokenType };
    }
    if (t.rule.wordType === 'D') {
        return { image: "DOM", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.DOM.tokenType };
    }
    if (t.rule.wordType === 'A') {
        return { image: "ANY", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.AnANY.tokenType };
    }
    if (t.rule.wordType === 'M') {
        var tlc = t.matchedString.toLowerCase();
        var tlcClean = tlc.replace(/ /g, '_');
        //debulog(">" + tlcClean + "<");
        //debulog(Object.keys(T).indexOf("domain"));
        //debulog(">>>" + JSON.stringify(T["domain"]));
        //debulog("> token >>" + JSON.stringify(T[tlcClean]));
        if (!OL[tlcClean]) {
            //debuglog(Object.keys(T).join('\" \"'));
            throw new Error("unknown token of type M with >" + t.matchedString + "<");
        }
        //debuglog(" here we go" + typeof T["domain"]);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: tokens_1.Tokens["domain"].tokenType };
    }
    if (t.rule.wordType === 'O') {
        var tlc = t.matchedString.toLowerCase();
        //var tlcClean = tlc; //  tlc.replace(/ /g,'_');
        var opToken = tokens_1.OperatorLookup[tlc];
        //console.log(' here mapped with _ ' + tlcClean + ' ' + Object.keys(T));
        if (!opToken) {
            debuglog(Object.keys(tokens_1.OperatorLookup).join('\" \"'));
            throw new Error("unknown token of type O with >" + t.matchedString + "< cleansed>" + (tlcClean) + "< not found in " + Object.getOwnPropertyNames(tokens_1.OperatorLookup).join('\n') + " , add to ");
            //process.exit(-1);
        }
        //console.log( ' here image  for O' + t.matchedString + ' ' + T[tlcClean].tokenType);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: opToken.tokenType };
    }
    if (t.rule.wordType === 'I') {
        var tlc = t.matchedString.toLowerCase();
        var opToken = tokens_1.Tokens[tlc];
        if (!opToken) {
            debuglog("unknown token of type I with " + t.matchedString);
            process.exit(-1);
        }
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: opToken.tokenType };
    }
    throw new Error("unknown token " + JSON.stringify(t));
}
exports.makeToken = makeToken;
class XLexer {
    constructor() {
        this.tokenize = function (sentence) {
            debuglog(() => ' sentence prior tokenize:' + JSON.stringify(sentence));
            return sentence.map((t, index) => {
                var u = makeToken(t, index, tokens_1.OperatorLookup);
                debuglog("produced nr   " + index + " > " + JSON.stringify(u));
                return u;
            });
        };
    }
}
;
function getLexer() {
    return new XLexer();
}
exports.getLexer = getLexer;
/* [ AFact, And,
  Describe,
  First, Oldest, Latest, What,
  At, Every, All, At, Least, One,
  The,
  LParen, RParen,


 Meaning, Of, Are,  In, About, You, All,
WhiteSpace, Select, From, Where, Comma, ACategory, All,
  List, Identifier, Integer, GreaterThan, LessThan, To, Relating, With];
*/
var SelectLexer = new Lexer(allTokens);
exports.SelectLexer = SelectLexer;
function parse(tokens, startrule) {
    const parser = new SelectParser.SelectParser(tokens);
    //console.log( ' ' + JSON.stringify( tokens ));
    var res = parser[startrule]();
    if (parser.errors.length > 0) {
        debuglog(() => 'parsing error in  input:' + JSON.stringify(parser.errors, undefined, 2));
        var u = new Error(parser.errors[0]);
        u.error_obj = parser.errors[0];
        throw u;
    }
    return res;
}
exports.parse = parse;
;
function parseSentenceToAsts(s, model, words) {
    var res = er_index_1.ErBase.processString(s, model.rules, words, {} /*model.operators*/);
    debuglog(() => 'res > ' + JSON.stringify(res, undefined, 2));
    var res2 = Object.assign({}, res);
    res2.errors = res2.errors || [];
    res2.asts = res.sentences.map((sentence, index) => {
        res2.errors[index] = false;
        var lexingResult = getLexer().tokenize(sentence);
        debuglog(() => {
            var sStrings = lexingResult.map((t, indext) => `[${indext}] ${t.image} (${t.bearer && t.bearer.matchedString || JSON.stringify(sentence[index][t.startIndex])})`);
            return 'tokens: #' + index + '...\n' + sStrings.join('\n');
        });
        //test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
        try {
            var ast = parse(lexingResult, 'catListOpMore');
            debuglog(() => {
                return 'ast: #' + index + '...\n' + AST.astToText(ast);
            });
            return ast;
        }
        catch (e) {
            debuglog(() => 'error  ' + JSON.stringify(e.error_obj, undefined, 2) + (!e.error_obj ? (e + ' ') + JSON.stringify(e) : ''));
            debuglog(() => ' sentence : ' + er_index_1.Sentence.dumpNice(sentence));
            var e2 = FormatError.formatError(e.error_obj, sentence);
            res2.errors = res2.errors || [];
            debuglog('parse error ' + e.toString());
            res2.errors[index] = {
                err_code: exports.ERR_PARSE_ERROR,
                text: e.toString().split(',\"token\":')[0]
            };
        }
        return undefined;
    });
    return res2;
}
exports.parseSentenceToAsts = parseSentenceToAsts;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZW50ZW5jZXBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUVaLCtGQUErRjtBQUMvRiwwRUFBMEU7QUFFMUUsK0NBQWdHO0FBRWhHLGdDQUFnQztBQUVoQyx5Q0FBeUM7QUFHekMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFekMsNkNBQTZDO0FBQzdDLHlDQUF5QztBQUN6Qyw2QkFBNkI7QUFJM0IsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFHakMscURBQXdEO0FBRXhELElBQUksVUFBVSxHQUFHLFdBQVcsQ0FBQyxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7QUFFbkUsVUFBVSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBRWpDLHFDQUEwRTtBQUMxRSxpRkFBaUY7QUFDakYsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxlQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUVsRCxTQUFnQixTQUFTLENBQUMsQ0FBa0IsRUFBRSxLQUFjLEVBQUUsRUFBUTtJQUNwRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtRQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVEO0lBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7UUFDakQsT0FB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MUIsSUFBSSxFQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RCLENBQUM7U0FDekI7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQWxDRCxrREFrQ0MiLCJmaWxlIjoic2VudGVuY2VwYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcclxuXHJcbi8vIGJhc2VkIG9uOiBodHRwOi8vZW4ud2lraWJvb2tzLm9yZy93aWtpL0FsZ29yaXRobV9pbXBsZW1lbnRhdGlvbi9TdHJpbmdzL0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcbi8vIGFuZDogIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGFtZXJhdSVFMiU4MCU5M0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcblxyXG5pbXBvcnQgeyBFckJhc2UgYXMgRXJCYXNlLCBTZW50ZW5jZSBhcyBTZW50ZW5jZSwgSUZFckJhc2UgYXMgSUZFckJhc2UgfSBmcm9tICcuL21hdGNoL2VyX2luZGV4JztcclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcblxyXG5pbXBvcnQgKiBhcyBTZWxlY3RQYXJzZXIgZnJvbSAnLi9wYXJzZXInO1xyXG5cclxuXHJcbmNvbnN0IGRlYnVnbG9nID0gZGVidWcoJ3NlbnRlbmNlcGFyc2VyJyk7XHJcblxyXG5pbXBvcnQgKiBhcyBGb3JtYXRFcnJvciBmcm9tICcuL2Zvcm1hdGVycm9yJztcclxuaW1wb3J0ICogYXMgY2hldnJvdGFpbiBmcm9tICdjaGV2cm90YWluJztcclxuaW1wb3J0ICogYXMgQVNUIGZyb20gJy4vYXN0JztcclxuXHJcbmltcG9ydCB7IEFTVE5vZGVUeXBlIGFzIE5UfSBmcm9tICcuL2FzdCc7XHJcblxyXG4gIHZhciBjcmVhdGVUb2tlbiA9IGNoZXZyb3RhaW4uY3JlYXRlVG9rZW47XHJcbiAgdmFyIExleGVyID0gY2hldnJvdGFpbi5MZXhlcjtcclxuICB2YXIgUGFyc2VyID0gY2hldnJvdGFpbi5QYXJzZXI7XHJcblxyXG5cclxuaW1wb3J0IHsgSUZNb2RlbCBhcyBJRk1vZGVsfSBmcm9tICcuL21vZGVsL2luZGV4X21vZGVsJztcclxuXHJcbnZhciBXaGl0ZVNwYWNlID0gY3JlYXRlVG9rZW4oe25hbWU6IFwiV2hpdGVTcGFjZVwiLCBwYXR0ZXJuOiAvXFxzKy99KTtcclxuXHJcbldoaXRlU3BhY2UuR1JPVVAgPSBMZXhlci5TS0lQUEVEO1xyXG5cclxuaW1wb3J0IHsgT3BlcmF0b3JMb29rdXAgYXMgT3BlcmF0b3JMb29rdXAsIFRva2VucyBhcyBUIH0gIGZyb20gJy4vdG9rZW5zJztcclxuLy8gd2hpdGVzcGFjZSBpcyBub3JtYWxseSB2ZXJ5IGNvbW1vbiBzbyBpdCBpcyBwbGFjZWQgZmlyc3QgdG8gc3BlZWQgdXAgdGhlIGxleGVyXHJcbnZhciBhbGxUb2tlbnMgPSBPYmplY3Qua2V5cyhUKS5tYXAoa2V5ID0+IFRba2V5XSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZVRva2VuKHQgOiBJRkVyQmFzZS5JV29yZCwgaW5kZXggOiBudW1iZXIsIE9MIDogYW55ICkge1xyXG4gIGlmICghdC5ydWxlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb2tlbiB3aXRob3V0IHJ1bGUgXCIgKyBKU09OLnN0cmluZ2lmeSh0KSk7XHJcbiAgfVxyXG4gIGlmICh0LnJ1bGUud29yZFR5cGUgPT09IElGTW9kZWwuV09SRFRZUEUuQ0FURUdPUlkpIHtcclxuICAgIHJldHVybiB7IGltYWdlIDogXCJDQVRcIiwgIHN0YXJ0T2Zmc2V0IDogaW5kZXgsIGJlYXJlciA6IHQsIHRva2VuVHlwZSA6IE9wZXJhdG9yTG9va3VwLkNBVC50b2tlblR5cGUgfTtcclxuICB9O1xyXG4gIGlmICh0LnJ1bGUud29yZFR5cGUgPT09ICdGJykge1xyXG4gICAgcmV0dXJuIHsgaW1hZ2UgOiBcIkZBQ1RcIiwgIHN0YXJ0T2Zmc2V0IDogaW5kZXgsIGJlYXJlciA6IHQsIHRva2VuVHlwZSA6IFQuRkFDVC50b2tlblR5cGUgfTtcclxuICB9XHJcbiAgaWYgKHQucnVsZS53b3JkVHlwZSA9PT0gJ04nKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCAndG9rZW50eXBlIGlzICcgKyAgVFtcIkludGVnZXJcIl0udG9rZW5UeXBlICArICAnICcgKyBKU09OLnN0cmluZ2lmeSggVFtcIkludGVnZXJcIl0gKSk7XHJcbiAgICAvLyBUT0RPIGkgcGFyc2VzIGFzIGludGVnZXIgLT4gaW50ZWdlclxyXG4gICAgcmV0dXJuIHsgaW1hZ2UgOiBcIk5VTUJFUlwiLCAgc3RhcnRPZmZzZXQgOiBpbmRleCwgYmVhcmVyIDogdCwgdG9rZW5UeXBlIDogVC5JbnRlZ2VyLnRva2VuVHlwZSB9O1xyXG4gIH1cclxuICBpZiAodC5ydWxlLndvcmRUeXBlID09PSAnRCcpIHtcclxuICAgIHJldHVybiB7IGltYWdlIDogXCJET01cIiwgIHN0YXJ0T2Zmc2V0IDogaW5kZXgsIGJlYXJlciA6IHQsIHRva2VuVHlwZSA6IFQuRE9NLnRva2VuVHlwZSB9O1xyXG4gIH1cclxuICBpZiAodC5ydWxlLndvcmRUeXBlID09PSAnQScpIHtcclxuICAgIHJldHVybiB7IGltYWdlIDogXCJBTllcIiwgIHN0YXJ0T2Zmc2V0IDogaW5kZXgsIGJlYXJlciA6IHQsIHRva2VuVHlwZSA6IFQuQW5BTlkudG9rZW5UeXBlIH07XHJcbiAgfVxyXG4gIGlmICh0LnJ1bGUud29yZFR5cGUgPT09ICdNJykge1xyXG4gICAgdmFyIHRsYyA9IHQubWF0Y2hlZFN0cmluZy50b0xvd2VyQ2FzZSgpO1xyXG4gICAgdmFyIHRsY0NsZWFuID0gdGxjLnJlcGxhY2UoLyAvZywnXycpO1xyXG4gICAgLy9kZWJ1bG9nKFwiPlwiICsgdGxjQ2xlYW4gKyBcIjxcIik7XHJcbiAgICAvL2RlYnVsb2coT2JqZWN0LmtleXMoVCkuaW5kZXhPZihcImRvbWFpblwiKSk7XHJcbiAgICAvL2RlYnVsb2coXCI+Pj5cIiArIEpTT04uc3RyaW5naWZ5KFRbXCJkb21haW5cIl0pKTtcclxuICAgIC8vZGVidWxvZyhcIj4gdG9rZW4gPj5cIiArIEpTT04uc3RyaW5naWZ5KFRbdGxjQ2xlYW5dKSk7XHJcbiAgICBpZiAoIU9MW3RsY0NsZWFuXSkge1xyXG4gICAgICAvL2RlYnVnbG9nKE9iamVjdC5rZXlzKFQpLmpvaW4oJ1xcXCIgXFxcIicpKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biB0b2tlbiBvZiB0eXBlIE0gd2l0aCA+XCIgKyB0Lm1hdGNoZWRTdHJpbmcrIFwiPFwiKTtcclxuICAgIH1cclxuICAgIC8vZGVidWdsb2coXCIgaGVyZSB3ZSBnb1wiICsgdHlwZW9mIFRbXCJkb21haW5cIl0pO1xyXG4gICAgcmV0dXJuIHsgaW1hZ2UgOiB0Lm1hdGNoZWRTdHJpbmcsIGJlYXJlciA6IHQsIHN0YXJ0T2Zmc2V0IDogaW5kZXgsIHRva2VuVHlwZSA6IFRbXCJkb21haW5cIl0udG9rZW5UeXBlIH07XHJcbiAgfVxyXG4gIGlmICh0LnJ1bGUud29yZFR5cGUgPT09ICdPJykge1xyXG4gICAgdmFyIHRsYyA9IHQubWF0Y2hlZFN0cmluZy50b0xvd2VyQ2FzZSgpO1xyXG4gICAgLy92YXIgdGxjQ2xlYW4gPSB0bGM7IC8vICB0bGMucmVwbGFjZSgvIC9nLCdfJyk7XHJcbiAgICB2YXIgb3BUb2tlbiA9IE9wZXJhdG9yTG9va3VwW3RsY107XHJcbiAgICAvL2NvbnNvbGUubG9nKCcgaGVyZSBtYXBwZWQgd2l0aCBfICcgKyB0bGNDbGVhbiArICcgJyArIE9iamVjdC5rZXlzKFQpKTtcclxuICAgIGlmICghb3BUb2tlbikge1xyXG4gICAgICBkZWJ1Z2xvZyhPYmplY3Qua2V5cyhPcGVyYXRvckxvb2t1cCkuam9pbignXFxcIiBcXFwiJykpO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHRva2VuIG9mIHR5cGUgTyB3aXRoID5cIiArIHQubWF0Y2hlZFN0cmluZyArIFwiPCBjbGVhbnNlZD5cIiArICh0bGNDbGVhbikgKyBcIjwgbm90IGZvdW5kIGluIFwiICsgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT3BlcmF0b3JMb29rdXApLmpvaW4oJ1xcbicpICtcIiAsIGFkZCB0byBcIik7XHJcbiAgICAgIC8vcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgIH1cclxuICAgIC8vY29uc29sZS5sb2coICcgaGVyZSBpbWFnZSAgZm9yIE8nICsgdC5tYXRjaGVkU3RyaW5nICsgJyAnICsgVFt0bGNDbGVhbl0udG9rZW5UeXBlKTtcclxuICAgIHJldHVybiB7IGltYWdlIDogdC5tYXRjaGVkU3RyaW5nLCBiZWFyZXIgOiB0LCBzdGFydE9mZnNldCA6IGluZGV4LCB0b2tlblR5cGUgOiBvcFRva2VuLnRva2VuVHlwZSB9O1xyXG4gIH1cclxuICBpZiAodC5ydWxlLndvcmRUeXBlID09PSAnSScpIHtcclxuICAgIHZhciB0bGMgPSB0Lm1hdGNoZWRTdHJpbmcudG9Mb3dlckNhc2UoKTtcclxuICAgIHZhciBvcFRva2VuID0gVFt0bGNdO1xyXG4gICAgaWYgKCFvcFRva2VuKSB7XHJcbiAgICAgIGRlYnVnbG9nKFwidW5rbm93biB0b2tlbiBvZiB0eXBlIEkgd2l0aCBcIiArIHQubWF0Y2hlZFN0cmluZyk7XHJcbiAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyBpbWFnZSA6IHQubWF0Y2hlZFN0cmluZywgYmVhcmVyIDogdCwgc3RhcnRPZmZzZXQgOiBpbmRleCwgdG9rZW5UeXBlIDogb3BUb2tlbi50b2tlblR5cGUgfTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biB0b2tlbiBcIiArIEpTT04uc3RyaW5naWZ5KHQpKTtcclxufVxyXG5cclxuY2xhc3MgWExleGVyIHtcclxuICAgdG9rZW5pemUgPSBmdW5jdGlvbihzZW50ZW5jZSA6IElGRXJCYXNlLklTZW50ZW5jZSkgOiBhbnlbXSAge1xyXG4gICAgZGVidWdsb2coICgpPT4gJyBzZW50ZW5jZSBwcmlvciB0b2tlbml6ZTonICsgSlNPTi5zdHJpbmdpZnkoc2VudGVuY2UpKTtcclxuICAgIHJldHVybiBzZW50ZW5jZS5tYXAoICh0LGluZGV4KSA9PiB7XHJcbiAgICAgICAgIHZhciB1ID0gIG1ha2VUb2tlbih0LCBpbmRleCwgT3BlcmF0b3JMb29rdXApO1xyXG4gICAgICAgIGRlYnVnbG9nKFwicHJvZHVjZWQgbnIgICBcIiArIGluZGV4ICsgXCIgPiBcIiArIEpTT04uc3RyaW5naWZ5KHUpKTtcclxuICAgICAgICByZXR1cm4gdTtcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMZXhlcigpICA6IGFueSB7XHJcbiAgcmV0dXJuIG5ldyBYTGV4ZXIoKTtcclxufVxyXG5cclxuICAvKiBbIEFGYWN0LCBBbmQsXHJcbiAgICBEZXNjcmliZSxcclxuICAgIEZpcnN0LCBPbGRlc3QsIExhdGVzdCwgV2hhdCxcclxuICAgIEF0LCBFdmVyeSwgQWxsLCBBdCwgTGVhc3QsIE9uZSxcclxuICAgIFRoZSxcclxuICAgIExQYXJlbiwgUlBhcmVuLFxyXG5cclxuXHJcbiAgIE1lYW5pbmcsIE9mLCBBcmUsICBJbiwgQWJvdXQsIFlvdSwgQWxsLFxyXG4gIFdoaXRlU3BhY2UsIFNlbGVjdCwgRnJvbSwgV2hlcmUsIENvbW1hLCBBQ2F0ZWdvcnksIEFsbCxcclxuICAgIExpc3QsIElkZW50aWZpZXIsIEludGVnZXIsIEdyZWF0ZXJUaGFuLCBMZXNzVGhhbiwgVG8sIFJlbGF0aW5nLCBXaXRoXTtcclxuKi9cclxuICAgIHZhciBTZWxlY3RMZXhlciA9IG5ldyBMZXhlcihhbGxUb2tlbnMpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHBhcnNlKHRva2VucyA6IGFueVtdLCBzdGFydHJ1bGUgOiBzdHJpbmcpIHtcclxuICBjb25zdCBwYXJzZXIgPSBuZXcgU2VsZWN0UGFyc2VyLlNlbGVjdFBhcnNlcih0b2tlbnMpO1xyXG4gIC8vY29uc29sZS5sb2coICcgJyArIEpTT04uc3RyaW5naWZ5KCB0b2tlbnMgKSk7XHJcbiAgdmFyIHJlcyA9IHBhcnNlcltzdGFydHJ1bGVdKCk7XHJcbiAgIGlmIChwYXJzZXIuZXJyb3JzLmxlbmd0aCA+IDApIHtcclxuICAgIGRlYnVnbG9nKCgpID0+ICdwYXJzaW5nIGVycm9yIGluICBpbnB1dDonICsgSlNPTi5zdHJpbmdpZnkocGFyc2VyLmVycm9ycyx1bmRlZmluZWQsMikpO1xyXG4gICAgdmFyIHUgPSBuZXcgRXJyb3IocGFyc2VyLmVycm9yc1swXSk7XHJcbiAgICAodSBhcyBhbnkpLmVycm9yX29iaiA9IHBhcnNlci5lcnJvcnNbMF07XHJcbiAgICB0aHJvdyB1O1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQYXJzZWRTZW50ZW5jZXMgIGV4dGVuZHMgSUZNb2RlbC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICBhc3RzIDogQVNULkFTVE5vZGVbXSxcclxuICBkb21haW5zPyA6IHN0cmluZ1tdXHJcbn07XHJcblxyXG5leHBvcnQgZGVjbGFyZSBjb25zdCBFUlJfUEFSU0VfRVJST1IgPSBcIlBBUlNFX0VSUk9SXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZW50ZW5jZVRvQXN0cyhzIDogc3RyaW5nLCBtb2RlbCA6IElGTW9kZWwuSU1vZGVscywgd29yZHMgOiBhbnkpIDogSVBhcnNlZFNlbnRlbmNlcyB7XHJcbiAgdmFyIHJlcyA9IEVyQmFzZS5wcm9jZXNzU3RyaW5nKHMsIG1vZGVsLnJ1bGVzLCB3b3Jkcywge30gLyptb2RlbC5vcGVyYXRvcnMqLyApO1xyXG4gIGRlYnVnbG9nKCgpID0+J3JlcyA+ICcgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpO1xyXG4gIHZhciByZXMyID0gT2JqZWN0LmFzc2lnbih7fSwgcmVzIGFzIGFueSkgYXMgSVBhcnNlZFNlbnRlbmNlcztcclxuICByZXMyLmVycm9ycyA9IHJlczIuZXJyb3JzIHx8IFtdO1xyXG4gIHJlczIuYXN0cyA9IHJlcy5zZW50ZW5jZXMubWFwKChzZW50ZW5jZSwgaW5kZXgpID0+IHtcclxuICAgIHJlczIuZXJyb3JzW2luZGV4XSA9IGZhbHNlO1xyXG4gICAgdmFyIGxleGluZ1Jlc3VsdCA9IGdldExleGVyKCkudG9rZW5pemUoc2VudGVuY2UpO1xyXG4gICAgZGVidWdsb2coICgpID0+IHtcclxuICAgICAgdmFyIHNTdHJpbmdzID0gbGV4aW5nUmVzdWx0Lm1hcCgodCwgaW5kZXh0KSA9PiAgYFske2luZGV4dH1dICR7dC5pbWFnZX0gKCR7dC5iZWFyZXIgJiYgdC5iZWFyZXIubWF0Y2hlZFN0cmluZyB8fCBKU09OLnN0cmluZ2lmeShzZW50ZW5jZVtpbmRleF1bdC5zdGFydEluZGV4XSl9KWAgKTtcclxuICAgICAgcmV0dXJuICd0b2tlbnM6ICMnICsgaW5kZXggKyAnLi4uXFxuJyArIHNTdHJpbmdzLmpvaW4oJ1xcbicpO1xyXG4gICAgfSk7XHJcbiAgICAvL3Rlc3QuZGVlcEVxdWFsKHNTdHJpbmdzLCBbJ0NBVCcsICdDQVQnLCAnQ0FUJywgJ0NBVCcsICd3aXRoJywgJ0NBVCcsICdGQUNUJywgJ0NBVCcsICdGQUNUJywgJ0ZBQ1QnIF0pO1xyXG4gICAgdHJ5IHtcclxuICAgICAgdmFyIGFzdCA9IHBhcnNlKGxleGluZ1Jlc3VsdCwgJ2NhdExpc3RPcE1vcmUnKTtcclxuICAgICAgZGVidWdsb2coKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiAnYXN0OiAjJyArIGluZGV4ICsgJy4uLlxcbicgKyBBU1QuYXN0VG9UZXh0KGFzdCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gYXN0O1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBkZWJ1Z2xvZygoKT0+ICdlcnJvciAgJyArIEpTT04uc3RyaW5naWZ5KGUuZXJyb3Jfb2JqLHVuZGVmaW5lZCwyKSArICghZS5lcnJvcl9vYmo/IChlICsgJyAnKSArIEpTT04uc3RyaW5naWZ5KGUpOiAnJykpO1xyXG4gICAgICBkZWJ1Z2xvZygoKT0+ICcgc2VudGVuY2UgOiAnICsgU2VudGVuY2UuZHVtcE5pY2Uoc2VudGVuY2UpKTtcclxuICAgICAgdmFyIGUyID0gRm9ybWF0RXJyb3IuZm9ybWF0RXJyb3IoZS5lcnJvcl9vYmosc2VudGVuY2UpO1xyXG4gICAgICByZXMyLmVycm9ycyA9IHJlczIuZXJyb3JzIHx8IFtdO1xyXG4gICAgICBkZWJ1Z2xvZygncGFyc2UgZXJyb3IgJyArIGUudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgICByZXMyLmVycm9yc1tpbmRleF0gPSB7XHJcbiAgICAgICAgZXJyX2NvZGUgOiBFUlJfUEFSU0VfRVJST1IsXHJcbiAgICAgICAgdGV4dCA6IGUudG9TdHJpbmcoKS5zcGxpdCgnLFxcXCJ0b2tlblxcXCI6JylbMF1cclxuICAgICAgfSAgYXMgSUZFckJhc2UuSUVSRXJyb3I7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH0pO1xyXG4gIHJldHVybiByZXMyO1xyXG59XHJcbi8vXHJcbmV4cG9ydCB7XHJcbiAgIFNlbGVjdExleGVyLFxyXG4gICBwYXJzZVxyXG59O1xyXG4iXX0=
