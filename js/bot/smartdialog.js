"use strict";
/**
 * The bot implementation
 *
 * Instantiate apssing a connector via
 * makeBot
 *
 *
 */
/**
 * @file
 * @module jfseb.mgnlq_abot.smartdialog
 * @copyright (c) 2016-2109 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleUpDownRecognizer = exports.metawordsDescriptions = exports.aResponsesOnTooLong = exports.restrictData = void 0;
const fs = require("fs");
const builder = require("botbuilder");
const debug = require("debug");
const WhatIs = require("../match/whatis");
const ListAll = require("../match/listall");
const Describe = require("../match/describe");
const MakeTable = require("../exec/makeqbetable");
const MongoQueries = require("../match/mongoqueries");
const Utils = require("abot_utils");
const DialogLogger = require("../utils/dialoglogger");
const process = require("process");
var dburl = process.env.DATABASE_URL || "";
var pglocalurl = "postgres://joe:abcdef@localhost:5432/abot";
var dburl = process.env.DATABASE_URL || pglocalurl;
const pg = require("pg");
var o = pg;
if (!(process.env.ABOT_DBNOSSL)) {
    o.defaults.ssl = true; // Only used internally !
}
var dialogLogger = DialogLogger.logger("smartbot", dburl, pg);
function send(o) { return o; }
;
function dialoglog(intent, session, response) {
    var sResponse;
    var sAction;
    if (typeof response === "string") {
        sAction = "";
        sResponse = response;
    }
    else {
        var aMessage = response;
        var iMessage = aMessage.toMessage();
        sResponse = iMessage.text;
        sAction = (iMessage.entities && iMessage.entities[0]) ? (JSON.stringify(iMessage.entities && iMessage.entities[0])) : "";
    }
    dialogLogger({
        intent: intent,
        session: session,
        response: sResponse,
        action: sAction
    });
    session.send(response);
}
var elizabot = require('../extern/elizabot/elizabot.js');
//import * as elizabot from 'elizabot';
let debuglog = debug('smartdialog');
const PlainRecognizer = require("./plainrecognizer");
//var builder = require('botbuilder');
function getConversationId(session) {
    return session.message &&
        session.message.address &&
        session.message.address.conversation.id;
}
var elizabots = {};
function getElizaBot(id) {
    if (!elizabots[id]) {
        elizabots[id] = {
            access: new Date(),
            elizabot: new elizabot()
        };
    }
    elizabots[id].access = new Date();
    return elizabots[id].elizabot;
}
//import * as Tools from '../match/tools';
var newFlow = true;
const index_model_1 = require("../model/index_model");
//var models = {};
function isAnonymous(userid) {
    return userid.indexOf("ano:") === 0;
}
function restrictData(arr) {
    if (arr.length < 6) {
        return arr;
    }
    var len = arr.length;
    var res = arr.slice(0, Math.min(Math.max(Math.floor(arr.length / 3), 7), arr.length));
    if (typeof arr[0] === "string") {
        var delta = len - res.length;
        res.push("... and " + delta + " more entries for registered users");
    }
    return res;
}
exports.restrictData = restrictData;
function restrictLoggedOn(session, arr) {
    var userid = session.message.address
        && session.message.address.user
        && session.message.address.user.id || "";
    if (process.env.ABOT_EMAIL_USER && isAnonymous(userid)) {
        return restrictData(arr);
    }
    return arr;
}
const aTrainReplies = ["Thank you for sharing this suggestion with us",
    "Thank for for this valuable information.",
    "Thank for for this interesting fact!",
    "Thats a plethoria of information.",
    "That's a nugget of information.",
    "Lovely, I may consider you input.",
    "Well done, anything more to let me know?",
    "I do appreciate your teaching and my learning experience, or was it the other way round?",
    "Your helpful input has been stored in some dusty corner of the World wide web!",
    "Thank you for my learning experience!",
    "I have incorporated your valuable suggestion in the wisdom of the internet"
];
var aTrainDialog = aTrainReplies;
var aTrainExitHint = [
    "\ntype \"done\" when you are done training me.",
    "",
    "",
    "",
    "\nremember, you are stuck here instructing me, type \"done\" to return.",
    ""
];
const aEnterTrain = ['So you think this is wrong? You can offer your advise here.\n Type "done" if you are done with instructing me',
    'Feel free to offer me your better solution here.\nType "done" if you are done with instructing me',
    'Some say "The secret to happiness is to lower your expectations to the point they are already met.", \nt if you could help me to become better, instruct me.\n Type "done" if you are done with teaching me',
    'Feel free to offer me your better solution here.\n Type "done" if you are done with instructing me',
    'Feel free to offer me your better solution here.\n Type "done" if you are done with instructing me',
];
const aBackFromTraining = [
    'Puuh, back from training! Now for the easy part ...\n ask me a new question.',
    'Live and don\'t learn, that\'s us. Naah, we\'ll see.\nAsk me another question.',
    'The secret to happiness is to lower your expectations to the point they are already met.\n Ask me a question.',
    'Thanks for having this lecture session, now i am back to our usual self.\n Ask me a question.'
];
const aTrainNoKlingon = [
    "He who masters the dark arts of SAP must not dwell in the earthly realms of Star Trek.",
    "SAP is a cloud company, not a space company.",
    "The depth of R/3 are deeper than Deep Space 42.",
    "My brainpower is fully absorbed with mastering other realms.",
    "For the wosap, the sky is the limit. Feel free to check out nasa.gov .",
    "The future is SAP or IBM blue, not space black.",
    "That's left to some murky future."
];
exports.aResponsesOnTooLong = [
    "Your input should be eloquent in it's brevity. This one was too long.",
    "my wisdom is severly bound by my limited input processing capabilities. Could you formulate a shorter input? Thank you.",
    "The length of you input indicates you probably know more about the topic than me? Can i humbly ask you to formulate a shorter question?",
    '\"What ever you want to teach, be brief\" (Horace). While this does not always applies to my answers, it is require for your questions. Please try again with a refined questions.',
    'I understand more than 4-letter words, but not more than 20 word sentences. Please try to shorten your input.',
    'the sky is the limit? Air force member or not, you can ask longer questions than \"the sky\", but not this long',
    'My answers may be exhaustive, but I understand more than 4-letter words, but not more than 20 word sentences. Sorry.',
    'Our conversation must be highly assymmetric: my answers may be verbose and exhaustive and fuzzy, questions and input must be brief. Try to reformulate it',
];
exports.metawordsDescriptions = {
    "category": "an attribute of a record in a model, example: a Planet has a \"name\" attribute",
    "domain": "a group of facts which are typically unrelated",
    "key": "an attribute value (of a category) which  is unique for the record",
    "tool": "is potentialy command to execute",
    "record": "a specific set of \"fact\"s of a domain, a \"record\" has a set of attributes values (\"fact\"s) of the categories, often a record has a \"key\"",
    "fact": "a specific category value of a record in a domain, may be a \"key\" value",
};
function getRandomResult(arr) {
    return arr[Math.floor(Math.random() * arr.length) % arr.length];
}
class SimpleUpDownRecognizer {
    constructor() {
    }
    recognize(context, callback) {
        var u = {};
        debuglog("recognizing " + context.message.text);
        if (context.message.text.indexOf("down") >= 0) {
            u.intent = "intent.down";
            u.score = 0.9;
            var e1 = {};
            e1.startIndex = "start ".length;
            e1.endIndex = context.message.text.length;
            e1.score = 0.3;
            u.entities = [e1];
            callback(undefined, u);
            return;
        }
        if (context.message.text.indexOf("up") >= 0) {
            u.intent = "intent.up";
            u.score = 0.9;
            var e1 = {};
            e1.startIndex = "up".length;
            e1.endIndex = context.message.text.length;
            e1.score = 0.3;
            u.entities = [e1];
            callback(undefined, u);
            return;
        }
        if (context.message.text.indexOf("done") >= 0) {
            u.intent = "intent.up";
            u.score = 0.9;
            var e1 = {};
            e1.startIndex = "up".length;
            e1.endIndex = context.message.text.length;
            e1.score = 0.3;
            u.entities = [e1];
            callback(undefined, u);
            return;
        }
        if (context.message.text.indexOf("exit") >= 0) {
            u.intent = "intent.up";
            u.score = 0.9;
            var e1 = {};
            e1.startIndex = "up".length;
            e1.endIndex = context.message.text.length;
            e1.score = 0.3;
            u.entities = [e1];
            callback(undefined, u);
            return;
        }
        if (context.message.text.indexOf("quit") >= 0) {
            u.intent = "intent.up";
            u.score = 0.9;
            var e1 = {};
            e1.startIndex = "up".length;
            e1.endIndex = context.message.text.length;
            e1.score = 0.3;
            u.entities = [e1];
            callback(undefined, u);
            return;
        }
        debuglog('recognizing nothing');
        u.intent = "None";
        u.score = 0.1;
        var e1 = {};
        e1.startIndex = "exit ".length;
        e1.endIndex = context.message.text.length;
        e1.score = 0.1;
        u.entities = [];
        callback(undefined, u);
    }
}
exports.SimpleUpDownRecognizer = SimpleUpDownRecognizer;
const AnyObject = Object;
var bot;
var oJSON = JSON.parse('' + fs.readFileSync('./resources/model/intents.json'));
var oRules = PlainRecognizer.parseRules(oJSON);
// var Recognizer = new (recognizer.RegExpRecognizer)(oRules);
function logQuery(session, intent, result) {
    fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
        text: session.message.text,
        timestamp: session.message.timestamp,
        intent: intent,
        res: result && result.length && JSON.stringify(result[0]) || "0",
        conversationId: session.message.address
            && session.message.address.conversation
            && session.message.address.conversation.id || "",
        userid: session.message.address
            && session.message.address.user
            && session.message.address.user.id || ""
    }), function (err) {
        if (err) {
            debuglog("logging failed " + err);
        }
    });
}
function logQueryWhatIsTupel(session, intent, result) {
    fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
        text: session.message.text,
        timestamp: session.message.timestamp,
        intent: intent,
        res: result && result.length && WhatIs.dumpNiceTupel(result[0]) || "0",
        conversationId: session.message.address
            && session.message.address.conversation
            && session.message.address.conversation.id || "",
        userid: session.message.address
            && session.message.address.user
            && session.message.address.user.id || ""
    }), function (err) {
        if (err) {
            debuglog("logging failed " + err);
        }
    });
}
var gwords = {};
/**
 * Construct a bot
 * @param connector {Connector} the connector to use
 * HTMLConnector
 * or connector = new builder.ConsoleConnector().listen()
 */
function makeBot(connector, modelProvider, options) {
    var t0 = Date.now();
    var theModelP = modelProvider();
    theModelP.then((theModel) => {
        var t = Date.now() - t0;
        if (options && options.showModelLoadTime) {
            console.log(`model load time ${(t)}`);
        }
    });
    function getTheModel() {
        return theModelP;
    }
    bot = new builder.UniversalBot(connector);
    var recognizer = new PlainRecognizer.RegExpRecognizer(oRules);
    var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
    var dialogUpDown = new builder.IntentDialog({ recognizers: [new SimpleUpDownRecognizer()] });
    bot.dialog('/updown', dialogUpDown);
    dialogUpDown.onBegin(function (session) {
        dialoglog("TrainMe", session, send(getRandomResult(aEnterTrain)));
        //session.send("Hi there, updown is waiting for you");
    });
    dialogUpDown.matches('intent.up', [
        function (session, args, next) {
            session.dialogData.abc = args || {};
            builder.Prompts.text(session, 'you want to exit training? type \"done\" again.');
        },
        function (session, results, next) {
            session.dialogData.abc = results.reponse;
            next();
        },
        function (session, results) {
            session.endDialogWithResult({ response: session.dialogData.abc });
        }
    ]);
    dialogUpDown.matches('intent.down', [
        function (session, args, next) {
            session.dialogData.abc = args || {};
            builder.Prompts.text(session, 'you want to go down!');
        },
        function (session, results, next) {
            session.dialogData.abc = -1; // results.reponse;
            next();
        },
        function (session, results) {
            session.send("still going down?");
        }
    ]);
    dialogUpDown.onDefault(function (session) {
        logQuery(session, "onDefault");
        var res = getRandomResult(aTrainDialog) + getRandomResult(aTrainExitHint);
        dialoglog("TrainMe", session, send(res));
    });
    /*
      bot.dialog('/train', [
        function (session, args, next) {
          session.dialgoData.abc = args || {};
          builder.Prompts.text(session, 'Do you want to train me');
        },
        function (session, results, next) {
          session.dialogData.abc = results.reponse;
        },
        function (session, results) {
          session.endDialogWithResult({ response: session.DialogData.abc });
        }
      ]);
    */
    bot.dialog('/', dialog);
    dialog.matches('ShowMe', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // ShowMe is a special form of WhatIs which also selects the
            // "closest _url" ranked by _preferredUrlOrder
            // if present, the _url is put into exec.action
            //
            /// TODO REMODEL
            // expecting entity A1
            debuglog("Show Entity");
            debuglog('raw: ' + JSON.stringify(args.entities), undefined, 2);
            var a1 = builder.EntityRecognizer.findEntity(args.entities, 'A1');
            getTheModel().then((theModel) => {
                ListAll.listAllShowMe(a1.entity, theModel).then(resultShowMe => {
                    logQuery(session, 'ShowMe', resultShowMe.bestURI);
                    // test.expect(3)
                    //  test.deepEqual(result.weight, 120, 'correct weight');
                    if (!resultShowMe || !resultShowMe.bestURI) {
                        dialoglog("ShowMe", session, send("I did not get what you want"));
                        return;
                    }
                    var bestURI = resultShowMe.bestURI;
                    // debuglog('result : ' + JSON.stringify(result, undefined, 2));
                    debuglog('best result : ' + JSON.stringify(resultShowMe || {}, undefined, 2));
                    // text : "starting unit test \"" + unittest + "\""+  (url?  (' with url ' + url ) : 'no url :-(' ),
                    //      action : { url: url }
                    var reply = new builder.Message(session)
                        .text("starting uri " + bestURI)
                        .addEntity({ url: bestURI }); // exec.action);
                    // .addAttachment({ fallbackText: "I don't know", contentType: 'image/jpeg', contentUrl: "www.wombat.org" });
                    dialoglog("ShowMe", session, send(reply));
                });
            });
        },
    ]);
    dialog.matches('WhatIs', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            var message = session.message.text;
            // TODO SWITH TO MONGOQUERIES
            getTheModel().then((theModel) => {
                debuglog("WhatIs Entities");
                debuglog(debuglog.enabled ? ('raw: ' + JSON.stringify(args.entities, undefined, 2)) : '-');
                var categoryEntity = builder.EntityRecognizer.findEntity(args.entities, 'category');
                var categoriesjoined = categoryEntity.entity;
                var inSth = builder.EntityRecognizer.findEntity(args.entities, 'A1');
                var cats = [];
                try {
                    cats = WhatIs.analyzeCategoryMultOnlyAndComma(categoriesjoined, theModel.rules, message);
                    debuglog("here cats: " + cats.join(","));
                }
                catch (e) {
                    if (e) {
                        debuglog("here exception" + e);
                        // currently we do not extract categories correctly , thus we rather ignore and go on
                        //just go on   dialoglog("WhatIs", session, send('I don\'t know anything about "' + categoriesjoined +
                        //     (e ? '(' + e.toString() + ')' : "")));
                        //   // next();
                        //   return;
                    }
                }
                //console.log(JSON.stringify(theModel.rules.wordMap['co-fio']));
                var query = categoriesjoined;
                var inSomething = inSth && inSth.entity || "";
                if (inSth) {
                    query = categoriesjoined + ' with ' + inSth.entity;
                }
                MongoQueries.listAll(query, theModel).then(resultWI => {
                    debuglog(() => 'got result' + JSON.stringify(resultWI));
                    var err_explain = ListAll.returnErrorTextIfOnlyError(resultWI);
                    if (err_explain) {
                        //dialoglog("ListAll", session, send('I don\'t know anything about "' + cat + " (" + category + ')\" in relation to "' + a1.entity + `".${explain}`));
                        // next();
                        dialoglog("ListAll", session, send('I don\'t know anything about "' + categoriesjoined + "\" (" + Utils.listToQuotedCommaAnd(cats) + ') in relation to "' + inSth.entity + `".${err_explain}`));
                        return;
                        //  dialoglog("ListAll", session, send(err_text));
                        //  return;
                    }
                    var joinresults = restrictLoggedOn(session, ListAll.joinResultsTupel(resultWI));
                    logQueryWhatIsTupel(session, 'ListAll', resultWI);
                    debuglog(debuglog ? ('listall result2 >:' + JSON.stringify(resultWI)) : '-');
                    // debuglog('result : ' + JSON.stringify(result, undefined, 2));
                    debuglog(debuglog.enabled ? ('best result : ' + JSON.stringify(resultWI[0].results[0] || {}, undefined, 2)) : '-');
                    // debuglog(debuglog.enabled? ('top : ' + WhatIs.dumpWeightsTop(result1.tupelanswers[0].result[0] || {}, { top: 3 })): '-');
                    // TODO cleansed sentence
                    //dialoglog("WhatIs", session, send('The ' + categoriesjoined + ' of ' + inSth.entity + ' is ' +
                    //resultWI.tupelanswers[0].result + "\n"));
                    debuglog(debuglog ? ('listall result >:' + JSON.stringify(resultWI)) : '-');
                    // TODO Why only FIRST!???
                    var joinresults = restrictLoggedOn(session, ListAll.joinResultsTupel([resultWI[0]]));
                    logQueryWhatIsTupel(session, 'ListAll', resultWI);
                    debuglog(debuglog ? ('listall result2 >:' + JSON.stringify(resultWI)) : '-');
                    if (joinresults.length) {
                        var suffix = inSomething ? ' of ' + inSomething : '';
                        if (cats.length === 1) {
                            dialoglog("WhatIs", session, send('The ' + categoriesjoined + suffix + ' is ' +
                                joinresults + "\n"));
                        }
                        else {
                            dialoglog("WhatIs", session, send("The " + categoriesjoined + suffix + " are ...\n" + joinresults.join(";\n")));
                        }
                    }
                    else {
                        var errprefix = ListAll.returnErrorTextIfOnlyError(resultWI) || '';
                        var suffix2 = inSomething ? ' for ' + inSomething : '';
                        dialoglog("ListAll", session, send("i did not find any " + categoriesjoined + suffix2 + ".\n" + joinresults.join(";\n") + "" + errprefix));
                    }
                    return;
                });
                return;
            });
        }
    ]);
    dialog.matches('ListAll', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            var message = session.message.text;
            debuglog("Intent : ListAll");
            debuglog(debuglog.enabled ? ('raw: ' + JSON.stringify(args.entities, undefined, 2)) : '-');
            var categoryEntity = builder.EntityRecognizer.findEntity(args.entities, 'categories');
            var category = categoryEntity.entity;
            var inSthEntity = builder.EntityRecognizer.findEntity(args.entities, 'insth');
            var inSomething = inSthEntity && inSthEntity.entity;
            // some metaqueries:
            getTheModel().then((theModel) => {
                if (category === "categories") {
                    // do we have a filter ?
                    var domain = undefined;
                    if (inSomething) {
                        domain = ListAll.inferDomain(theModel, inSomething);
                    }
                    if (!domain) {
                        var res = restrictLoggedOn(session, theModel.category).join(";\n");
                        if (inSomething) {
                            dialoglog("ListAll", session, send("I did not infer a domain restriction from \"" + Utils.stripQuotes(inSomething) + "\", all my categories are ...\n" + res));
                        }
                        else {
                            dialoglog("ListAll", session, send("my categories are ...\n" + res));
                        }
                        return;
                    }
                    else {
                        var aRes = index_model_1.Model.getCategoriesForDomain(theModel, domain);
                        var res = restrictLoggedOn(session, aRes).join(";\n");
                        dialoglog("ListAll", session, send("my categories in domain \"" + domain + "\" are ...\n" + res));
                        return;
                    }
                }
                if (category === "domains") {
                    var res = restrictLoggedOn(session, theModel.domains).join(";\n");
                    dialoglog("ListAll", session, send("my domains are ...\n" + res));
                    return;
                }
                //console.log(JSON.stringify(theModel.rules.wordMap['co-fio']));
                var query = category;
                var categoriesjoined = category;
                if (inSomething) {
                    query = category + ' with ' + inSomething;
                }
                MongoQueries.listAll(query, theModel).then(result1 => {
                    var cats = [];
                    try {
                        debuglog('analyzing category from ' + category);
                        cats = WhatIs.analyzeCategoryMultOnlyAndComma(category, theModel.rules, message);
                        debuglog("here cats: " + cats.join(","));
                    }
                    catch (e) {
                        if (e) {
                            debuglog("here exception: " + e);
                            // Go on for now
                            //
                            //  dialoglog("WhatIs", session, send('I don\'t know anything about "' + category +
                            //    (e ? '(' + e.toString() + ')' : "")));
                            //  // next();
                            //  return;
                        }
                    }
                    //var result1 = ListAll.listAllWithContext(cat, inSomething,
                    //  theModel.rules, theModel.records, categorySet);
                    debuglog(debuglog ? ('listall result >:' + JSON.stringify(result1)) : '-');
                    var err_explain = ListAll.returnErrorTextIfOnlyError(result1);
                    if (err_explain) {
                        //dialoglog("ListAll", session, send('I don\'t know anything about "' + cat + " (" + category + ')\" in relation to "' + a1.entity + `".${explain}`));
                        // next();
                        var suffix = inSomething ? 'in relation to "' + inSomething + '"' : '';
                        dialoglog("ListAll", session, send('I don\'t know anything about "' + categoriesjoined + "\" (" + Utils.listToQuotedCommaAnd(cats) + ')' + suffix + `.${err_explain}`));
                        return;
                        //  dialoglog("ListAll", session, send(err_text));
                        //  return;
                    }
                    var joinresults = restrictLoggedOn(session, ListAll.joinResultsTupel(result1));
                    logQueryWhatIsTupel(session, 'ListAll', result1);
                    debuglog(() => ('listall result2 >:' + JSON.stringify(result1)));
                    var suffix = (inSomething) ? " for " + inSomething : "";
                    if (joinresults.length) {
                        dialoglog("ListAll", session, send("the " + category + suffix + " are ...\n" + joinresults.join(";\n")));
                    }
                    else {
                        var errprefix = "";
                        var errprefix = ListAll.returnErrorTextIfOnlyError(result1) || '';
                        dialoglog("ListAll", session, send("I did not find any " + category + suffix + ".\n" + joinresults.join(";\n") + "" + errprefix));
                    }
                    return;
                });
                return;
            });
        }
    ]);
    dialog.matches('buildtable', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            getTheModel().then((theModel) => {
                var message = session.message.text;
                debuglog("Intent : buildtable");
                debuglog('raw: ' + JSON.stringify(args.entities), undefined, 2);
                var categories = builder.EntityRecognizer.findEntity(args.entities, 'categories').entity;
                debuglog("factOrCat is" + categories);
                var cats;
                try {
                    cats = WhatIs.analyzeCategoryMultOnlyAndComma(categories, theModel.rules, message);
                    debuglog("here cats" + cats.join(","));
                }
                catch (e) {
                    if (e) {
                        debuglog("here exception" + e);
                        dialoglog("WhatIs", session, send('I don\'t know anything about "' + categories + '"(' + e.toString() + ')'));
                        // next();
                        return;
                    }
                }
                if (!cats || (cats.length === 0)) {
                    dialoglog("ListAll", session, send('I did not find a category in "' + categories + '"'));
                    // next();
                    return;
                }
                var exec = MakeTable.makeTable(cats, theModel);
                //      const exec = ExecServer.execTool(session.dialogData.result as IMatch.IToolMatch, theModel.records);
                var reply = new builder.Message(session)
                    .text(exec.text)
                    .addEntity(exec.action);
                // .addAttachment({ fallbackText: "I don't know", contentType: 'image/jpeg', contentUrl: "www.wombat.org" });
                dialoglog("ShowMe", session, send(reply));
            });
        }
    ]);
    dialog.matches('Describe', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            getTheModel().then((theModel) => {
                var message = session.message.text;
                debuglog("Intent : Describe");
                debuglog('raw: ' + JSON.stringify(args.entities), undefined, 2);
                var factEntity = builder.EntityRecognizer.findEntity(args.entities, 'A1');
                var factOrCat = factEntity && factEntity.entity;
                var domainEntity = builder.EntityRecognizer.findEntity(args.entities, 'D');
                var domainS = domainEntity && domainEntity.entity;
                var filterDomain = undefined;
                if (domainS) {
                    filterDomain = ListAll.inferDomain(theModel, domainS);
                    debuglog("got domain" + filterDomain);
                    if (!filterDomain) {
                        dialoglog("Describe", session, send("I did not infer a domain restriction from \"" + domainS + "\". Specify an existing domain. (List all domains) to get exact names.\n"));
                        return;
                    }
                }
                debuglog("factOrCat is" + factOrCat);
                if (exports.metawordsDescriptions[factOrCat.toLowerCase()]) {
                    // do we have a filter ?
                    var prefix = "";
                    if (filterDomain) {
                        prefix = '"in domain "' + filterDomain + '" make no sense when matching a metaword.\n';
                    }
                    debuglog("showing meta result");
                    dialoglog("Describe", session, send(prefix + '"' + factOrCat + '" is ' + exports.metawordsDescriptions[factOrCat.toLowerCase()] + ""));
                    return;
                }
                var categories = [];
                if (WhatIs.splitAtCommaAnd(factOrCat).length > 1) {
                    dialoglog("Describe", session, send("Whoa, i can only explain one thing at a time, not \"" + factOrCat + "\". Please ask one at a time."));
                    return;
                    // getDomainsForCategory
                }
                var category = WhatIs.analyzeCategory(factOrCat, theModel.rules, message);
                //var catResults = [];
                var catResultsP = undefined;
                if (category) {
                    //TODO
                    catResultsP = Describe.describeCategory(category, filterDomain, theModel, message);
                }
                else {
                    catResultsP = global.Promise.resolve([]);
                }
                catResultsP.then(catResults => {
                    var resFact = Describe.describeFactInDomain(factOrCat, filterDomain, theModel).then((resFact) => {
                        if (catResults) {
                            var prefixed = catResults.map(res => `${Describe.sloppyOrExact(category, factOrCat, theModel)}  ${res}`);
                        }
                        if (catResults.length) {
                            resFact = prefixed.join("\n");
                            +"\n" + resFact;
                        }
                        dialoglog("Describe", session, send(resFact));
                    });
                    /*
                        var aRes = Model.getCategoriesForDomain(theModel, domain);
                         var res = restrictLoggedOn(session, aRes).join(";\n");
                        dialoglog("ListAll",session,send("my categories in domain \"" + domain + "\" are ...\n" + res));
                        return;
                      }
                    }
                    if (category === "domains") {
                      var res = restrictLoggedOn(session, theModel.domains).join(";\n");
                      dialoglog("ListAll",session, send("my domains are ...\n" + res));
                      return;
                    }
                    if (category === "tools") {
                      var res = restrictLoggedOn(session, theModel.tools).map(function (oTool) {
                        return oTool.name;
                      }).join(";\n");
                      dialoglog("ListAll", session,send("my tools are ...\n" + res));
                      return;
                    }
                    */
                    /*
                    var cats = [];
                      try {
                      cats = WhatIs.analyzeCategoryMult2(category, theModel.rules, message);
                      debuglog("here cats" + cats.join(","));
                    } catch (e) {
                        if(e) {
                          debuglog("here exception" + e);
                          dialoglog("WhatIs",session,send('I don\'t know anything about "' + category + '"(' + e.toString() + ')'));
                          // next();
                          return;
                        }
                    }
                    if (!cats || (cats.length === 0)) {
                      dialoglog("ListAll",session,send('I don\'t know anything about "' + category + '"'));
                      // next();
                      return;
                    }
                    var cat = "";
                    if( cats.length === 1) {
                      cat = cats[0];
                    }
                    if( cats.length === 1) {
                      debuglog('category identified:' + cat);
                      if (a1 && a1.entity) {
                        debuglog('got filter:' + a1.entity);
                        var categorySet = Model.getAllRecordCategoriesForTargetCategory(theModel, cat, true);
                        var result1 = ListAll.listAllWithContext(cat, a1.entity,
                          theModel.rules, theModel.records, categorySet);
                        // TODO classifying the string twice is a terrible waste
                        if (!result1.length) {
                          debuglog('going for having');
                          var categorySetFull = Model.getAllRecordCategoriesForTargetCategory(theModel, cat, false);
                          result1 = ListAll.listAllHavingContext(cat, a1.entity, theModel.rules,
                            theModel.records, categorySetFull);
                        }
                        debuglog('listall result:' + JSON.stringify(result1));
                        var joinresults = restrictLoggedOn(session, ListAll.joinResults(result1));
                        logQueryWhatIs(session, 'ListAll', result1);
                        if(joinresults.length ){
                          dialoglog("ListAll",session,send("the " + category + " for " + a1.entity + " are ...\n" + joinresults.join(";\n")));
                        } else {
                          dialoglog("ListAll",session,send("i did not find any " + category + " for " + a1.entity + ".\n" + joinresults.join(";\n")));
                        }
                        return;
                      } else {
                        // no entity, e.g. list all countries
                        //
                        var categorySetFull = Model.getAllRecordCategoriesForTargetCategory(theModel, cat, false);
                        var result = ListAll.listAllHavingContext(cat, cat, theModel.rules, theModel.records, categorySetFull);
                        logQueryWhatIs(session, 'ListAll', result);
                        if (result.length) {
                          debuglog('listall result:' + JSON.stringify(result));
                          var joinresults = [];
                          debuglog("here is cat>" + cat);
                          if(cat !== "example question") {
                            joinresults = restrictLoggedOn(session, ListAll.joinResults(result));
                          } else {
                            joinresults = ListAll.joinResults(result);
                          }
                          var response = "the " + category + " are ...\n" + joinresults.join(";\n");
                          dialoglog("ListAll",session,send(response));
                          return;
                        } else {
                          var response = "Found no data having \"" + cat + "\""
                          dialoglog("ListAll",session,send(response));
                          return;
                        }
                      }
                    } else {
                      // multiple categories
                      debuglog('categories identified:' + cats.join(","));
                      if (a1 && a1.entity) {
                        debuglog('got filter:' + a1.entity);
                        try {
                        var categorySet = Model.getAllRecordCategoriesForTargetCategories(theModel, cats, true);
                        } catch(e) {
                            debuglog("here exception" + e);
                            dialoglog("WhatIs",session,send('I cannot combine "' + category + '(' + e.toString() + ')'));
                            return;
                        }
                        var result1T = ListAll.listAllTupelWithContext(cats, a1.entity,
                          theModel.rules, theModel.records, categorySet);
                        // TODO classifying the string twice is a terrible waste
                        if (!result1T.length) {
                          debuglog('going for having');
                          var categorySetFull = Model.getAllRecordCategoriesForTargetCategories(theModel, cats, false);
                          result1T = ListAll.listAllTupelHavingContext(cats, a1.entity, theModel.rules,
                            theModel.records, categorySetFull);
                        }
                        debuglog('listall result:' + JSON.stringify(result1T));
                        var joinresults = restrictLoggedOn(session, ListAll.joinResultsTupel(result1T));
                        logQueryWhatIsTupel(session, 'ListAll', result1T);
                        if(joinresults.length ){
                          dialoglog("ListAll",session,send("the " + category + " for " + a1.entity + " are ...\n" + joinresults.join(";\n")));
                        } else {
                          dialoglog("ListAll",session,send("i did not find any " + category + " for " + a1.entity + ".\n" + joinresults.join(";\n")));
                        }
                        return;
                      } else {
                        // no entity, e.g. list all countries
                        //
                        var categorySetFull = {} as { [key : string] : boolean};
                        try {
                          categorySetFull = Model.getAllRecordCategoriesForTargetCategories(theModel, cats, false);
                        } catch(e) {
                            debuglog("here exception" + e);
                            dialoglog("WhatIs",session,send('I cannot combine "' + category + '(' + e.toString() + ')'));
                        // next();
                            return;
                        }
                        var resultT = ListAll.listAllTupelHavingContext(cats, "\"" + cats.join("\" \"") + "\"", theModel.rules, theModel.records, categorySetFull);
                        logQueryWhatIsTupel(session, 'ListAll', resultT);
                        if (resultT.length) {
                          debuglog('listall result:' + JSON.stringify(resultT));
                          var joinresults = [];
                          debuglog("here is cat>" + cats.join(", "));
                          if(cat !== "example question") {
                            joinresults = restrictLoggedOn(session, ListAll.joinResultsTupel(resultT));
                          } else {
                            joinresults = ListAll.joinResultsTupel(resultT);
                          }
                          var response = "the " + category + " are ...\n" + joinresults.join(";\n");
                          dialoglog("ListAll",session,send(response));
                          return;
                        } else {
                          var response = "Found no data having \"" + cat + "\""
                          dialoglog("ListAll",session,send(response));
                          return;
                        }
                      }
                    }
                      */
                });
            });
        }
    ]);
    dialog.matches('TrainMe', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            var message = session.message.text;
            debuglog("Intent : Train");
            debuglog('raw: ' + JSON.stringify(args.entities), undefined, 2);
            var categoryEntity = builder.EntityRecognizer.findEntity(args.entities, 'categories');
            if (message.toLowerCase().indexOf("kronos") >= 0 || message.toLowerCase().indexOf("klingon") >= 0) {
                dialoglog("TrainMe", session, send(getRandomResult(aTrainNoKlingon)));
                return;
            }
            var res = getRandomResult(aTrainReplies);
            dialoglog("TrainMe", session, send(res));
        }
    ]);
    dialog.matches('TooLong', [
        function (session, args, next) {
            var isCombinedIndex = {};
            var oNewEntity;
            // expecting entity A1
            var message = session.message.text;
            debuglog("Intent : TooLong");
            debuglog('raw: ' + JSON.stringify(args.entities), undefined, 2);
            var categoryEntity = builder.EntityRecognizer.findEntity(args.entities, 'categories');
            dialoglog("TooLong", session, send(getRandomResult(exports.aResponsesOnTooLong)));
        }
    ]);
    dialog.matches('Wrong', [
        function (session, args, next) {
            /*
            dialogLogger({
              session: session,
              intent: "Wrong",
              response: '<begin updown>'
            }); */
            session.beginDialog('/updown', session.userData.count);
        },
        function (session, results, next) {
            var alarm = session.dialogData.alarm;
            next();
        },
        function (session, results) {
            session.send(getRandomResult(aBackFromTraining)); //  + JSON.stringify(results));
            //session.send('end of wrong');
        }
    ]);
    dialog.matches('Exit', [
        function (session, args, next) {
            debuglog('exit :');
            debuglog('exit' + JSON.stringify(args.entities));
            dialogLogger({
                session: session,
                intent: "Exit",
                response: 'you are in a logic loop'
            });
            session.send("you are in a logic loop ");
        }
    ]);
    dialog.matches('Help', [
        function (session, args, next) {
            debuglog('help :');
            debuglog('help');
            session.send("I know about .... <categories>>");
        }
    ]);
    dialog.onDefault(function (session) {
        logQuery(session, "onDefault");
        var eliza = getElizaBot(getConversationId(session));
        var reply = eliza.transform(session.message.text);
        dialoglog("eliza", session, send(reply));
        //new Eilzabot
        //session.send("I do not understand this at all");
        //builder.DialogAction.send('I\'m sorry I didn\'t understand. I can only show start and ring');
    });
    return bot;
}
if (module) {
    module.exports = {
        aTrainNoKlingon: aTrainNoKlingon,
        aTrainReplies: aTrainReplies,
        restrictData: restrictData,
        isAnonymous: isAnonymous,
        SimpleUpDownRecognizer: SimpleUpDownRecognizer,
        aResponsesOnTooLong: exports.aResponsesOnTooLong,
        metawordsDescriptions: exports.metawordsDescriptions,
        makeBot: makeBot
    };
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ib3Qvc21hcnRkaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7O0dBT0c7QUFDSDs7OztHQUlHOzs7QUFFSCx5QkFBeUI7QUFFekIsc0NBQXNDO0FBQ3RDLCtCQUErQjtBQVEvQiwwQ0FBMEM7QUFDMUMsNENBQTRDO0FBQzVDLDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsc0RBQXNEO0FBRXRELG9DQUFvQztBQU1wQyxzREFBc0Q7QUFHdEQsbUNBQW1DO0FBRW5DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztBQUUzQyxJQUFJLFVBQVUsR0FBRywyQ0FBMkMsQ0FBQztBQUM3RCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxVQUFVLENBQUM7QUFDbkQseUJBQXlCO0FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQVMsQ0FBQztBQUNsQixJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFO0lBQy9CLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLHlCQUF5QjtDQUNqRDtBQUNELElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUc5RCxTQUFTLElBQUksQ0FBNEIsQ0FBSSxJQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFBLENBQUM7QUFDaEUsU0FBUyxTQUFTLENBQUMsTUFBYyxFQUFFLE9BQXdCLEVBQUUsUUFBeUI7SUFDcEYsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksT0FBZSxDQUFDO0lBQ3BCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1FBQ2hDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixTQUFTLEdBQUcsUUFBUSxDQUFDO0tBQ3RCO1NBQU07UUFDTCxJQUFJLFFBQVEsR0FBb0IsUUFBUSxDQUFDO1FBQ3pDLElBQUksUUFBUSxHQUFxQixRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdEQsU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDMUIsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDMUg7SUFDRCxZQUFZLENBQUM7UUFDWCxNQUFNLEVBQUUsTUFBTTtRQUNkLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFFBQVEsRUFBRSxTQUFTO1FBQ25CLE1BQU0sRUFBRSxPQUFPO0tBQ2hCLENBQUMsQ0FBQztJQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVELElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ3pELHVDQUF1QztBQUV2QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMscURBQXFEO0FBQ3JELHNDQUFzQztBQUV0QyxTQUFTLGlCQUFpQixDQUFDLE9BQXdCO0lBQ2pELE9BQU8sT0FBTyxDQUFDLE9BQU87UUFDcEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPO1FBQ3ZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7QUFDNUMsQ0FBQztBQUVELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUVuQixTQUFTLFdBQVcsQ0FBQyxFQUFVO0lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDbEIsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHO1lBQ2QsTUFBTSxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ2xCLFFBQVEsRUFBRSxJQUFJLFFBQVEsRUFBRTtTQUN6QixDQUFDO0tBQ0g7SUFDRCxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDbEMsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ2hDLENBQUM7QUFHRCwwQ0FBMEM7QUFFMUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBRW5CLHNEQUE2QztBQUU3QyxrQkFBa0I7QUFHbEIsU0FBUyxXQUFXLENBQUMsTUFBYztJQUNqQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBVTtJQUNyQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFDRCxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQ3JCLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdEYsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDOUIsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxHQUFHLG9DQUFvQyxDQUFDLENBQUM7S0FDckU7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFYRCxvQ0FXQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxHQUFVO0lBQzVELElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztXQUMvQixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1dBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQzNDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3RELE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFCO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQywrQ0FBK0M7SUFDcEUsMENBQTBDO0lBQzFDLHNDQUFzQztJQUN0QyxtQ0FBbUM7SUFDbkMsaUNBQWlDO0lBQ2pDLG1DQUFtQztJQUNuQywwQ0FBMEM7SUFDMUMsMEZBQTBGO0lBQzFGLGdGQUFnRjtJQUNoRix1Q0FBdUM7SUFDdkMsNEVBQTRFO0NBQzdFLENBQUM7QUFFRixJQUFJLFlBQVksR0FBRyxhQUFhLENBQUM7QUFFakMsSUFBSSxjQUFjLEdBQUc7SUFDbkIsZ0RBQWdEO0lBQ2hELEVBQUU7SUFDRixFQUFFO0lBQ0YsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSxFQUFFO0NBQUMsQ0FBQztBQUVOLE1BQU0sV0FBVyxHQUFHLENBQUMsK0dBQStHO0lBQ2xJLG1HQUFtRztJQUNuRyw2TUFBNk07SUFDN00sb0dBQW9HO0lBQ3BHLG9HQUFvRztDQUNyRyxDQUFDO0FBQ0YsTUFBTSxpQkFBaUIsR0FBRztJQUN4Qiw4RUFBOEU7SUFDOUUsZ0ZBQWdGO0lBQ2hGLCtHQUErRztJQUMvRywrRkFBK0Y7Q0FDaEcsQ0FBQztBQUdGLE1BQU0sZUFBZSxHQUFHO0lBQ3RCLHdGQUF3RjtJQUN4Riw4Q0FBOEM7SUFDOUMsaURBQWlEO0lBQ2pELDhEQUE4RDtJQUM5RCx3RUFBd0U7SUFDeEUsaURBQWlEO0lBQ2pELG1DQUFtQztDQUNwQyxDQUFBO0FBRVksUUFBQSxtQkFBbUIsR0FBRztJQUNqQyx1RUFBdUU7SUFDdkUseUhBQXlIO0lBQ3pILHlJQUF5STtJQUN6SSxvTEFBb0w7SUFDcEwsK0dBQStHO0lBQy9HLGlIQUFpSDtJQUNqSCxzSEFBc0g7SUFDdEgsMkpBQTJKO0NBQzVKLENBQUM7QUFFVyxRQUFBLHFCQUFxQixHQUFHO0lBQ25DLFVBQVUsRUFBRSxpRkFBaUY7SUFDN0YsUUFBUSxFQUFFLGdEQUFnRDtJQUMxRCxLQUFLLEVBQUUsb0VBQW9FO0lBQzNFLE1BQU0sRUFBRSxrQ0FBa0M7SUFDMUMsUUFBUSxFQUFFLGtKQUFrSjtJQUM1SixNQUFNLEVBQUUsMkVBQTJFO0NBQ3BGLENBQUM7QUFFRixTQUFTLGVBQWUsQ0FBQyxHQUFhO0lBQ3BDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUVELE1BQWEsc0JBQXNCO0lBQ2pDO0lBRUEsQ0FBQztJQUVELFNBQVMsQ0FBQyxPQUFrQyxFQUFFLFFBQXVFO1FBQ25ILElBQUksQ0FBQyxHQUFHLEVBQXFDLENBQUM7UUFFOUMsUUFBUSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxDQUFDLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztZQUN6QixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7WUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2QsSUFBSSxFQUFFLEdBQUcsRUFBcUIsQ0FBQztZQUMvQixFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDNUIsRUFBRSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDMUMsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZixDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFDRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsQ0FBQyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7WUFDdkIsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZCxJQUFJLEVBQUUsR0FBRyxFQUFxQixDQUFDO1lBQy9CLEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM1QixFQUFFLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMxQyxFQUFFLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNmLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE9BQU87U0FDUjtRQUNELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxDQUFDLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztZQUN2QixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7WUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzVCLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2QsSUFBSSxFQUFFLEdBQUcsRUFBcUIsQ0FBQztZQUMvQixFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDNUIsRUFBRSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDMUMsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZixDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFDRCxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNsQixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7UUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDaEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUExRUQsd0RBMEVDO0FBRUQsTUFBTSxTQUFTLEdBQUcsTUFBYSxDQUFDO0FBRWhDLElBQUksR0FBRyxDQUFDO0FBRVIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFDL0UsSUFBSSxNQUFNLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvQyw4REFBOEQ7QUFHOUQsU0FBUyxRQUFRLENBQUMsT0FBd0IsRUFBRSxNQUFjLEVBQUUsTUFBbUI7SUFFN0UsRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM5RCxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1FBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVM7UUFDcEMsTUFBTSxFQUFFLE1BQU07UUFDZCxHQUFHLEVBQUUsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHO1FBQ2hFLGNBQWMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU87ZUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTtlQUNwQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUU7UUFDaEQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztlQUM1QixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2VBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRTtLQUN6QyxDQUFDLEVBQUcsVUFBVSxHQUFHO1FBQ2hCLElBQUksR0FBRyxFQUFFO1lBQ1AsUUFBUSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ25DO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBR0QsU0FBUyxtQkFBbUIsQ0FBQyxPQUF3QixFQUFFLE1BQWMsRUFBRSxNQUF5QztJQUU5RyxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUEwQixFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzlELElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUk7UUFDMUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUztRQUNwQyxNQUFNLEVBQUUsTUFBTTtRQUNkLEdBQUcsRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUc7UUFDdEUsY0FBYyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztlQUNwQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZO2VBQ3BDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRTtRQUNoRCxNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPO2VBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUk7ZUFDNUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFO0tBQ3pDLENBQUMsRUFBRSxVQUFVLEdBQUc7UUFDZixJQUFJLEdBQUcsRUFBRTtZQUNQLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQjs7Ozs7R0FLRztBQUNILFNBQVMsT0FBTyxDQUFDLFNBQVMsRUFDeEIsYUFBNEMsRUFBRSxPQUFhO0lBQzNELElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNwQixJQUFJLFNBQVMsR0FBRyxhQUFhLEVBQUUsQ0FBQztJQUNoQyxTQUFTLENBQUMsSUFBSSxDQUNaLENBQUMsUUFBUSxFQUFFLEVBQUU7UUFDWCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTtZQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN2QztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUwsU0FBUyxXQUFXO1FBQ2xCLE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRCxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFDLElBQUksVUFBVSxHQUFHLElBQUksZUFBZSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlELElBQUksTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNyRSxJQUFJLFlBQVksR0FBRyxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxJQUFJLHNCQUFzQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFN0YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDcEMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLE9BQU87UUFDcEMsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsc0RBQXNEO0lBQ3hELENBQUMsQ0FBQyxDQUFBO0lBRUYsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7UUFDaEMsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNwQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsaURBQWlELENBQUMsQ0FBQztRQUNuRixDQUFDO1FBQ0QsVUFBVSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUk7WUFDOUIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUN6QyxJQUFJLEVBQUUsQ0FBQztRQUNULENBQUM7UUFDRCxVQUFVLE9BQU8sRUFBRSxPQUFPO1lBQ3hCLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQztLQUNGLENBQ0EsQ0FBQztJQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1FBQ2xDLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUNELFVBQVUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJO1lBQzlCLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CO1lBQ2hELElBQUksRUFBRSxDQUFDO1FBQ1QsQ0FBQztRQUNELFVBQVUsT0FBTyxFQUFFLE9BQU87WUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7S0FDRixDQUNBLENBQUM7SUFDRixZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsT0FBTztRQUN0QyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLElBQUksR0FBRyxHQUFHLGVBQWUsQ0FBQyxZQUFZLENBQUMsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDMUUsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFFSDs7Ozs7Ozs7Ozs7OztNQWFFO0lBRUYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7UUFDdkIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2YsNERBQTREO1lBQzVELDhDQUE4QztZQUM5QywrQ0FBK0M7WUFDL0MsRUFBRTtZQUNGLGdCQUFnQjtZQUNoQixzQkFBc0I7WUFDdEIsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hCLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRSxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDOUIsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FDN0MsWUFBWSxDQUFDLEVBQUU7b0JBQ2IsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUcsWUFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDM0QsaUJBQWlCO29CQUNqQix5REFBeUQ7b0JBQ3pELElBQUksQ0FBQyxZQUFZLElBQUksQ0FBRSxZQUFvQixDQUFDLE9BQU8sRUFBRTt3QkFDbkQsU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQzt3QkFDbEUsT0FBTztxQkFDUjtvQkFDRCxJQUFJLE9BQU8sR0FBSSxZQUFvQixDQUFDLE9BQU8sQ0FBQztvQkFDNUMsZ0VBQWdFO29CQUNoRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUU5RSxvR0FBb0c7b0JBQ3BHLDZCQUE2QjtvQkFFN0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQzt5QkFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUM7eUJBQy9CLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBLENBQUMsZ0JBQWdCO29CQUMvQyw2R0FBNkc7b0JBQzdHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3ZCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLFVBQVUsQ0FBQztZQUNmLHNCQUFzQjtZQUN0QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUVuQyw2QkFBNkI7WUFDN0IsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBRTlCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1QixRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRixJQUFJLGdCQUFnQixHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7Z0JBQzdDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDckUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNkLElBQUk7b0JBQ0YsSUFBSSxHQUFHLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUN6RixRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDMUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsSUFBSSxDQUFDLEVBQUU7d0JBQ0wsUUFBUSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUMvQixxRkFBcUY7d0JBQ3JGLHNHQUFzRzt3QkFDdEcsNkNBQTZDO3dCQUM3QyxlQUFlO3dCQUNmLFlBQVk7cUJBQ2I7aUJBQ0Y7Z0JBQ0QsZ0VBQWdFO2dCQUNoRSxJQUFJLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztnQkFDN0IsSUFBSSxXQUFXLEdBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO2dCQUM5QyxJQUFJLEtBQUssRUFBRTtvQkFDVCxLQUFLLEdBQUcsZ0JBQWdCLEdBQUcsUUFBUSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7aUJBQ3BEO2dCQUNELFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDcEQsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7b0JBRXZELElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxXQUFXLEVBQUU7d0JBQ2Ysc0pBQXNKO3dCQUN0SixVQUFVO3dCQUNWLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxnQkFBZ0IsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ2hNLE9BQU87d0JBRVAsa0RBQWtEO3dCQUNsRCxXQUFXO3FCQUNaO29CQUNELElBQUksV0FBVyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDaEYsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbEQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM3RSxnRUFBZ0U7b0JBQ2hFLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuSCw0SEFBNEg7b0JBQzVILHlCQUF5QjtvQkFFekIsZ0dBQWdHO29CQUNoRywyQ0FBMkM7b0JBRzNDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDNUUsMEJBQTBCO29CQUMxQixJQUFJLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRixtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUNsRCxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzdFLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTt3QkFDdEIsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3JELElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7NEJBQ3JCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLEdBQUcsTUFBTSxHQUFHLE1BQU07Z0NBQzNFLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO3lCQUN4Qjs2QkFBTTs0QkFDTCxTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLE1BQU0sR0FBRyxZQUFZLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQ2pIO3FCQUNGO3lCQUFNO3dCQUNMLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ25FLElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN2RCxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMscUJBQXFCLEdBQUcsZ0JBQWdCLEdBQUcsT0FBTyxHQUFHLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO3FCQUM1STtvQkFDRCxPQUFPO2dCQUNULENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtRQUN4QixVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxVQUFVLENBQUM7WUFDZixzQkFBc0I7WUFDdEIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDbkMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0YsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3RGLElBQUksUUFBUSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7WUFDckMsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzdFLElBQUksV0FBVyxHQUFHLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQ3BELG9CQUFvQjtZQUNwQixXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFFOUIsSUFBSSxRQUFRLEtBQUssWUFBWSxFQUFFO29CQUM3Qix3QkFBd0I7b0JBQ3hCLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQztvQkFDdkIsSUFBSSxXQUFXLEVBQUU7d0JBQ2YsTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO3FCQUNyRDtvQkFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNYLElBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNuRSxJQUFJLFdBQVcsRUFBRTs0QkFDZixTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsOENBQThDLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsR0FBRyxpQ0FBaUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUNoSzs2QkFBTTs0QkFDTCxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMseUJBQXlCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt5QkFDdEU7d0JBQ0QsT0FBTztxQkFDUjt5QkFBTTt3QkFDTCxJQUFJLElBQUksR0FBRyxtQkFBSyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQzt3QkFDMUQsSUFBSSxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDdEQsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixHQUFHLE1BQU0sR0FBRyxjQUFjLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDbEcsT0FBTztxQkFDUjtpQkFDRjtnQkFDRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7b0JBQzFCLElBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNsRSxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbEUsT0FBTztpQkFDUjtnQkFDRCxnRUFBZ0U7Z0JBQ2hFLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDckIsSUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7Z0JBQ2hDLElBQUksV0FBVyxFQUFFO29CQUNmLEtBQUssR0FBRyxRQUFRLEdBQUcsUUFBUSxHQUFHLFdBQVcsQ0FBQztpQkFDM0M7Z0JBQ0QsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNuRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ2QsSUFBSTt3QkFDRixRQUFRLENBQUMsMEJBQTBCLEdBQUcsUUFBUSxDQUFDLENBQUM7d0JBQ2hELElBQUksR0FBRyxNQUFNLENBQUMsK0JBQStCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ2pGLFFBQVEsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3FCQUMxQztvQkFBQyxPQUFPLENBQUMsRUFBRTt3QkFDVixJQUFJLENBQUMsRUFBRTs0QkFDTCxRQUFRLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUM7NEJBQ2pDLGdCQUFnQjs0QkFDaEIsRUFBRTs0QkFFRixtRkFBbUY7NEJBQ25GLDRDQUE0Qzs0QkFDNUMsY0FBYzs0QkFDZCxXQUFXO3lCQUNaO3FCQUNGO29CQUNELDREQUE0RDtvQkFDNUQsbURBQW1EO29CQUNuRCxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzNFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDOUQsSUFBSSxXQUFXLEVBQUU7d0JBQ2Ysc0pBQXNKO3dCQUN0SixVQUFVO3dCQUNWLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN2RSxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsZ0JBQWdCLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4SyxPQUFPO3dCQUVQLGtEQUFrRDt3QkFDbEQsV0FBVztxQkFDWjtvQkFDRCxJQUFJLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQy9FLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ2pELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRSxJQUFJLE1BQU0sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3hELElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTt3QkFDdEIsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLEdBQUcsTUFBTSxHQUFHLFlBQVksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDMUc7eUJBQU07d0JBQ0wsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO3dCQUNuQixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNsRSxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMscUJBQXFCLEdBQUcsUUFBUSxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztxQkFDbkk7b0JBQ0QsT0FBTztnQkFDVCxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBR0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7UUFDM0IsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2Ysc0JBQXNCO1lBQ3RCLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUU5QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDbkMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ2hDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUN6RixRQUFRLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLElBQUksQ0FBQztnQkFDVCxJQUFJO29CQUNGLElBQUksR0FBRyxNQUFNLENBQUMsK0JBQStCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ25GLFFBQVEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUN4QztnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixJQUFJLENBQUMsRUFBRTt3QkFDTCxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQy9CLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUM5RyxVQUFVO3dCQUNWLE9BQU87cUJBQ1I7aUJBQ0Y7Z0JBQ0QsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUU7b0JBQ2hDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDekYsVUFBVTtvQkFDVixPQUFPO2lCQUNSO2dCQUNELElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQywyR0FBMkc7Z0JBQzNHLElBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7cUJBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3FCQUNmLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFCLDZHQUE2RztnQkFDN0csU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7UUFDekIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2Ysc0JBQXNCO1lBQ3RCLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUM5QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDbkMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQzlCLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFFLElBQUksU0FBUyxHQUFHLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUNoRCxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzNFLElBQUksT0FBTyxHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUNsRCxJQUFJLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzdCLElBQUksT0FBTyxFQUFFO29CQUNYLFlBQVksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDdEQsUUFBUSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLFlBQVksRUFBRTt3QkFDakIsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLDhDQUE4QyxHQUFHLE9BQU8sR0FBRywwRUFBMEUsQ0FBQyxDQUFDLENBQUM7d0JBQzVLLE9BQU87cUJBQ1I7aUJBQ0Y7Z0JBRUQsUUFBUSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsQ0FBQztnQkFDckMsSUFBSSw2QkFBcUIsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRTtvQkFDbEQsd0JBQXdCO29CQUN4QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7b0JBQ2hCLElBQUksWUFBWSxFQUFFO3dCQUNoQixNQUFNLEdBQUcsY0FBYyxHQUFHLFlBQVksR0FBRyw2Q0FBNkMsQ0FBQztxQkFDeEY7b0JBQ0QsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7b0JBQ2hDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLFNBQVMsR0FBRyxPQUFPLEdBQUcsNkJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDL0gsT0FBTztpQkFDUjtnQkFDRCxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNoRCxTQUFTLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsc0RBQXNELEdBQUcsU0FBUyxHQUFHLCtCQUErQixDQUFDLENBQUMsQ0FBQztvQkFDM0ksT0FBTztvQkFDUCx3QkFBd0I7aUJBQ3pCO2dCQUlELElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzFFLHNCQUFzQjtnQkFDdEIsSUFBSSxXQUFXLEdBQUcsU0FBOEIsQ0FBQztnQkFDakQsSUFBSSxRQUFRLEVBQUU7b0JBQ1osTUFBTTtvQkFDTixXQUFXLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUNwRjtxQkFBTTtvQkFDTCxXQUFXLEdBQUksTUFBTSxDQUFDLE9BQWUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ25EO2dCQUVELFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQzVCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUU5RixJQUFJLFVBQVUsRUFBRTs0QkFDZCxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ2xDLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7eUJBQ3ZFO3dCQUNELElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTs0QkFDckIsT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7NEJBQUMsQ0FBRSxJQUFJLEdBQUcsT0FBTyxDQUFDO3lCQUNqRDt3QkFDRCxTQUFTLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDaEQsQ0FBQyxDQUFDLENBQUM7b0JBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBbUJFO29CQUVGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBb0lJO2dCQUNOLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDeEIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2Ysc0JBQXNCO1lBQ3RCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ25DLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNCLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RixJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqRyxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsT0FBTzthQUNSO1lBQ0QsSUFBSSxHQUFHLEdBQUcsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtRQUN4QixVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxVQUFVLENBQUM7WUFDZixzQkFBc0I7WUFDdEIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDbkMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0IsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3RGLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUdILE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ3RCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCOzs7OztrQkFLTTtZQUNOLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUNELFVBQVUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJO1lBQzlCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3JDLElBQUksRUFBRSxDQUFDO1FBQ1QsQ0FBQztRQUNELFVBQVUsT0FBTyxFQUFFLE9BQU87WUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsK0JBQStCO1lBQ2pGLCtCQUErQjtRQUNqQyxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDckIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25CLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNqRCxZQUFZLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFFBQVEsRUFBRSx5QkFBeUI7YUFDcEMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7S0FDRixDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUNyQixVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQixRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUNsRCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLE9BQU87UUFDaEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMvQixJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDekMsY0FBYztRQUNkLGtEQUFrRDtRQUNsRCwrRkFBK0Y7SUFDakcsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxJQUFJLE1BQU0sRUFBRTtJQUNWLE1BQU0sQ0FBQyxPQUFPLEdBQUc7UUFDZixlQUFlLEVBQUUsZUFBZTtRQUNoQyxhQUFhLEVBQUUsYUFBYTtRQUM1QixZQUFZLEVBQUUsWUFBWTtRQUMxQixXQUFXLEVBQUUsV0FBVztRQUN4QixzQkFBc0IsRUFBRSxzQkFBc0I7UUFDOUMsbUJBQW1CLEVBQUUsMkJBQW1CO1FBQ3hDLHFCQUFxQixFQUFFLDZCQUFxQjtRQUM1QyxPQUFPLEVBQUUsT0FBTztLQUNqQixDQUFDO0NBQ0giLCJmaWxlIjoiYm90L3NtYXJ0ZGlhbG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGUgYm90IGltcGxlbWVudGF0aW9uXG4gKlxuICogSW5zdGFudGlhdGUgYXBzc2luZyBhIGNvbm5lY3RvciB2aWFcbiAqIG1ha2VCb3RcbiAqXG4gKlxuICovXG4vKipcbiAqIEBmaWxlXG4gKiBAbW9kdWxlIGpmc2ViLm1nbmxxX2Fib3Quc21hcnRkaWFsb2dcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYtMjEwOSBHZXJkIEZvcnN0bWFublxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0ICogYXMgYnVpbGRlciBmcm9tICdib3RidWlsZGVyJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcblxuLy9pbXBvcnQgKiBhcyBNYXRjaCBmcm9tICcuLi9tYXRjaC9tYXRjaCc7XG4vL2ltcG9ydCAqIGFzIHNyY0hhbmRsZSBmcm9tICdzcmNIYW5kbGUnO1xuXG4vL2ltcG9ydCAqIGFzIEFuYWx5emUgZnJvbSAnLi4vbWF0Y2gvYW5hbHl6ZSc7XG5pbXBvcnQgeyBCcmVha0Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cbmltcG9ydCAqIGFzIFdoYXRJcyBmcm9tICcuLi9tYXRjaC93aGF0aXMnO1xuaW1wb3J0ICogYXMgTGlzdEFsbCBmcm9tICcuLi9tYXRjaC9saXN0YWxsJztcbmltcG9ydCAqIGFzIERlc2NyaWJlIGZyb20gJy4uL21hdGNoL2Rlc2NyaWJlJztcbmltcG9ydCAqIGFzIE1ha2VUYWJsZSBmcm9tICcuLi9leGVjL21ha2VxYmV0YWJsZSc7XG5pbXBvcnQgKiBhcyBNb25nb1F1ZXJpZXMgZnJvbSAnLi4vbWF0Y2gvbW9uZ29xdWVyaWVzJztcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XG5cbmltcG9ydCB7IEVyRXJyb3IgYXMgRXJFcnJvciB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7XG5cbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0ICogYXMgRGlhbG9nTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2RpYWxvZ2xvZ2dlcic7XG5cbmltcG9ydCB7IE1vbmdvUSBhcyBNb25nb1EgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInO1xuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcblxudmFyIGRidXJsID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMIHx8IFwiXCI7XG5cbnZhciBwZ2xvY2FsdXJsID0gXCJwb3N0Z3JlczovL2pvZTphYmNkZWZAbG9jYWxob3N0OjU0MzIvYWJvdFwiO1xudmFyIGRidXJsID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMIHx8IHBnbG9jYWx1cmw7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG52YXIgbyA9IHBnIGFzIGFueTtcbmlmICghKHByb2Nlc3MuZW52LkFCT1RfREJOT1NTTCkpIHtcbiAgby5kZWZhdWx0cy5zc2wgPSB0cnVlOyAvLyBPbmx5IHVzZWQgaW50ZXJuYWxseSAhXG59XG52YXIgZGlhbG9nTG9nZ2VyID0gRGlhbG9nTG9nZ2VyLmxvZ2dlcihcInNtYXJ0Ym90XCIsIGRidXJsLCBwZyk7XG5cbnR5cGUgc3RyaW5nT3JNZXNzYWdlID0gc3RyaW5nIHwgYnVpbGRlci5NZXNzYWdlO1xuZnVuY3Rpb24gc2VuZDxUIGV4dGVuZHMgc3RyaW5nT3JNZXNzYWdlPihvOiBUKTogVCB7IHJldHVybiBvOyB9O1xuZnVuY3Rpb24gZGlhbG9nbG9nKGludGVudDogc3RyaW5nLCBzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24sIHJlc3BvbnNlOiBzdHJpbmdPck1lc3NhZ2UpIHtcbiAgdmFyIHNSZXNwb25zZTogc3RyaW5nO1xuICB2YXIgc0FjdGlvbjogc3RyaW5nO1xuICBpZiAodHlwZW9mIHJlc3BvbnNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgc0FjdGlvbiA9IFwiXCI7XG4gICAgc1Jlc3BvbnNlID0gcmVzcG9uc2U7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGFNZXNzYWdlOiBidWlsZGVyLk1lc3NhZ2UgPSByZXNwb25zZTtcbiAgICB2YXIgaU1lc3NhZ2U6IGJ1aWxkZXIuSU1lc3NhZ2UgPSBhTWVzc2FnZS50b01lc3NhZ2UoKTtcbiAgICBzUmVzcG9uc2UgPSBpTWVzc2FnZS50ZXh0O1xuICAgIHNBY3Rpb24gPSAoaU1lc3NhZ2UuZW50aXRpZXMgJiYgaU1lc3NhZ2UuZW50aXRpZXNbMF0pID8gKEpTT04uc3RyaW5naWZ5KGlNZXNzYWdlLmVudGl0aWVzICYmIGlNZXNzYWdlLmVudGl0aWVzWzBdKSkgOiBcIlwiO1xuICB9XG4gIGRpYWxvZ0xvZ2dlcih7XG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICByZXNwb25zZTogc1Jlc3BvbnNlLFxuICAgIGFjdGlvbjogc0FjdGlvblxuICB9KTtcbiAgc2Vzc2lvbi5zZW5kKHJlc3BvbnNlKTtcbn1cblxudmFyIGVsaXphYm90ID0gcmVxdWlyZSgnLi4vZXh0ZXJuL2VsaXphYm90L2VsaXphYm90LmpzJyk7XG4vL2ltcG9ydCAqIGFzIGVsaXphYm90IGZyb20gJ2VsaXphYm90JztcblxubGV0IGRlYnVnbG9nID0gZGVidWcoJ3NtYXJ0ZGlhbG9nJyk7XG5pbXBvcnQgKiBhcyBQbGFpblJlY29nbml6ZXIgZnJvbSAnLi9wbGFpbnJlY29nbml6ZXInO1xuLy92YXIgYnVpbGRlciA9IHJlcXVpcmUoJ2JvdGJ1aWxkZXInKTtcblxuZnVuY3Rpb24gZ2V0Q29udmVyc2F0aW9uSWQoc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNlc3Npb24ubWVzc2FnZSAmJlxuICAgIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzICYmXG4gICAgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uLmlkO1xufVxuXG52YXIgZWxpemFib3RzID0ge307XG5cbmZ1bmN0aW9uIGdldEVsaXphQm90KGlkOiBzdHJpbmcpIHtcbiAgaWYgKCFlbGl6YWJvdHNbaWRdKSB7XG4gICAgZWxpemFib3RzW2lkXSA9IHtcbiAgICAgIGFjY2VzczogbmV3IERhdGUoKSxcbiAgICAgIGVsaXphYm90OiBuZXcgZWxpemFib3QoKVxuICAgIH07XG4gIH1cbiAgZWxpemFib3RzW2lkXS5hY2Nlc3MgPSBuZXcgRGF0ZSgpO1xuICByZXR1cm4gZWxpemFib3RzW2lkXS5lbGl6YWJvdDtcbn1cblxuaW1wb3J0ICogYXMgSU1hdGNoIGZyb20gJy4uL21hdGNoL2lmbWF0Y2gnO1xuLy9pbXBvcnQgKiBhcyBUb29scyBmcm9tICcuLi9tYXRjaC90b29scyc7XG5cbnZhciBuZXdGbG93ID0gdHJ1ZTtcblxuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cbi8vdmFyIG1vZGVscyA9IHt9O1xuXG5cbmZ1bmN0aW9uIGlzQW5vbnltb3VzKHVzZXJpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiB1c2VyaWQuaW5kZXhPZihcImFubzpcIikgPT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXN0cmljdERhdGEoYXJyOiBhbnlbXSk6IGFueVtdIHtcbiAgaWYgKGFyci5sZW5ndGggPCA2KSB7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIHJlcyA9IGFyci5zbGljZSgwLCBNYXRoLm1pbihNYXRoLm1heChNYXRoLmZsb29yKGFyci5sZW5ndGggLyAzKSwgNyksIGFyci5sZW5ndGgpKTtcbiAgaWYgKHR5cGVvZiBhcnJbMF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICB2YXIgZGVsdGEgPSBsZW4gLSByZXMubGVuZ3RoO1xuICAgIHJlcy5wdXNoKFwiLi4uIGFuZCBcIiArIGRlbHRhICsgXCIgbW9yZSBlbnRyaWVzIGZvciByZWdpc3RlcmVkIHVzZXJzXCIpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uLCBhcnI6IGFueVtdKTogYW55W10ge1xuICB2YXIgdXNlcmlkID0gc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlci5pZCB8fCBcIlwiO1xuICBpZiAocHJvY2Vzcy5lbnYuQUJPVF9FTUFJTF9VU0VSICYmIGlzQW5vbnltb3VzKHVzZXJpZCkpIHtcbiAgICByZXR1cm4gcmVzdHJpY3REYXRhKGFycik7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuY29uc3QgYVRyYWluUmVwbGllcyA9IFtcIlRoYW5rIHlvdSBmb3Igc2hhcmluZyB0aGlzIHN1Z2dlc3Rpb24gd2l0aCB1c1wiLFxuICBcIlRoYW5rIGZvciBmb3IgdGhpcyB2YWx1YWJsZSBpbmZvcm1hdGlvbi5cIixcbiAgXCJUaGFuayBmb3IgZm9yIHRoaXMgaW50ZXJlc3RpbmcgZmFjdCFcIixcbiAgXCJUaGF0cyBhIHBsZXRob3JpYSBvZiBpbmZvcm1hdGlvbi5cIixcbiAgXCJUaGF0J3MgYSBudWdnZXQgb2YgaW5mb3JtYXRpb24uXCIsXG4gIFwiTG92ZWx5LCBJIG1heSBjb25zaWRlciB5b3UgaW5wdXQuXCIsXG4gIFwiV2VsbCBkb25lLCBhbnl0aGluZyBtb3JlIHRvIGxldCBtZSBrbm93P1wiLFxuICBcIkkgZG8gYXBwcmVjaWF0ZSB5b3VyIHRlYWNoaW5nIGFuZCBteSBsZWFybmluZyBleHBlcmllbmNlLCBvciB3YXMgaXQgdGhlIG90aGVyIHdheSByb3VuZD9cIixcbiAgXCJZb3VyIGhlbHBmdWwgaW5wdXQgaGFzIGJlZW4gc3RvcmVkIGluIHNvbWUgZHVzdHkgY29ybmVyIG9mIHRoZSBXb3JsZCB3aWRlIHdlYiFcIixcbiAgXCJUaGFuayB5b3UgZm9yIG15IGxlYXJuaW5nIGV4cGVyaWVuY2UhXCIsXG4gIFwiSSBoYXZlIGluY29ycG9yYXRlZCB5b3VyIHZhbHVhYmxlIHN1Z2dlc3Rpb24gaW4gdGhlIHdpc2RvbSBvZiB0aGUgaW50ZXJuZXRcIlxuXTtcblxudmFyIGFUcmFpbkRpYWxvZyA9IGFUcmFpblJlcGxpZXM7XG5cbnZhciBhVHJhaW5FeGl0SGludCA9IFtcbiAgXCJcXG50eXBlIFxcXCJkb25lXFxcIiB3aGVuIHlvdSBhcmUgZG9uZSB0cmFpbmluZyBtZS5cIixcbiAgXCJcIixcbiAgXCJcIixcbiAgXCJcIixcbiAgXCJcXG5yZW1lbWJlciwgeW91IGFyZSBzdHVjayBoZXJlIGluc3RydWN0aW5nIG1lLCB0eXBlIFxcXCJkb25lXFxcIiB0byByZXR1cm4uXCIsXG4gIFwiXCJdO1xuXG5jb25zdCBhRW50ZXJUcmFpbiA9IFsnU28geW91IHRoaW5rIHRoaXMgaXMgd3Jvbmc/IFlvdSBjYW4gb2ZmZXIgeW91ciBhZHZpc2UgaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG5UeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbiAgJ1NvbWUgc2F5IFwiVGhlIHNlY3JldCB0byBoYXBwaW5lc3MgaXMgdG8gbG93ZXIgeW91ciBleHBlY3RhdGlvbnMgdG8gdGhlIHBvaW50IHRoZXkgYXJlIGFscmVhZHkgbWV0LlwiLCBcXG50IGlmIHlvdSBjb3VsZCBoZWxwIG1lIHRvIGJlY29tZSBiZXR0ZXIsIGluc3RydWN0IG1lLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIHRlYWNoaW5nIG1lJyxcbiAgJ0ZlZWwgZnJlZSB0byBvZmZlciBtZSB5b3VyIGJldHRlciBzb2x1dGlvbiBoZXJlLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbiAgJ0ZlZWwgZnJlZSB0byBvZmZlciBtZSB5b3VyIGJldHRlciBzb2x1dGlvbiBoZXJlLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbl07XG5jb25zdCBhQmFja0Zyb21UcmFpbmluZyA9IFtcbiAgJ1B1dWgsIGJhY2sgZnJvbSB0cmFpbmluZyEgTm93IGZvciB0aGUgZWFzeSBwYXJ0IC4uLlxcbiBhc2sgbWUgYSBuZXcgcXVlc3Rpb24uJyxcbiAgJ0xpdmUgYW5kIGRvblxcJ3QgbGVhcm4sIHRoYXRcXCdzIHVzLiBOYWFoLCB3ZVxcJ2xsIHNlZS5cXG5Bc2sgbWUgYW5vdGhlciBxdWVzdGlvbi4nLFxuICAnVGhlIHNlY3JldCB0byBoYXBwaW5lc3MgaXMgdG8gbG93ZXIgeW91ciBleHBlY3RhdGlvbnMgdG8gdGhlIHBvaW50IHRoZXkgYXJlIGFscmVhZHkgbWV0LlxcbiBBc2sgbWUgYSBxdWVzdGlvbi4nLFxuICAnVGhhbmtzIGZvciBoYXZpbmcgdGhpcyBsZWN0dXJlIHNlc3Npb24sIG5vdyBpIGFtIGJhY2sgdG8gb3VyIHVzdWFsIHNlbGYuXFxuIEFzayBtZSBhIHF1ZXN0aW9uLidcbl07XG5cblxuY29uc3QgYVRyYWluTm9LbGluZ29uID0gW1xuICBcIkhlIHdobyBtYXN0ZXJzIHRoZSBkYXJrIGFydHMgb2YgU0FQIG11c3Qgbm90IGR3ZWxsIGluIHRoZSBlYXJ0aGx5IHJlYWxtcyBvZiBTdGFyIFRyZWsuXCIsXG4gIFwiU0FQIGlzIGEgY2xvdWQgY29tcGFueSwgbm90IGEgc3BhY2UgY29tcGFueS5cIixcbiAgXCJUaGUgZGVwdGggb2YgUi8zIGFyZSBkZWVwZXIgdGhhbiBEZWVwIFNwYWNlIDQyLlwiLFxuICBcIk15IGJyYWlucG93ZXIgaXMgZnVsbHkgYWJzb3JiZWQgd2l0aCBtYXN0ZXJpbmcgb3RoZXIgcmVhbG1zLlwiLFxuICBcIkZvciB0aGUgd29zYXAsIHRoZSBza3kgaXMgdGhlIGxpbWl0LiBGZWVsIGZyZWUgdG8gY2hlY2sgb3V0IG5hc2EuZ292IC5cIixcbiAgXCJUaGUgZnV0dXJlIGlzIFNBUCBvciBJQk0gYmx1ZSwgbm90IHNwYWNlIGJsYWNrLlwiLFxuICBcIlRoYXQncyBsZWZ0IHRvIHNvbWUgbXVya3kgZnV0dXJlLlwiXG5dXG5cbmV4cG9ydCBjb25zdCBhUmVzcG9uc2VzT25Ub29Mb25nID0gW1xuICBcIllvdXIgaW5wdXQgc2hvdWxkIGJlIGVsb3F1ZW50IGluIGl0J3MgYnJldml0eS4gVGhpcyBvbmUgd2FzIHRvbyBsb25nLlwiLFxuICBcIm15IHdpc2RvbSBpcyBzZXZlcmx5IGJvdW5kIGJ5IG15IGxpbWl0ZWQgaW5wdXQgcHJvY2Vzc2luZyBjYXBhYmlsaXRpZXMuIENvdWxkIHlvdSBmb3JtdWxhdGUgYSBzaG9ydGVyIGlucHV0PyBUaGFuayB5b3UuXCIsXG4gIFwiVGhlIGxlbmd0aCBvZiB5b3UgaW5wdXQgaW5kaWNhdGVzIHlvdSBwcm9iYWJseSBrbm93IG1vcmUgYWJvdXQgdGhlIHRvcGljIHRoYW4gbWU/IENhbiBpIGh1bWJseSBhc2sgeW91IHRvIGZvcm11bGF0ZSBhIHNob3J0ZXIgcXVlc3Rpb24/XCIsXG4gICdcXFwiV2hhdCBldmVyIHlvdSB3YW50IHRvIHRlYWNoLCBiZSBicmllZlxcXCIgKEhvcmFjZSkuIFdoaWxlIHRoaXMgZG9lcyBub3QgYWx3YXlzIGFwcGxpZXMgdG8gbXkgYW5zd2VycywgaXQgaXMgcmVxdWlyZSBmb3IgeW91ciBxdWVzdGlvbnMuIFBsZWFzZSB0cnkgYWdhaW4gd2l0aCBhIHJlZmluZWQgcXVlc3Rpb25zLicsXG4gICdJIHVuZGVyc3RhbmQgbW9yZSB0aGFuIDQtbGV0dGVyIHdvcmRzLCBidXQgbm90IG1vcmUgdGhhbiAyMCB3b3JkIHNlbnRlbmNlcy4gUGxlYXNlIHRyeSB0byBzaG9ydGVuIHlvdXIgaW5wdXQuJyxcbiAgJ3RoZSBza3kgaXMgdGhlIGxpbWl0PyBBaXIgZm9yY2UgbWVtYmVyIG9yIG5vdCwgeW91IGNhbiBhc2sgbG9uZ2VyIHF1ZXN0aW9ucyB0aGFuIFxcXCJ0aGUgc2t5XFxcIiwgYnV0IG5vdCB0aGlzIGxvbmcnLFxuICAnTXkgYW5zd2VycyBtYXkgYmUgZXhoYXVzdGl2ZSwgYnV0IEkgdW5kZXJzdGFuZCBtb3JlIHRoYW4gNC1sZXR0ZXIgd29yZHMsIGJ1dCBub3QgbW9yZSB0aGFuIDIwIHdvcmQgc2VudGVuY2VzLiBTb3JyeS4nLFxuICAnT3VyIGNvbnZlcnNhdGlvbiBtdXN0IGJlIGhpZ2hseSBhc3N5bW1ldHJpYzogbXkgYW5zd2VycyBtYXkgYmUgdmVyYm9zZSBhbmQgZXhoYXVzdGl2ZSBhbmQgZnV6enksIHF1ZXN0aW9ucyBhbmQgaW5wdXQgbXVzdCBiZSBicmllZi4gVHJ5IHRvIHJlZm9ybXVsYXRlIGl0Jyxcbl07XG5cbmV4cG9ydCBjb25zdCBtZXRhd29yZHNEZXNjcmlwdGlvbnMgPSB7XG4gIFwiY2F0ZWdvcnlcIjogXCJhbiBhdHRyaWJ1dGUgb2YgYSByZWNvcmQgaW4gYSBtb2RlbCwgZXhhbXBsZTogYSBQbGFuZXQgaGFzIGEgXFxcIm5hbWVcXFwiIGF0dHJpYnV0ZVwiLFxuICBcImRvbWFpblwiOiBcImEgZ3JvdXAgb2YgZmFjdHMgd2hpY2ggYXJlIHR5cGljYWxseSB1bnJlbGF0ZWRcIixcbiAgXCJrZXlcIjogXCJhbiBhdHRyaWJ1dGUgdmFsdWUgKG9mIGEgY2F0ZWdvcnkpIHdoaWNoICBpcyB1bmlxdWUgZm9yIHRoZSByZWNvcmRcIixcbiAgXCJ0b29sXCI6IFwiaXMgcG90ZW50aWFseSBjb21tYW5kIHRvIGV4ZWN1dGVcIixcbiAgXCJyZWNvcmRcIjogXCJhIHNwZWNpZmljIHNldCBvZiBcXFwiZmFjdFxcXCJzIG9mIGEgZG9tYWluLCBhIFxcXCJyZWNvcmRcXFwiIGhhcyBhIHNldCBvZiBhdHRyaWJ1dGVzIHZhbHVlcyAoXFxcImZhY3RcXFwicykgb2YgdGhlIGNhdGVnb3JpZXMsIG9mdGVuIGEgcmVjb3JkIGhhcyBhIFxcXCJrZXlcXFwiXCIsXG4gIFwiZmFjdFwiOiBcImEgc3BlY2lmaWMgY2F0ZWdvcnkgdmFsdWUgb2YgYSByZWNvcmQgaW4gYSBkb21haW4sIG1heSBiZSBhIFxcXCJrZXlcXFwiIHZhbHVlXCIsXG59O1xuXG5mdW5jdGlvbiBnZXRSYW5kb21SZXN1bHQoYXJyOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCkgJSBhcnIubGVuZ3RoXTtcbn1cblxuZXhwb3J0IGNsYXNzIFNpbXBsZVVwRG93blJlY29nbml6ZXIgaW1wbGVtZW50cyBidWlsZGVyLklJbnRlbnRSZWNvZ25pemVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgfVxuXG4gIHJlY29nbml6ZShjb250ZXh0OiBidWlsZGVyLklSZWNvZ25pemVDb250ZXh0LCBjYWxsYmFjazogKGVycjogRXJyb3IsIHJlc3VsdDogYnVpbGRlci5JSW50ZW50UmVjb2duaXplclJlc3VsdCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHZhciB1ID0ge30gYXMgYnVpbGRlci5JSW50ZW50UmVjb2duaXplclJlc3VsdDtcblxuICAgIGRlYnVnbG9nKFwicmVjb2duaXppbmcgXCIgKyBjb250ZXh0Lm1lc3NhZ2UudGV4dCk7XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJkb3duXCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQuZG93blwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInN0YXJ0IFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwidXBcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJkb25lXCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwiZXhpdFwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcInF1aXRcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVidWdsb2coJ3JlY29nbml6aW5nIG5vdGhpbmcnKTtcbiAgICB1LmludGVudCA9IFwiTm9uZVwiO1xuICAgIHUuc2NvcmUgPSAwLjE7XG4gICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgIGUxLnN0YXJ0SW5kZXggPSBcImV4aXQgXCIubGVuZ3RoO1xuICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgIGUxLnNjb3JlID0gMC4xO1xuICAgIHUuZW50aXRpZXMgPSBbXTtcbiAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICB9XG59XG5cbmNvbnN0IEFueU9iamVjdCA9IE9iamVjdCBhcyBhbnk7XG5cbnZhciBib3Q7XG5cbnZhciBvSlNPTiA9IEpTT04ucGFyc2UoJycgKyBmcy5yZWFkRmlsZVN5bmMoJy4vcmVzb3VyY2VzL21vZGVsL2ludGVudHMuanNvbicpKTtcbnZhciBvUnVsZXMgPSBQbGFpblJlY29nbml6ZXIucGFyc2VSdWxlcyhvSlNPTik7XG4vLyB2YXIgUmVjb2duaXplciA9IG5ldyAocmVjb2duaXplci5SZWdFeHBSZWNvZ25pemVyKShvUnVsZXMpO1xuXG5cbmZ1bmN0aW9uIGxvZ1F1ZXJ5KHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PGFueT4pIHtcblxuICBmcy5hcHBlbmRGaWxlKCcuL2xvZ3Mvc2hvd21lcXVlcmllcy50eHQnLCBcIlxcblwiICsgSlNPTi5zdHJpbmdpZnkoe1xuICAgIHRleHQ6IHNlc3Npb24ubWVzc2FnZS50ZXh0LFxuICAgIHRpbWVzdGFtcDogc2Vzc2lvbi5tZXNzYWdlLnRpbWVzdGFtcCxcbiAgICBpbnRlbnQ6IGludGVudCxcbiAgICByZXM6IHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoICYmIEpTT04uc3RyaW5naWZ5KHJlc3VsdFswXSkgfHwgXCIwXCIsXG4gICAgY29udmVyc2F0aW9uSWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uLmlkIHx8IFwiXCIsXG4gICAgdXNlcmlkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXJcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyLmlkIHx8IFwiXCJcbiAgfSkgLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXI+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBXaGF0SXMuZHVtcE5pY2VUdXBlbChyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvblxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZCB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlci5pZCB8fCBcIlwiXG4gIH0pLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGd3b3JkcyA9IHt9O1xuLyoqXG4gKiBDb25zdHJ1Y3QgYSBib3RcbiAqIEBwYXJhbSBjb25uZWN0b3Ige0Nvbm5lY3Rvcn0gdGhlIGNvbm5lY3RvciB0byB1c2VcbiAqIEhUTUxDb25uZWN0b3JcbiAqIG9yIGNvbm5lY3RvciA9IG5ldyBidWlsZGVyLkNvbnNvbGVDb25uZWN0b3IoKS5saXN0ZW4oKVxuICovXG5mdW5jdGlvbiBtYWtlQm90KGNvbm5lY3RvcixcbiAgbW9kZWxQcm92aWRlcjogKCkgPT4gUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4sIG9wdGlvbnM/OiBhbnkpOiBidWlsZGVyLlVuaXZlcnNhbEJvdCB7XG4gIHZhciB0MCA9IERhdGUubm93KCk7XG4gIHZhciB0aGVNb2RlbFAgPSBtb2RlbFByb3ZpZGVyKCk7XG4gIHRoZU1vZGVsUC50aGVuKFxuICAgICh0aGVNb2RlbCkgPT4ge1xuICAgICAgdmFyIHQgPSBEYXRlLm5vdygpIC0gdDA7XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNob3dNb2RlbExvYWRUaW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBtb2RlbCBsb2FkIHRpbWUgJHsodCl9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgZnVuY3Rpb24gZ2V0VGhlTW9kZWwoKTogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xuICAgIHJldHVybiB0aGVNb2RlbFA7XG4gIH1cblxuICBib3QgPSBuZXcgYnVpbGRlci5Vbml2ZXJzYWxCb3QoY29ubmVjdG9yKTtcbiAgdmFyIHJlY29nbml6ZXIgPSBuZXcgUGxhaW5SZWNvZ25pemVyLlJlZ0V4cFJlY29nbml6ZXIob1J1bGVzKTtcbiAgdmFyIGRpYWxvZyA9IG5ldyBidWlsZGVyLkludGVudERpYWxvZyh7IHJlY29nbml6ZXJzOiBbcmVjb2duaXplcl0gfSk7XG4gIHZhciBkaWFsb2dVcERvd24gPSBuZXcgYnVpbGRlci5JbnRlbnREaWFsb2coeyByZWNvZ25pemVyczogW25ldyBTaW1wbGVVcERvd25SZWNvZ25pemVyKCldIH0pO1xuXG4gIGJvdC5kaWFsb2coJy91cGRvd24nLCBkaWFsb2dVcERvd24pO1xuICBkaWFsb2dVcERvd24ub25CZWdpbihmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChnZXRSYW5kb21SZXN1bHQoYUVudGVyVHJhaW4pKSk7XG4gICAgLy9zZXNzaW9uLnNlbmQoXCJIaSB0aGVyZSwgdXBkb3duIGlzIHdhaXRpbmcgZm9yIHlvdVwiKTtcbiAgfSlcblxuICBkaWFsb2dVcERvd24ubWF0Y2hlcygnaW50ZW50LnVwJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gYXJncyB8fCB7fTtcbiAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICd5b3Ugd2FudCB0byBleGl0IHRyYWluaW5nPyB0eXBlIFxcXCJkb25lXFxcIiBhZ2Fpbi4nKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgbmV4dCgpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgIHNlc3Npb24uZW5kRGlhbG9nV2l0aFJlc3VsdCh7IHJlc3BvbnNlOiBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjIH0pO1xuICAgIH1cbiAgXVxuICApO1xuXG4gIGRpYWxvZ1VwRG93bi5tYXRjaGVzKCdpbnRlbnQuZG93bicsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IGFyZ3MgfHwge307XG4gICAgICBidWlsZGVyLlByb21wdHMudGV4dChzZXNzaW9uLCAneW91IHdhbnQgdG8gZ28gZG93biEnKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gLTE7IC8vIHJlc3VsdHMucmVwb25zZTtcbiAgICAgIG5leHQoKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJzdGlsbCBnb2luZyBkb3duP1wiKTtcbiAgICB9XG4gIF1cbiAgKTtcbiAgZGlhbG9nVXBEb3duLm9uRGVmYXVsdChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgIGxvZ1F1ZXJ5KHNlc3Npb24sIFwib25EZWZhdWx0XCIpO1xuICAgIHZhciByZXMgPSBnZXRSYW5kb21SZXN1bHQoYVRyYWluRGlhbG9nKSArIGdldFJhbmRvbVJlc3VsdChhVHJhaW5FeGl0SGludCk7XG4gICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKHJlcykpO1xuICB9KTtcblxuICAvKlxuICAgIGJvdC5kaWFsb2coJy90cmFpbicsIFtcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICAgIHNlc3Npb24uZGlhbGdvRGF0YS5hYmMgPSBhcmdzIHx8IHt9O1xuICAgICAgICBidWlsZGVyLlByb21wdHMudGV4dChzZXNzaW9uLCAnRG8geW91IHdhbnQgdG8gdHJhaW4gbWUnKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICAgIHNlc3Npb24uZW5kRGlhbG9nV2l0aFJlc3VsdCh7IHJlc3BvbnNlOiBzZXNzaW9uLkRpYWxvZ0RhdGEuYWJjIH0pO1xuICAgICAgfVxuICAgIF0pO1xuICAqL1xuXG4gIGJvdC5kaWFsb2coJy8nLCBkaWFsb2cpO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdTaG93TWUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gU2hvd01lIGlzIGEgc3BlY2lhbCBmb3JtIG9mIFdoYXRJcyB3aGljaCBhbHNvIHNlbGVjdHMgdGhlXG4gICAgICAvLyBcImNsb3Nlc3QgX3VybFwiIHJhbmtlZCBieSBfcHJlZmVycmVkVXJsT3JkZXJcbiAgICAgIC8vIGlmIHByZXNlbnQsIHRoZSBfdXJsIGlzIHB1dCBpbnRvIGV4ZWMuYWN0aW9uXG4gICAgICAvL1xuICAgICAgLy8vIFRPRE8gUkVNT0RFTFxuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZGVidWdsb2coXCJTaG93IEVudGl0eVwiKTtcbiAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIHZhciBhMSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuICAgICAgICBMaXN0QWxsLmxpc3RBbGxTaG93TWUoYTEuZW50aXR5LCB0aGVNb2RlbCkudGhlbihcbiAgICAgICAgICByZXN1bHRTaG93TWUgPT4ge1xuICAgICAgICAgICAgbG9nUXVlcnkoc2Vzc2lvbiwgJ1Nob3dNZScsIChyZXN1bHRTaG93TWUgYXMgYW55KS5iZXN0VVJJKTtcbiAgICAgICAgICAgIC8vIHRlc3QuZXhwZWN0KDMpXG4gICAgICAgICAgICAvLyAgdGVzdC5kZWVwRXF1YWwocmVzdWx0LndlaWdodCwgMTIwLCAnY29ycmVjdCB3ZWlnaHQnKTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0U2hvd01lIHx8ICEocmVzdWx0U2hvd01lIGFzIGFueSkuYmVzdFVSSSkge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJTaG93TWVcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBnZXQgd2hhdCB5b3Ugd2FudFwiKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBiZXN0VVJJID0gKHJlc3VsdFNob3dNZSBhcyBhbnkpLmJlc3RVUkk7XG4gICAgICAgICAgICAvLyBkZWJ1Z2xvZygncmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgICAgICBkZWJ1Z2xvZygnYmVzdCByZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0U2hvd01lIHx8IHt9LCB1bmRlZmluZWQsIDIpKTtcblxuICAgICAgICAgICAgLy8gdGV4dCA6IFwic3RhcnRpbmcgdW5pdCB0ZXN0IFxcXCJcIiArIHVuaXR0ZXN0ICsgXCJcXFwiXCIrICAodXJsPyAgKCcgd2l0aCB1cmwgJyArIHVybCApIDogJ25vIHVybCA6LSgnICksXG4gICAgICAgICAgICAvLyAgICAgIGFjdGlvbiA6IHsgdXJsOiB1cmwgfVxuXG4gICAgICAgICAgICB2YXIgcmVwbHkgPSBuZXcgYnVpbGRlci5NZXNzYWdlKHNlc3Npb24pXG4gICAgICAgICAgICAgIC50ZXh0KFwic3RhcnRpbmcgdXJpIFwiICsgYmVzdFVSSSlcbiAgICAgICAgICAgICAgLmFkZEVudGl0eSh7IHVybDogYmVzdFVSSSB9KSAvLyBleGVjLmFjdGlvbik7XG4gICAgICAgICAgICAvLyAuYWRkQXR0YWNobWVudCh7IGZhbGxiYWNrVGV4dDogXCJJIGRvbid0IGtub3dcIiwgY29udGVudFR5cGU6ICdpbWFnZS9qcGVnJywgY29udGVudFVybDogXCJ3d3cud29tYmF0Lm9yZ1wiIH0pO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQocmVwbHkpKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdXaGF0SXMnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcblxuICAgICAgLy8gVE9ETyBTV0lUSCBUTyBNT05HT1FVRVJJRVNcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICBkZWJ1Z2xvZyhcIldoYXRJcyBFbnRpdGllc1wiKTtcbiAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcnknKTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXNqb2luZWQgPSBjYXRlZ29yeUVudGl0eS5lbnRpdHk7XG4gICAgICAgIHZhciBpblN0aCA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yaWVzam9pbmVkLCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHM6IFwiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAvLyBjdXJyZW50bHkgd2UgZG8gbm90IGV4dHJhY3QgY2F0ZWdvcmllcyBjb3JyZWN0bHkgLCB0aHVzIHdlIHJhdGhlciBpZ25vcmUgYW5kIGdvIG9uXG4gICAgICAgICAgICAvL2p1c3QgZ28gb24gICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllc2pvaW5lZCArXG4gICAgICAgICAgICAvLyAgICAgKGUgPyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScgOiBcIlwiKSkpO1xuICAgICAgICAgICAgLy8gICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAvLyAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGVNb2RlbC5ydWxlcy53b3JkTWFwWydjby1maW8nXSkpO1xuICAgICAgICB2YXIgcXVlcnkgPSBjYXRlZ29yaWVzam9pbmVkO1xuICAgICAgICB2YXIgaW5Tb21ldGhpbmcgPSBpblN0aCAmJiBpblN0aC5lbnRpdHkgfHwgXCJcIjtcbiAgICAgICAgaWYgKGluU3RoKSB7XG4gICAgICAgICAgcXVlcnkgPSBjYXRlZ29yaWVzam9pbmVkICsgJyB3aXRoICcgKyBpblN0aC5lbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgTW9uZ29RdWVyaWVzLmxpc3RBbGwocXVlcnksIHRoZU1vZGVsKS50aGVuKHJlc3VsdFdJID0+IHtcbiAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnZ290IHJlc3VsdCcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpXG5cbiAgICAgICAgICB2YXIgZXJyX2V4cGxhaW4gPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdFdJKTtcbiAgICAgICAgICBpZiAoZXJyX2V4cGxhaW4pIHtcbiAgICAgICAgICAgIC8vZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXQgKyBcIiAoXCIgKyBjYXRlZ29yeSArICcpXFxcIiBpbiByZWxhdGlvbiB0byBcIicgKyBhMS5lbnRpdHkgKyBgXCIuJHtleHBsYWlufWApKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllc2pvaW5lZCArIFwiXFxcIiAoXCIgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChjYXRzKSArICcpIGluIHJlbGF0aW9uIHRvIFwiJyArIGluU3RoLmVudGl0eSArIGBcIi4ke2Vycl9leHBsYWlufWApKTtcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChlcnJfdGV4dCkpO1xuICAgICAgICAgICAgLy8gIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0V0kpKTtcbiAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0V0kpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdDIgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgLy8gZGVidWdsb2coJ3Jlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ2Jlc3QgcmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJWzBdLnJlc3VsdHNbMF0gfHwge30sIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkPyAoJ3RvcCA6ICcgKyBXaGF0SXMuZHVtcFdlaWdodHNUb3AocmVzdWx0MS50dXBlbGFuc3dlcnNbMF0ucmVzdWx0WzBdIHx8IHt9LCB7IHRvcDogMyB9KSk6ICctJyk7XG4gICAgICAgICAgLy8gVE9ETyBjbGVhbnNlZCBzZW50ZW5jZVxuXG4gICAgICAgICAgLy9kaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnVGhlICcgKyBjYXRlZ29yaWVzam9pbmVkICsgJyBvZiAnICsgaW5TdGguZW50aXR5ICsgJyBpcyAnICtcbiAgICAgICAgICAvL3Jlc3VsdFdJLnR1cGVsYW5zd2Vyc1swXS5yZXN1bHQgKyBcIlxcblwiKSk7XG5cblxuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdCA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpIDogJy0nKTtcbiAgICAgICAgICAvLyBUT0RPIFdoeSBvbmx5IEZJUlNUIT8/P1xuICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKFtyZXN1bHRXSVswXV0pKTtcbiAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0V0kpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdDIgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgaWYgKGpvaW5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IGluU29tZXRoaW5nID8gJyBvZiAnICsgaW5Tb21ldGhpbmcgOiAnJztcbiAgICAgICAgICAgIGlmIChjYXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnVGhlICcgKyBjYXRlZ29yaWVzam9pbmVkICsgc3VmZml4ICsgJyBpcyAnICtcbiAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyArIFwiXFxuXCIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKFwiVGhlIFwiICsgY2F0ZWdvcmllc2pvaW5lZCArIHN1ZmZpeCArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBlcnJwcmVmaXggPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdFdJKSB8fCAnJztcbiAgICAgICAgICAgIHZhciBzdWZmaXgyID0gaW5Tb21ldGhpbmcgPyAnIGZvciAnICsgaW5Tb21ldGhpbmcgOiAnJztcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3JpZXNqb2luZWQgKyBzdWZmaXgyICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSArIFwiXCIgKyBlcnJwcmVmaXgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnTGlzdEFsbCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBMaXN0QWxsXCIpO1xuICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgIHZhciBjYXRlZ29yeSA9IGNhdGVnb3J5RW50aXR5LmVudGl0eTtcbiAgICAgIHZhciBpblN0aEVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdpbnN0aCcpXG4gICAgICB2YXIgaW5Tb21ldGhpbmcgPSBpblN0aEVudGl0eSAmJiBpblN0aEVudGl0eS5lbnRpdHk7XG4gICAgICAvLyBzb21lIG1ldGFxdWVyaWVzOlxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuXG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJjYXRlZ29yaWVzXCIpIHtcbiAgICAgICAgICAvLyBkbyB3ZSBoYXZlIGEgZmlsdGVyID9cbiAgICAgICAgICB2YXIgZG9tYWluID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgICAgZG9tYWluID0gTGlzdEFsbC5pbmZlckRvbWFpbih0aGVNb2RlbCwgaW5Tb21ldGhpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwuY2F0ZWdvcnkpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgaWYgKGluU29tZXRoaW5nKSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBpbmZlciBhIGRvbWFpbiByZXN0cmljdGlvbiBmcm9tIFxcXCJcIiArIFV0aWxzLnN0cmlwUXVvdGVzKGluU29tZXRoaW5nKSArIFwiXFxcIiwgYWxsIG15IGNhdGVnb3JpZXMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBjYXRlZ29yaWVzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYVJlcyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBhUmVzKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIm15IGNhdGVnb3JpZXMgaW4gZG9tYWluIFxcXCJcIiArIGRvbWFpbiArIFwiXFxcIiBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcImRvbWFpbnNcIikge1xuICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmRvbWFpbnMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIm15IGRvbWFpbnMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhlTW9kZWwucnVsZXMud29yZE1hcFsnY28tZmlvJ10pKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gY2F0ZWdvcnk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzam9pbmVkID0gY2F0ZWdvcnk7XG4gICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgIHF1ZXJ5ID0gY2F0ZWdvcnkgKyAnIHdpdGggJyArIGluU29tZXRoaW5nO1xuICAgICAgICB9XG4gICAgICAgIE1vbmdvUXVlcmllcy5saXN0QWxsKHF1ZXJ5LCB0aGVNb2RlbCkudGhlbihyZXN1bHQxID0+IHtcbiAgICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZygnYW5hbHl6aW5nIGNhdGVnb3J5IGZyb20gJyArIGNhdGVnb3J5KTtcbiAgICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yeSwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHM6IFwiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvbjogXCIgKyBlKTtcbiAgICAgICAgICAgICAgLy8gR28gb24gZm9yIG5vd1xuICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgIC8vICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcnkgK1xuICAgICAgICAgICAgICAvLyAgICAoZSA/ICcoJyArIGUudG9TdHJpbmcoKSArICcpJyA6IFwiXCIpKSk7XG4gICAgICAgICAgICAgIC8vICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAgIC8vICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vdmFyIHJlc3VsdDEgPSBMaXN0QWxsLmxpc3RBbGxXaXRoQ29udGV4dChjYXQsIGluU29tZXRoaW5nLFxuICAgICAgICAgIC8vICB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXQpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdCA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSkgOiAnLScpO1xuICAgICAgICAgIHZhciBlcnJfZXhwbGFpbiA9IExpc3RBbGwucmV0dXJuRXJyb3JUZXh0SWZPbmx5RXJyb3IocmVzdWx0MSk7XG4gICAgICAgICAgaWYgKGVycl9leHBsYWluKSB7XG4gICAgICAgICAgICAvL2RpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ICsgXCIgKFwiICsgY2F0ZWdvcnkgKyAnKVxcXCIgaW4gcmVsYXRpb24gdG8gXCInICsgYTEuZW50aXR5ICsgYFwiLiR7ZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gaW5Tb21ldGhpbmcgPyAnaW4gcmVsYXRpb24gdG8gXCInICsgaW5Tb21ldGhpbmcgKyAnXCInIDogJyc7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgKyBcIlxcXCIgKFwiICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0cykgKyAnKScgKyBzdWZmaXggKyBgLiR7ZXJyX2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKGVycl90ZXh0KSk7XG4gICAgICAgICAgICAvLyAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHQxKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdDEpO1xuICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDEpKSk7XG4gICAgICAgICAgdmFyIHN1ZmZpeCA9IChpblNvbWV0aGluZykgPyBcIiBmb3IgXCIgKyBpblNvbWV0aGluZyA6IFwiXCI7XG4gICAgICAgICAgaWYgKGpvaW5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwidGhlIFwiICsgY2F0ZWdvcnkgKyBzdWZmaXggKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gXCJcIjtcbiAgICAgICAgICAgIHZhciBlcnJwcmVmaXggPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdDEpIHx8ICcnO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBzdWZmaXggKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpICsgXCJcIiArIGVycnByZWZpeCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG5cbiAgZGlhbG9nLm1hdGNoZXMoJ2J1aWxkdGFibGUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogYnVpbGR0YWJsZVwiKTtcbiAgICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJykuZW50aXR5O1xuICAgICAgICBkZWJ1Z2xvZyhcImZhY3RPckNhdCBpc1wiICsgY2F0ZWdvcmllcyk7XG4gICAgICAgIHZhciBjYXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yaWVzLCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHNcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXMgKyAnXCIoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNhdHMgfHwgKGNhdHMubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkaWQgbm90IGZpbmQgYSBjYXRlZ29yeSBpbiBcIicgKyBjYXRlZ29yaWVzICsgJ1wiJykpO1xuICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV4ZWMgPSBNYWtlVGFibGUubWFrZVRhYmxlKGNhdHMsIHRoZU1vZGVsKTtcbiAgICAgICAgLy8gICAgICBjb25zdCBleGVjID0gRXhlY1NlcnZlci5leGVjVG9vbChzZXNzaW9uLmRpYWxvZ0RhdGEucmVzdWx0IGFzIElNYXRjaC5JVG9vbE1hdGNoLCB0aGVNb2RlbC5yZWNvcmRzKTtcbiAgICAgICAgdmFyIHJlcGx5ID0gbmV3IGJ1aWxkZXIuTWVzc2FnZShzZXNzaW9uKVxuICAgICAgICAgIC50ZXh0KGV4ZWMudGV4dClcbiAgICAgICAgICAuYWRkRW50aXR5KGV4ZWMuYWN0aW9uKTtcbiAgICAgICAgLy8gLmFkZEF0dGFjaG1lbnQoeyBmYWxsYmFja1RleHQ6IFwiSSBkb24ndCBrbm93XCIsIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZycsIGNvbnRlbnRVcmw6IFwid3d3LndvbWJhdC5vcmdcIiB9KTtcbiAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQocmVwbHkpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ0Rlc2NyaWJlJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBEZXNjcmliZVwiKTtcbiAgICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgICB2YXIgZmFjdEVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgICB2YXIgZmFjdE9yQ2F0ID0gZmFjdEVudGl0eSAmJiBmYWN0RW50aXR5LmVudGl0eTtcbiAgICAgICAgdmFyIGRvbWFpbkVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdEJyk7XG4gICAgICAgIHZhciBkb21haW5TID0gZG9tYWluRW50aXR5ICYmIGRvbWFpbkVudGl0eS5lbnRpdHk7XG4gICAgICAgIHZhciBmaWx0ZXJEb21haW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChkb21haW5TKSB7XG4gICAgICAgICAgZmlsdGVyRG9tYWluID0gTGlzdEFsbC5pbmZlckRvbWFpbih0aGVNb2RlbCwgZG9tYWluUyk7XG4gICAgICAgICAgZGVidWdsb2coXCJnb3QgZG9tYWluXCIgKyBmaWx0ZXJEb21haW4pO1xuICAgICAgICAgIGlmICghZmlsdGVyRG9tYWluKSB7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGluZmVyIGEgZG9tYWluIHJlc3RyaWN0aW9uIGZyb20gXFxcIlwiICsgZG9tYWluUyArIFwiXFxcIi4gU3BlY2lmeSBhbiBleGlzdGluZyBkb21haW4uIChMaXN0IGFsbCBkb21haW5zKSB0byBnZXQgZXhhY3QgbmFtZXMuXFxuXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Z2xvZyhcImZhY3RPckNhdCBpc1wiICsgZmFjdE9yQ2F0KTtcbiAgICAgICAgaWYgKG1ldGF3b3Jkc0Rlc2NyaXB0aW9uc1tmYWN0T3JDYXQudG9Mb3dlckNhc2UoKV0pIHtcbiAgICAgICAgICAvLyBkbyB3ZSBoYXZlIGEgZmlsdGVyID9cbiAgICAgICAgICB2YXIgcHJlZml4ID0gXCJcIjtcbiAgICAgICAgICBpZiAoZmlsdGVyRG9tYWluKSB7XG4gICAgICAgICAgICBwcmVmaXggPSAnXCJpbiBkb21haW4gXCInICsgZmlsdGVyRG9tYWluICsgJ1wiIG1ha2Ugbm8gc2Vuc2Ugd2hlbiBtYXRjaGluZyBhIG1ldGF3b3JkLlxcbic7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlYnVnbG9nKFwic2hvd2luZyBtZXRhIHJlc3VsdFwiKTtcbiAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKHByZWZpeCArICdcIicgKyBmYWN0T3JDYXQgKyAnXCIgaXMgJyArIG1ldGF3b3Jkc0Rlc2NyaXB0aW9uc1tmYWN0T3JDYXQudG9Mb3dlckNhc2UoKV0gKyBcIlwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGlmIChXaGF0SXMuc3BsaXRBdENvbW1hQW5kKGZhY3RPckNhdCkubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQoXCJXaG9hLCBpIGNhbiBvbmx5IGV4cGxhaW4gb25lIHRoaW5nIGF0IGEgdGltZSwgbm90IFxcXCJcIiArIGZhY3RPckNhdCArIFwiXFxcIi4gUGxlYXNlIGFzayBvbmUgYXQgYSB0aW1lLlwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIC8vIGdldERvbWFpbnNGb3JDYXRlZ29yeVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIHZhciBjYXRlZ29yeSA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnkoZmFjdE9yQ2F0LCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgIC8vdmFyIGNhdFJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIGNhdFJlc3VsdHNQID0gdW5kZWZpbmVkIGFzIFByb21pc2U8c3RyaW5nW10+O1xuICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAvL1RPRE9cbiAgICAgICAgICBjYXRSZXN1bHRzUCA9IERlc2NyaWJlLmRlc2NyaWJlQ2F0ZWdvcnkoY2F0ZWdvcnksIGZpbHRlckRvbWFpbiwgdGhlTW9kZWwsIG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhdFJlc3VsdHNQID0gKGdsb2JhbC5Qcm9taXNlIGFzIGFueSkucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cblxuICAgICAgICBjYXRSZXN1bHRzUC50aGVuKGNhdFJlc3VsdHMgPT4ge1xuICAgICAgICAgIHZhciByZXNGYWN0ID0gRGVzY3JpYmUuZGVzY3JpYmVGYWN0SW5Eb21haW4oZmFjdE9yQ2F0LCBmaWx0ZXJEb21haW4sIHRoZU1vZGVsKS50aGVuKChyZXNGYWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChjYXRSZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHZhciBwcmVmaXhlZCA9IGNhdFJlc3VsdHMubWFwKHJlcyA9PlxuICAgICAgICAgICAgICAgIGAke0Rlc2NyaWJlLnNsb3BweU9yRXhhY3QoY2F0ZWdvcnksIGZhY3RPckNhdCwgdGhlTW9kZWwpfSAgJHtyZXN9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2F0UmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmVzRmFjdCA9IHByZWZpeGVkLmpvaW4oXCJcXG5cIik7ICsgXCJcXG5cIiArIHJlc0ZhY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKHJlc0ZhY3QpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvKlxuICAgICAgICAgICAgICB2YXIgYVJlcyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XG4gICAgICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBhUmVzKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcIm15IGNhdGVnb3JpZXMgaW4gZG9tYWluIFxcXCJcIiArIGRvbWFpbiArIFwiXFxcIiBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiZG9tYWluc1wiKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC5kb21haW5zKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLCBzZW5kKFwibXkgZG9tYWlucyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcInRvb2xzXCIpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLnRvb2xzKS5tYXAoZnVuY3Rpb24gKG9Ub29sKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvVG9vbC5uYW1lO1xuICAgICAgICAgICAgfSkuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sc2VuZChcIm15IHRvb2xzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAqL1xuXG4gICAgICAgICAgLypcbiAgICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdDIoY2F0ZWdvcnksIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIGlmKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIixzZXNzaW9uLHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICsgJ1wiKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghY2F0cyB8fCAoY2F0cy5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yeSArICdcIicpKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGNhdCA9IFwiXCI7XG4gICAgICAgICAgaWYoIGNhdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBjYXQgPSBjYXRzWzBdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiggY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdjYXRlZ29yeSBpZGVudGlmaWVkOicgKyBjYXQpO1xuICAgICAgICAgICAgaWYgKGExICYmIGExLmVudGl0eSkge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ290IGZpbHRlcjonICsgYTEuZW50aXR5KTtcbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0ID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KHRoZU1vZGVsLCBjYXQsIHRydWUpO1xuICAgICAgICAgICAgICB2YXIgcmVzdWx0MSA9IExpc3RBbGwubGlzdEFsbFdpdGhDb250ZXh0KGNhdCwgYTEuZW50aXR5LFxuICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldCk7XG4gICAgICAgICAgICAgIC8vIFRPRE8gY2xhc3NpZnlpbmcgdGhlIHN0cmluZyB0d2ljZSBpcyBhIHRlcnJpYmxlIHdhc3RlXG4gICAgICAgICAgICAgIGlmICghcmVzdWx0MS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ29pbmcgZm9yIGhhdmluZycpO1xuICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcnkodGhlTW9kZWwsIGNhdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlc3VsdDEgPSBMaXN0QWxsLmxpc3RBbGxIYXZpbmdDb250ZXh0KGNhdCwgYTEuZW50aXR5LCB0aGVNb2RlbC5ydWxlcyxcbiAgICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0RnVsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSk7XG4gICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQxKSk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0MSk7XG4gICAgICAgICAgICAgIGlmKGpvaW5yZXN1bHRzLmxlbmd0aCApe1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIG5vIGVudGl0eSwgZS5nLiBsaXN0IGFsbCBjb3VudHJpZXNcbiAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeSh0aGVNb2RlbCwgY2F0LCBmYWxzZSk7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBMaXN0QWxsLmxpc3RBbGxIYXZpbmdDb250ZXh0KGNhdCwgY2F0LCB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXMoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGlzIGNhdD5cIiArIGNhdCk7XG4gICAgICAgICAgICAgICAgaWYoY2F0ICE9PSBcImV4YW1wbGUgcXVlc3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHMocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcIkZvdW5kIG5vIGRhdGEgaGF2aW5nIFxcXCJcIiArIGNhdCArIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtdWx0aXBsZSBjYXRlZ29yaWVzXG4gICAgICAgICAgICBkZWJ1Z2xvZygnY2F0ZWdvcmllcyBpZGVudGlmaWVkOicgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICAgIGlmIChhMSAmJiBhMS5lbnRpdHkpIHtcbiAgICAgICAgICAgICAgZGVidWdsb2coJ2dvdCBmaWx0ZXI6JyArIGExLmVudGl0eSk7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKHRoZU1vZGVsLCBjYXRzLCB0cnVlKTtcbiAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLHNlc3Npb24sc2VuZCgnSSBjYW5ub3QgY29tYmluZSBcIicgKyBjYXRlZ29yeSArICcoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciByZXN1bHQxVCA9IExpc3RBbGwubGlzdEFsbFR1cGVsV2l0aENvbnRleHQoY2F0cywgYTEuZW50aXR5LFxuICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldCk7XG4gICAgICAgICAgICAgIC8vIFRPRE8gY2xhc3NpZnlpbmcgdGhlIHN0cmluZyB0d2ljZSBpcyBhIHRlcnJpYmxlIHdhc3RlXG4gICAgICAgICAgICAgIGlmICghcmVzdWx0MVQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2dvaW5nIGZvciBoYXZpbmcnKTtcbiAgICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3JpZXModGhlTW9kZWwsIGNhdHMsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQxVCA9IExpc3RBbGwubGlzdEFsbFR1cGVsSGF2aW5nQ29udGV4dChjYXRzLCBhMS5lbnRpdHksIHRoZU1vZGVsLnJ1bGVzLFxuICAgICAgICAgICAgICAgICAgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDFUKSk7XG4gICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdDFUKSk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxVCk7XG4gICAgICAgICAgICAgIGlmKGpvaW5yZXN1bHRzLmxlbmd0aCApe1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIG5vIGVudGl0eSwgZS5nLiBsaXN0IGFsbCBjb3VudHJpZXNcbiAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IHt9IGFzIHsgW2tleSA6IHN0cmluZ10gOiBib29sZWFufTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyh0aGVNb2RlbCwgY2F0cywgZmFsc2UpO1xuICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsc2Vzc2lvbixzZW5kKCdJIGNhbm5vdCBjb21iaW5lIFwiJyArIGNhdGVnb3J5ICsgJygnICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgcmVzdWx0VCA9IExpc3RBbGwubGlzdEFsbFR1cGVsSGF2aW5nQ29udGV4dChjYXRzLCBcIlxcXCJcIiArIGNhdHMuam9pbihcIlxcXCIgXFxcIlwiKSArIFwiXFxcIlwiLCB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFQpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0VC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFQpKTtcbiAgICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgaXMgY2F0PlwiICsgY2F0cy5qb2luKFwiLCBcIikpO1xuICAgICAgICAgICAgICAgIGlmKGNhdCAhPT0gXCJleGFtcGxlIHF1ZXN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0VCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHRUKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJGb3VuZCBubyBkYXRhIGhhdmluZyBcXFwiXCIgKyBjYXQgKyBcIlxcXCJcIlxuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1RyYWluTWUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogVHJhaW5cIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpO1xuICAgICAgaWYgKG1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmRleE9mKFwia3Jvbm9zXCIpID49IDAgfHwgbWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJrbGluZ29uXCIpID49IDApIHtcbiAgICAgICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhVHJhaW5Ob0tsaW5nb24pKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciByZXMgPSBnZXRSYW5kb21SZXN1bHQoYVRyYWluUmVwbGllcyk7XG4gICAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQocmVzKSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnVG9vTG9uZycsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBUb29Mb25nXCIpO1xuICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgIGRpYWxvZ2xvZyhcIlRvb0xvbmdcIiwgc2Vzc2lvbiwgc2VuZChnZXRSYW5kb21SZXN1bHQoYVJlc3BvbnNlc09uVG9vTG9uZykpKTtcbiAgICB9XG4gIF0pO1xuXG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1dyb25nJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICAvKlxuICAgICAgZGlhbG9nTG9nZ2VyKHtcbiAgICAgICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICAgICAgaW50ZW50OiBcIldyb25nXCIsXG4gICAgICAgIHJlc3BvbnNlOiAnPGJlZ2luIHVwZG93bj4nXG4gICAgICB9KTsgKi9cbiAgICAgIHNlc3Npb24uYmVnaW5EaWFsb2coJy91cGRvd24nLCBzZXNzaW9uLnVzZXJEYXRhLmNvdW50KTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICB2YXIgYWxhcm0gPSBzZXNzaW9uLmRpYWxvZ0RhdGEuYWxhcm07XG4gICAgICBuZXh0KCk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgc2Vzc2lvbi5zZW5kKGdldFJhbmRvbVJlc3VsdChhQmFja0Zyb21UcmFpbmluZykpOyAvLyAgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRzKSk7XG4gICAgICAvL3Nlc3Npb24uc2VuZCgnZW5kIG9mIHdyb25nJyk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnRXhpdCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgZGVidWdsb2coJ2V4aXQgOicpO1xuICAgICAgZGVidWdsb2coJ2V4aXQnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcykpO1xuICAgICAgZGlhbG9nTG9nZ2VyKHtcbiAgICAgICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICAgICAgaW50ZW50OiBcIkV4aXRcIixcbiAgICAgICAgcmVzcG9uc2U6ICd5b3UgYXJlIGluIGEgbG9naWMgbG9vcCdcbiAgICAgIH0pO1xuICAgICAgc2Vzc2lvbi5zZW5kKFwieW91IGFyZSBpbiBhIGxvZ2ljIGxvb3AgXCIpO1xuICAgIH1cbiAgXSk7XG4gIGRpYWxvZy5tYXRjaGVzKCdIZWxwJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBkZWJ1Z2xvZygnaGVscCA6Jyk7XG4gICAgICBkZWJ1Z2xvZygnaGVscCcpO1xuICAgICAgc2Vzc2lvbi5zZW5kKFwiSSBrbm93IGFib3V0IC4uLi4gPGNhdGVnb3JpZXM+PlwiKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5vbkRlZmF1bHQoZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICBsb2dRdWVyeShzZXNzaW9uLCBcIm9uRGVmYXVsdFwiKTtcbiAgICB2YXIgZWxpemEgPSBnZXRFbGl6YUJvdChnZXRDb252ZXJzYXRpb25JZChzZXNzaW9uKSk7XG4gICAgdmFyIHJlcGx5ID0gZWxpemEudHJhbnNmb3JtKHNlc3Npb24ubWVzc2FnZS50ZXh0KTtcbiAgICBkaWFsb2dsb2coXCJlbGl6YVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgLy9uZXcgRWlsemFib3RcbiAgICAvL3Nlc3Npb24uc2VuZChcIkkgZG8gbm90IHVuZGVyc3RhbmQgdGhpcyBhdCBhbGxcIik7XG4gICAgLy9idWlsZGVyLkRpYWxvZ0FjdGlvbi5zZW5kKCdJXFwnbSBzb3JyeSBJIGRpZG5cXCd0IHVuZGVyc3RhbmQuIEkgY2FuIG9ubHkgc2hvdyBzdGFydCBhbmQgcmluZycpO1xuICB9KTtcblxuICByZXR1cm4gYm90O1xufVxuXG5pZiAobW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFUcmFpbk5vS2xpbmdvbjogYVRyYWluTm9LbGluZ29uLFxuICAgIGFUcmFpblJlcGxpZXM6IGFUcmFpblJlcGxpZXMsXG4gICAgcmVzdHJpY3REYXRhOiByZXN0cmljdERhdGEsXG4gICAgaXNBbm9ueW1vdXM6IGlzQW5vbnltb3VzLFxuICAgIFNpbXBsZVVwRG93blJlY29nbml6ZXI6IFNpbXBsZVVwRG93blJlY29nbml6ZXIsXG4gICAgYVJlc3BvbnNlc09uVG9vTG9uZzogYVJlc3BvbnNlc09uVG9vTG9uZyxcbiAgICBtZXRhd29yZHNEZXNjcmlwdGlvbnM6IG1ldGF3b3Jkc0Rlc2NyaXB0aW9ucyxcbiAgICBtYWtlQm90OiBtYWtlQm90XG4gIH07XG59XG4iXX0=
