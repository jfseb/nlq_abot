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
/*

function logQueryWhatIs(session: builder.Session, intent: string, result?: Array<IMatch.IWhatIsAnswer>) {

  fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
    text: session.message.text,
    timestamp: session.message.timestamp,
    intent: intent,
    res: result && result.length && WhatIs.dumpNice(result[0]) || "0",
    conversationId: session.message.address
    && session.message.address.conversation
    && session.message.address.conversation.id || "",
    userid: session.message.address
    && session.message.address.user
    && session.message.address.user.id || ""
  }), function (err, res) {
    if (err) {
      debuglog("logging failed " + err);
    }
  });
}
*/
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
    // Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
    // var model = sensitive.modelurl;
    // var model = 'https://api.projectoxford.ai/luis/v2.0/apps/c413b2ef-382c-45bd-8ff0-f76d60e2a821?subscription-key=c21398b5980a4ce09f474bbfee93b892&q='
    var recognizer = new PlainRecognizer.RegExpRecognizer(oRules);
    var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
    // dialog.onBegin(function(session,args) {
    // console.log("beginning ...")
    // session.dialogData.retryPrompt = args && args.retryPrompt || "I am sorry"
    // session.send("What do you want?")
    //
    // })
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
            // ShowMe is a special form of WhatIs which also selects teh
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
    /*
      // Add intent handlers
      dialog.matches('train', [
        function (session, args, next) {
          debuglog('train');
          // Resolve and store any entities passed from LUIS.
          var title = builder.EntityRecognizer.findEntity(args.entities, 'builtin.alarm.title');
          var time = builder.EntityRecognizer.resolveTime(args.entities);
          var alarm = session.dialogData.alarm = {
            title: title ? title.entity : null,
            timestamp: time ? time.getTime() : null
          };
          // Prompt for title
          if (!alarm.title) {
            dialogLogger({
              session: session,
              intent: "train",
              response: 'What fact would you like to train?'
            });
            builder.Prompts.text(session, 'What fact would you like to train?');
          } else {
            next();
          }
        },
        function (session, results, next) {
          var alarm = session.dialogData.alarm;
          if (results.response) {
            alarm.title = results.response;
          }
  
          // Prompt for time (title will be blank if the user said cancel)
          if (alarm.title && !alarm.timestamp) {
  
  
            builder.Prompts.time(session, 'What time would you like to set the alarm for?');
          } else {
            next();
          }
        },
        function (session, results) {
          var alarm = session.dialogData.alarm;
          if (results.response) {
            var time = builder.EntityRecognizer.resolveTime([results.response]);
            alarm.timestamp = time ? time.getTime() : null;
          }
          // Set the alarm (if title or timestamp is blank the user said cancel)
          if (alarm.title && alarm.timestamp) {
            // Save address of who to notify and write to scheduler.
            alarm.address = session.message.address;
            //alarms[alarm.title] = alarm;
  
            // Send confirmation to user
            var date = new Date(alarm.timestamp);
            var isAM = date.getHours() < 12;
            session.send('Creating alarm named "%s" for %d/%d/%d %d:%02d%s',
              alarm.title,
              date.getMonth() + 1, date.getDate(), date.getFullYear(),
              isAM ? date.getHours() : date.getHours() - 12, date.getMinutes(), isAM ? 'am' : 'pm');
          } else {
            session.send('Ok... no problem.');
          }
        }
      ]);
    */
    dialog.onDefault(function (session) {
        logQuery(session, "onDefault");
        var eliza = getElizaBot(getConversationId(session));
        var reply = eliza.transform(session.message.text);
        dialoglog("eliza", session, send(reply));
        //new Eilzabot
        //session.send("I do not understand this at all");
        //builder.DialogAction.send('I\'m sorry I didn\'t understand. I can only show start and ring');
    });
    /*
    // Very simple alarm scheduler
    var alarms = {};
    setInterval(function () {
      var now = new Date().getTime();
      for (var key in alarms) {
        var alarm = alarms[key];
        if (now >= alarm.timestamp) {
          var msg = new builder.Message()
            .address(alarm.address)
            .text('Here\'s your \'%s\' alarm.', alarm.title);
          bot.send(msg);
          delete alarms[key];
        }
      }
    }, 15000);
    */
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ib3Qvc21hcnRkaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7O0dBT0c7QUFDSDs7OztHQUlHOzs7QUFFSCx5QkFBeUI7QUFFekIsc0NBQXNDO0FBQ3RDLCtCQUErQjtBQVEvQiwwQ0FBMEM7QUFDMUMsNENBQTRDO0FBQzVDLDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsc0RBQXNEO0FBRXRELG9DQUFvQztBQU1wQyxzREFBc0Q7QUFHdEQsbUNBQW1DO0FBRW5DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztBQUUzQyxJQUFJLFVBQVUsR0FBRywyQ0FBMkMsQ0FBQztBQUM3RCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxVQUFVLENBQUM7QUFDbkQseUJBQXlCO0FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQVMsQ0FBQztBQUNsQixJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFO0lBQy9CLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLHlCQUF5QjtDQUNqRDtBQUNELElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUc5RCxTQUFTLElBQUksQ0FBNEIsQ0FBSSxJQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFBLENBQUM7QUFDaEUsU0FBUyxTQUFTLENBQUMsTUFBYyxFQUFFLE9BQXdCLEVBQUUsUUFBeUI7SUFDcEYsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksT0FBZSxDQUFDO0lBQ3BCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1FBQ2hDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixTQUFTLEdBQUcsUUFBUSxDQUFDO0tBQ3RCO1NBQU07UUFDTCxJQUFJLFFBQVEsR0FBb0IsUUFBUSxDQUFDO1FBQ3pDLElBQUksUUFBUSxHQUFxQixRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdEQsU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDMUIsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDMUg7SUFDRCxZQUFZLENBQUM7UUFDWCxNQUFNLEVBQUUsTUFBTTtRQUNkLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFFBQVEsRUFBRSxTQUFTO1FBQ25CLE1BQU0sRUFBRSxPQUFPO0tBQ2hCLENBQUMsQ0FBQztJQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVELElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ3pELHVDQUF1QztBQUV2QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMscURBQXFEO0FBQ3JELHNDQUFzQztBQUV0QyxTQUFTLGlCQUFpQixDQUFDLE9BQXdCO0lBQ2pELE9BQU8sT0FBTyxDQUFDLE9BQU87UUFDcEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPO1FBQ3ZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7QUFDNUMsQ0FBQztBQUVELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUVuQixTQUFTLFdBQVcsQ0FBQyxFQUFVO0lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDbEIsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHO1lBQ2QsTUFBTSxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ2xCLFFBQVEsRUFBRSxJQUFJLFFBQVEsRUFBRTtTQUN6QixDQUFDO0tBQ0g7SUFDRCxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDbEMsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ2hDLENBQUM7QUFHRCwwQ0FBMEM7QUFFMUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBRW5CLHNEQUE2QztBQUU3QyxrQkFBa0I7QUFHbEIsU0FBUyxXQUFXLENBQUMsTUFBYztJQUNqQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBVTtJQUNyQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFDRCxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQ3JCLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdEYsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDOUIsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxHQUFHLG9DQUFvQyxDQUFDLENBQUM7S0FDckU7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFYRCxvQ0FXQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxHQUFVO0lBQzVELElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztXQUMvQixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1dBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQzNDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3RELE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFCO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQywrQ0FBK0M7SUFDcEUsMENBQTBDO0lBQzFDLHNDQUFzQztJQUN0QyxtQ0FBbUM7SUFDbkMsaUNBQWlDO0lBQ2pDLG1DQUFtQztJQUNuQywwQ0FBMEM7SUFDMUMsMEZBQTBGO0lBQzFGLGdGQUFnRjtJQUNoRix1Q0FBdUM7SUFDdkMsNEVBQTRFO0NBQzdFLENBQUM7QUFFRixJQUFJLFlBQVksR0FBRyxhQUFhLENBQUM7QUFFakMsSUFBSSxjQUFjLEdBQUc7SUFDbkIsZ0RBQWdEO0lBQ2hELEVBQUU7SUFDRixFQUFFO0lBQ0YsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSxFQUFFO0NBQUMsQ0FBQztBQUVOLE1BQU0sV0FBVyxHQUFHLENBQUMsK0dBQStHO0lBQ2xJLG1HQUFtRztJQUNuRyw2TUFBNk07SUFDN00sb0dBQW9HO0lBQ3BHLG9HQUFvRztDQUNyRyxDQUFDO0FBQ0YsTUFBTSxpQkFBaUIsR0FBRztJQUN4Qiw4RUFBOEU7SUFDOUUsZ0ZBQWdGO0lBQ2hGLCtHQUErRztJQUMvRywrRkFBK0Y7Q0FDaEcsQ0FBQztBQUdGLE1BQU0sZUFBZSxHQUFHO0lBQ3RCLHdGQUF3RjtJQUN4Riw4Q0FBOEM7SUFDOUMsaURBQWlEO0lBQ2pELDhEQUE4RDtJQUM5RCx3RUFBd0U7SUFDeEUsaURBQWlEO0lBQ2pELG1DQUFtQztDQUNwQyxDQUFBO0FBRVksUUFBQSxtQkFBbUIsR0FBRztJQUNqQyx1RUFBdUU7SUFDdkUseUhBQXlIO0lBQ3pILHlJQUF5STtJQUN6SSxvTEFBb0w7SUFDcEwsK0dBQStHO0lBQy9HLGlIQUFpSDtJQUNqSCxzSEFBc0g7SUFDdEgsMkpBQTJKO0NBQzVKLENBQUM7QUFFVyxRQUFBLHFCQUFxQixHQUFHO0lBQ25DLFVBQVUsRUFBRSxpRkFBaUY7SUFDN0YsUUFBUSxFQUFFLGdEQUFnRDtJQUMxRCxLQUFLLEVBQUUsb0VBQW9FO0lBQzNFLE1BQU0sRUFBRSxrQ0FBa0M7SUFDMUMsUUFBUSxFQUFFLGtKQUFrSjtJQUM1SixNQUFNLEVBQUUsMkVBQTJFO0NBQ3BGLENBQUM7QUFFRixTQUFTLGVBQWUsQ0FBQyxHQUFhO0lBQ3BDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUVELE1BQWEsc0JBQXNCO0lBQ2pDO0lBRUEsQ0FBQztJQUVELFNBQVMsQ0FBQyxPQUFrQyxFQUFFLFFBQXVFO1FBQ25ILElBQUksQ0FBQyxHQUFHLEVBQXFDLENBQUM7UUFFOUMsUUFBUSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxDQUFDLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztZQUN6QixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7WUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2QsSUFBSSxFQUFFLEdBQUcsRUFBcUIsQ0FBQztZQUMvQixFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDNUIsRUFBRSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDMUMsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZixDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFDRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsQ0FBQyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7WUFDdkIsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZCxJQUFJLEVBQUUsR0FBRyxFQUFxQixDQUFDO1lBQy9CLEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM1QixFQUFFLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMxQyxFQUFFLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNmLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE9BQU87U0FDUjtRQUNELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxDQUFDLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztZQUN2QixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7WUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzVCLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2QsSUFBSSxFQUFFLEdBQUcsRUFBcUIsQ0FBQztZQUMvQixFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDNUIsRUFBRSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDMUMsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDZixDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFDRCxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNsQixDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNkLElBQUksRUFBRSxHQUFHLEVBQXFCLENBQUM7UUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDaEIsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUExRUQsd0RBMEVDO0FBRUQsTUFBTSxTQUFTLEdBQUcsTUFBYSxDQUFDO0FBRWhDLElBQUksR0FBRyxDQUFDO0FBRVIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFDL0UsSUFBSSxNQUFNLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvQyw4REFBOEQ7QUFHOUQsU0FBUyxRQUFRLENBQUMsT0FBd0IsRUFBRSxNQUFjLEVBQUUsTUFBbUI7SUFFN0UsRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM5RCxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1FBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVM7UUFDcEMsTUFBTSxFQUFFLE1BQU07UUFDZCxHQUFHLEVBQUUsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHO1FBQ2hFLGNBQWMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU87ZUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTtlQUNwQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUU7UUFDaEQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztlQUM1QixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2VBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRTtLQUN6QyxDQUFDLEVBQUcsVUFBVSxHQUFHO1FBQ2hCLElBQUksR0FBRyxFQUFFO1lBQ1AsUUFBUSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ25DO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXFCRTtBQUVGLFNBQVMsbUJBQW1CLENBQUMsT0FBd0IsRUFBRSxNQUFjLEVBQUUsTUFBeUM7SUFFOUcsRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM5RCxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1FBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVM7UUFDcEMsTUFBTSxFQUFFLE1BQU07UUFDZCxHQUFHLEVBQUUsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHO1FBQ3RFLGNBQWMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU87ZUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTtlQUNwQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUU7UUFDaEQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztlQUM1QixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2VBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRTtLQUN6QyxDQUFDLEVBQUUsVUFBVSxHQUFHO1FBQ2YsSUFBSSxHQUFHLEVBQUU7WUFDUCxRQUFRLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDbkM7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEI7Ozs7O0dBS0c7QUFDSCxTQUFTLE9BQU8sQ0FBQyxTQUFTLEVBQ3hCLGFBQTRDLEVBQUUsT0FBYTtJQUMzRCxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDcEIsSUFBSSxTQUFTLEdBQUcsYUFBYSxFQUFFLENBQUM7SUFDaEMsU0FBUyxDQUFDLElBQUksQ0FDWixDQUFDLFFBQVEsRUFBRSxFQUFFO1FBQ1gsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsaUJBQWlCLEVBQUU7WUFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDdkM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVMLFNBQVMsV0FBVztRQUNsQixPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQsR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUkxQyx5R0FBeUc7SUFDekcsa0NBQWtDO0lBQ2xDLHNKQUFzSjtJQUN0SixJQUFJLFVBQVUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RCxJQUFJLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDckUsMENBQTBDO0lBQzFDLCtCQUErQjtJQUMvQiw0RUFBNEU7SUFDNUUsb0NBQW9DO0lBQ3BDLEVBQUU7SUFDRixLQUFLO0lBRUwsSUFBSSxZQUFZLEdBQUcsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRTdGLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxPQUFPO1FBQ3BDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLHNEQUFzRDtJQUN4RCxDQUFDLENBQUMsQ0FBQTtJQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO1FBQ2hDLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGlEQUFpRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELFVBQVUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJO1lBQzlCLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDekMsSUFBSSxFQUFFLENBQUM7UUFDVCxDQUFDO1FBQ0QsVUFBVSxPQUFPLEVBQUUsT0FBTztZQUN4QixPQUFPLENBQUMsbUJBQW1CLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7S0FDRixDQUNBLENBQUM7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtRQUNsQyxVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQixPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFDRCxVQUFVLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSTtZQUM5QixPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQjtZQUNoRCxJQUFJLEVBQUUsQ0FBQztRQUNULENBQUM7UUFDRCxVQUFVLE9BQU8sRUFBRSxPQUFPO1lBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNwQyxDQUFDO0tBQ0YsQ0FDQSxDQUFDO0lBQ0YsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLE9BQU87UUFDdEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMvQixJQUFJLEdBQUcsR0FBRyxlQUFlLENBQUMsWUFBWSxDQUFDLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFFLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUg7Ozs7Ozs7Ozs7Ozs7TUFhRTtJQUVGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRXhCLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3ZCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLFVBQVUsQ0FBQztZQUNmLDREQUE0RDtZQUM1RCw4Q0FBOEM7WUFDOUMsK0NBQStDO1lBRS9DLEVBQUU7WUFDRixnQkFBZ0I7WUFDaEIsc0JBQXNCO1lBQ3RCLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN4QixRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEUsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQzlCLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQzdDLFlBQVksQ0FBQyxFQUFFO29CQUNiLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFHLFlBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzNELGlCQUFpQjtvQkFDakIseURBQXlEO29CQUN6RCxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUUsWUFBb0IsQ0FBQyxPQUFPLEVBQUU7d0JBQ25ELFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7d0JBQ2xFLE9BQU87cUJBQ1I7b0JBQ0QsSUFBSSxPQUFPLEdBQUksWUFBb0IsQ0FBQyxPQUFPLENBQUM7b0JBQzVDLGdFQUFnRTtvQkFDaEUsUUFBUSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFOUUsb0dBQW9HO29CQUNwRyw2QkFBNkI7b0JBRTdCLElBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7eUJBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO3lCQUMvQixTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQSxDQUFDLGdCQUFnQjtvQkFDL0MsNkdBQTZHO29CQUM3RyxTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtRQUN2QixVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxVQUFVLENBQUM7WUFDZixzQkFBc0I7WUFDdEIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFFbkMsNkJBQTZCO1lBQzdCLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUU5QixRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzNGLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDcEYsSUFBSSxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO2dCQUM3QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDZCxJQUFJO29CQUNGLElBQUksR0FBRyxNQUFNLENBQUMsK0JBQStCLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDekYsUUFBUSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQzFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLElBQUksQ0FBQyxFQUFFO3dCQUNMLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDL0IscUZBQXFGO3dCQUNyRixzR0FBc0c7d0JBQ3RHLDZDQUE2Qzt3QkFDN0MsZUFBZTt3QkFDZixZQUFZO3FCQUNiO2lCQUNGO2dCQUNELGdFQUFnRTtnQkFDaEUsSUFBSSxLQUFLLEdBQUcsZ0JBQWdCLENBQUM7Z0JBQzdCLElBQUksV0FBVyxHQUFHLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsS0FBSyxHQUFHLGdCQUFnQixHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO2lCQUNwRDtnQkFDRCxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3BELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO29CQUV2RCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQy9ELElBQUksV0FBVyxFQUFFO3dCQUNmLHNKQUFzSjt3QkFDdEosVUFBVTt3QkFDVixTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsZ0JBQWdCLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxvQkFBb0IsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNoTSxPQUFPO3dCQUVQLGtEQUFrRDt3QkFDbEQsV0FBVztxQkFDWjtvQkFDRCxJQUFJLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ2hGLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2xELFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDN0UsZ0VBQWdFO29CQUNoRSxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbkgsNEhBQTRIO29CQUM1SCx5QkFBeUI7b0JBRXpCLGdHQUFnRztvQkFDaEcsMkNBQTJDO29CQUczQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzVFLDBCQUEwQjtvQkFDMUIsSUFBSSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckYsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbEQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM3RSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7d0JBQ3RCLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNyRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOzRCQUNyQixTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLE1BQU0sR0FBRyxNQUFNO2dDQUMzRSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzt5QkFDeEI7NkJBQU07NEJBQ0wsU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsR0FBRyxNQUFNLEdBQUcsWUFBWSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUNqSDtxQkFDRjt5QkFBTTt3QkFDTCxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNuRSxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkQsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixHQUFHLGdCQUFnQixHQUFHLE9BQU8sR0FBRyxLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztxQkFDNUk7b0JBQ0QsT0FBTztnQkFDVCxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDeEIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2Ysc0JBQXNCO1lBQ3RCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ25DLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzdCLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNGLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RixJQUFJLFFBQVEsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO1lBQ3JDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUM3RSxJQUFJLFdBQVcsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUNwRCxvQkFBb0I7WUFDcEIsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBRTlCLElBQUksUUFBUSxLQUFLLFlBQVksRUFBRTtvQkFDN0Isd0JBQXdCO29CQUN4QixJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUM7b0JBQ3ZCLElBQUksV0FBVyxFQUFFO3dCQUNmLE1BQU0sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztxQkFDckQ7b0JBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDWCxJQUFJLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkUsSUFBSSxXQUFXLEVBQUU7NEJBQ2YsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLDhDQUE4QyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsaUNBQWlDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt5QkFDaEs7NkJBQU07NEJBQ0wsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7eUJBQ3RFO3dCQUNELE9BQU87cUJBQ1I7eUJBQU07d0JBQ0wsSUFBSSxJQUFJLEdBQUcsbUJBQUssQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQzFELElBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3RELFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxNQUFNLEdBQUcsY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ2xHLE9BQU87cUJBQ1I7aUJBQ0Y7Z0JBQ0QsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUMxQixJQUFJLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbEUsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xFLE9BQU87aUJBQ1I7Z0JBQ0QsZ0VBQWdFO2dCQUNoRSxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3JCLElBQUksZ0JBQWdCLEdBQUcsUUFBUSxDQUFDO2dCQUNoQyxJQUFJLFdBQVcsRUFBRTtvQkFDZixLQUFLLEdBQUcsUUFBUSxHQUFHLFFBQVEsR0FBRyxXQUFXLENBQUM7aUJBQzNDO2dCQUNELFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDbkQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNkLElBQUk7d0JBQ0YsUUFBUSxDQUFDLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxDQUFDO3dCQUNoRCxJQUFJLEdBQUcsTUFBTSxDQUFDLCtCQUErQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO3dCQUNqRixRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztxQkFDMUM7b0JBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ1YsSUFBSSxDQUFDLEVBQUU7NEJBQ0wsUUFBUSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxnQkFBZ0I7NEJBQ2hCLEVBQUU7NEJBRUYsbUZBQW1GOzRCQUNuRiw0Q0FBNEM7NEJBQzVDLGNBQWM7NEJBQ2QsV0FBVzt5QkFDWjtxQkFDRjtvQkFDRCw0REFBNEQ7b0JBQzVELG1EQUFtRDtvQkFDbkQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMzRSxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzlELElBQUksV0FBVyxFQUFFO3dCQUNmLHNKQUFzSjt3QkFDdEosVUFBVTt3QkFDVixJQUFJLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixHQUFHLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkUsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLGdCQUFnQixHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEssT0FBTzt3QkFFUCxrREFBa0Q7d0JBQ2xELFdBQVc7cUJBQ1o7b0JBQ0QsSUFBSSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUMvRSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNqRCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN4RCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7d0JBQ3RCLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxHQUFHLE1BQU0sR0FBRyxZQUFZLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQzFHO3lCQUFNO3dCQUNMLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQzt3QkFDbkIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDbEUsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFFBQVEsR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7cUJBQ25JO29CQUNELE9BQU87Z0JBQ1QsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUNULENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUdILE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1FBQzNCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLFVBQVUsQ0FBQztZQUNmLHNCQUFzQjtZQUN0QixXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFFOUIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNoQyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDekYsUUFBUSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxJQUFJLENBQUM7Z0JBQ1QsSUFBSTtvQkFDRixJQUFJLEdBQUcsTUFBTSxDQUFDLCtCQUErQixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNuRixRQUFRLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDeEM7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsSUFBSSxDQUFDLEVBQUU7d0JBQ0wsUUFBUSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUMvQixTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDOUcsVUFBVTt3QkFDVixPQUFPO3FCQUNSO2lCQUNGO2dCQUNELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUNoQyxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pGLFVBQVU7b0JBQ1YsT0FBTztpQkFDUjtnQkFDRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDL0MsMkdBQTJHO2dCQUMzRyxJQUFJLEtBQUssR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO3FCQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztxQkFDZixTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQiw2R0FBNkc7Z0JBQzdHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUdGLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1FBQ3pCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLFVBQVUsQ0FBQztZQUNmLHNCQUFzQjtZQUN0QixXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDOUIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLFNBQVMsR0FBRyxVQUFVLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDaEQsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLE9BQU8sR0FBRyxZQUFZLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQztnQkFDbEQsSUFBSSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM3QixJQUFJLE9BQU8sRUFBRTtvQkFDWCxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3RELFFBQVEsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxZQUFZLEVBQUU7d0JBQ2pCLFNBQVMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyw4Q0FBOEMsR0FBRyxPQUFPLEdBQUcsMEVBQTBFLENBQUMsQ0FBQyxDQUFDO3dCQUM1SyxPQUFPO3FCQUNSO2lCQUNGO2dCQUVELFFBQVEsQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksNkJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUU7b0JBQ2xELHdCQUF3QjtvQkFDeEIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO29CQUNoQixJQUFJLFlBQVksRUFBRTt3QkFDaEIsTUFBTSxHQUFHLGNBQWMsR0FBRyxZQUFZLEdBQUcsNkNBQTZDLENBQUM7cUJBQ3hGO29CQUNELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO29CQUNoQyxTQUFTLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxTQUFTLEdBQUcsT0FBTyxHQUFHLDZCQUFxQixDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQy9ILE9BQU87aUJBQ1I7Z0JBQ0QsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDaEQsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHNEQUFzRCxHQUFHLFNBQVMsR0FBRywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7b0JBQzNJLE9BQU87b0JBQ1Asd0JBQXdCO2lCQUN6QjtnQkFJRCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRSxzQkFBc0I7Z0JBQ3RCLElBQUksV0FBVyxHQUFHLFNBQThCLENBQUM7Z0JBQ2pELElBQUksUUFBUSxFQUFFO29CQUNaLE1BQU07b0JBQ04sV0FBVyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDcEY7cUJBQU07b0JBQ0wsV0FBVyxHQUFJLE1BQU0sQ0FBQyxPQUFlLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUNuRDtnQkFFRCxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUM1QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFFOUYsSUFBSSxVQUFVLEVBQUU7NEJBQ2QsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUNsQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO3lCQUN2RTt3QkFDRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUU7NEJBQ3JCLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUFDLENBQUUsSUFBSSxHQUFHLE9BQU8sQ0FBQzt5QkFDakQ7d0JBQ0QsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ2hELENBQUMsQ0FBQyxDQUFDO29CQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQW1CRTtvQkFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQW9JSTtnQkFDTixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ3hCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLFVBQVUsQ0FBQztZQUNmLHNCQUFzQjtZQUN0QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNuQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMzQixRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDdEYsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakcsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RFLE9BQU87YUFDUjtZQUNELElBQUksR0FBRyxHQUFHLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN6QyxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDeEIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksVUFBVSxDQUFDO1lBQ2Ysc0JBQXNCO1lBQ3RCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ25DLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzdCLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RixTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLDJCQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUM7S0FDRixDQUFDLENBQUM7SUFHSCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtRQUN0QixVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUMzQjs7Ozs7a0JBS007WUFDTixPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFDRCxVQUFVLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSTtZQUM5QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUNyQyxJQUFJLEVBQUUsQ0FBQztRQUNULENBQUM7UUFDRCxVQUFVLE9BQU8sRUFBRSxPQUFPO1lBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtZQUNqRiwrQkFBK0I7UUFDakMsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQ3JCLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1lBQzNCLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuQixRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDakQsWUFBWSxDQUFDO2dCQUNYLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxRQUFRLEVBQUUseUJBQXlCO2FBQ3BDLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDckIsVUFBVSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDM0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25CLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDbEQsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUErREU7SUFFRixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsT0FBTztRQUNoQyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN6QyxjQUFjO1FBQ2Qsa0RBQWtEO1FBQ2xELCtGQUErRjtJQUNqRyxDQUFDLENBQUMsQ0FBQztJQUVIOzs7Ozs7Ozs7Ozs7Ozs7O01BZ0JFO0lBQ0YsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsSUFBSSxNQUFNLEVBQUU7SUFDVixNQUFNLENBQUMsT0FBTyxHQUFHO1FBQ2YsZUFBZSxFQUFFLGVBQWU7UUFDaEMsYUFBYSxFQUFFLGFBQWE7UUFDNUIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsV0FBVyxFQUFFLFdBQVc7UUFDeEIsc0JBQXNCLEVBQUUsc0JBQXNCO1FBQzlDLG1CQUFtQixFQUFFLDJCQUFtQjtRQUN4QyxxQkFBcUIsRUFBRSw2QkFBcUI7UUFDNUMsT0FBTyxFQUFFLE9BQU87S0FDakIsQ0FBQztDQUNIIiwiZmlsZSI6ImJvdC9zbWFydGRpYWxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhlIGJvdCBpbXBsZW1lbnRhdGlvblxuICpcbiAqIEluc3RhbnRpYXRlIGFwc3NpbmcgYSBjb25uZWN0b3IgdmlhXG4gKiBtYWtlQm90XG4gKlxuICpcbiAqL1xuLyoqXG4gKiBAZmlsZVxuICogQG1vZHVsZSBqZnNlYi5tZ25scV9hYm90LnNtYXJ0ZGlhbG9nXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2LTIxMDkgR2VyZCBGb3JzdG1hbm5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCAqIGFzIGJ1aWxkZXIgZnJvbSAnYm90YnVpbGRlcic7XG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbi8vaW1wb3J0ICogYXMgTWF0Y2ggZnJvbSAnLi4vbWF0Y2gvbWF0Y2gnO1xuLy9pbXBvcnQgKiBhcyBzcmNIYW5kbGUgZnJvbSAnc3JjSGFuZGxlJztcblxuLy9pbXBvcnQgKiBhcyBBbmFseXplIGZyb20gJy4uL21hdGNoL2FuYWx5emUnO1xuaW1wb3J0IHsgQnJlYWtEb3duIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuXG5pbXBvcnQgKiBhcyBXaGF0SXMgZnJvbSAnLi4vbWF0Y2gvd2hhdGlzJztcbmltcG9ydCAqIGFzIExpc3RBbGwgZnJvbSAnLi4vbWF0Y2gvbGlzdGFsbCc7XG5pbXBvcnQgKiBhcyBEZXNjcmliZSBmcm9tICcuLi9tYXRjaC9kZXNjcmliZSc7XG5pbXBvcnQgKiBhcyBNYWtlVGFibGUgZnJvbSAnLi4vZXhlYy9tYWtlcWJldGFibGUnO1xuaW1wb3J0ICogYXMgTW9uZ29RdWVyaWVzIGZyb20gJy4uL21hdGNoL21vbmdvcXVlcmllcyc7XG5cbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJ2Fib3RfdXRpbHMnO1xuXG5pbXBvcnQgeyBFckVycm9yIGFzIEVyRXJyb3IgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInO1xuXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCAqIGFzIERpYWxvZ0xvZ2dlciBmcm9tICcuLi91dGlscy9kaWFsb2dsb2dnZXInO1xuXG5pbXBvcnQgeyBNb25nb1EgYXMgTW9uZ29RIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJztcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAncHJvY2Vzcyc7XG5cbnZhciBkYnVybCA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCB8fCBcIlwiO1xuXG52YXIgcGdsb2NhbHVybCA9IFwicG9zdGdyZXM6Ly9qb2U6YWJjZGVmQGxvY2FsaG9zdDo1NDMyL2Fib3RcIjtcbnZhciBkYnVybCA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCB8fCBwZ2xvY2FsdXJsO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xudmFyIG8gPSBwZyBhcyBhbnk7XG5pZiAoIShwcm9jZXNzLmVudi5BQk9UX0RCTk9TU0wpKSB7XG4gIG8uZGVmYXVsdHMuc3NsID0gdHJ1ZTsgLy8gT25seSB1c2VkIGludGVybmFsbHkgIVxufVxudmFyIGRpYWxvZ0xvZ2dlciA9IERpYWxvZ0xvZ2dlci5sb2dnZXIoXCJzbWFydGJvdFwiLCBkYnVybCwgcGcpO1xuXG50eXBlIHN0cmluZ09yTWVzc2FnZSA9IHN0cmluZyB8IGJ1aWxkZXIuTWVzc2FnZTtcbmZ1bmN0aW9uIHNlbmQ8VCBleHRlbmRzIHN0cmluZ09yTWVzc2FnZT4obzogVCk6IFQgeyByZXR1cm4gbzsgfTtcbmZ1bmN0aW9uIGRpYWxvZ2xvZyhpbnRlbnQ6IHN0cmluZywgc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uLCByZXNwb25zZTogc3RyaW5nT3JNZXNzYWdlKSB7XG4gIHZhciBzUmVzcG9uc2U6IHN0cmluZztcbiAgdmFyIHNBY3Rpb246IHN0cmluZztcbiAgaWYgKHR5cGVvZiByZXNwb25zZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHNBY3Rpb24gPSBcIlwiO1xuICAgIHNSZXNwb25zZSA9IHJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHZhciBhTWVzc2FnZTogYnVpbGRlci5NZXNzYWdlID0gcmVzcG9uc2U7XG4gICAgdmFyIGlNZXNzYWdlOiBidWlsZGVyLklNZXNzYWdlID0gYU1lc3NhZ2UudG9NZXNzYWdlKCk7XG4gICAgc1Jlc3BvbnNlID0gaU1lc3NhZ2UudGV4dDtcbiAgICBzQWN0aW9uID0gKGlNZXNzYWdlLmVudGl0aWVzICYmIGlNZXNzYWdlLmVudGl0aWVzWzBdKSA/IChKU09OLnN0cmluZ2lmeShpTWVzc2FnZS5lbnRpdGllcyAmJiBpTWVzc2FnZS5lbnRpdGllc1swXSkpIDogXCJcIjtcbiAgfVxuICBkaWFsb2dMb2dnZXIoe1xuICAgIGludGVudDogaW50ZW50LFxuICAgIHNlc3Npb246IHNlc3Npb24sXG4gICAgcmVzcG9uc2U6IHNSZXNwb25zZSxcbiAgICBhY3Rpb246IHNBY3Rpb25cbiAgfSk7XG4gIHNlc3Npb24uc2VuZChyZXNwb25zZSk7XG59XG5cbnZhciBlbGl6YWJvdCA9IHJlcXVpcmUoJy4uL2V4dGVybi9lbGl6YWJvdC9lbGl6YWJvdC5qcycpO1xuLy9pbXBvcnQgKiBhcyBlbGl6YWJvdCBmcm9tICdlbGl6YWJvdCc7XG5cbmxldCBkZWJ1Z2xvZyA9IGRlYnVnKCdzbWFydGRpYWxvZycpO1xuaW1wb3J0ICogYXMgUGxhaW5SZWNvZ25pemVyIGZyb20gJy4vcGxhaW5yZWNvZ25pemVyJztcbi8vdmFyIGJ1aWxkZXIgPSByZXF1aXJlKCdib3RidWlsZGVyJyk7XG5cbmZ1bmN0aW9uIGdldENvbnZlcnNhdGlvbklkKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbik6IHN0cmluZyB7XG4gIHJldHVybiBzZXNzaW9uLm1lc3NhZ2UgJiZcbiAgICBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcyAmJlxuICAgIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZDtcbn1cblxudmFyIGVsaXphYm90cyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRFbGl6YUJvdChpZDogc3RyaW5nKSB7XG4gIGlmICghZWxpemFib3RzW2lkXSkge1xuICAgIGVsaXphYm90c1tpZF0gPSB7XG4gICAgICBhY2Nlc3M6IG5ldyBEYXRlKCksXG4gICAgICBlbGl6YWJvdDogbmV3IGVsaXphYm90KClcbiAgICB9O1xuICB9XG4gIGVsaXphYm90c1tpZF0uYWNjZXNzID0gbmV3IERhdGUoKTtcbiAgcmV0dXJuIGVsaXphYm90c1tpZF0uZWxpemFib3Q7XG59XG5cbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcbi8vaW1wb3J0ICogYXMgVG9vbHMgZnJvbSAnLi4vbWF0Y2gvdG9vbHMnO1xuXG52YXIgbmV3RmxvdyA9IHRydWU7XG5cbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuXG4vL3ZhciBtb2RlbHMgPSB7fTtcblxuXG5mdW5jdGlvbiBpc0Fub255bW91cyh1c2VyaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdXNlcmlkLmluZGV4T2YoXCJhbm86XCIpID09PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzdHJpY3REYXRhKGFycjogYW55W10pOiBhbnlbXSB7XG4gIGlmIChhcnIubGVuZ3RoIDwgNikge1xuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciByZXMgPSBhcnIuc2xpY2UoMCwgTWF0aC5taW4oTWF0aC5tYXgoTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gMyksIDcpLCBhcnIubGVuZ3RoKSk7XG4gIGlmICh0eXBlb2YgYXJyWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgdmFyIGRlbHRhID0gbGVuIC0gcmVzLmxlbmd0aDtcbiAgICByZXMucHVzaChcIi4uLiBhbmQgXCIgKyBkZWx0YSArIFwiIG1vcmUgZW50cmllcyBmb3IgcmVnaXN0ZXJlZCB1c2Vyc1wiKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiByZXN0cmljdExvZ2dlZE9uKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgYXJyOiBhbnlbXSk6IGFueVtdIHtcbiAgdmFyIHVzZXJpZCA9IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlclxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXIuaWQgfHwgXCJcIjtcbiAgaWYgKHByb2Nlc3MuZW52LkFCT1RfRU1BSUxfVVNFUiAmJiBpc0Fub255bW91cyh1c2VyaWQpKSB7XG4gICAgcmV0dXJuIHJlc3RyaWN0RGF0YShhcnIpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmNvbnN0IGFUcmFpblJlcGxpZXMgPSBbXCJUaGFuayB5b3UgZm9yIHNoYXJpbmcgdGhpcyBzdWdnZXN0aW9uIHdpdGggdXNcIixcbiAgXCJUaGFuayBmb3IgZm9yIHRoaXMgdmFsdWFibGUgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhbmsgZm9yIGZvciB0aGlzIGludGVyZXN0aW5nIGZhY3QhXCIsXG4gIFwiVGhhdHMgYSBwbGV0aG9yaWEgb2YgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhdCdzIGEgbnVnZ2V0IG9mIGluZm9ybWF0aW9uLlwiLFxuICBcIkxvdmVseSwgSSBtYXkgY29uc2lkZXIgeW91IGlucHV0LlwiLFxuICBcIldlbGwgZG9uZSwgYW55dGhpbmcgbW9yZSB0byBsZXQgbWUga25vdz9cIixcbiAgXCJJIGRvIGFwcHJlY2lhdGUgeW91ciB0ZWFjaGluZyBhbmQgbXkgbGVhcm5pbmcgZXhwZXJpZW5jZSwgb3Igd2FzIGl0IHRoZSBvdGhlciB3YXkgcm91bmQ/XCIsXG4gIFwiWW91ciBoZWxwZnVsIGlucHV0IGhhcyBiZWVuIHN0b3JlZCBpbiBzb21lIGR1c3R5IGNvcm5lciBvZiB0aGUgV29ybGQgd2lkZSB3ZWIhXCIsXG4gIFwiVGhhbmsgeW91IGZvciBteSBsZWFybmluZyBleHBlcmllbmNlIVwiLFxuICBcIkkgaGF2ZSBpbmNvcnBvcmF0ZWQgeW91ciB2YWx1YWJsZSBzdWdnZXN0aW9uIGluIHRoZSB3aXNkb20gb2YgdGhlIGludGVybmV0XCJcbl07XG5cbnZhciBhVHJhaW5EaWFsb2cgPSBhVHJhaW5SZXBsaWVzO1xuXG52YXIgYVRyYWluRXhpdEhpbnQgPSBbXG4gIFwiXFxudHlwZSBcXFwiZG9uZVxcXCIgd2hlbiB5b3UgYXJlIGRvbmUgdHJhaW5pbmcgbWUuXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXFxucmVtZW1iZXIsIHlvdSBhcmUgc3R1Y2sgaGVyZSBpbnN0cnVjdGluZyBtZSwgdHlwZSBcXFwiZG9uZVxcXCIgdG8gcmV0dXJuLlwiLFxuICBcIlwiXTtcblxuY29uc3QgYUVudGVyVHJhaW4gPSBbJ1NvIHlvdSB0aGluayB0aGlzIGlzIHdyb25nPyBZb3UgY2FuIG9mZmVyIHlvdXIgYWR2aXNlIGhlcmUuXFxuIFR5cGUgXCJkb25lXCIgaWYgeW91IGFyZSBkb25lIHdpdGggaW5zdHJ1Y3RpbmcgbWUnLFxuICAnRmVlbCBmcmVlIHRvIG9mZmVyIG1lIHlvdXIgYmV0dGVyIHNvbHV0aW9uIGhlcmUuXFxuVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdTb21lIHNheSBcIlRoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cIiwgXFxudCBpZiB5b3UgY291bGQgaGVscCBtZSB0byBiZWNvbWUgYmV0dGVyLCBpbnN0cnVjdCBtZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCB0ZWFjaGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG5dO1xuY29uc3QgYUJhY2tGcm9tVHJhaW5pbmcgPSBbXG4gICdQdXVoLCBiYWNrIGZyb20gdHJhaW5pbmchIE5vdyBmb3IgdGhlIGVhc3kgcGFydCAuLi5cXG4gYXNrIG1lIGEgbmV3IHF1ZXN0aW9uLicsXG4gICdMaXZlIGFuZCBkb25cXCd0IGxlYXJuLCB0aGF0XFwncyB1cy4gTmFhaCwgd2VcXCdsbCBzZWUuXFxuQXNrIG1lIGFub3RoZXIgcXVlc3Rpb24uJyxcbiAgJ1RoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cXG4gQXNrIG1lIGEgcXVlc3Rpb24uJyxcbiAgJ1RoYW5rcyBmb3IgaGF2aW5nIHRoaXMgbGVjdHVyZSBzZXNzaW9uLCBub3cgaSBhbSBiYWNrIHRvIG91ciB1c3VhbCBzZWxmLlxcbiBBc2sgbWUgYSBxdWVzdGlvbi4nXG5dO1xuXG5cbmNvbnN0IGFUcmFpbk5vS2xpbmdvbiA9IFtcbiAgXCJIZSB3aG8gbWFzdGVycyB0aGUgZGFyayBhcnRzIG9mIFNBUCBtdXN0IG5vdCBkd2VsbCBpbiB0aGUgZWFydGhseSByZWFsbXMgb2YgU3RhciBUcmVrLlwiLFxuICBcIlNBUCBpcyBhIGNsb3VkIGNvbXBhbnksIG5vdCBhIHNwYWNlIGNvbXBhbnkuXCIsXG4gIFwiVGhlIGRlcHRoIG9mIFIvMyBhcmUgZGVlcGVyIHRoYW4gRGVlcCBTcGFjZSA0Mi5cIixcbiAgXCJNeSBicmFpbnBvd2VyIGlzIGZ1bGx5IGFic29yYmVkIHdpdGggbWFzdGVyaW5nIG90aGVyIHJlYWxtcy5cIixcbiAgXCJGb3IgdGhlIHdvc2FwLCB0aGUgc2t5IGlzIHRoZSBsaW1pdC4gRmVlbCBmcmVlIHRvIGNoZWNrIG91dCBuYXNhLmdvdiAuXCIsXG4gIFwiVGhlIGZ1dHVyZSBpcyBTQVAgb3IgSUJNIGJsdWUsIG5vdCBzcGFjZSBibGFjay5cIixcbiAgXCJUaGF0J3MgbGVmdCB0byBzb21lIG11cmt5IGZ1dHVyZS5cIlxuXVxuXG5leHBvcnQgY29uc3QgYVJlc3BvbnNlc09uVG9vTG9uZyA9IFtcbiAgXCJZb3VyIGlucHV0IHNob3VsZCBiZSBlbG9xdWVudCBpbiBpdCdzIGJyZXZpdHkuIFRoaXMgb25lIHdhcyB0b28gbG9uZy5cIixcbiAgXCJteSB3aXNkb20gaXMgc2V2ZXJseSBib3VuZCBieSBteSBsaW1pdGVkIGlucHV0IHByb2Nlc3NpbmcgY2FwYWJpbGl0aWVzLiBDb3VsZCB5b3UgZm9ybXVsYXRlIGEgc2hvcnRlciBpbnB1dD8gVGhhbmsgeW91LlwiLFxuICBcIlRoZSBsZW5ndGggb2YgeW91IGlucHV0IGluZGljYXRlcyB5b3UgcHJvYmFibHkga25vdyBtb3JlIGFib3V0IHRoZSB0b3BpYyB0aGFuIG1lPyBDYW4gaSBodW1ibHkgYXNrIHlvdSB0byBmb3JtdWxhdGUgYSBzaG9ydGVyIHF1ZXN0aW9uP1wiLFxuICAnXFxcIldoYXQgZXZlciB5b3Ugd2FudCB0byB0ZWFjaCwgYmUgYnJpZWZcXFwiIChIb3JhY2UpLiBXaGlsZSB0aGlzIGRvZXMgbm90IGFsd2F5cyBhcHBsaWVzIHRvIG15IGFuc3dlcnMsIGl0IGlzIHJlcXVpcmUgZm9yIHlvdXIgcXVlc3Rpb25zLiBQbGVhc2UgdHJ5IGFnYWluIHdpdGggYSByZWZpbmVkIHF1ZXN0aW9ucy4nLFxuICAnSSB1bmRlcnN0YW5kIG1vcmUgdGhhbiA0LWxldHRlciB3b3JkcywgYnV0IG5vdCBtb3JlIHRoYW4gMjAgd29yZCBzZW50ZW5jZXMuIFBsZWFzZSB0cnkgdG8gc2hvcnRlbiB5b3VyIGlucHV0LicsXG4gICd0aGUgc2t5IGlzIHRoZSBsaW1pdD8gQWlyIGZvcmNlIG1lbWJlciBvciBub3QsIHlvdSBjYW4gYXNrIGxvbmdlciBxdWVzdGlvbnMgdGhhbiBcXFwidGhlIHNreVxcXCIsIGJ1dCBub3QgdGhpcyBsb25nJyxcbiAgJ015IGFuc3dlcnMgbWF5IGJlIGV4aGF1c3RpdmUsIGJ1dCBJIHVuZGVyc3RhbmQgbW9yZSB0aGFuIDQtbGV0dGVyIHdvcmRzLCBidXQgbm90IG1vcmUgdGhhbiAyMCB3b3JkIHNlbnRlbmNlcy4gU29ycnkuJyxcbiAgJ091ciBjb252ZXJzYXRpb24gbXVzdCBiZSBoaWdobHkgYXNzeW1tZXRyaWM6IG15IGFuc3dlcnMgbWF5IGJlIHZlcmJvc2UgYW5kIGV4aGF1c3RpdmUgYW5kIGZ1enp5LCBxdWVzdGlvbnMgYW5kIGlucHV0IG11c3QgYmUgYnJpZWYuIFRyeSB0byByZWZvcm11bGF0ZSBpdCcsXG5dO1xuXG5leHBvcnQgY29uc3QgbWV0YXdvcmRzRGVzY3JpcHRpb25zID0ge1xuICBcImNhdGVnb3J5XCI6IFwiYW4gYXR0cmlidXRlIG9mIGEgcmVjb3JkIGluIGEgbW9kZWwsIGV4YW1wbGU6IGEgUGxhbmV0IGhhcyBhIFxcXCJuYW1lXFxcIiBhdHRyaWJ1dGVcIixcbiAgXCJkb21haW5cIjogXCJhIGdyb3VwIG9mIGZhY3RzIHdoaWNoIGFyZSB0eXBpY2FsbHkgdW5yZWxhdGVkXCIsXG4gIFwia2V5XCI6IFwiYW4gYXR0cmlidXRlIHZhbHVlIChvZiBhIGNhdGVnb3J5KSB3aGljaCAgaXMgdW5pcXVlIGZvciB0aGUgcmVjb3JkXCIsXG4gIFwidG9vbFwiOiBcImlzIHBvdGVudGlhbHkgY29tbWFuZCB0byBleGVjdXRlXCIsXG4gIFwicmVjb3JkXCI6IFwiYSBzcGVjaWZpYyBzZXQgb2YgXFxcImZhY3RcXFwicyBvZiBhIGRvbWFpbiwgYSBcXFwicmVjb3JkXFxcIiBoYXMgYSBzZXQgb2YgYXR0cmlidXRlcyB2YWx1ZXMgKFxcXCJmYWN0XFxcInMpIG9mIHRoZSBjYXRlZ29yaWVzLCBvZnRlbiBhIHJlY29yZCBoYXMgYSBcXFwia2V5XFxcIlwiLFxuICBcImZhY3RcIjogXCJhIHNwZWNpZmljIGNhdGVnb3J5IHZhbHVlIG9mIGEgcmVjb3JkIGluIGEgZG9tYWluLCBtYXkgYmUgYSBcXFwia2V5XFxcIiB2YWx1ZVwiLFxufTtcblxuZnVuY3Rpb24gZ2V0UmFuZG9tUmVzdWx0KGFycjogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpICUgYXJyLmxlbmd0aF07XG59XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVVcERvd25SZWNvZ25pemVyIGltcGxlbWVudHMgYnVpbGRlci5JSW50ZW50UmVjb2duaXplciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gIH1cblxuICByZWNvZ25pemUoY29udGV4dDogYnVpbGRlci5JUmVjb2duaXplQ29udGV4dCwgY2FsbGJhY2s6IChlcnI6IEVycm9yLCByZXN1bHQ6IGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXJSZXN1bHQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB2YXIgdSA9IHt9IGFzIGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXJSZXN1bHQ7XG5cbiAgICBkZWJ1Z2xvZyhcInJlY29nbml6aW5nIFwiICsgY29udGV4dC5tZXNzYWdlLnRleHQpO1xuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwiZG93blwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LmRvd25cIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJzdGFydCBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcInVwXCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwiZG9uZVwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImV4aXRcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJxdWl0XCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYnVnbG9nKCdyZWNvZ25pemluZyBub3RoaW5nJyk7XG4gICAgdS5pbnRlbnQgPSBcIk5vbmVcIjtcbiAgICB1LnNjb3JlID0gMC4xO1xuICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICBlMS5zdGFydEluZGV4ID0gXCJleGl0IFwiLmxlbmd0aDtcbiAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICBlMS5zY29yZSA9IDAuMTtcbiAgICB1LmVudGl0aWVzID0gW107XG4gICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgfVxufVxuXG5jb25zdCBBbnlPYmplY3QgPSBPYmplY3QgYXMgYW55O1xuXG52YXIgYm90O1xuXG52YXIgb0pTT04gPSBKU09OLnBhcnNlKCcnICsgZnMucmVhZEZpbGVTeW5jKCcuL3Jlc291cmNlcy9tb2RlbC9pbnRlbnRzLmpzb24nKSk7XG52YXIgb1J1bGVzID0gUGxhaW5SZWNvZ25pemVyLnBhcnNlUnVsZXMob0pTT04pO1xuLy8gdmFyIFJlY29nbml6ZXIgPSBuZXcgKHJlY29nbml6ZXIuUmVnRXhwUmVjb2duaXplcikob1J1bGVzKTtcblxuXG5mdW5jdGlvbiBsb2dRdWVyeShzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24sIGludGVudDogc3RyaW5nLCByZXN1bHQ/OiBBcnJheTxhbnk+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBKU09OLnN0cmluZ2lmeShyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvblxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZCB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlci5pZCB8fCBcIlwiXG4gIH0pICwgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlYnVnbG9nKFwibG9nZ2luZyBmYWlsZWQgXCIgKyBlcnIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qXG5cbmZ1bmN0aW9uIGxvZ1F1ZXJ5V2hhdElzKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PElNYXRjaC5JV2hhdElzQW5zd2VyPikge1xuXG4gIGZzLmFwcGVuZEZpbGUoJy4vbG9ncy9zaG93bWVxdWVyaWVzLnR4dCcsIFwiXFxuXCIgKyBKU09OLnN0cmluZ2lmeSh7XG4gICAgdGV4dDogc2Vzc2lvbi5tZXNzYWdlLnRleHQsXG4gICAgdGltZXN0YW1wOiBzZXNzaW9uLm1lc3NhZ2UudGltZXN0YW1wLFxuICAgIGludGVudDogaW50ZW50LFxuICAgIHJlczogcmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggJiYgV2hhdElzLmR1bXBOaWNlKHJlc3VsdFswXSkgfHwgXCIwXCIsXG4gICAgY29udmVyc2F0aW9uSWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uLmlkIHx8IFwiXCIsXG4gICAgdXNlcmlkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXJcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyLmlkIHx8IFwiXCJcbiAgfSksIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlYnVnbG9nKFwibG9nZ2luZyBmYWlsZWQgXCIgKyBlcnIpO1xuICAgIH1cbiAgfSk7XG59XG4qL1xuXG5mdW5jdGlvbiBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXI+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBXaGF0SXMuZHVtcE5pY2VUdXBlbChyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvblxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZCB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlci5pZCB8fCBcIlwiXG4gIH0pLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGd3b3JkcyA9IHt9O1xuLyoqXG4gKiBDb25zdHJ1Y3QgYSBib3RcbiAqIEBwYXJhbSBjb25uZWN0b3Ige0Nvbm5lY3Rvcn0gdGhlIGNvbm5lY3RvciB0byB1c2VcbiAqIEhUTUxDb25uZWN0b3JcbiAqIG9yIGNvbm5lY3RvciA9IG5ldyBidWlsZGVyLkNvbnNvbGVDb25uZWN0b3IoKS5saXN0ZW4oKVxuICovXG5mdW5jdGlvbiBtYWtlQm90KGNvbm5lY3RvcixcbiAgbW9kZWxQcm92aWRlcjogKCkgPT4gUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4sIG9wdGlvbnM/OiBhbnkpOiBidWlsZGVyLlVuaXZlcnNhbEJvdCB7XG4gIHZhciB0MCA9IERhdGUubm93KCk7XG4gIHZhciB0aGVNb2RlbFAgPSBtb2RlbFByb3ZpZGVyKCk7XG4gIHRoZU1vZGVsUC50aGVuKFxuICAgICh0aGVNb2RlbCkgPT4ge1xuICAgICAgdmFyIHQgPSBEYXRlLm5vdygpIC0gdDA7XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNob3dNb2RlbExvYWRUaW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBtb2RlbCBsb2FkIHRpbWUgJHsodCl9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgZnVuY3Rpb24gZ2V0VGhlTW9kZWwoKTogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xuICAgIHJldHVybiB0aGVNb2RlbFA7XG4gIH1cblxuICBib3QgPSBuZXcgYnVpbGRlci5Vbml2ZXJzYWxCb3QoY29ubmVjdG9yKTtcblxuXG5cbiAgLy8gQ3JlYXRlIExVSVMgcmVjb2duaXplciB0aGF0IHBvaW50cyBhdCBvdXIgbW9kZWwgYW5kIGFkZCBpdCBhcyB0aGUgcm9vdCAnLycgZGlhbG9nIGZvciBvdXIgQ29ydGFuYSBCb3QuXG4gIC8vIHZhciBtb2RlbCA9IHNlbnNpdGl2ZS5tb2RlbHVybDtcbiAgLy8gdmFyIG1vZGVsID0gJ2h0dHBzOi8vYXBpLnByb2plY3RveGZvcmQuYWkvbHVpcy92Mi4wL2FwcHMvYzQxM2IyZWYtMzgyYy00NWJkLThmZjAtZjc2ZDYwZTJhODIxP3N1YnNjcmlwdGlvbi1rZXk9YzIxMzk4YjU5ODBhNGNlMDlmNDc0YmJmZWU5M2I4OTImcT0nXG4gIHZhciByZWNvZ25pemVyID0gbmV3IFBsYWluUmVjb2duaXplci5SZWdFeHBSZWNvZ25pemVyKG9SdWxlcyk7XG5cbiAgdmFyIGRpYWxvZyA9IG5ldyBidWlsZGVyLkludGVudERpYWxvZyh7IHJlY29nbml6ZXJzOiBbcmVjb2duaXplcl0gfSk7XG4gIC8vIGRpYWxvZy5vbkJlZ2luKGZ1bmN0aW9uKHNlc3Npb24sYXJncykge1xuICAvLyBjb25zb2xlLmxvZyhcImJlZ2lubmluZyAuLi5cIilcbiAgLy8gc2Vzc2lvbi5kaWFsb2dEYXRhLnJldHJ5UHJvbXB0ID0gYXJncyAmJiBhcmdzLnJldHJ5UHJvbXB0IHx8IFwiSSBhbSBzb3JyeVwiXG4gIC8vIHNlc3Npb24uc2VuZChcIldoYXQgZG8geW91IHdhbnQ/XCIpXG4gIC8vXG4gIC8vIH0pXG5cbiAgdmFyIGRpYWxvZ1VwRG93biA9IG5ldyBidWlsZGVyLkludGVudERpYWxvZyh7IHJlY29nbml6ZXJzOiBbbmV3IFNpbXBsZVVwRG93blJlY29nbml6ZXIoKV0gfSk7XG5cbiAgYm90LmRpYWxvZygnL3VwZG93bicsIGRpYWxvZ1VwRG93bik7XG4gIGRpYWxvZ1VwRG93bi5vbkJlZ2luKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhRW50ZXJUcmFpbikpKTtcbiAgICAvL3Nlc3Npb24uc2VuZChcIkhpIHRoZXJlLCB1cGRvd24gaXMgd2FpdGluZyBmb3IgeW91XCIpO1xuICB9KVxuXG4gIGRpYWxvZ1VwRG93bi5tYXRjaGVzKCdpbnRlbnQudXAnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSBhcmdzIHx8IHt9O1xuICAgICAgYnVpbGRlci5Qcm9tcHRzLnRleHQoc2Vzc2lvbiwgJ3lvdSB3YW50IHRvIGV4aXQgdHJhaW5pbmc/IHR5cGUgXFxcImRvbmVcXFwiIGFnYWluLicpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSByZXN1bHRzLnJlcG9uc2U7XG4gICAgICBuZXh0KCk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgc2Vzc2lvbi5lbmREaWFsb2dXaXRoUmVzdWx0KHsgcmVzcG9uc2U6IHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgfSk7XG4gICAgfVxuICBdXG4gICk7XG5cbiAgZGlhbG9nVXBEb3duLm1hdGNoZXMoJ2ludGVudC5kb3duJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gYXJncyB8fCB7fTtcbiAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICd5b3Ugd2FudCB0byBnbyBkb3duIScpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSAtMTsgLy8gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgbmV4dCgpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgIHNlc3Npb24uc2VuZChcInN0aWxsIGdvaW5nIGRvd24/XCIpO1xuICAgIH1cbiAgXVxuICApO1xuICBkaWFsb2dVcERvd24ub25EZWZhdWx0KGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgbG9nUXVlcnkoc2Vzc2lvbiwgXCJvbkRlZmF1bHRcIik7XG4gICAgdmFyIHJlcyA9IGdldFJhbmRvbVJlc3VsdChhVHJhaW5EaWFsb2cpICsgZ2V0UmFuZG9tUmVzdWx0KGFUcmFpbkV4aXRIaW50KTtcbiAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQocmVzKSk7XG4gIH0pO1xuXG4gIC8qXG4gICAgYm90LmRpYWxvZygnL3RyYWluJywgW1xuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgICAgc2Vzc2lvbi5kaWFsZ29EYXRhLmFiYyA9IGFyZ3MgfHwge307XG4gICAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICdEbyB5b3Ugd2FudCB0byB0cmFpbiBtZScpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSByZXN1bHRzLnJlcG9uc2U7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgICAgc2Vzc2lvbi5lbmREaWFsb2dXaXRoUmVzdWx0KHsgcmVzcG9uc2U6IHNlc3Npb24uRGlhbG9nRGF0YS5hYmMgfSk7XG4gICAgICB9XG4gICAgXSk7XG4gICovXG5cbiAgYm90LmRpYWxvZygnLycsIGRpYWxvZyk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1Nob3dNZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBTaG93TWUgaXMgYSBzcGVjaWFsIGZvcm0gb2YgV2hhdElzIHdoaWNoIGFsc28gc2VsZWN0cyB0ZWhcbiAgICAgIC8vIFwiY2xvc2VzdCBfdXJsXCIgcmFua2VkIGJ5IF9wcmVmZXJyZWRVcmxPcmRlclxuICAgICAgLy8gaWYgcHJlc2VudCwgdGhlIF91cmwgaXMgcHV0IGludG8gZXhlYy5hY3Rpb25cblxuICAgICAgLy9cbiAgICAgIC8vLyBUT0RPIFJFTU9ERUxcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGRlYnVnbG9nKFwiU2hvdyBFbnRpdHlcIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgYTEgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnQTEnKTtcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcbiAgICAgICAgTGlzdEFsbC5saXN0QWxsU2hvd01lKGExLmVudGl0eSwgdGhlTW9kZWwpLnRoZW4oXG4gICAgICAgICAgcmVzdWx0U2hvd01lID0+IHtcbiAgICAgICAgICAgIGxvZ1F1ZXJ5KHNlc3Npb24sICdTaG93TWUnLCAocmVzdWx0U2hvd01lIGFzIGFueSkuYmVzdFVSSSk7XG4gICAgICAgICAgICAvLyB0ZXN0LmV4cGVjdCgzKVxuICAgICAgICAgICAgLy8gIHRlc3QuZGVlcEVxdWFsKHJlc3VsdC53ZWlnaHQsIDEyMCwgJ2NvcnJlY3Qgd2VpZ2h0Jyk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdFNob3dNZSB8fCAhKHJlc3VsdFNob3dNZSBhcyBhbnkpLmJlc3RVUkkpIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgZ2V0IHdoYXQgeW91IHdhbnRcIikpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYmVzdFVSSSA9IChyZXN1bHRTaG93TWUgYXMgYW55KS5iZXN0VVJJO1xuICAgICAgICAgICAgLy8gZGVidWdsb2coJ3Jlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAgICAgZGVidWdsb2coJ2Jlc3QgcmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFNob3dNZSB8fCB7fSwgdW5kZWZpbmVkLCAyKSk7XG5cbiAgICAgICAgICAgIC8vIHRleHQgOiBcInN0YXJ0aW5nIHVuaXQgdGVzdCBcXFwiXCIgKyB1bml0dGVzdCArIFwiXFxcIlwiKyAgKHVybD8gICgnIHdpdGggdXJsICcgKyB1cmwgKSA6ICdubyB1cmwgOi0oJyApLFxuICAgICAgICAgICAgLy8gICAgICBhY3Rpb24gOiB7IHVybDogdXJsIH1cblxuICAgICAgICAgICAgdmFyIHJlcGx5ID0gbmV3IGJ1aWxkZXIuTWVzc2FnZShzZXNzaW9uKVxuICAgICAgICAgICAgICAudGV4dChcInN0YXJ0aW5nIHVyaSBcIiArIGJlc3RVUkkpXG4gICAgICAgICAgICAgIC5hZGRFbnRpdHkoeyB1cmw6IGJlc3RVUkkgfSkgLy8gZXhlYy5hY3Rpb24pO1xuICAgICAgICAgICAgLy8gLmFkZEF0dGFjaG1lbnQoeyBmYWxsYmFja1RleHQ6IFwiSSBkb24ndCBrbm93XCIsIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZycsIGNvbnRlbnRVcmw6IFwid3d3LndvbWJhdC5vcmdcIiB9KTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIlNob3dNZVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnV2hhdElzJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG5cbiAgICAgIC8vIFRPRE8gU1dJVEggVE8gTU9OR09RVUVSSUVTXG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG5cbiAgICAgICAgZGVidWdsb2coXCJXaGF0SXMgRW50aXRpZXNcIik7XG4gICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMsIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3J5Jyk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzam9pbmVkID0gY2F0ZWdvcnlFbnRpdHkuZW50aXR5O1xuICAgICAgICB2YXIgaW5TdGggPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnQTEnKTtcbiAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcmllc2pvaW5lZCwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzOiBcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgLy8gY3VycmVudGx5IHdlIGRvIG5vdCBleHRyYWN0IGNhdGVnb3JpZXMgY29ycmVjdGx5ICwgdGh1cyB3ZSByYXRoZXIgaWdub3JlIGFuZCBnbyBvblxuICAgICAgICAgICAgLy9qdXN0IGdvIG9uICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgK1xuICAgICAgICAgICAgLy8gICAgIChlID8gJygnICsgZS50b1N0cmluZygpICsgJyknIDogXCJcIikpKTtcbiAgICAgICAgICAgIC8vICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgLy8gICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhlTW9kZWwucnVsZXMud29yZE1hcFsnY28tZmlvJ10pKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gY2F0ZWdvcmllc2pvaW5lZDtcbiAgICAgICAgdmFyIGluU29tZXRoaW5nID0gaW5TdGggJiYgaW5TdGguZW50aXR5IHx8IFwiXCI7XG4gICAgICAgIGlmIChpblN0aCkge1xuICAgICAgICAgIHF1ZXJ5ID0gY2F0ZWdvcmllc2pvaW5lZCArICcgd2l0aCAnICsgaW5TdGguZW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIE1vbmdvUXVlcmllcy5saXN0QWxsKHF1ZXJ5LCB0aGVNb2RlbCkudGhlbihyZXN1bHRXSSA9PiB7XG4gICAgICAgICAgZGVidWdsb2coKCkgPT4gJ2dvdCByZXN1bHQnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKVxuXG4gICAgICAgICAgdmFyIGVycl9leHBsYWluID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHRXSSk7XG4gICAgICAgICAgaWYgKGVycl9leHBsYWluKSB7XG4gICAgICAgICAgICAvL2RpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ICsgXCIgKFwiICsgY2F0ZWdvcnkgKyAnKVxcXCIgaW4gcmVsYXRpb24gdG8gXCInICsgYTEuZW50aXR5ICsgYFwiLiR7ZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgKyBcIlxcXCIgKFwiICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0cykgKyAnKSBpbiByZWxhdGlvbiB0byBcIicgKyBpblN0aC5lbnRpdHkgKyBgXCIuJHtlcnJfZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoZXJyX3RleHQpKTtcbiAgICAgICAgICAgIC8vICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdFdJKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFdJKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSkgOiAnLScpO1xuICAgICAgICAgIC8vIGRlYnVnbG9nKCdyZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0LCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdiZXN0IHJlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSVswXS5yZXN1bHRzWzBdIHx8IHt9LCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gICAgICAgICAgLy8gZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZD8gKCd0b3AgOiAnICsgV2hhdElzLmR1bXBXZWlnaHRzVG9wKHJlc3VsdDEudHVwZWxhbnN3ZXJzWzBdLnJlc3VsdFswXSB8fCB7fSwgeyB0b3A6IDMgfSkpOiAnLScpO1xuICAgICAgICAgIC8vIFRPRE8gY2xlYW5zZWQgc2VudGVuY2VcblxuICAgICAgICAgIC8vZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ1RoZSAnICsgY2F0ZWdvcmllc2pvaW5lZCArICcgb2YgJyArIGluU3RoLmVudGl0eSArICcgaXMgJyArXG4gICAgICAgICAgLy9yZXN1bHRXSS50dXBlbGFuc3dlcnNbMF0ucmVzdWx0ICsgXCJcXG5cIikpO1xuXG5cbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgLy8gVE9ETyBXaHkgb25seSBGSVJTVCE/Pz9cbiAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChbcmVzdWx0V0lbMF1dKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFdJKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSkgOiAnLScpO1xuICAgICAgICAgIGlmIChqb2lucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSBpblNvbWV0aGluZyA/ICcgb2YgJyArIGluU29tZXRoaW5nIDogJyc7XG4gICAgICAgICAgICBpZiAoY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ1RoZSAnICsgY2F0ZWdvcmllc2pvaW5lZCArIHN1ZmZpeCArICcgaXMgJyArXG4gICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgKyBcIlxcblwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZChcIlRoZSBcIiArIGNhdGVnb3JpZXNqb2luZWQgKyBzdWZmaXggKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHRXSSkgfHwgJyc7XG4gICAgICAgICAgICB2YXIgc3VmZml4MiA9IGluU29tZXRoaW5nID8gJyBmb3IgJyArIGluU29tZXRoaW5nIDogJyc7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJpIGRpZCBub3QgZmluZCBhbnkgXCIgKyBjYXRlZ29yaWVzam9pbmVkICsgc3VmZml4MiArIFwiLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikgKyBcIlwiICsgZXJycHJlZml4KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ0xpc3RBbGwnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogTGlzdEFsbFwiKTtcbiAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMsIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJyk7XG4gICAgICB2YXIgY2F0ZWdvcnkgPSBjYXRlZ29yeUVudGl0eS5lbnRpdHk7XG4gICAgICB2YXIgaW5TdGhFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnaW5zdGgnKVxuICAgICAgdmFyIGluU29tZXRoaW5nID0gaW5TdGhFbnRpdHkgJiYgaW5TdGhFbnRpdHkuZW50aXR5O1xuICAgICAgLy8gc29tZSBtZXRhcXVlcmllczpcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcmllc1wiKSB7XG4gICAgICAgICAgLy8gZG8gd2UgaGF2ZSBhIGZpbHRlciA/XG4gICAgICAgICAgdmFyIGRvbWFpbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoaW5Tb21ldGhpbmcpIHtcbiAgICAgICAgICAgIGRvbWFpbiA9IExpc3RBbGwuaW5mZXJEb21haW4odGhlTW9kZWwsIGluU29tZXRoaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkb21haW4pIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmNhdGVnb3J5KS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgaW5mZXIgYSBkb21haW4gcmVzdHJpY3Rpb24gZnJvbSBcXFwiXCIgKyBVdGlscy5zdHJpcFF1b3RlcyhpblNvbWV0aGluZykgKyBcIlxcXCIsIGFsbCBteSBjYXRlZ29yaWVzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwibXkgY2F0ZWdvcmllcyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGFSZXMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgYVJlcykuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBjYXRlZ29yaWVzIGluIGRvbWFpbiBcXFwiXCIgKyBkb21haW4gKyBcIlxcXCIgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJkb21haW5zXCIpIHtcbiAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC5kb21haW5zKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBkb21haW5zIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLnJ1bGVzLndvcmRNYXBbJ2NvLWZpbyddKSk7XG4gICAgICAgIHZhciBxdWVyeSA9IGNhdGVnb3J5O1xuICAgICAgICB2YXIgY2F0ZWdvcmllc2pvaW5lZCA9IGNhdGVnb3J5O1xuICAgICAgICBpZiAoaW5Tb21ldGhpbmcpIHtcbiAgICAgICAgICBxdWVyeSA9IGNhdGVnb3J5ICsgJyB3aXRoICcgKyBpblNvbWV0aGluZztcbiAgICAgICAgfVxuICAgICAgICBNb25nb1F1ZXJpZXMubGlzdEFsbChxdWVyeSwgdGhlTW9kZWwpLnRoZW4ocmVzdWx0MSA9PiB7XG4gICAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGVidWdsb2coJ2FuYWx5emluZyBjYXRlZ29yeSBmcm9tICcgKyBjYXRlZ29yeSk7XG4gICAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcnksIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzOiBcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb246IFwiICsgZSk7XG4gICAgICAgICAgICAgIC8vIEdvIG9uIGZvciBub3dcbiAgICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgICAvLyAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICtcbiAgICAgICAgICAgICAgLy8gICAgKGUgPyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScgOiBcIlwiKSkpO1xuICAgICAgICAgICAgICAvLyAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgICAvLyAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvL3ZhciByZXN1bHQxID0gTGlzdEFsbC5saXN0QWxsV2l0aENvbnRleHQoY2F0LCBpblNvbWV0aGluZyxcbiAgICAgICAgICAvLyAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MSkpIDogJy0nKTtcbiAgICAgICAgICB2YXIgZXJyX2V4cGxhaW4gPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdDEpO1xuICAgICAgICAgIGlmIChlcnJfZXhwbGFpbikge1xuICAgICAgICAgICAgLy9kaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdCArIFwiIChcIiArIGNhdGVnb3J5ICsgJylcXFwiIGluIHJlbGF0aW9uIHRvIFwiJyArIGExLmVudGl0eSArIGBcIi4ke2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IGluU29tZXRoaW5nID8gJ2luIHJlbGF0aW9uIHRvIFwiJyArIGluU29tZXRoaW5nICsgJ1wiJyA6ICcnO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzam9pbmVkICsgXCJcXFwiIChcIiArIFV0aWxzLmxpc3RUb1F1b3RlZENvbW1hQW5kKGNhdHMpICsgJyknICsgc3VmZml4ICsgYC4ke2Vycl9leHBsYWlufWApKTtcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChlcnJfdGV4dCkpO1xuICAgICAgICAgICAgLy8gIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0MSkpO1xuICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxKTtcbiAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAoJ2xpc3RhbGwgcmVzdWx0MiA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSkpO1xuICAgICAgICAgIHZhciBzdWZmaXggPSAoaW5Tb21ldGhpbmcpID8gXCIgZm9yIFwiICsgaW5Tb21ldGhpbmcgOiBcIlwiO1xuICAgICAgICAgIGlmIChqb2lucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgc3VmZml4ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGVycnByZWZpeCA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHQxKSB8fCAnJztcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgc3VmZml4ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSArIFwiXCIgKyBlcnJwcmVmaXgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuXG4gIGRpYWxvZy5tYXRjaGVzKCdidWlsZHRhYmxlJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IGJ1aWxkdGFibGVcIik7XG4gICAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpLmVudGl0eTtcbiAgICAgICAgZGVidWdsb2coXCJmYWN0T3JDYXQgaXNcIiArIGNhdGVnb3JpZXMpO1xuICAgICAgICB2YXIgY2F0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcmllcywgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzICsgJ1wiKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjYXRzIHx8IChjYXRzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZGlkIG5vdCBmaW5kIGEgY2F0ZWdvcnkgaW4gXCInICsgY2F0ZWdvcmllcyArICdcIicpKTtcbiAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBleGVjID0gTWFrZVRhYmxlLm1ha2VUYWJsZShjYXRzLCB0aGVNb2RlbCk7XG4gICAgICAgIC8vICAgICAgY29uc3QgZXhlYyA9IEV4ZWNTZXJ2ZXIuZXhlY1Rvb2woc2Vzc2lvbi5kaWFsb2dEYXRhLnJlc3VsdCBhcyBJTWF0Y2guSVRvb2xNYXRjaCwgdGhlTW9kZWwucmVjb3Jkcyk7XG4gICAgICAgIHZhciByZXBseSA9IG5ldyBidWlsZGVyLk1lc3NhZ2Uoc2Vzc2lvbilcbiAgICAgICAgICAudGV4dChleGVjLnRleHQpXG4gICAgICAgICAgLmFkZEVudGl0eShleGVjLmFjdGlvbik7XG4gICAgICAgIC8vIC5hZGRBdHRhY2htZW50KHsgZmFsbGJhY2tUZXh0OiBcIkkgZG9uJ3Qga25vd1wiLCBjb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnLCBjb250ZW50VXJsOiBcInd3dy53b21iYXQub3JnXCIgfSk7XG4gICAgICAgIGRpYWxvZ2xvZyhcIlNob3dNZVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgICB9KTtcbiAgICB9XG5cblxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnRGVzY3JpYmUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IERlc2NyaWJlXCIpO1xuICAgICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICAgIHZhciBmYWN0RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0ExJyk7XG4gICAgICAgIHZhciBmYWN0T3JDYXQgPSBmYWN0RW50aXR5ICYmIGZhY3RFbnRpdHkuZW50aXR5O1xuICAgICAgICB2YXIgZG9tYWluRW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0QnKTtcbiAgICAgICAgdmFyIGRvbWFpblMgPSBkb21haW5FbnRpdHkgJiYgZG9tYWluRW50aXR5LmVudGl0eTtcbiAgICAgICAgdmFyIGZpbHRlckRvbWFpbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGRvbWFpblMpIHtcbiAgICAgICAgICBmaWx0ZXJEb21haW4gPSBMaXN0QWxsLmluZmVyRG9tYWluKHRoZU1vZGVsLCBkb21haW5TKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhcImdvdCBkb21haW5cIiArIGZpbHRlckRvbWFpbik7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJEb21haW4pIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgaW5mZXIgYSBkb21haW4gcmVzdHJpY3Rpb24gZnJvbSBcXFwiXCIgKyBkb21haW5TICsgXCJcXFwiLiBTcGVjaWZ5IGFuIGV4aXN0aW5nIGRvbWFpbi4gKExpc3QgYWxsIGRvbWFpbnMpIHRvIGdldCBleGFjdCBuYW1lcy5cXG5cIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnbG9nKFwiZmFjdE9yQ2F0IGlzXCIgKyBmYWN0T3JDYXQpO1xuICAgICAgICBpZiAobWV0YXdvcmRzRGVzY3JpcHRpb25zW2ZhY3RPckNhdC50b0xvd2VyQ2FzZSgpXSkge1xuICAgICAgICAgIC8vIGRvIHdlIGhhdmUgYSBmaWx0ZXIgP1xuICAgICAgICAgIHZhciBwcmVmaXggPSBcIlwiO1xuICAgICAgICAgIGlmIChmaWx0ZXJEb21haW4pIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICdcImluIGRvbWFpbiBcIicgKyBmaWx0ZXJEb21haW4gKyAnXCIgbWFrZSBubyBzZW5zZSB3aGVuIG1hdGNoaW5nIGEgbWV0YXdvcmQuXFxuJztcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVidWdsb2coXCJzaG93aW5nIG1ldGEgcmVzdWx0XCIpO1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQocHJlZml4ICsgJ1wiJyArIGZhY3RPckNhdCArICdcIiBpcyAnICsgbWV0YXdvcmRzRGVzY3JpcHRpb25zW2ZhY3RPckNhdC50b0xvd2VyQ2FzZSgpXSArIFwiXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgaWYgKFdoYXRJcy5zcGxpdEF0Q29tbWFBbmQoZmFjdE9yQ2F0KS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgZGlhbG9nbG9nKFwiRGVzY3JpYmVcIiwgc2Vzc2lvbiwgc2VuZChcIldob2EsIGkgY2FuIG9ubHkgZXhwbGFpbiBvbmUgdGhpbmcgYXQgYSB0aW1lLCBub3QgXFxcIlwiICsgZmFjdE9yQ2F0ICsgXCJcXFwiLiBQbGVhc2UgYXNrIG9uZSBhdCBhIHRpbWUuXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgLy8gZ2V0RG9tYWluc0ZvckNhdGVnb3J5XG4gICAgICAgIH1cblxuXG5cbiAgICAgICAgdmFyIGNhdGVnb3J5ID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeShmYWN0T3JDYXQsIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgLy92YXIgY2F0UmVzdWx0cyA9IFtdO1xuICAgICAgICB2YXIgY2F0UmVzdWx0c1AgPSB1bmRlZmluZWQgYXMgUHJvbWlzZTxzdHJpbmdbXT47XG4gICAgICAgIGlmIChjYXRlZ29yeSkge1xuICAgICAgICAgIC8vVE9ET1xuICAgICAgICAgIGNhdFJlc3VsdHNQID0gRGVzY3JpYmUuZGVzY3JpYmVDYXRlZ29yeShjYXRlZ29yeSwgZmlsdGVyRG9tYWluLCB0aGVNb2RlbCwgbWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0UmVzdWx0c1AgPSAoZ2xvYmFsLlByb21pc2UgYXMgYW55KS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhdFJlc3VsdHNQLnRoZW4oY2F0UmVzdWx0cyA9PiB7XG4gICAgICAgICAgdmFyIHJlc0ZhY3QgPSBEZXNjcmliZS5kZXNjcmliZUZhY3RJbkRvbWFpbihmYWN0T3JDYXQsIGZpbHRlckRvbWFpbiwgdGhlTW9kZWwpLnRoZW4oKHJlc0ZhY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKGNhdFJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgdmFyIHByZWZpeGVkID0gY2F0UmVzdWx0cy5tYXAocmVzID0+XG4gICAgICAgICAgICAgICAgYCR7RGVzY3JpYmUuc2xvcHB5T3JFeGFjdChjYXRlZ29yeSwgZmFjdE9yQ2F0LCB0aGVNb2RlbCl9ICAke3Jlc31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYXRSZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXNGYWN0ID0gcHJlZml4ZWQuam9pbihcIlxcblwiKTsgKyBcIlxcblwiICsgcmVzRmFjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQocmVzRmFjdCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8qXG4gICAgICAgICAgICAgIHZhciBhUmVzID0gTW9kZWwuZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcbiAgICAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIGFSZXMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwibXkgY2F0ZWdvcmllcyBpbiBkb21haW4gXFxcIlwiICsgZG9tYWluICsgXCJcXFwiIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJkb21haW5zXCIpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmRvbWFpbnMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sIHNlbmQoXCJteSBkb21haW5zIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwidG9vbHNcIikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwudG9vbHMpLm1hcChmdW5jdGlvbiAob1Rvb2wpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9Ub29sLm5hbWU7XG4gICAgICAgICAgICB9KS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbixzZW5kKFwibXkgdG9vbHMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICovXG5cbiAgICAgICAgICAvKlxuICAgICAgICAgIHZhciBjYXRzID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2F0cyA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnlNdWx0MihjYXRlZ29yeSwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHNcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgaWYoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLHNlc3Npb24sc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcnkgKyAnXCIoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFjYXRzIHx8IChjYXRzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICsgJ1wiJykpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgY2F0ID0gXCJcIjtcbiAgICAgICAgICBpZiggY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNhdCA9IGNhdHNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCBjYXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgZGVidWdsb2coJ2NhdGVnb3J5IGlkZW50aWZpZWQ6JyArIGNhdCk7XG4gICAgICAgICAgICBpZiAoYTEgJiYgYTEuZW50aXR5KSB7XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdnb3QgZmlsdGVyOicgKyBhMS5lbnRpdHkpO1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXQgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcnkodGhlTW9kZWwsIGNhdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQxID0gTGlzdEFsbC5saXN0QWxsV2l0aENvbnRleHQoY2F0LCBhMS5lbnRpdHksXG4gICAgICAgICAgICAgICAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICAgICAgLy8gVE9ETyBjbGFzc2lmeWluZyB0aGUgc3RyaW5nIHR3aWNlIGlzIGEgdGVycmlibGUgd2FzdGVcbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQxLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdnb2luZyBmb3IgaGF2aW5nJyk7XG4gICAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeSh0aGVNb2RlbCwgY2F0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0MSA9IExpc3RBbGwubGlzdEFsbEhhdmluZ0NvbnRleHQoY2F0LCBhMS5lbnRpdHksIHRoZU1vZGVsLnJ1bGVzLFxuICAgICAgICAgICAgICAgICAgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDEpKTtcbiAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzKHJlc3VsdDEpKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXMoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxKTtcbiAgICAgICAgICAgICAgaWYoam9pbnJlc3VsdHMubGVuZ3RoICl7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwiaSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gbm8gZW50aXR5LCBlLmcuIGxpc3QgYWxsIGNvdW50cmllc1xuICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KHRoZU1vZGVsLCBjYXQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IExpc3RBbGwubGlzdEFsbEhhdmluZ0NvbnRleHQoY2F0LCBjYXQsIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJcyhzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgaXMgY2F0PlwiICsgY2F0KTtcbiAgICAgICAgICAgICAgICBpZihjYXQgIT09IFwiZXhhbXBsZSBxdWVzdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSBMaXN0QWxsLmpvaW5SZXN1bHRzKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwidGhlIFwiICsgY2F0ZWdvcnkgKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwiRm91bmQgbm8gZGF0YSBoYXZpbmcgXFxcIlwiICsgY2F0ICsgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG11bHRpcGxlIGNhdGVnb3JpZXNcbiAgICAgICAgICAgIGRlYnVnbG9nKCdjYXRlZ29yaWVzIGlkZW50aWZpZWQ6JyArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgICAgaWYgKGExICYmIGExLmVudGl0eSkge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ290IGZpbHRlcjonICsgYTEuZW50aXR5KTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0ID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3JpZXModGhlTW9kZWwsIGNhdHMsIHRydWUpO1xuICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsc2Vzc2lvbixzZW5kKCdJIGNhbm5vdCBjb21iaW5lIFwiJyArIGNhdGVnb3J5ICsgJygnICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHJlc3VsdDFUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxXaXRoQ29udGV4dChjYXRzLCBhMS5lbnRpdHksXG4gICAgICAgICAgICAgICAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICAgICAgLy8gVE9ETyBjbGFzc2lmeWluZyB0aGUgc3RyaW5nIHR3aWNlIGlzIGEgdGVycmlibGUgd2FzdGVcbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQxVC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ29pbmcgZm9yIGhhdmluZycpO1xuICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyh0aGVNb2RlbCwgY2F0cywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlc3VsdDFUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxIYXZpbmdDb250ZXh0KGNhdHMsIGExLmVudGl0eSwgdGhlTW9kZWwucnVsZXMsXG4gICAgICAgICAgICAgICAgICB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MVQpKTtcbiAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0MVQpKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdDFUKTtcbiAgICAgICAgICAgICAgaWYoam9pbnJlc3VsdHMubGVuZ3RoICl7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwiaSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gbm8gZW50aXR5LCBlLmcuIGxpc3QgYWxsIGNvdW50cmllc1xuICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0ge30gYXMgeyBba2V5IDogc3RyaW5nXSA6IGJvb2xlYW59O1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKHRoZU1vZGVsLCBjYXRzLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIixzZXNzaW9uLHNlbmQoJ0kgY2Fubm90IGNvbWJpbmUgXCInICsgY2F0ZWdvcnkgKyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciByZXN1bHRUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxIYXZpbmdDb250ZXh0KGNhdHMsIFwiXFxcIlwiICsgY2F0cy5qb2luKFwiXFxcIiBcXFwiXCIpICsgXCJcXFwiXCIsIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0VCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHRULmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0VCkpO1xuICAgICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBpcyBjYXQ+XCIgKyBjYXRzLmpvaW4oXCIsIFwiKSk7XG4gICAgICAgICAgICAgICAgaWYoY2F0ICE9PSBcImV4YW1wbGUgcXVlc3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHRUKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdFQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcIkZvdW5kIG5vIGRhdGEgaGF2aW5nIFxcXCJcIiArIGNhdCArIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnVHJhaW5NZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBUcmFpblwiKTtcbiAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJyk7XG4gICAgICBpZiAobWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJrcm9ub3NcIikgPj0gMCB8fCBtZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImtsaW5nb25cIikgPj0gMCkge1xuICAgICAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFUcmFpbk5vS2xpbmdvbikpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHJlcyA9IGdldFJhbmRvbVJlc3VsdChhVHJhaW5SZXBsaWVzKTtcbiAgICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChyZXMpKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdUb29Mb25nJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IFRvb0xvbmdcIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpO1xuICAgICAgZGlhbG9nbG9nKFwiVG9vTG9uZ1wiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhUmVzcG9uc2VzT25Ub29Mb25nKSkpO1xuICAgIH1cbiAgXSk7XG5cblxuICBkaWFsb2cubWF0Y2hlcygnV3JvbmcnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIC8qXG4gICAgICBkaWFsb2dMb2dnZXIoe1xuICAgICAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgICAgICBpbnRlbnQ6IFwiV3JvbmdcIixcbiAgICAgICAgcmVzcG9uc2U6ICc8YmVnaW4gdXBkb3duPidcbiAgICAgIH0pOyAqL1xuICAgICAgc2Vzc2lvbi5iZWdpbkRpYWxvZygnL3VwZG93bicsIHNlc3Npb24udXNlckRhdGEuY291bnQpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHZhciBhbGFybSA9IHNlc3Npb24uZGlhbG9nRGF0YS5hbGFybTtcbiAgICAgIG5leHQoKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICBzZXNzaW9uLnNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFCYWNrRnJvbVRyYWluaW5nKSk7IC8vICArIEpTT04uc3RyaW5naWZ5KHJlc3VsdHMpKTtcbiAgICAgIC8vc2Vzc2lvbi5zZW5kKCdlbmQgb2Ygd3JvbmcnKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdFeGl0JywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBkZWJ1Z2xvZygnZXhpdCA6Jyk7XG4gICAgICBkZWJ1Z2xvZygnZXhpdCcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSk7XG4gICAgICBkaWFsb2dMb2dnZXIoe1xuICAgICAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgICAgICBpbnRlbnQ6IFwiRXhpdFwiLFxuICAgICAgICByZXNwb25zZTogJ3lvdSBhcmUgaW4gYSBsb2dpYyBsb29wJ1xuICAgICAgfSk7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJ5b3UgYXJlIGluIGEgbG9naWMgbG9vcCBcIik7XG4gICAgfVxuICBdKTtcbiAgZGlhbG9nLm1hdGNoZXMoJ0hlbHAnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIGRlYnVnbG9nKCdoZWxwIDonKTtcbiAgICAgIGRlYnVnbG9nKCdoZWxwJyk7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJJIGtub3cgYWJvdXQgLi4uLiA8Y2F0ZWdvcmllcz4+XCIpO1xuICAgIH1cbiAgXSk7XG5cbiAgLypcbiAgICAvLyBBZGQgaW50ZW50IGhhbmRsZXJzXG4gICAgZGlhbG9nLm1hdGNoZXMoJ3RyYWluJywgW1xuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgICAgZGVidWdsb2coJ3RyYWluJyk7XG4gICAgICAgIC8vIFJlc29sdmUgYW5kIHN0b3JlIGFueSBlbnRpdGllcyBwYXNzZWQgZnJvbSBMVUlTLlxuICAgICAgICB2YXIgdGl0bGUgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnYnVpbHRpbi5hbGFybS50aXRsZScpO1xuICAgICAgICB2YXIgdGltZSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5yZXNvbHZlVGltZShhcmdzLmVudGl0aWVzKTtcbiAgICAgICAgdmFyIGFsYXJtID0gc2Vzc2lvbi5kaWFsb2dEYXRhLmFsYXJtID0ge1xuICAgICAgICAgIHRpdGxlOiB0aXRsZSA/IHRpdGxlLmVudGl0eSA6IG51bGwsXG4gICAgICAgICAgdGltZXN0YW1wOiB0aW1lID8gdGltZS5nZXRUaW1lKCkgOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIC8vIFByb21wdCBmb3IgdGl0bGVcbiAgICAgICAgaWYgKCFhbGFybS50aXRsZSkge1xuICAgICAgICAgIGRpYWxvZ0xvZ2dlcih7XG4gICAgICAgICAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgICAgICAgICAgaW50ZW50OiBcInRyYWluXCIsXG4gICAgICAgICAgICByZXNwb25zZTogJ1doYXQgZmFjdCB3b3VsZCB5b3UgbGlrZSB0byB0cmFpbj8nXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYnVpbGRlci5Qcm9tcHRzLnRleHQoc2Vzc2lvbiwgJ1doYXQgZmFjdCB3b3VsZCB5b3UgbGlrZSB0byB0cmFpbj8nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgICB2YXIgYWxhcm0gPSBzZXNzaW9uLmRpYWxvZ0RhdGEuYWxhcm07XG4gICAgICAgIGlmIChyZXN1bHRzLnJlc3BvbnNlKSB7XG4gICAgICAgICAgYWxhcm0udGl0bGUgPSByZXN1bHRzLnJlc3BvbnNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvbXB0IGZvciB0aW1lICh0aXRsZSB3aWxsIGJlIGJsYW5rIGlmIHRoZSB1c2VyIHNhaWQgY2FuY2VsKVxuICAgICAgICBpZiAoYWxhcm0udGl0bGUgJiYgIWFsYXJtLnRpbWVzdGFtcCkge1xuXG5cbiAgICAgICAgICBidWlsZGVyLlByb21wdHMudGltZShzZXNzaW9uLCAnV2hhdCB0aW1lIHdvdWxkIHlvdSBsaWtlIHRvIHNldCB0aGUgYWxhcm0gZm9yPycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICAgIHZhciBhbGFybSA9IHNlc3Npb24uZGlhbG9nRGF0YS5hbGFybTtcbiAgICAgICAgaWYgKHJlc3VsdHMucmVzcG9uc2UpIHtcbiAgICAgICAgICB2YXIgdGltZSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5yZXNvbHZlVGltZShbcmVzdWx0cy5yZXNwb25zZV0pO1xuICAgICAgICAgIGFsYXJtLnRpbWVzdGFtcCA9IHRpbWUgPyB0aW1lLmdldFRpbWUoKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0IHRoZSBhbGFybSAoaWYgdGl0bGUgb3IgdGltZXN0YW1wIGlzIGJsYW5rIHRoZSB1c2VyIHNhaWQgY2FuY2VsKVxuICAgICAgICBpZiAoYWxhcm0udGl0bGUgJiYgYWxhcm0udGltZXN0YW1wKSB7XG4gICAgICAgICAgLy8gU2F2ZSBhZGRyZXNzIG9mIHdobyB0byBub3RpZnkgYW5kIHdyaXRlIHRvIHNjaGVkdWxlci5cbiAgICAgICAgICBhbGFybS5hZGRyZXNzID0gc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3M7XG4gICAgICAgICAgLy9hbGFybXNbYWxhcm0udGl0bGVdID0gYWxhcm07XG5cbiAgICAgICAgICAvLyBTZW5kIGNvbmZpcm1hdGlvbiB0byB1c2VyXG4gICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShhbGFybS50aW1lc3RhbXApO1xuICAgICAgICAgIHZhciBpc0FNID0gZGF0ZS5nZXRIb3VycygpIDwgMTI7XG4gICAgICAgICAgc2Vzc2lvbi5zZW5kKCdDcmVhdGluZyBhbGFybSBuYW1lZCBcIiVzXCIgZm9yICVkLyVkLyVkICVkOiUwMmQlcycsXG4gICAgICAgICAgICBhbGFybS50aXRsZSxcbiAgICAgICAgICAgIGRhdGUuZ2V0TW9udGgoKSArIDEsIGRhdGUuZ2V0RGF0ZSgpLCBkYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgICAgICAgICBpc0FNID8gZGF0ZS5nZXRIb3VycygpIDogZGF0ZS5nZXRIb3VycygpIC0gMTIsIGRhdGUuZ2V0TWludXRlcygpLCBpc0FNID8gJ2FtJyA6ICdwbScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlc3Npb24uc2VuZCgnT2suLi4gbm8gcHJvYmxlbS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0pO1xuICAqL1xuXG4gIGRpYWxvZy5vbkRlZmF1bHQoZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICBsb2dRdWVyeShzZXNzaW9uLCBcIm9uRGVmYXVsdFwiKTtcbiAgICB2YXIgZWxpemEgPSBnZXRFbGl6YUJvdChnZXRDb252ZXJzYXRpb25JZChzZXNzaW9uKSk7XG4gICAgdmFyIHJlcGx5ID0gZWxpemEudHJhbnNmb3JtKHNlc3Npb24ubWVzc2FnZS50ZXh0KTtcbiAgICBkaWFsb2dsb2coXCJlbGl6YVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgLy9uZXcgRWlsemFib3RcbiAgICAvL3Nlc3Npb24uc2VuZChcIkkgZG8gbm90IHVuZGVyc3RhbmQgdGhpcyBhdCBhbGxcIik7XG4gICAgLy9idWlsZGVyLkRpYWxvZ0FjdGlvbi5zZW5kKCdJXFwnbSBzb3JyeSBJIGRpZG5cXCd0IHVuZGVyc3RhbmQuIEkgY2FuIG9ubHkgc2hvdyBzdGFydCBhbmQgcmluZycpO1xuICB9KTtcblxuICAvKlxuICAvLyBWZXJ5IHNpbXBsZSBhbGFybSBzY2hlZHVsZXJcbiAgdmFyIGFsYXJtcyA9IHt9O1xuICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGZvciAodmFyIGtleSBpbiBhbGFybXMpIHtcbiAgICAgIHZhciBhbGFybSA9IGFsYXJtc1trZXldO1xuICAgICAgaWYgKG5vdyA+PSBhbGFybS50aW1lc3RhbXApIHtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBidWlsZGVyLk1lc3NhZ2UoKVxuICAgICAgICAgIC5hZGRyZXNzKGFsYXJtLmFkZHJlc3MpXG4gICAgICAgICAgLnRleHQoJ0hlcmVcXCdzIHlvdXIgXFwnJXNcXCcgYWxhcm0uJywgYWxhcm0udGl0bGUpO1xuICAgICAgICBib3Quc2VuZChtc2cpO1xuICAgICAgICBkZWxldGUgYWxhcm1zW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9LCAxNTAwMCk7XG4gICovXG4gIHJldHVybiBib3Q7XG59XG5cbmlmIChtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYVRyYWluTm9LbGluZ29uOiBhVHJhaW5Ob0tsaW5nb24sXG4gICAgYVRyYWluUmVwbGllczogYVRyYWluUmVwbGllcyxcbiAgICByZXN0cmljdERhdGE6IHJlc3RyaWN0RGF0YSxcbiAgICBpc0Fub255bW91czogaXNBbm9ueW1vdXMsXG4gICAgU2ltcGxlVXBEb3duUmVjb2duaXplcjogU2ltcGxlVXBEb3duUmVjb2duaXplcixcbiAgICBhUmVzcG9uc2VzT25Ub29Mb25nOiBhUmVzcG9uc2VzT25Ub29Mb25nLFxuICAgIG1ldGF3b3Jkc0Rlc2NyaXB0aW9uczogbWV0YXdvcmRzRGVzY3JpcHRpb25zLFxuICAgIG1ha2VCb3Q6IG1ha2VCb3RcbiAgfTtcbn1cbiJdfQ==
