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
exports.metawordsDescriptions = exports.aResponsesOnTooLong = exports.restrictData = void 0;
const fs = require("fs");
const builder = require("./botbuilder");
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
/*
export class SimpleUpDownRecognizer implements builder.IIntentRecognizer {
  constructor() {

  }

  recognize(context: builder.IRecognizeContext, callback: (err: Error, result: builder.IIntentRecognizerResult) => void): void {
    var u = {} as builder.IIntentRecognizerResult;

    debuglog("recognizing " + context.message.text);
    if (context.message.text.indexOf("down") >= 0) {
      u.intent = "intent.down";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
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
      var e1 = {} as builder.IEntity;
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
      var e1 = {} as builder.IEntity;
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
      var e1 = {} as builder.IEntity;
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
      var e1 = {} as builder.IEntity;
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
    var e1 = {} as builder.IEntity;
    e1.startIndex = "exit ".length;
    e1.endIndex = context.message.text.length;
    e1.score = 0.1;
    u.entities = [];
    callback(undefined, u);
  }
}
*/
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
    // var dialogUpDown = new builder.IntentDialog({ recognizers: [new SimpleUpDownRecognizer()] });
    /*
    bot.dialog('/updown', dialogUpDown);
    dialogUpDown.onBegin(function (session) {
      dialoglog("TrainMe", session, send(getRandomResult(aEnterTrain)));
      //session.send("Hi there, updown is waiting for you");
    })
  
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
    ]
    );
  
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
    ]
    );
    dialogUpDown.onDefault(function (session) {
      logQuery(session, "onDefault");
      var res = getRandomResult(aTrainDialog) + getRandomResult(aTrainExitHint);
      dialoglog("TrainMe", session, send(res));
    });
    */
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
        //SimpleUpDownRecognizer: SimpleUpDownRecognizer,
        aResponsesOnTooLong: exports.aResponsesOnTooLong,
        metawordsDescriptions: exports.metawordsDescriptions,
        makeBot: makeBot
    };
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUM7UUFDbEQsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxPQUFPO1FBQ2hDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDL0IsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLGNBQWM7UUFDZCxrREFBa0Q7UUFDbEQsK0ZBQStGO0lBQ2pHLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsSUFBSSxNQUFNLEVBQUU7SUFDVixNQUFNLENBQUMsT0FBTyxHQUFHO1FBQ2YsZUFBZSxFQUFFLGVBQWU7UUFDaEMsYUFBYSxFQUFFLGFBQWE7UUFDNUIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsV0FBVyxFQUFFLFdBQVc7UUFDeEIsaURBQWlEO1FBQ2pELG1CQUFtQixFQUFFLDJCQUFtQjtRQUN4QyxxQkFBcUIsRUFBRSw2QkFBcUI7UUFDNUMsT0FBTyxFQUFFLE9BQU87S0FDakIsQ0FBQztDQUNIIiwiZmlsZSI6ImJvdC9zbWFydGRpYWxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhlIGJvdCBpbXBsZW1lbnRhdGlvblxuICpcbiAqIEluc3RhbnRpYXRlIGFwc3NpbmcgYSBjb25uZWN0b3IgdmlhXG4gKiBtYWtlQm90XG4gKlxuICpcbiAqL1xuLyoqXG4gKiBAZmlsZVxuICogQG1vZHVsZSBqZnNlYi5tZ25scV9hYm90LnNtYXJ0ZGlhbG9nXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2LTIxMDkgR2VyZCBGb3JzdG1hbm5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCAqIGFzIGJ1aWxkZXIgZnJvbSAnLi9ib3RidWlsZGVyJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcblxuLy9pbXBvcnQgKiBhcyBNYXRjaCBmcm9tICcuLi9tYXRjaC9tYXRjaCc7XG4vL2ltcG9ydCAqIGFzIHNyY0hhbmRsZSBmcm9tICdzcmNIYW5kbGUnO1xuXG4vL2ltcG9ydCAqIGFzIEFuYWx5emUgZnJvbSAnLi4vbWF0Y2gvYW5hbHl6ZSc7XG5pbXBvcnQgeyBCcmVha0Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cbmltcG9ydCAqIGFzIFdoYXRJcyBmcm9tICcuLi9tYXRjaC93aGF0aXMnO1xuaW1wb3J0ICogYXMgTGlzdEFsbCBmcm9tICcuLi9tYXRjaC9saXN0YWxsJztcbmltcG9ydCAqIGFzIERlc2NyaWJlIGZyb20gJy4uL21hdGNoL2Rlc2NyaWJlJztcbmltcG9ydCAqIGFzIE1ha2VUYWJsZSBmcm9tICcuLi9leGVjL21ha2VxYmV0YWJsZSc7XG5pbXBvcnQgKiBhcyBNb25nb1F1ZXJpZXMgZnJvbSAnLi4vbWF0Y2gvbW9uZ29xdWVyaWVzJztcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XG5cbmltcG9ydCB7IEVyRXJyb3IgYXMgRXJFcnJvciB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7XG5cbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0ICogYXMgRGlhbG9nTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2RpYWxvZ2xvZ2dlcic7XG5cbmltcG9ydCB7IE1vbmdvUSBhcyBNb25nb1EgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInO1xuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcblxudmFyIGRidXJsID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMIHx8IFwiXCI7XG5cbnZhciBwZ2xvY2FsdXJsID0gXCJwb3N0Z3JlczovL2pvZTphYmNkZWZAbG9jYWxob3N0OjU0MzIvYWJvdFwiO1xudmFyIGRidXJsID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMIHx8IHBnbG9jYWx1cmw7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG52YXIgbyA9IHBnIGFzIGFueTtcbmlmICghKHByb2Nlc3MuZW52LkFCT1RfREJOT1NTTCkpIHtcbiAgby5kZWZhdWx0cy5zc2wgPSB0cnVlOyAvLyBPbmx5IHVzZWQgaW50ZXJuYWxseSAhXG59XG52YXIgZGlhbG9nTG9nZ2VyID0gRGlhbG9nTG9nZ2VyLmxvZ2dlcihcInNtYXJ0Ym90XCIsIGRidXJsLCBwZyk7XG5cbnR5cGUgc3RyaW5nT3JNZXNzYWdlID0gc3RyaW5nIHwgYnVpbGRlci5NZXNzYWdlO1xuXG5mdW5jdGlvbiBzZW5kPFQgZXh0ZW5kcyBzdHJpbmdPck1lc3NhZ2U+KG86IFQpOiBUIHsgcmV0dXJuIG87IH07XG5cbmZ1bmN0aW9uIGRpYWxvZ2xvZyhpbnRlbnQ6IHN0cmluZywgc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uLCByZXNwb25zZTogc3RyaW5nT3JNZXNzYWdlKSB7XG4gIHZhciBzUmVzcG9uc2U6IHN0cmluZztcbiAgdmFyIHNBY3Rpb246IHN0cmluZztcbiAgaWYgKHR5cGVvZiByZXNwb25zZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHNBY3Rpb24gPSBcIlwiO1xuICAgIHNSZXNwb25zZSA9IHJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHZhciBhTWVzc2FnZTogYnVpbGRlci5NZXNzYWdlID0gcmVzcG9uc2U7XG4gICAgdmFyIGlNZXNzYWdlOiBidWlsZGVyLklNZXNzYWdlID0gYU1lc3NhZ2UudG9NZXNzYWdlKCk7XG4gICAgc1Jlc3BvbnNlID0gaU1lc3NhZ2UudGV4dDtcbiAgICBzQWN0aW9uID0gKGlNZXNzYWdlLmVudGl0aWVzICYmIGlNZXNzYWdlLmVudGl0aWVzWzBdKSA/IChKU09OLnN0cmluZ2lmeShpTWVzc2FnZS5lbnRpdGllcyAmJiBpTWVzc2FnZS5lbnRpdGllc1swXSkpIDogXCJcIjtcbiAgfVxuICBkaWFsb2dMb2dnZXIoe1xuICAgIGludGVudDogaW50ZW50LFxuICAgIHNlc3Npb246IHNlc3Npb24sXG4gICAgcmVzcG9uc2U6IHNSZXNwb25zZSxcbiAgICBhY3Rpb246IHNBY3Rpb25cbiAgfSk7XG4gIHNlc3Npb24uc2VuZChyZXNwb25zZSk7XG59XG5cbnZhciBlbGl6YWJvdCA9IHJlcXVpcmUoJy4uL2V4dGVybi9lbGl6YWJvdC9lbGl6YWJvdC5qcycpO1xuLy9pbXBvcnQgKiBhcyBlbGl6YWJvdCBmcm9tICdlbGl6YWJvdCc7XG5cbmxldCBkZWJ1Z2xvZyA9IGRlYnVnKCdzbWFydGRpYWxvZycpO1xuaW1wb3J0ICogYXMgUGxhaW5SZWNvZ25pemVyIGZyb20gJy4vcGxhaW5yZWNvZ25pemVyJztcbi8vdmFyIGJ1aWxkZXIgPSByZXF1aXJlKCdib3RidWlsZGVyJyk7XG5cbmZ1bmN0aW9uIGdldENvbnZlcnNhdGlvbklkKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbik6IHN0cmluZyB7XG4gIHJldHVybiBzZXNzaW9uLm1lc3NhZ2UgJiZcbiAgICBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcyAmJlxuICAgIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZDtcbn1cblxudmFyIGVsaXphYm90cyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRFbGl6YUJvdChpZDogc3RyaW5nKSB7XG4gIGlmICghZWxpemFib3RzW2lkXSkge1xuICAgIGVsaXphYm90c1tpZF0gPSB7XG4gICAgICBhY2Nlc3M6IG5ldyBEYXRlKCksXG4gICAgICBlbGl6YWJvdDogbmV3IGVsaXphYm90KClcbiAgICB9O1xuICB9XG4gIGVsaXphYm90c1tpZF0uYWNjZXNzID0gbmV3IERhdGUoKTtcbiAgcmV0dXJuIGVsaXphYm90c1tpZF0uZWxpemFib3Q7XG59XG5cbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcbi8vaW1wb3J0ICogYXMgVG9vbHMgZnJvbSAnLi4vbWF0Y2gvdG9vbHMnO1xuXG52YXIgbmV3RmxvdyA9IHRydWU7XG5cbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuXG4vL3ZhciBtb2RlbHMgPSB7fTtcblxuXG5mdW5jdGlvbiBpc0Fub255bW91cyh1c2VyaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdXNlcmlkLmluZGV4T2YoXCJhbm86XCIpID09PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzdHJpY3REYXRhKGFycjogYW55W10pOiBhbnlbXSB7XG4gIGlmIChhcnIubGVuZ3RoIDwgNikge1xuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciByZXMgPSBhcnIuc2xpY2UoMCwgTWF0aC5taW4oTWF0aC5tYXgoTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gMyksIDcpLCBhcnIubGVuZ3RoKSk7XG4gIGlmICh0eXBlb2YgYXJyWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgdmFyIGRlbHRhID0gbGVuIC0gcmVzLmxlbmd0aDtcbiAgICByZXMucHVzaChcIi4uLiBhbmQgXCIgKyBkZWx0YSArIFwiIG1vcmUgZW50cmllcyBmb3IgcmVnaXN0ZXJlZCB1c2Vyc1wiKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiByZXN0cmljdExvZ2dlZE9uKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgYXJyOiBhbnlbXSk6IGFueVtdIHtcbiAgdmFyIHVzZXJpZCA9IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlclxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXIuaWQgfHwgXCJcIjtcbiAgaWYgKHByb2Nlc3MuZW52LkFCT1RfRU1BSUxfVVNFUiAmJiBpc0Fub255bW91cyh1c2VyaWQpKSB7XG4gICAgcmV0dXJuIHJlc3RyaWN0RGF0YShhcnIpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmNvbnN0IGFUcmFpblJlcGxpZXMgPSBbXCJUaGFuayB5b3UgZm9yIHNoYXJpbmcgdGhpcyBzdWdnZXN0aW9uIHdpdGggdXNcIixcbiAgXCJUaGFuayBmb3IgZm9yIHRoaXMgdmFsdWFibGUgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhbmsgZm9yIGZvciB0aGlzIGludGVyZXN0aW5nIGZhY3QhXCIsXG4gIFwiVGhhdHMgYSBwbGV0aG9yaWEgb2YgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhdCdzIGEgbnVnZ2V0IG9mIGluZm9ybWF0aW9uLlwiLFxuICBcIkxvdmVseSwgSSBtYXkgY29uc2lkZXIgeW91IGlucHV0LlwiLFxuICBcIldlbGwgZG9uZSwgYW55dGhpbmcgbW9yZSB0byBsZXQgbWUga25vdz9cIixcbiAgXCJJIGRvIGFwcHJlY2lhdGUgeW91ciB0ZWFjaGluZyBhbmQgbXkgbGVhcm5pbmcgZXhwZXJpZW5jZSwgb3Igd2FzIGl0IHRoZSBvdGhlciB3YXkgcm91bmQ/XCIsXG4gIFwiWW91ciBoZWxwZnVsIGlucHV0IGhhcyBiZWVuIHN0b3JlZCBpbiBzb21lIGR1c3R5IGNvcm5lciBvZiB0aGUgV29ybGQgd2lkZSB3ZWIhXCIsXG4gIFwiVGhhbmsgeW91IGZvciBteSBsZWFybmluZyBleHBlcmllbmNlIVwiLFxuICBcIkkgaGF2ZSBpbmNvcnBvcmF0ZWQgeW91ciB2YWx1YWJsZSBzdWdnZXN0aW9uIGluIHRoZSB3aXNkb20gb2YgdGhlIGludGVybmV0XCJcbl07XG5cbnZhciBhVHJhaW5EaWFsb2cgPSBhVHJhaW5SZXBsaWVzO1xuXG52YXIgYVRyYWluRXhpdEhpbnQgPSBbXG4gIFwiXFxudHlwZSBcXFwiZG9uZVxcXCIgd2hlbiB5b3UgYXJlIGRvbmUgdHJhaW5pbmcgbWUuXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXFxucmVtZW1iZXIsIHlvdSBhcmUgc3R1Y2sgaGVyZSBpbnN0cnVjdGluZyBtZSwgdHlwZSBcXFwiZG9uZVxcXCIgdG8gcmV0dXJuLlwiLFxuICBcIlwiXTtcblxuY29uc3QgYUVudGVyVHJhaW4gPSBbJ1NvIHlvdSB0aGluayB0aGlzIGlzIHdyb25nPyBZb3UgY2FuIG9mZmVyIHlvdXIgYWR2aXNlIGhlcmUuXFxuIFR5cGUgXCJkb25lXCIgaWYgeW91IGFyZSBkb25lIHdpdGggaW5zdHJ1Y3RpbmcgbWUnLFxuICAnRmVlbCBmcmVlIHRvIG9mZmVyIG1lIHlvdXIgYmV0dGVyIHNvbHV0aW9uIGhlcmUuXFxuVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdTb21lIHNheSBcIlRoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cIiwgXFxudCBpZiB5b3UgY291bGQgaGVscCBtZSB0byBiZWNvbWUgYmV0dGVyLCBpbnN0cnVjdCBtZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCB0ZWFjaGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG5dO1xuY29uc3QgYUJhY2tGcm9tVHJhaW5pbmcgPSBbXG4gICdQdXVoLCBiYWNrIGZyb20gdHJhaW5pbmchIE5vdyBmb3IgdGhlIGVhc3kgcGFydCAuLi5cXG4gYXNrIG1lIGEgbmV3IHF1ZXN0aW9uLicsXG4gICdMaXZlIGFuZCBkb25cXCd0IGxlYXJuLCB0aGF0XFwncyB1cy4gTmFhaCwgd2VcXCdsbCBzZWUuXFxuQXNrIG1lIGFub3RoZXIgcXVlc3Rpb24uJyxcbiAgJ1RoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cXG4gQXNrIG1lIGEgcXVlc3Rpb24uJyxcbiAgJ1RoYW5rcyBmb3IgaGF2aW5nIHRoaXMgbGVjdHVyZSBzZXNzaW9uLCBub3cgaSBhbSBiYWNrIHRvIG91ciB1c3VhbCBzZWxmLlxcbiBBc2sgbWUgYSBxdWVzdGlvbi4nXG5dO1xuXG5cbmNvbnN0IGFUcmFpbk5vS2xpbmdvbiA9IFtcbiAgXCJIZSB3aG8gbWFzdGVycyB0aGUgZGFyayBhcnRzIG9mIFNBUCBtdXN0IG5vdCBkd2VsbCBpbiB0aGUgZWFydGhseSByZWFsbXMgb2YgU3RhciBUcmVrLlwiLFxuICBcIlNBUCBpcyBhIGNsb3VkIGNvbXBhbnksIG5vdCBhIHNwYWNlIGNvbXBhbnkuXCIsXG4gIFwiVGhlIGRlcHRoIG9mIFIvMyBhcmUgZGVlcGVyIHRoYW4gRGVlcCBTcGFjZSA0Mi5cIixcbiAgXCJNeSBicmFpbnBvd2VyIGlzIGZ1bGx5IGFic29yYmVkIHdpdGggbWFzdGVyaW5nIG90aGVyIHJlYWxtcy5cIixcbiAgXCJGb3IgdGhlIHdvc2FwLCB0aGUgc2t5IGlzIHRoZSBsaW1pdC4gRmVlbCBmcmVlIHRvIGNoZWNrIG91dCBuYXNhLmdvdiAuXCIsXG4gIFwiVGhlIGZ1dHVyZSBpcyBTQVAgb3IgSUJNIGJsdWUsIG5vdCBzcGFjZSBibGFjay5cIixcbiAgXCJUaGF0J3MgbGVmdCB0byBzb21lIG11cmt5IGZ1dHVyZS5cIlxuXVxuXG5leHBvcnQgY29uc3QgYVJlc3BvbnNlc09uVG9vTG9uZyA9IFtcbiAgXCJZb3VyIGlucHV0IHNob3VsZCBiZSBlbG9xdWVudCBpbiBpdCdzIGJyZXZpdHkuIFRoaXMgb25lIHdhcyB0b28gbG9uZy5cIixcbiAgXCJteSB3aXNkb20gaXMgc2V2ZXJseSBib3VuZCBieSBteSBsaW1pdGVkIGlucHV0IHByb2Nlc3NpbmcgY2FwYWJpbGl0aWVzLiBDb3VsZCB5b3UgZm9ybXVsYXRlIGEgc2hvcnRlciBpbnB1dD8gVGhhbmsgeW91LlwiLFxuICBcIlRoZSBsZW5ndGggb2YgeW91IGlucHV0IGluZGljYXRlcyB5b3UgcHJvYmFibHkga25vdyBtb3JlIGFib3V0IHRoZSB0b3BpYyB0aGFuIG1lPyBDYW4gaSBodW1ibHkgYXNrIHlvdSB0byBmb3JtdWxhdGUgYSBzaG9ydGVyIHF1ZXN0aW9uP1wiLFxuICAnXFxcIldoYXQgZXZlciB5b3Ugd2FudCB0byB0ZWFjaCwgYmUgYnJpZWZcXFwiIChIb3JhY2UpLiBXaGlsZSB0aGlzIGRvZXMgbm90IGFsd2F5cyBhcHBsaWVzIHRvIG15IGFuc3dlcnMsIGl0IGlzIHJlcXVpcmUgZm9yIHlvdXIgcXVlc3Rpb25zLiBQbGVhc2UgdHJ5IGFnYWluIHdpdGggYSByZWZpbmVkIHF1ZXN0aW9ucy4nLFxuICAnSSB1bmRlcnN0YW5kIG1vcmUgdGhhbiA0LWxldHRlciB3b3JkcywgYnV0IG5vdCBtb3JlIHRoYW4gMjAgd29yZCBzZW50ZW5jZXMuIFBsZWFzZSB0cnkgdG8gc2hvcnRlbiB5b3VyIGlucHV0LicsXG4gICd0aGUgc2t5IGlzIHRoZSBsaW1pdD8gQWlyIGZvcmNlIG1lbWJlciBvciBub3QsIHlvdSBjYW4gYXNrIGxvbmdlciBxdWVzdGlvbnMgdGhhbiBcXFwidGhlIHNreVxcXCIsIGJ1dCBub3QgdGhpcyBsb25nJyxcbiAgJ015IGFuc3dlcnMgbWF5IGJlIGV4aGF1c3RpdmUsIGJ1dCBJIHVuZGVyc3RhbmQgbW9yZSB0aGFuIDQtbGV0dGVyIHdvcmRzLCBidXQgbm90IG1vcmUgdGhhbiAyMCB3b3JkIHNlbnRlbmNlcy4gU29ycnkuJyxcbiAgJ091ciBjb252ZXJzYXRpb24gbXVzdCBiZSBoaWdobHkgYXNzeW1tZXRyaWM6IG15IGFuc3dlcnMgbWF5IGJlIHZlcmJvc2UgYW5kIGV4aGF1c3RpdmUgYW5kIGZ1enp5LCBxdWVzdGlvbnMgYW5kIGlucHV0IG11c3QgYmUgYnJpZWYuIFRyeSB0byByZWZvcm11bGF0ZSBpdCcsXG5dO1xuXG5leHBvcnQgY29uc3QgbWV0YXdvcmRzRGVzY3JpcHRpb25zID0ge1xuICBcImNhdGVnb3J5XCI6IFwiYW4gYXR0cmlidXRlIG9mIGEgcmVjb3JkIGluIGEgbW9kZWwsIGV4YW1wbGU6IGEgUGxhbmV0IGhhcyBhIFxcXCJuYW1lXFxcIiBhdHRyaWJ1dGVcIixcbiAgXCJkb21haW5cIjogXCJhIGdyb3VwIG9mIGZhY3RzIHdoaWNoIGFyZSB0eXBpY2FsbHkgdW5yZWxhdGVkXCIsXG4gIFwia2V5XCI6IFwiYW4gYXR0cmlidXRlIHZhbHVlIChvZiBhIGNhdGVnb3J5KSB3aGljaCAgaXMgdW5pcXVlIGZvciB0aGUgcmVjb3JkXCIsXG4gIFwidG9vbFwiOiBcImlzIHBvdGVudGlhbHkgY29tbWFuZCB0byBleGVjdXRlXCIsXG4gIFwicmVjb3JkXCI6IFwiYSBzcGVjaWZpYyBzZXQgb2YgXFxcImZhY3RcXFwicyBvZiBhIGRvbWFpbiwgYSBcXFwicmVjb3JkXFxcIiBoYXMgYSBzZXQgb2YgYXR0cmlidXRlcyB2YWx1ZXMgKFxcXCJmYWN0XFxcInMpIG9mIHRoZSBjYXRlZ29yaWVzLCBvZnRlbiBhIHJlY29yZCBoYXMgYSBcXFwia2V5XFxcIlwiLFxuICBcImZhY3RcIjogXCJhIHNwZWNpZmljIGNhdGVnb3J5IHZhbHVlIG9mIGEgcmVjb3JkIGluIGEgZG9tYWluLCBtYXkgYmUgYSBcXFwia2V5XFxcIiB2YWx1ZVwiLFxufTtcblxuZnVuY3Rpb24gZ2V0UmFuZG9tUmVzdWx0KGFycjogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpICUgYXJyLmxlbmd0aF07XG59XG5cbi8qXG5leHBvcnQgY2xhc3MgU2ltcGxlVXBEb3duUmVjb2duaXplciBpbXBsZW1lbnRzIGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcblxuICB9XG5cbiAgcmVjb2duaXplKGNvbnRleHQ6IGJ1aWxkZXIuSVJlY29nbml6ZUNvbnRleHQsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgcmVzdWx0OiBidWlsZGVyLklJbnRlbnRSZWNvZ25pemVyUmVzdWx0KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdmFyIHUgPSB7fSBhcyBidWlsZGVyLklJbnRlbnRSZWNvZ25pemVyUmVzdWx0O1xuXG4gICAgZGVidWdsb2coXCJyZWNvZ25pemluZyBcIiArIGNvbnRleHQubWVzc2FnZS50ZXh0KTtcbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImRvd25cIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC5kb3duXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwic3RhcnQgXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJ1cFwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImRvbmVcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJleGl0XCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwicXVpdFwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWJ1Z2xvZygncmVjb2duaXppbmcgbm90aGluZycpO1xuICAgIHUuaW50ZW50ID0gXCJOb25lXCI7XG4gICAgdS5zY29yZSA9IDAuMTtcbiAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgZTEuc3RhcnRJbmRleCA9IFwiZXhpdCBcIi5sZW5ndGg7XG4gICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgZTEuc2NvcmUgPSAwLjE7XG4gICAgdS5lbnRpdGllcyA9IFtdO1xuICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gIH1cbn1cbiovXG5cbmNvbnN0IEFueU9iamVjdCA9IE9iamVjdCBhcyBhbnk7XG5cbnZhciBib3Q7XG5cbnZhciBvSlNPTiA9IEpTT04ucGFyc2UoJycgKyBmcy5yZWFkRmlsZVN5bmMoJy4vcmVzb3VyY2VzL21vZGVsL2ludGVudHMuanNvbicpKTtcbnZhciBvUnVsZXMgPSBQbGFpblJlY29nbml6ZXIucGFyc2VSdWxlcyhvSlNPTik7XG4vLyB2YXIgUmVjb2duaXplciA9IG5ldyAocmVjb2duaXplci5SZWdFeHBSZWNvZ25pemVyKShvUnVsZXMpO1xuXG5cbmZ1bmN0aW9uIGxvZ1F1ZXJ5KHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PGFueT4pIHtcblxuICBmcy5hcHBlbmRGaWxlKCcuL2xvZ3Mvc2hvd21lcXVlcmllcy50eHQnLCBcIlxcblwiICsgSlNPTi5zdHJpbmdpZnkoe1xuICAgIHRleHQ6IHNlc3Npb24ubWVzc2FnZS50ZXh0LFxuICAgIHRpbWVzdGFtcDogc2Vzc2lvbi5tZXNzYWdlLnRpbWVzdGFtcCxcbiAgICBpbnRlbnQ6IGludGVudCxcbiAgICByZXM6IHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoICYmIEpTT04uc3RyaW5naWZ5KHJlc3VsdFswXSkgfHwgXCIwXCIsXG4gICAgY29udmVyc2F0aW9uSWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uLmlkIHx8IFwiXCIsXG4gICAgdXNlcmlkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXJcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyLmlkIHx8IFwiXCJcbiAgfSkgLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXI+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBXaGF0SXMuZHVtcE5pY2VUdXBlbChyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvblxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbi5pZCB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlci5pZCB8fCBcIlwiXG4gIH0pLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGd3b3JkcyA9IHt9O1xuLyoqXG4gKiBDb25zdHJ1Y3QgYSBib3RcbiAqIEBwYXJhbSBjb25uZWN0b3Ige0Nvbm5lY3Rvcn0gdGhlIGNvbm5lY3RvciB0byB1c2VcbiAqIEhUTUxDb25uZWN0b3JcbiAqIG9yIGNvbm5lY3RvciA9IG5ldyBidWlsZGVyLkNvbnNvbGVDb25uZWN0b3IoKS5saXN0ZW4oKVxuICovXG5mdW5jdGlvbiBtYWtlQm90KGNvbm5lY3RvcixcbiAgbW9kZWxQcm92aWRlcjogKCkgPT4gUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4sIG9wdGlvbnM/OiBhbnkpOiBidWlsZGVyLlVuaXZlcnNhbEJvdCB7XG4gIHZhciB0MCA9IERhdGUubm93KCk7XG4gIHZhciB0aGVNb2RlbFAgPSBtb2RlbFByb3ZpZGVyKCk7XG4gIHRoZU1vZGVsUC50aGVuKFxuICAgICh0aGVNb2RlbCkgPT4ge1xuICAgICAgdmFyIHQgPSBEYXRlLm5vdygpIC0gdDA7XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNob3dNb2RlbExvYWRUaW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBtb2RlbCBsb2FkIHRpbWUgJHsodCl9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgZnVuY3Rpb24gZ2V0VGhlTW9kZWwoKTogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xuICAgIHJldHVybiB0aGVNb2RlbFA7XG4gIH1cblxuICBib3QgPSBuZXcgYnVpbGRlci5Vbml2ZXJzYWxCb3QoY29ubmVjdG9yKTtcbiAgdmFyIHJlY29nbml6ZXIgPSBuZXcgUGxhaW5SZWNvZ25pemVyLlJlZ0V4cFJlY29nbml6ZXIob1J1bGVzKTtcbiAgdmFyIGRpYWxvZyA9IG5ldyBidWlsZGVyLkludGVudERpYWxvZyh7IHJlY29nbml6ZXJzOiBbcmVjb2duaXplcl0gfSk7XG4gIC8vIHZhciBkaWFsb2dVcERvd24gPSBuZXcgYnVpbGRlci5JbnRlbnREaWFsb2coeyByZWNvZ25pemVyczogW25ldyBTaW1wbGVVcERvd25SZWNvZ25pemVyKCldIH0pO1xuXG4gIC8qXG4gIGJvdC5kaWFsb2coJy91cGRvd24nLCBkaWFsb2dVcERvd24pO1xuICBkaWFsb2dVcERvd24ub25CZWdpbihmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChnZXRSYW5kb21SZXN1bHQoYUVudGVyVHJhaW4pKSk7XG4gICAgLy9zZXNzaW9uLnNlbmQoXCJIaSB0aGVyZSwgdXBkb3duIGlzIHdhaXRpbmcgZm9yIHlvdVwiKTtcbiAgfSlcblxuICBkaWFsb2dVcERvd24ubWF0Y2hlcygnaW50ZW50LnVwJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gYXJncyB8fCB7fTtcbiAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICd5b3Ugd2FudCB0byBleGl0IHRyYWluaW5nPyB0eXBlIFxcXCJkb25lXFxcIiBhZ2Fpbi4nKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgbmV4dCgpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgIHNlc3Npb24uZW5kRGlhbG9nV2l0aFJlc3VsdCh7IHJlc3BvbnNlOiBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjIH0pO1xuICAgIH1cbiAgXVxuICApO1xuXG4gIGRpYWxvZ1VwRG93bi5tYXRjaGVzKCdpbnRlbnQuZG93bicsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IGFyZ3MgfHwge307XG4gICAgICBidWlsZGVyLlByb21wdHMudGV4dChzZXNzaW9uLCAneW91IHdhbnQgdG8gZ28gZG93biEnKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gLTE7IC8vIHJlc3VsdHMucmVwb25zZTtcbiAgICAgIG5leHQoKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJzdGlsbCBnb2luZyBkb3duP1wiKTtcbiAgICB9XG4gIF1cbiAgKTtcbiAgZGlhbG9nVXBEb3duLm9uRGVmYXVsdChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgIGxvZ1F1ZXJ5KHNlc3Npb24sIFwib25EZWZhdWx0XCIpO1xuICAgIHZhciByZXMgPSBnZXRSYW5kb21SZXN1bHQoYVRyYWluRGlhbG9nKSArIGdldFJhbmRvbVJlc3VsdChhVHJhaW5FeGl0SGludCk7XG4gICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKHJlcykpO1xuICB9KTtcbiAgKi9cblxuICAvKlxuICAgIGJvdC5kaWFsb2coJy90cmFpbicsIFtcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICAgIHNlc3Npb24uZGlhbGdvRGF0YS5hYmMgPSBhcmdzIHx8IHt9O1xuICAgICAgICBidWlsZGVyLlByb21wdHMudGV4dChzZXNzaW9uLCAnRG8geW91IHdhbnQgdG8gdHJhaW4gbWUnKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICAgIHNlc3Npb24uZW5kRGlhbG9nV2l0aFJlc3VsdCh7IHJlc3BvbnNlOiBzZXNzaW9uLkRpYWxvZ0RhdGEuYWJjIH0pO1xuICAgICAgfVxuICAgIF0pO1xuICAqL1xuXG4gIGJvdC5kaWFsb2coJy8nLCBkaWFsb2cpO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdTaG93TWUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gU2hvd01lIGlzIGEgc3BlY2lhbCBmb3JtIG9mIFdoYXRJcyB3aGljaCBhbHNvIHNlbGVjdHMgdGhlXG4gICAgICAvLyBcImNsb3Nlc3QgX3VybFwiIHJhbmtlZCBieSBfcHJlZmVycmVkVXJsT3JkZXJcbiAgICAgIC8vIGlmIHByZXNlbnQsIHRoZSBfdXJsIGlzIHB1dCBpbnRvIGV4ZWMuYWN0aW9uXG4gICAgICAvL1xuICAgICAgLy8vIFRPRE8gUkVNT0RFTFxuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZGVidWdsb2coXCJTaG93IEVudGl0eVwiKTtcbiAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIHZhciBhMSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuICAgICAgICBMaXN0QWxsLmxpc3RBbGxTaG93TWUoYTEuZW50aXR5LCB0aGVNb2RlbCkudGhlbihcbiAgICAgICAgICByZXN1bHRTaG93TWUgPT4ge1xuICAgICAgICAgICAgbG9nUXVlcnkoc2Vzc2lvbiwgJ1Nob3dNZScsIChyZXN1bHRTaG93TWUgYXMgYW55KS5iZXN0VVJJKTtcbiAgICAgICAgICAgIC8vIHRlc3QuZXhwZWN0KDMpXG4gICAgICAgICAgICAvLyAgdGVzdC5kZWVwRXF1YWwocmVzdWx0LndlaWdodCwgMTIwLCAnY29ycmVjdCB3ZWlnaHQnKTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0U2hvd01lIHx8ICEocmVzdWx0U2hvd01lIGFzIGFueSkuYmVzdFVSSSkge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJTaG93TWVcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBnZXQgd2hhdCB5b3Ugd2FudFwiKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBiZXN0VVJJID0gKHJlc3VsdFNob3dNZSBhcyBhbnkpLmJlc3RVUkk7XG4gICAgICAgICAgICAvLyBkZWJ1Z2xvZygncmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgICAgICBkZWJ1Z2xvZygnYmVzdCByZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0U2hvd01lIHx8IHt9LCB1bmRlZmluZWQsIDIpKTtcblxuICAgICAgICAgICAgLy8gdGV4dCA6IFwic3RhcnRpbmcgdW5pdCB0ZXN0IFxcXCJcIiArIHVuaXR0ZXN0ICsgXCJcXFwiXCIrICAodXJsPyAgKCcgd2l0aCB1cmwgJyArIHVybCApIDogJ25vIHVybCA6LSgnICksXG4gICAgICAgICAgICAvLyAgICAgIGFjdGlvbiA6IHsgdXJsOiB1cmwgfVxuXG4gICAgICAgICAgICB2YXIgcmVwbHkgPSBuZXcgYnVpbGRlci5NZXNzYWdlKHNlc3Npb24pXG4gICAgICAgICAgICAgIC50ZXh0KFwic3RhcnRpbmcgdXJpIFwiICsgYmVzdFVSSSlcbiAgICAgICAgICAgICAgLmFkZEVudGl0eSh7IHVybDogYmVzdFVSSSB9KSAvLyBleGVjLmFjdGlvbik7XG4gICAgICAgICAgICAvLyAuYWRkQXR0YWNobWVudCh7IGZhbGxiYWNrVGV4dDogXCJJIGRvbid0IGtub3dcIiwgY29udGVudFR5cGU6ICdpbWFnZS9qcGVnJywgY29udGVudFVybDogXCJ3d3cud29tYmF0Lm9yZ1wiIH0pO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQocmVwbHkpKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdXaGF0SXMnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcblxuICAgICAgLy8gVE9ETyBTV0lUSCBUTyBNT05HT1FVRVJJRVNcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICBkZWJ1Z2xvZyhcIldoYXRJcyBFbnRpdGllc1wiKTtcbiAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcnknKTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXNqb2luZWQgPSBjYXRlZ29yeUVudGl0eS5lbnRpdHk7XG4gICAgICAgIHZhciBpblN0aCA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yaWVzam9pbmVkLCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHM6IFwiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAvLyBjdXJyZW50bHkgd2UgZG8gbm90IGV4dHJhY3QgY2F0ZWdvcmllcyBjb3JyZWN0bHkgLCB0aHVzIHdlIHJhdGhlciBpZ25vcmUgYW5kIGdvIG9uXG4gICAgICAgICAgICAvL2p1c3QgZ28gb24gICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllc2pvaW5lZCArXG4gICAgICAgICAgICAvLyAgICAgKGUgPyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScgOiBcIlwiKSkpO1xuICAgICAgICAgICAgLy8gICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAvLyAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGVNb2RlbC5ydWxlcy53b3JkTWFwWydjby1maW8nXSkpO1xuICAgICAgICB2YXIgcXVlcnkgPSBjYXRlZ29yaWVzam9pbmVkO1xuICAgICAgICB2YXIgaW5Tb21ldGhpbmcgPSBpblN0aCAmJiBpblN0aC5lbnRpdHkgfHwgXCJcIjtcbiAgICAgICAgaWYgKGluU3RoKSB7XG4gICAgICAgICAgcXVlcnkgPSBjYXRlZ29yaWVzam9pbmVkICsgJyB3aXRoICcgKyBpblN0aC5lbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgTW9uZ29RdWVyaWVzLmxpc3RBbGwocXVlcnksIHRoZU1vZGVsKS50aGVuKHJlc3VsdFdJID0+IHtcbiAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnZ290IHJlc3VsdCcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpXG5cbiAgICAgICAgICB2YXIgZXJyX2V4cGxhaW4gPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdFdJKTtcbiAgICAgICAgICBpZiAoZXJyX2V4cGxhaW4pIHtcbiAgICAgICAgICAgIC8vZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXQgKyBcIiAoXCIgKyBjYXRlZ29yeSArICcpXFxcIiBpbiByZWxhdGlvbiB0byBcIicgKyBhMS5lbnRpdHkgKyBgXCIuJHtleHBsYWlufWApKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllc2pvaW5lZCArIFwiXFxcIiAoXCIgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChjYXRzKSArICcpIGluIHJlbGF0aW9uIHRvIFwiJyArIGluU3RoLmVudGl0eSArIGBcIi4ke2Vycl9leHBsYWlufWApKTtcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChlcnJfdGV4dCkpO1xuICAgICAgICAgICAgLy8gIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0V0kpKTtcbiAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0V0kpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdDIgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgLy8gZGVidWdsb2coJ3Jlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ2Jlc3QgcmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJWzBdLnJlc3VsdHNbMF0gfHwge30sIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkPyAoJ3RvcCA6ICcgKyBXaGF0SXMuZHVtcFdlaWdodHNUb3AocmVzdWx0MS50dXBlbGFuc3dlcnNbMF0ucmVzdWx0WzBdIHx8IHt9LCB7IHRvcDogMyB9KSk6ICctJyk7XG4gICAgICAgICAgLy8gVE9ETyBjbGVhbnNlZCBzZW50ZW5jZVxuXG4gICAgICAgICAgLy9kaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnVGhlICcgKyBjYXRlZ29yaWVzam9pbmVkICsgJyBvZiAnICsgaW5TdGguZW50aXR5ICsgJyBpcyAnICtcbiAgICAgICAgICAvL3Jlc3VsdFdJLnR1cGVsYW5zd2Vyc1swXS5yZXN1bHQgKyBcIlxcblwiKSk7XG5cblxuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdCA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpIDogJy0nKTtcbiAgICAgICAgICAvLyBUT0RPIFdoeSBvbmx5IEZJUlNUIT8/P1xuICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKFtyZXN1bHRXSVswXV0pKTtcbiAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0V0kpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdDIgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgaWYgKGpvaW5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IGluU29tZXRoaW5nID8gJyBvZiAnICsgaW5Tb21ldGhpbmcgOiAnJztcbiAgICAgICAgICAgIGlmIChjYXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnVGhlICcgKyBjYXRlZ29yaWVzam9pbmVkICsgc3VmZml4ICsgJyBpcyAnICtcbiAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyArIFwiXFxuXCIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKFwiVGhlIFwiICsgY2F0ZWdvcmllc2pvaW5lZCArIHN1ZmZpeCArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBlcnJwcmVmaXggPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdFdJKSB8fCAnJztcbiAgICAgICAgICAgIHZhciBzdWZmaXgyID0gaW5Tb21ldGhpbmcgPyAnIGZvciAnICsgaW5Tb21ldGhpbmcgOiAnJztcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3JpZXNqb2luZWQgKyBzdWZmaXgyICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSArIFwiXCIgKyBlcnJwcmVmaXgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnTGlzdEFsbCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBMaXN0QWxsXCIpO1xuICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgIHZhciBjYXRlZ29yeSA9IGNhdGVnb3J5RW50aXR5LmVudGl0eTtcbiAgICAgIHZhciBpblN0aEVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdpbnN0aCcpXG4gICAgICB2YXIgaW5Tb21ldGhpbmcgPSBpblN0aEVudGl0eSAmJiBpblN0aEVudGl0eS5lbnRpdHk7XG4gICAgICAvLyBzb21lIG1ldGFxdWVyaWVzOlxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuXG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJjYXRlZ29yaWVzXCIpIHtcbiAgICAgICAgICAvLyBkbyB3ZSBoYXZlIGEgZmlsdGVyID9cbiAgICAgICAgICB2YXIgZG9tYWluID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgICAgZG9tYWluID0gTGlzdEFsbC5pbmZlckRvbWFpbih0aGVNb2RlbCwgaW5Tb21ldGhpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwuY2F0ZWdvcnkpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgaWYgKGluU29tZXRoaW5nKSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBpbmZlciBhIGRvbWFpbiByZXN0cmljdGlvbiBmcm9tIFxcXCJcIiArIFV0aWxzLnN0cmlwUXVvdGVzKGluU29tZXRoaW5nKSArIFwiXFxcIiwgYWxsIG15IGNhdGVnb3JpZXMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBjYXRlZ29yaWVzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYVJlcyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBhUmVzKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIm15IGNhdGVnb3JpZXMgaW4gZG9tYWluIFxcXCJcIiArIGRvbWFpbiArIFwiXFxcIiBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcImRvbWFpbnNcIikge1xuICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmRvbWFpbnMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIm15IGRvbWFpbnMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhlTW9kZWwucnVsZXMud29yZE1hcFsnY28tZmlvJ10pKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gY2F0ZWdvcnk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzam9pbmVkID0gY2F0ZWdvcnk7XG4gICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgIHF1ZXJ5ID0gY2F0ZWdvcnkgKyAnIHdpdGggJyArIGluU29tZXRoaW5nO1xuICAgICAgICB9XG4gICAgICAgIE1vbmdvUXVlcmllcy5saXN0QWxsKHF1ZXJ5LCB0aGVNb2RlbCkudGhlbihyZXN1bHQxID0+IHtcbiAgICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZygnYW5hbHl6aW5nIGNhdGVnb3J5IGZyb20gJyArIGNhdGVnb3J5KTtcbiAgICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yeSwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHM6IFwiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvbjogXCIgKyBlKTtcbiAgICAgICAgICAgICAgLy8gR28gb24gZm9yIG5vd1xuICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgIC8vICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcnkgK1xuICAgICAgICAgICAgICAvLyAgICAoZSA/ICcoJyArIGUudG9TdHJpbmcoKSArICcpJyA6IFwiXCIpKSk7XG4gICAgICAgICAgICAgIC8vICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAgIC8vICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vdmFyIHJlc3VsdDEgPSBMaXN0QWxsLmxpc3RBbGxXaXRoQ29udGV4dChjYXQsIGluU29tZXRoaW5nLFxuICAgICAgICAgIC8vICB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXQpO1xuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nID8gKCdsaXN0YWxsIHJlc3VsdCA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSkgOiAnLScpO1xuICAgICAgICAgIHZhciBlcnJfZXhwbGFpbiA9IExpc3RBbGwucmV0dXJuRXJyb3JUZXh0SWZPbmx5RXJyb3IocmVzdWx0MSk7XG4gICAgICAgICAgaWYgKGVycl9leHBsYWluKSB7XG4gICAgICAgICAgICAvL2RpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ICsgXCIgKFwiICsgY2F0ZWdvcnkgKyAnKVxcXCIgaW4gcmVsYXRpb24gdG8gXCInICsgYTEuZW50aXR5ICsgYFwiLiR7ZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gaW5Tb21ldGhpbmcgPyAnaW4gcmVsYXRpb24gdG8gXCInICsgaW5Tb21ldGhpbmcgKyAnXCInIDogJyc7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgKyBcIlxcXCIgKFwiICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0cykgKyAnKScgKyBzdWZmaXggKyBgLiR7ZXJyX2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKGVycl90ZXh0KSk7XG4gICAgICAgICAgICAvLyAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHQxKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdDEpO1xuICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDEpKSk7XG4gICAgICAgICAgdmFyIHN1ZmZpeCA9IChpblNvbWV0aGluZykgPyBcIiBmb3IgXCIgKyBpblNvbWV0aGluZyA6IFwiXCI7XG4gICAgICAgICAgaWYgKGpvaW5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwidGhlIFwiICsgY2F0ZWdvcnkgKyBzdWZmaXggKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gXCJcIjtcbiAgICAgICAgICAgIHZhciBlcnJwcmVmaXggPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdDEpIHx8ICcnO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBzdWZmaXggKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpICsgXCJcIiArIGVycnByZWZpeCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG5cbiAgZGlhbG9nLm1hdGNoZXMoJ2J1aWxkdGFibGUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogYnVpbGR0YWJsZVwiKTtcbiAgICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJykuZW50aXR5O1xuICAgICAgICBkZWJ1Z2xvZyhcImZhY3RPckNhdCBpc1wiICsgY2F0ZWdvcmllcyk7XG4gICAgICAgIHZhciBjYXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdE9ubHlBbmRDb21tYShjYXRlZ29yaWVzLCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHNcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXMgKyAnXCIoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNhdHMgfHwgKGNhdHMubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkaWQgbm90IGZpbmQgYSBjYXRlZ29yeSBpbiBcIicgKyBjYXRlZ29yaWVzICsgJ1wiJykpO1xuICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV4ZWMgPSBNYWtlVGFibGUubWFrZVRhYmxlKGNhdHMsIHRoZU1vZGVsKTtcbiAgICAgICAgLy8gICAgICBjb25zdCBleGVjID0gRXhlY1NlcnZlci5leGVjVG9vbChzZXNzaW9uLmRpYWxvZ0RhdGEucmVzdWx0IGFzIElNYXRjaC5JVG9vbE1hdGNoLCB0aGVNb2RlbC5yZWNvcmRzKTtcbiAgICAgICAgdmFyIHJlcGx5ID0gbmV3IGJ1aWxkZXIuTWVzc2FnZShzZXNzaW9uKVxuICAgICAgICAgIC50ZXh0KGV4ZWMudGV4dClcbiAgICAgICAgICAuYWRkRW50aXR5KGV4ZWMuYWN0aW9uKTtcbiAgICAgICAgLy8gLmFkZEF0dGFjaG1lbnQoeyBmYWxsYmFja1RleHQ6IFwiSSBkb24ndCBrbm93XCIsIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZycsIGNvbnRlbnRVcmw6IFwid3d3LndvbWJhdC5vcmdcIiB9KTtcbiAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQocmVwbHkpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ0Rlc2NyaWJlJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBEZXNjcmliZVwiKTtcbiAgICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgICB2YXIgZmFjdEVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdBMScpO1xuICAgICAgICB2YXIgZmFjdE9yQ2F0ID0gZmFjdEVudGl0eSAmJiBmYWN0RW50aXR5LmVudGl0eTtcbiAgICAgICAgdmFyIGRvbWFpbkVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdEJyk7XG4gICAgICAgIHZhciBkb21haW5TID0gZG9tYWluRW50aXR5ICYmIGRvbWFpbkVudGl0eS5lbnRpdHk7XG4gICAgICAgIHZhciBmaWx0ZXJEb21haW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChkb21haW5TKSB7XG4gICAgICAgICAgZmlsdGVyRG9tYWluID0gTGlzdEFsbC5pbmZlckRvbWFpbih0aGVNb2RlbCwgZG9tYWluUyk7XG4gICAgICAgICAgZGVidWdsb2coXCJnb3QgZG9tYWluXCIgKyBmaWx0ZXJEb21haW4pO1xuICAgICAgICAgIGlmICghZmlsdGVyRG9tYWluKSB7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGluZmVyIGEgZG9tYWluIHJlc3RyaWN0aW9uIGZyb20gXFxcIlwiICsgZG9tYWluUyArIFwiXFxcIi4gU3BlY2lmeSBhbiBleGlzdGluZyBkb21haW4uIChMaXN0IGFsbCBkb21haW5zKSB0byBnZXQgZXhhY3QgbmFtZXMuXFxuXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Z2xvZyhcImZhY3RPckNhdCBpc1wiICsgZmFjdE9yQ2F0KTtcbiAgICAgICAgaWYgKG1ldGF3b3Jkc0Rlc2NyaXB0aW9uc1tmYWN0T3JDYXQudG9Mb3dlckNhc2UoKV0pIHtcbiAgICAgICAgICAvLyBkbyB3ZSBoYXZlIGEgZmlsdGVyID9cbiAgICAgICAgICB2YXIgcHJlZml4ID0gXCJcIjtcbiAgICAgICAgICBpZiAoZmlsdGVyRG9tYWluKSB7XG4gICAgICAgICAgICBwcmVmaXggPSAnXCJpbiBkb21haW4gXCInICsgZmlsdGVyRG9tYWluICsgJ1wiIG1ha2Ugbm8gc2Vuc2Ugd2hlbiBtYXRjaGluZyBhIG1ldGF3b3JkLlxcbic7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlYnVnbG9nKFwic2hvd2luZyBtZXRhIHJlc3VsdFwiKTtcbiAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKHByZWZpeCArICdcIicgKyBmYWN0T3JDYXQgKyAnXCIgaXMgJyArIG1ldGF3b3Jkc0Rlc2NyaXB0aW9uc1tmYWN0T3JDYXQudG9Mb3dlckNhc2UoKV0gKyBcIlwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGlmIChXaGF0SXMuc3BsaXRBdENvbW1hQW5kKGZhY3RPckNhdCkubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQoXCJXaG9hLCBpIGNhbiBvbmx5IGV4cGxhaW4gb25lIHRoaW5nIGF0IGEgdGltZSwgbm90IFxcXCJcIiArIGZhY3RPckNhdCArIFwiXFxcIi4gUGxlYXNlIGFzayBvbmUgYXQgYSB0aW1lLlwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIC8vIGdldERvbWFpbnNGb3JDYXRlZ29yeVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIHZhciBjYXRlZ29yeSA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnkoZmFjdE9yQ2F0LCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgIC8vdmFyIGNhdFJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIGNhdFJlc3VsdHNQID0gdW5kZWZpbmVkIGFzIFByb21pc2U8c3RyaW5nW10+O1xuICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAvL1RPRE9cbiAgICAgICAgICBjYXRSZXN1bHRzUCA9IERlc2NyaWJlLmRlc2NyaWJlQ2F0ZWdvcnkoY2F0ZWdvcnksIGZpbHRlckRvbWFpbiwgdGhlTW9kZWwsIG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhdFJlc3VsdHNQID0gKGdsb2JhbC5Qcm9taXNlIGFzIGFueSkucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cblxuICAgICAgICBjYXRSZXN1bHRzUC50aGVuKGNhdFJlc3VsdHMgPT4ge1xuICAgICAgICAgIHZhciByZXNGYWN0ID0gRGVzY3JpYmUuZGVzY3JpYmVGYWN0SW5Eb21haW4oZmFjdE9yQ2F0LCBmaWx0ZXJEb21haW4sIHRoZU1vZGVsKS50aGVuKChyZXNGYWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChjYXRSZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHZhciBwcmVmaXhlZCA9IGNhdFJlc3VsdHMubWFwKHJlcyA9PlxuICAgICAgICAgICAgICAgIGAke0Rlc2NyaWJlLnNsb3BweU9yRXhhY3QoY2F0ZWdvcnksIGZhY3RPckNhdCwgdGhlTW9kZWwpfSAgJHtyZXN9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2F0UmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmVzRmFjdCA9IHByZWZpeGVkLmpvaW4oXCJcXG5cIik7ICsgXCJcXG5cIiArIHJlc0ZhY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKHJlc0ZhY3QpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvKlxuICAgICAgICAgICAgICB2YXIgYVJlcyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XG4gICAgICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBhUmVzKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcIm15IGNhdGVnb3JpZXMgaW4gZG9tYWluIFxcXCJcIiArIGRvbWFpbiArIFwiXFxcIiBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiZG9tYWluc1wiKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC5kb21haW5zKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLCBzZW5kKFwibXkgZG9tYWlucyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcInRvb2xzXCIpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLnRvb2xzKS5tYXAoZnVuY3Rpb24gKG9Ub29sKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvVG9vbC5uYW1lO1xuICAgICAgICAgICAgfSkuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sc2VuZChcIm15IHRvb2xzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAqL1xuXG4gICAgICAgICAgLypcbiAgICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhdHMgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5TXVsdDIoY2F0ZWdvcnksIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIGlmKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIixzZXNzaW9uLHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICsgJ1wiKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghY2F0cyB8fCAoY2F0cy5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yeSArICdcIicpKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGNhdCA9IFwiXCI7XG4gICAgICAgICAgaWYoIGNhdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBjYXQgPSBjYXRzWzBdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiggY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdjYXRlZ29yeSBpZGVudGlmaWVkOicgKyBjYXQpO1xuICAgICAgICAgICAgaWYgKGExICYmIGExLmVudGl0eSkge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ290IGZpbHRlcjonICsgYTEuZW50aXR5KTtcbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0ID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KHRoZU1vZGVsLCBjYXQsIHRydWUpO1xuICAgICAgICAgICAgICB2YXIgcmVzdWx0MSA9IExpc3RBbGwubGlzdEFsbFdpdGhDb250ZXh0KGNhdCwgYTEuZW50aXR5LFxuICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldCk7XG4gICAgICAgICAgICAgIC8vIFRPRE8gY2xhc3NpZnlpbmcgdGhlIHN0cmluZyB0d2ljZSBpcyBhIHRlcnJpYmxlIHdhc3RlXG4gICAgICAgICAgICAgIGlmICghcmVzdWx0MS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ29pbmcgZm9yIGhhdmluZycpO1xuICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcnkodGhlTW9kZWwsIGNhdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlc3VsdDEgPSBMaXN0QWxsLmxpc3RBbGxIYXZpbmdDb250ZXh0KGNhdCwgYTEuZW50aXR5LCB0aGVNb2RlbC5ydWxlcyxcbiAgICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0RnVsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSk7XG4gICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQxKSk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0MSk7XG4gICAgICAgICAgICAgIGlmKGpvaW5yZXN1bHRzLmxlbmd0aCApe1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIG5vIGVudGl0eSwgZS5nLiBsaXN0IGFsbCBjb3VudHJpZXNcbiAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeSh0aGVNb2RlbCwgY2F0LCBmYWxzZSk7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBMaXN0QWxsLmxpc3RBbGxIYXZpbmdDb250ZXh0KGNhdCwgY2F0LCB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXMoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGlzIGNhdD5cIiArIGNhdCk7XG4gICAgICAgICAgICAgICAgaWYoY2F0ICE9PSBcImV4YW1wbGUgcXVlc3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHMocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcIkZvdW5kIG5vIGRhdGEgaGF2aW5nIFxcXCJcIiArIGNhdCArIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtdWx0aXBsZSBjYXRlZ29yaWVzXG4gICAgICAgICAgICBkZWJ1Z2xvZygnY2F0ZWdvcmllcyBpZGVudGlmaWVkOicgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICAgIGlmIChhMSAmJiBhMS5lbnRpdHkpIHtcbiAgICAgICAgICAgICAgZGVidWdsb2coJ2dvdCBmaWx0ZXI6JyArIGExLmVudGl0eSk7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKHRoZU1vZGVsLCBjYXRzLCB0cnVlKTtcbiAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLHNlc3Npb24sc2VuZCgnSSBjYW5ub3QgY29tYmluZSBcIicgKyBjYXRlZ29yeSArICcoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciByZXN1bHQxVCA9IExpc3RBbGwubGlzdEFsbFR1cGVsV2l0aENvbnRleHQoY2F0cywgYTEuZW50aXR5LFxuICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldCk7XG4gICAgICAgICAgICAgIC8vIFRPRE8gY2xhc3NpZnlpbmcgdGhlIHN0cmluZyB0d2ljZSBpcyBhIHRlcnJpYmxlIHdhc3RlXG4gICAgICAgICAgICAgIGlmICghcmVzdWx0MVQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2dvaW5nIGZvciBoYXZpbmcnKTtcbiAgICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3JpZXModGhlTW9kZWwsIGNhdHMsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQxVCA9IExpc3RBbGwubGlzdEFsbFR1cGVsSGF2aW5nQ29udGV4dChjYXRzLCBhMS5lbnRpdHksIHRoZU1vZGVsLnJ1bGVzLFxuICAgICAgICAgICAgICAgICAgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDFUKSk7XG4gICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdDFUKSk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxVCk7XG4gICAgICAgICAgICAgIGlmKGpvaW5yZXN1bHRzLmxlbmd0aCApe1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcImkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIG5vIGVudGl0eSwgZS5nLiBsaXN0IGFsbCBjb3VudHJpZXNcbiAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IHt9IGFzIHsgW2tleSA6IHN0cmluZ10gOiBib29sZWFufTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyh0aGVNb2RlbCwgY2F0cywgZmFsc2UpO1xuICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsc2Vzc2lvbixzZW5kKCdJIGNhbm5vdCBjb21iaW5lIFwiJyArIGNhdGVnb3J5ICsgJygnICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgcmVzdWx0VCA9IExpc3RBbGwubGlzdEFsbFR1cGVsSGF2aW5nQ29udGV4dChjYXRzLCBcIlxcXCJcIiArIGNhdHMuam9pbihcIlxcXCIgXFxcIlwiKSArIFwiXFxcIlwiLCB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFQpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0VC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFQpKTtcbiAgICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgaXMgY2F0PlwiICsgY2F0cy5qb2luKFwiLCBcIikpO1xuICAgICAgICAgICAgICAgIGlmKGNhdCAhPT0gXCJleGFtcGxlIHF1ZXN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0VCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHRUKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJGb3VuZCBubyBkYXRhIGhhdmluZyBcXFwiXCIgKyBjYXQgKyBcIlxcXCJcIlxuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1RyYWluTWUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogVHJhaW5cIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpO1xuICAgICAgaWYgKG1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmRleE9mKFwia3Jvbm9zXCIpID49IDAgfHwgbWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJrbGluZ29uXCIpID49IDApIHtcbiAgICAgICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhVHJhaW5Ob0tsaW5nb24pKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciByZXMgPSBnZXRSYW5kb21SZXN1bHQoYVRyYWluUmVwbGllcyk7XG4gICAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQocmVzKSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnVG9vTG9uZycsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBUb29Mb25nXCIpO1xuICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgIGRpYWxvZ2xvZyhcIlRvb0xvbmdcIiwgc2Vzc2lvbiwgc2VuZChnZXRSYW5kb21SZXN1bHQoYVJlc3BvbnNlc09uVG9vTG9uZykpKTtcbiAgICB9XG4gIF0pO1xuXG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1dyb25nJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICAvKlxuICAgICAgZGlhbG9nTG9nZ2VyKHtcbiAgICAgICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICAgICAgaW50ZW50OiBcIldyb25nXCIsXG4gICAgICAgIHJlc3BvbnNlOiAnPGJlZ2luIHVwZG93bj4nXG4gICAgICB9KTsgKi9cbiAgICAgIHNlc3Npb24uYmVnaW5EaWFsb2coJy91cGRvd24nLCBzZXNzaW9uLnVzZXJEYXRhLmNvdW50KTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICB2YXIgYWxhcm0gPSBzZXNzaW9uLmRpYWxvZ0RhdGEuYWxhcm07XG4gICAgICBuZXh0KCk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgc2Vzc2lvbi5zZW5kKGdldFJhbmRvbVJlc3VsdChhQmFja0Zyb21UcmFpbmluZykpOyAvLyAgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRzKSk7XG4gICAgICAvL3Nlc3Npb24uc2VuZCgnZW5kIG9mIHdyb25nJyk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnRXhpdCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgZGVidWdsb2coJ2V4aXQgOicpO1xuICAgICAgZGVidWdsb2coJ2V4aXQnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcykpO1xuICAgICAgZGlhbG9nTG9nZ2VyKHtcbiAgICAgICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICAgICAgaW50ZW50OiBcIkV4aXRcIixcbiAgICAgICAgcmVzcG9uc2U6ICd5b3UgYXJlIGluIGEgbG9naWMgbG9vcCdcbiAgICAgIH0pO1xuICAgICAgc2Vzc2lvbi5zZW5kKFwieW91IGFyZSBpbiBhIGxvZ2ljIGxvb3AgXCIpO1xuICAgIH1cbiAgXSk7XG4gIGRpYWxvZy5tYXRjaGVzKCdIZWxwJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBkZWJ1Z2xvZygnaGVscCA6Jyk7XG4gICAgICBkZWJ1Z2xvZygnaGVscCcpO1xuICAgICAgc2Vzc2lvbi5zZW5kKFwiSSBrbm93IGFib3V0IC4uLi4gPGNhdGVnb3JpZXM+PlwiKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5vbkRlZmF1bHQoZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICBsb2dRdWVyeShzZXNzaW9uLCBcIm9uRGVmYXVsdFwiKTtcbiAgICB2YXIgZWxpemEgPSBnZXRFbGl6YUJvdChnZXRDb252ZXJzYXRpb25JZChzZXNzaW9uKSk7XG4gICAgdmFyIHJlcGx5ID0gZWxpemEudHJhbnNmb3JtKHNlc3Npb24ubWVzc2FnZS50ZXh0KTtcbiAgICBkaWFsb2dsb2coXCJlbGl6YVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgLy9uZXcgRWlsemFib3RcbiAgICAvL3Nlc3Npb24uc2VuZChcIkkgZG8gbm90IHVuZGVyc3RhbmQgdGhpcyBhdCBhbGxcIik7XG4gICAgLy9idWlsZGVyLkRpYWxvZ0FjdGlvbi5zZW5kKCdJXFwnbSBzb3JyeSBJIGRpZG5cXCd0IHVuZGVyc3RhbmQuIEkgY2FuIG9ubHkgc2hvdyBzdGFydCBhbmQgcmluZycpO1xuICB9KTtcblxuICByZXR1cm4gYm90O1xufVxuXG5pZiAobW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFUcmFpbk5vS2xpbmdvbjogYVRyYWluTm9LbGluZ29uLFxuICAgIGFUcmFpblJlcGxpZXM6IGFUcmFpblJlcGxpZXMsXG4gICAgcmVzdHJpY3REYXRhOiByZXN0cmljdERhdGEsXG4gICAgaXNBbm9ueW1vdXM6IGlzQW5vbnltb3VzLFxuICAgIC8vU2ltcGxlVXBEb3duUmVjb2duaXplcjogU2ltcGxlVXBEb3duUmVjb2duaXplcixcbiAgICBhUmVzcG9uc2VzT25Ub29Mb25nOiBhUmVzcG9uc2VzT25Ub29Mb25nLFxuICAgIG1ldGF3b3Jkc0Rlc2NyaXB0aW9uczogbWV0YXdvcmRzRGVzY3JpcHRpb25zLFxuICAgIG1ha2VCb3Q6IG1ha2VCb3RcbiAgfTtcbn1cbiJdfQ==
