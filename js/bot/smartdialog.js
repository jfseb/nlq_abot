"use strict";
/**
 * The bot implementation
 *
 * Instantiate creation via makeBot
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
        session.message.address.conversationId;
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
        && session.message.address.user || "";
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
var oJSON = JSON.parse('' + fs.readFileSync(__dirname + '/../../resources/model/intents.json'));
var oRules = PlainRecognizer.parseRules(oJSON);
// var Recognizer = new (recognizer.RegExpRecognizer)(oRules);
function logQuery(session, intent, result) {
    fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
        text: session.message.text,
        timestamp: session.message.timestamp,
        intent: intent,
        res: result && result.length && JSON.stringify(result[0]) || "0",
        conversationId: session.message.address
            && session.message.address.conversationId || "",
        userid: session.message.address
            && session.message.address.user || ""
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
            && session.message.address.conversationId
            || "",
        userid: session.message.address
            && session.message.address.user || ""
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
        var t = (Date.now() - t0) / 1000;
        if (options && options.showModelLoadTime) {
            console.log(`model load time ${(t)}s`);
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
            session.beginDialog('/updown', 1);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ib3Qvc21hcnRkaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHO0FBQ0g7Ozs7R0FJRzs7O0FBRUgseUJBQXlCO0FBRXpCLHdDQUF3QztBQUN4QywrQkFBK0I7QUFFL0IsMENBQTBDO0FBQzFDLDRDQUE0QztBQUM1Qyw4Q0FBOEM7QUFDOUMsa0RBQWtEO0FBQ2xELHNEQUFzRDtBQUV0RCxvQ0FBb0M7QUFNcEMsc0RBQXNEO0FBR3RELG1DQUFtQztBQUVuQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7QUFFM0MsSUFBSSxVQUFVLEdBQUcsMkNBQTJDLENBQUM7QUFDN0QsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksVUFBVSxDQUFDO0FBQ25ELHlCQUF5QjtBQUN6QixJQUFJLENBQUMsR0FBRyxFQUFTLENBQUM7QUFDbEIsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtJQUMvQixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyx5QkFBeUI7Q0FDakQ7QUFDRCxJQUFJLFlBQVksR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFJOUQsU0FBUyxJQUFJLENBQTRCLENBQUksSUFBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxDQUFDO0FBRWhFLFNBQVMsU0FBUyxDQUFDLE1BQWMsRUFBRSxPQUF3QixFQUFFLFFBQXlCO0lBQ3BGLElBQUksU0FBaUIsQ0FBQztJQUN0QixJQUFJLE9BQWUsQ0FBQztJQUNwQixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsU0FBUyxHQUFHLFFBQVEsQ0FBQztLQUN0QjtTQUFNO1FB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QUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN6QyxjQUFjO1FBQ2Qsa0RBQWtEO1FBQ2xELCtGQUErRjtJQUNqRyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELElBQUksTUFBTSxFQUFFO0lBQ1YsTUFBTSxDQUFDLE9BQU8sR0FBRztRQUNmLGVBQWUsRUFBRSxlQUFlO1FBQ2hDLGFBQWEsRUFBRSxhQUFhO1FBQzVCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLGlEQUFpRDtRQUNqRCxtQkFBbUIsRUFBRSwyQkFBbUI7UUFDeEMscUJBQXFCLEVBQUUsNkJBQXFCO1FBQzVDLE9BQU8sRUFBRSxPQUFPO0tBQ2pCLENBQUM7Q0FDSCIsImZpbGUiOiJib3Qvc21hcnRkaWFsb2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoZSBib3QgaW1wbGVtZW50YXRpb25cbiAqXG4gKiBJbnN0YW50aWF0ZSBjcmVhdGlvbiB2aWEgbWFrZUJvdFxuICpcbiAqL1xuLyoqXG4gKiBAZmlsZVxuICogQG1vZHVsZSBqZnNlYi5tZ25scV9hYm90LnNtYXJ0ZGlhbG9nXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2LTIxMDkgR2VyZCBGb3JzdG1hbm5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCAqIGFzIGJ1aWxkZXIgZnJvbSAnLi9ib3RidWlsZGVyJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcblxuaW1wb3J0ICogYXMgV2hhdElzIGZyb20gJy4uL21hdGNoL3doYXRpcyc7XG5pbXBvcnQgKiBhcyBMaXN0QWxsIGZyb20gJy4uL21hdGNoL2xpc3RhbGwnO1xuaW1wb3J0ICogYXMgRGVzY3JpYmUgZnJvbSAnLi4vbWF0Y2gvZGVzY3JpYmUnO1xuaW1wb3J0ICogYXMgTWFrZVRhYmxlIGZyb20gJy4uL2V4ZWMvbWFrZXFiZXRhYmxlJztcbmltcG9ydCAqIGFzIE1vbmdvUXVlcmllcyBmcm9tICcuLi9tYXRjaC9tb25nb3F1ZXJpZXMnO1xuXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICdhYm90X3V0aWxzJztcblxuaW1wb3J0IHsgRXJFcnJvciBhcyBFckVycm9yIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJztcblxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgKiBhcyBEaWFsb2dMb2dnZXIgZnJvbSAnLi4vdXRpbHMvZGlhbG9nbG9nZ2VyJztcblxuaW1wb3J0IHsgTW9uZ29RIGFzIE1vbmdvUSB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7XG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnO1xuXG52YXIgZGJ1cmwgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwgfHwgXCJcIjtcblxudmFyIHBnbG9jYWx1cmwgPSBcInBvc3RncmVzOi8vam9lOmFiY2RlZkBsb2NhbGhvc3Q6NTQzMi9hYm90XCI7XG52YXIgZGJ1cmwgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwgfHwgcGdsb2NhbHVybDtcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbnZhciBvID0gcGcgYXMgYW55O1xuaWYgKCEocHJvY2Vzcy5lbnYuQUJPVF9EQk5PU1NMKSkge1xuICBvLmRlZmF1bHRzLnNzbCA9IHRydWU7IC8vIE9ubHkgdXNlZCBpbnRlcm5hbGx5ICFcbn1cbnZhciBkaWFsb2dMb2dnZXIgPSBEaWFsb2dMb2dnZXIubG9nZ2VyKFwic21hcnRib3RcIiwgZGJ1cmwsIHBnKTtcblxudHlwZSBzdHJpbmdPck1lc3NhZ2UgPSBzdHJpbmcgfCBidWlsZGVyLk1lc3NhZ2U7XG5cbmZ1bmN0aW9uIHNlbmQ8VCBleHRlbmRzIHN0cmluZ09yTWVzc2FnZT4obzogVCk6IFQgeyByZXR1cm4gbzsgfTtcblxuZnVuY3Rpb24gZGlhbG9nbG9nKGludGVudDogc3RyaW5nLCBzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24sIHJlc3BvbnNlOiBzdHJpbmdPck1lc3NhZ2UpIHtcbiAgdmFyIHNSZXNwb25zZTogc3RyaW5nO1xuICB2YXIgc0FjdGlvbjogc3RyaW5nO1xuICBpZiAodHlwZW9mIHJlc3BvbnNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgc0FjdGlvbiA9IFwiXCI7XG4gICAgc1Jlc3BvbnNlID0gcmVzcG9uc2U7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGFNZXNzYWdlOiBidWlsZGVyLk1lc3NhZ2UgPSByZXNwb25zZTtcbiAgICB2YXIgaU1lc3NhZ2U6IGJ1aWxkZXIuSU1lc3NhZ2UgPSBhTWVzc2FnZS50b01lc3NhZ2UoKTtcbiAgICBzUmVzcG9uc2UgPSBpTWVzc2FnZS50ZXh0O1xuICAgIHNBY3Rpb24gPSAoaU1lc3NhZ2UuZW50aXRpZXMgJiYgaU1lc3NhZ2UuZW50aXRpZXNbMF0pID8gKEpTT04uc3RyaW5naWZ5KGlNZXNzYWdlLmVudGl0aWVzICYmIGlNZXNzYWdlLmVudGl0aWVzWzBdKSkgOiBcIlwiO1xuICB9XG4gIGRpYWxvZ0xvZ2dlcih7XG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgc2Vzc2lvbjogc2Vzc2lvbixcbiAgICByZXNwb25zZTogc1Jlc3BvbnNlLFxuICAgIGFjdGlvbjogc0FjdGlvblxuICB9KTtcbiAgc2Vzc2lvbi5zZW5kKHJlc3BvbnNlKTtcbn1cblxudmFyIGVsaXphYm90ID0gcmVxdWlyZSgnLi4vZXh0ZXJuL2VsaXphYm90L2VsaXphYm90LmpzJyk7XG4vL2ltcG9ydCAqIGFzIGVsaXphYm90IGZyb20gJ2VsaXphYm90JztcblxubGV0IGRlYnVnbG9nID0gZGVidWcoJ3NtYXJ0ZGlhbG9nJyk7XG5pbXBvcnQgKiBhcyBQbGFpblJlY29nbml6ZXIgZnJvbSAnLi9wbGFpbnJlY29nbml6ZXInO1xuLy92YXIgYnVpbGRlciA9IHJlcXVpcmUoJ2JvdGJ1aWxkZXInKTtcblxuZnVuY3Rpb24gZ2V0Q29udmVyc2F0aW9uSWQoc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNlc3Npb24ubWVzc2FnZSAmJlxuICAgIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzICYmXG4gICAgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uSWQ7XG59XG5cbnZhciBlbGl6YWJvdHMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RWxpemFCb3QoaWQ6IHN0cmluZykge1xuICBpZiAoIWVsaXphYm90c1tpZF0pIHtcbiAgICBlbGl6YWJvdHNbaWRdID0ge1xuICAgICAgYWNjZXNzOiBuZXcgRGF0ZSgpLFxuICAgICAgZWxpemFib3Q6IG5ldyBlbGl6YWJvdCgpXG4gICAgfTtcbiAgfVxuICBlbGl6YWJvdHNbaWRdLmFjY2VzcyA9IG5ldyBEYXRlKCk7XG4gIHJldHVybiBlbGl6YWJvdHNbaWRdLmVsaXphYm90O1xufVxuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi4vbWF0Y2gvaWZtYXRjaCc7XG4vL2ltcG9ydCAqIGFzIFRvb2xzIGZyb20gJy4uL21hdGNoL3Rvb2xzJztcblxudmFyIG5ld0Zsb3cgPSB0cnVlO1xuXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcblxuLy92YXIgbW9kZWxzID0ge307XG5cblxuZnVuY3Rpb24gaXNBbm9ueW1vdXModXNlcmlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHVzZXJpZC5pbmRleE9mKFwiYW5vOlwiKSA9PT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc3RyaWN0RGF0YShhcnI6IGFueVtdKTogYW55W10ge1xuICBpZiAoYXJyLmxlbmd0aCA8IDYpIHtcbiAgICByZXR1cm4gYXJyO1xuICB9XG4gIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuICB2YXIgcmVzID0gYXJyLnNsaWNlKDAsIE1hdGgubWluKE1hdGgubWF4KE1hdGguZmxvb3IoYXJyLmxlbmd0aCAvIDMpLCA3KSwgYXJyLmxlbmd0aCkpO1xuICBpZiAodHlwZW9mIGFyclswXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHZhciBkZWx0YSA9IGxlbiAtIHJlcy5sZW5ndGg7XG4gICAgcmVzLnB1c2goXCIuLi4gYW5kIFwiICsgZGVsdGEgKyBcIiBtb3JlIGVudHJpZXMgZm9yIHJlZ2lzdGVyZWQgdXNlcnNcIik7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24sIGFycjogYW55W10pOiBhbnlbXSB7XG4gIHZhciB1c2VyaWQgPSBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXIgfHwgXCJcIjtcbiAgaWYgKHByb2Nlc3MuZW52LkFCT1RfRU1BSUxfVVNFUiAmJiBpc0Fub255bW91cyh1c2VyaWQpKSB7XG4gICAgcmV0dXJuIHJlc3RyaWN0RGF0YShhcnIpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmNvbnN0IGFUcmFpblJlcGxpZXMgPSBbXCJUaGFuayB5b3UgZm9yIHNoYXJpbmcgdGhpcyBzdWdnZXN0aW9uIHdpdGggdXNcIixcbiAgXCJUaGFuayBmb3IgZm9yIHRoaXMgdmFsdWFibGUgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhbmsgZm9yIGZvciB0aGlzIGludGVyZXN0aW5nIGZhY3QhXCIsXG4gIFwiVGhhdHMgYSBwbGV0aG9yaWEgb2YgaW5mb3JtYXRpb24uXCIsXG4gIFwiVGhhdCdzIGEgbnVnZ2V0IG9mIGluZm9ybWF0aW9uLlwiLFxuICBcIkxvdmVseSwgSSBtYXkgY29uc2lkZXIgeW91IGlucHV0LlwiLFxuICBcIldlbGwgZG9uZSwgYW55dGhpbmcgbW9yZSB0byBsZXQgbWUga25vdz9cIixcbiAgXCJJIGRvIGFwcHJlY2lhdGUgeW91ciB0ZWFjaGluZyBhbmQgbXkgbGVhcm5pbmcgZXhwZXJpZW5jZSwgb3Igd2FzIGl0IHRoZSBvdGhlciB3YXkgcm91bmQ/XCIsXG4gIFwiWW91ciBoZWxwZnVsIGlucHV0IGhhcyBiZWVuIHN0b3JlZCBpbiBzb21lIGR1c3R5IGNvcm5lciBvZiB0aGUgV29ybGQgd2lkZSB3ZWIhXCIsXG4gIFwiVGhhbmsgeW91IGZvciBteSBsZWFybmluZyBleHBlcmllbmNlIVwiLFxuICBcIkkgaGF2ZSBpbmNvcnBvcmF0ZWQgeW91ciB2YWx1YWJsZSBzdWdnZXN0aW9uIGluIHRoZSB3aXNkb20gb2YgdGhlIGludGVybmV0XCJcbl07XG5cbnZhciBhVHJhaW5EaWFsb2cgPSBhVHJhaW5SZXBsaWVzO1xuXG52YXIgYVRyYWluRXhpdEhpbnQgPSBbXG4gIFwiXFxudHlwZSBcXFwiZG9uZVxcXCIgd2hlbiB5b3UgYXJlIGRvbmUgdHJhaW5pbmcgbWUuXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXCIsXG4gIFwiXFxucmVtZW1iZXIsIHlvdSBhcmUgc3R1Y2sgaGVyZSBpbnN0cnVjdGluZyBtZSwgdHlwZSBcXFwiZG9uZVxcXCIgdG8gcmV0dXJuLlwiLFxuICBcIlwiXTtcblxuY29uc3QgYUVudGVyVHJhaW4gPSBbJ1NvIHlvdSB0aGluayB0aGlzIGlzIHdyb25nPyBZb3UgY2FuIG9mZmVyIHlvdXIgYWR2aXNlIGhlcmUuXFxuIFR5cGUgXCJkb25lXCIgaWYgeW91IGFyZSBkb25lIHdpdGggaW5zdHJ1Y3RpbmcgbWUnLFxuICAnRmVlbCBmcmVlIHRvIG9mZmVyIG1lIHlvdXIgYmV0dGVyIHNvbHV0aW9uIGhlcmUuXFxuVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdTb21lIHNheSBcIlRoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cIiwgXFxudCBpZiB5b3UgY291bGQgaGVscCBtZSB0byBiZWNvbWUgYmV0dGVyLCBpbnN0cnVjdCBtZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCB0ZWFjaGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG5dO1xuY29uc3QgYUJhY2tGcm9tVHJhaW5pbmcgPSBbXG4gICdQdXVoLCBiYWNrIGZyb20gdHJhaW5pbmchIE5vdyBmb3IgdGhlIGVhc3kgcGFydCAuLi5cXG4gYXNrIG1lIGEgbmV3IHF1ZXN0aW9uLicsXG4gICdMaXZlIGFuZCBkb25cXCd0IGxlYXJuLCB0aGF0XFwncyB1cy4gTmFhaCwgd2VcXCdsbCBzZWUuXFxuQXNrIG1lIGFub3RoZXIgcXVlc3Rpb24uJyxcbiAgJ1RoZSBzZWNyZXQgdG8gaGFwcGluZXNzIGlzIHRvIGxvd2VyIHlvdXIgZXhwZWN0YXRpb25zIHRvIHRoZSBwb2ludCB0aGV5IGFyZSBhbHJlYWR5IG1ldC5cXG4gQXNrIG1lIGEgcXVlc3Rpb24uJyxcbiAgJ1RoYW5rcyBmb3IgaGF2aW5nIHRoaXMgbGVjdHVyZSBzZXNzaW9uLCBub3cgaSBhbSBiYWNrIHRvIG91ciB1c3VhbCBzZWxmLlxcbiBBc2sgbWUgYSBxdWVzdGlvbi4nXG5dO1xuXG5cbmNvbnN0IGFUcmFpbk5vS2xpbmdvbiA9IFtcbiAgXCJIZSB3aG8gbWFzdGVycyB0aGUgZGFyayBhcnRzIG9mIFNBUCBtdXN0IG5vdCBkd2VsbCBpbiB0aGUgZWFydGhseSByZWFsbXMgb2YgU3RhciBUcmVrLlwiLFxuICBcIlNBUCBpcyBhIGNsb3VkIGNvbXBhbnksIG5vdCBhIHNwYWNlIGNvbXBhbnkuXCIsXG4gIFwiVGhlIGRlcHRoIG9mIFIvMyBhcmUgZGVlcGVyIHRoYW4gRGVlcCBTcGFjZSA0Mi5cIixcbiAgXCJNeSBicmFpbnBvd2VyIGlzIGZ1bGx5IGFic29yYmVkIHdpdGggbWFzdGVyaW5nIG90aGVyIHJlYWxtcy5cIixcbiAgXCJGb3IgdGhlIHdvc2FwLCB0aGUgc2t5IGlzIHRoZSBsaW1pdC4gRmVlbCBmcmVlIHRvIGNoZWNrIG91dCBuYXNhLmdvdiAuXCIsXG4gIFwiVGhlIGZ1dHVyZSBpcyBTQVAgb3IgSUJNIGJsdWUsIG5vdCBzcGFjZSBibGFjay5cIixcbiAgXCJUaGF0J3MgbGVmdCB0byBzb21lIG11cmt5IGZ1dHVyZS5cIlxuXVxuXG5leHBvcnQgY29uc3QgYVJlc3BvbnNlc09uVG9vTG9uZyA9IFtcbiAgXCJZb3VyIGlucHV0IHNob3VsZCBiZSBlbG9xdWVudCBpbiBpdCdzIGJyZXZpdHkuIFRoaXMgb25lIHdhcyB0b28gbG9uZy5cIixcbiAgXCJteSB3aXNkb20gaXMgc2V2ZXJseSBib3VuZCBieSBteSBsaW1pdGVkIGlucHV0IHByb2Nlc3NpbmcgY2FwYWJpbGl0aWVzLiBDb3VsZCB5b3UgZm9ybXVsYXRlIGEgc2hvcnRlciBpbnB1dD8gVGhhbmsgeW91LlwiLFxuICBcIlRoZSBsZW5ndGggb2YgeW91IGlucHV0IGluZGljYXRlcyB5b3UgcHJvYmFibHkga25vdyBtb3JlIGFib3V0IHRoZSB0b3BpYyB0aGFuIG1lPyBDYW4gaSBodW1ibHkgYXNrIHlvdSB0byBmb3JtdWxhdGUgYSBzaG9ydGVyIHF1ZXN0aW9uP1wiLFxuICAnXFxcIldoYXQgZXZlciB5b3Ugd2FudCB0byB0ZWFjaCwgYmUgYnJpZWZcXFwiIChIb3JhY2UpLiBXaGlsZSB0aGlzIGRvZXMgbm90IGFsd2F5cyBhcHBsaWVzIHRvIG15IGFuc3dlcnMsIGl0IGlzIHJlcXVpcmUgZm9yIHlvdXIgcXVlc3Rpb25zLiBQbGVhc2UgdHJ5IGFnYWluIHdpdGggYSByZWZpbmVkIHF1ZXN0aW9ucy4nLFxuICAnSSB1bmRlcnN0YW5kIG1vcmUgdGhhbiA0LWxldHRlciB3b3JkcywgYnV0IG5vdCBtb3JlIHRoYW4gMjAgd29yZCBzZW50ZW5jZXMuIFBsZWFzZSB0cnkgdG8gc2hvcnRlbiB5b3VyIGlucHV0LicsXG4gICd0aGUgc2t5IGlzIHRoZSBsaW1pdD8gQWlyIGZvcmNlIG1lbWJlciBvciBub3QsIHlvdSBjYW4gYXNrIGxvbmdlciBxdWVzdGlvbnMgdGhhbiBcXFwidGhlIHNreVxcXCIsIGJ1dCBub3QgdGhpcyBsb25nJyxcbiAgJ015IGFuc3dlcnMgbWF5IGJlIGV4aGF1c3RpdmUsIGJ1dCBJIHVuZGVyc3RhbmQgbW9yZSB0aGFuIDQtbGV0dGVyIHdvcmRzLCBidXQgbm90IG1vcmUgdGhhbiAyMCB3b3JkIHNlbnRlbmNlcy4gU29ycnkuJyxcbiAgJ091ciBjb252ZXJzYXRpb24gbXVzdCBiZSBoaWdobHkgYXNzeW1tZXRyaWM6IG15IGFuc3dlcnMgbWF5IGJlIHZlcmJvc2UgYW5kIGV4aGF1c3RpdmUgYW5kIGZ1enp5LCBxdWVzdGlvbnMgYW5kIGlucHV0IG11c3QgYmUgYnJpZWYuIFRyeSB0byByZWZvcm11bGF0ZSBpdCcsXG5dO1xuXG5leHBvcnQgY29uc3QgbWV0YXdvcmRzRGVzY3JpcHRpb25zID0ge1xuICBcImNhdGVnb3J5XCI6IFwiYW4gYXR0cmlidXRlIG9mIGEgcmVjb3JkIGluIGEgbW9kZWwsIGV4YW1wbGU6IGEgUGxhbmV0IGhhcyBhIFxcXCJuYW1lXFxcIiBhdHRyaWJ1dGVcIixcbiAgXCJkb21haW5cIjogXCJhIGdyb3VwIG9mIGZhY3RzIHdoaWNoIGFyZSB0eXBpY2FsbHkgdW5yZWxhdGVkXCIsXG4gIFwia2V5XCI6IFwiYW4gYXR0cmlidXRlIHZhbHVlIChvZiBhIGNhdGVnb3J5KSB3aGljaCAgaXMgdW5pcXVlIGZvciB0aGUgcmVjb3JkXCIsXG4gIFwidG9vbFwiOiBcImlzIHBvdGVudGlhbHkgY29tbWFuZCB0byBleGVjdXRlXCIsXG4gIFwicmVjb3JkXCI6IFwiYSBzcGVjaWZpYyBzZXQgb2YgXFxcImZhY3RcXFwicyBvZiBhIGRvbWFpbiwgYSBcXFwicmVjb3JkXFxcIiBoYXMgYSBzZXQgb2YgYXR0cmlidXRlcyB2YWx1ZXMgKFxcXCJmYWN0XFxcInMpIG9mIHRoZSBjYXRlZ29yaWVzLCBvZnRlbiBhIHJlY29yZCBoYXMgYSBcXFwia2V5XFxcIlwiLFxuICBcImZhY3RcIjogXCJhIHNwZWNpZmljIGNhdGVnb3J5IHZhbHVlIG9mIGEgcmVjb3JkIGluIGEgZG9tYWluLCBtYXkgYmUgYSBcXFwia2V5XFxcIiB2YWx1ZVwiLFxufTtcblxuZnVuY3Rpb24gZ2V0UmFuZG9tUmVzdWx0KGFycjogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpICUgYXJyLmxlbmd0aF07XG59XG5cbi8qXG5leHBvcnQgY2xhc3MgU2ltcGxlVXBEb3duUmVjb2duaXplciBpbXBsZW1lbnRzIGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcblxuICB9XG5cbiAgcmVjb2duaXplKGNvbnRleHQ6IGJ1aWxkZXIuSVJlY29nbml6ZUNvbnRleHQsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgcmVzdWx0OiBidWlsZGVyLklJbnRlbnRSZWNvZ25pemVyUmVzdWx0KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdmFyIHUgPSB7fSBhcyBidWlsZGVyLklJbnRlbnRSZWNvZ25pemVyUmVzdWx0O1xuXG4gICAgZGVidWdsb2coXCJyZWNvZ25pemluZyBcIiArIGNvbnRleHQubWVzc2FnZS50ZXh0KTtcbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImRvd25cIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC5kb3duXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwic3RhcnQgXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJ1cFwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImRvbmVcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJleGl0XCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwicXVpdFwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWJ1Z2xvZygncmVjb2duaXppbmcgbm90aGluZycpO1xuICAgIHUuaW50ZW50ID0gXCJOb25lXCI7XG4gICAgdS5zY29yZSA9IDAuMTtcbiAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgZTEuc3RhcnRJbmRleCA9IFwiZXhpdCBcIi5sZW5ndGg7XG4gICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgZTEuc2NvcmUgPSAwLjE7XG4gICAgdS5lbnRpdGllcyA9IFtdO1xuICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gIH1cbn1cbiovXG5cbmNvbnN0IEFueU9iamVjdCA9IE9iamVjdCBhcyBhbnk7XG5cbnZhciBib3Q7XG5cbnZhciBvSlNPTiA9IEpTT04ucGFyc2UoJycgKyBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy8uLi8uLi9yZXNvdXJjZXMvbW9kZWwvaW50ZW50cy5qc29uJykpO1xudmFyIG9SdWxlcyA9IFBsYWluUmVjb2duaXplci5wYXJzZVJ1bGVzKG9KU09OKTtcbi8vIHZhciBSZWNvZ25pemVyID0gbmV3IChyZWNvZ25pemVyLlJlZ0V4cFJlY29nbml6ZXIpKG9SdWxlcyk7XG5cblxuZnVuY3Rpb24gbG9nUXVlcnkoc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uLCBpbnRlbnQ6IHN0cmluZywgcmVzdWx0PzogQXJyYXk8YW55Pikge1xuXG4gIGZzLmFwcGVuZEZpbGUoJy4vbG9ncy9zaG93bWVxdWVyaWVzLnR4dCcsIFwiXFxuXCIgKyBKU09OLnN0cmluZ2lmeSh7XG4gICAgdGV4dDogc2Vzc2lvbi5tZXNzYWdlLnRleHQsXG4gICAgdGltZXN0YW1wOiBzZXNzaW9uLm1lc3NhZ2UudGltZXN0YW1wLFxuICAgIGludGVudDogaW50ZW50LFxuICAgIHJlczogcmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggJiYgSlNPTi5zdHJpbmdpZnkocmVzdWx0WzBdKSB8fCBcIjBcIixcbiAgICBjb252ZXJzYXRpb25JZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy5jb252ZXJzYXRpb25JZCB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyIHx8IFwiXCJcbiAgfSkgLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgaW50ZW50OiBzdHJpbmcsIHJlc3VsdD86IEFycmF5PElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXI+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBXaGF0SXMuZHVtcE5pY2VUdXBlbChyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbklkXG4gICAgfHwgXCJcIixcbiAgICB1c2VyaWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlciB8fCBcIlwiXG4gIH0pLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVidWdsb2coXCJsb2dnaW5nIGZhaWxlZCBcIiArIGVycik7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGd3b3JkcyA9IHt9O1xuLyoqXG4gKiBDb25zdHJ1Y3QgYSBib3RcbiAqIEBwYXJhbSBjb25uZWN0b3Ige0Nvbm5lY3Rvcn0gdGhlIGNvbm5lY3RvciB0byB1c2VcbiAqIEhUTUxDb25uZWN0b3JcbiAqIG9yIGNvbm5lY3RvciA9IG5ldyBidWlsZGVyLkNvbnNvbGVDb25uZWN0b3IoKS5saXN0ZW4oKVxuICovXG5mdW5jdGlvbiBtYWtlQm90KGNvbm5lY3RvcixcbiAgbW9kZWxQcm92aWRlcjogKCkgPT4gUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4sIG9wdGlvbnM/OiBhbnkpOiBidWlsZGVyLlVuaXZlcnNhbEJvdCB7XG4gIHZhciB0MCA9IERhdGUubm93KCk7XG4gIHZhciB0aGVNb2RlbFAgPSBtb2RlbFByb3ZpZGVyKCk7XG4gIHRoZU1vZGVsUC50aGVuKFxuICAgICh0aGVNb2RlbCkgPT4ge1xuICAgICAgdmFyIHQgPSAoRGF0ZS5ub3coKSAtIHQwKS8xMDAwO1xuICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zaG93TW9kZWxMb2FkVGltZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgbW9kZWwgbG9hZCB0aW1lICR7KHQpfXNgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICBmdW5jdGlvbiBnZXRUaGVNb2RlbCgpOiBQcm9taXNlPElNYXRjaC5JTW9kZWxzPiB7XG4gICAgcmV0dXJuIHRoZU1vZGVsUDtcbiAgfVxuXG4gIGJvdCA9IG5ldyBidWlsZGVyLlVuaXZlcnNhbEJvdChjb25uZWN0b3IpO1xuICB2YXIgcmVjb2duaXplciA9IG5ldyBQbGFpblJlY29nbml6ZXIuUmVnRXhwUmVjb2duaXplcihvUnVsZXMpO1xuICB2YXIgZGlhbG9nID0gbmV3IGJ1aWxkZXIuSW50ZW50RGlhbG9nKHsgcmVjb2duaXplcnM6IFtyZWNvZ25pemVyXSB9KTtcbiAgLy8gdmFyIGRpYWxvZ1VwRG93biA9IG5ldyBidWlsZGVyLkludGVudERpYWxvZyh7IHJlY29nbml6ZXJzOiBbbmV3IFNpbXBsZVVwRG93blJlY29nbml6ZXIoKV0gfSk7XG5cbiAgLypcbiAgYm90LmRpYWxvZygnL3VwZG93bicsIGRpYWxvZ1VwRG93bik7XG4gIGRpYWxvZ1VwRG93bi5vbkJlZ2luKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhRW50ZXJUcmFpbikpKTtcbiAgICAvL3Nlc3Npb24uc2VuZChcIkhpIHRoZXJlLCB1cGRvd24gaXMgd2FpdGluZyBmb3IgeW91XCIpO1xuICB9KVxuXG4gIGRpYWxvZ1VwRG93bi5tYXRjaGVzKCdpbnRlbnQudXAnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSBhcmdzIHx8IHt9O1xuICAgICAgYnVpbGRlci5Qcm9tcHRzLnRleHQoc2Vzc2lvbiwgJ3lvdSB3YW50IHRvIGV4aXQgdHJhaW5pbmc/IHR5cGUgXFxcImRvbmVcXFwiIGFnYWluLicpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSByZXN1bHRzLnJlcG9uc2U7XG4gICAgICBuZXh0KCk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgc2Vzc2lvbi5lbmREaWFsb2dXaXRoUmVzdWx0KHsgcmVzcG9uc2U6IHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgfSk7XG4gICAgfVxuICBdXG4gICk7XG5cbiAgZGlhbG9nVXBEb3duLm1hdGNoZXMoJ2ludGVudC5kb3duJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBzZXNzaW9uLmRpYWxvZ0RhdGEuYWJjID0gYXJncyB8fCB7fTtcbiAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICd5b3Ugd2FudCB0byBnbyBkb3duIScpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSAtMTsgLy8gcmVzdWx0cy5yZXBvbnNlO1xuICAgICAgbmV4dCgpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgIHNlc3Npb24uc2VuZChcInN0aWxsIGdvaW5nIGRvd24/XCIpO1xuICAgIH1cbiAgXVxuICApO1xuICBkaWFsb2dVcERvd24ub25EZWZhdWx0KGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgbG9nUXVlcnkoc2Vzc2lvbiwgXCJvbkRlZmF1bHRcIik7XG4gICAgdmFyIHJlcyA9IGdldFJhbmRvbVJlc3VsdChhVHJhaW5EaWFsb2cpICsgZ2V0UmFuZG9tUmVzdWx0KGFUcmFpbkV4aXRIaW50KTtcbiAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQocmVzKSk7XG4gIH0pO1xuICAqL1xuXG4gIC8qXG4gICAgYm90LmRpYWxvZygnL3RyYWluJywgW1xuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgICAgc2Vzc2lvbi5kaWFsZ29EYXRhLmFiYyA9IGFyZ3MgfHwge307XG4gICAgICAgIGJ1aWxkZXIuUHJvbXB0cy50ZXh0KHNlc3Npb24sICdEbyB5b3Ugd2FudCB0byB0cmFpbiBtZScpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzLCBuZXh0KSB7XG4gICAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSByZXN1bHRzLnJlcG9uc2U7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgICAgc2Vzc2lvbi5lbmREaWFsb2dXaXRoUmVzdWx0KHsgcmVzcG9uc2U6IHNlc3Npb24uRGlhbG9nRGF0YS5hYmMgfSk7XG4gICAgICB9XG4gICAgXSk7XG4gICovXG5cbiAgYm90LmRpYWxvZygnLycsIGRpYWxvZyk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1Nob3dNZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBTaG93TWUgaXMgYSBzcGVjaWFsIGZvcm0gb2YgV2hhdElzIHdoaWNoIGFsc28gc2VsZWN0cyB0aGVcbiAgICAgIC8vIFwiY2xvc2VzdCBfdXJsXCIgcmFua2VkIGJ5IF9wcmVmZXJyZWRVcmxPcmRlclxuICAgICAgLy8gaWYgcHJlc2VudCwgdGhlIF91cmwgaXMgcHV0IGludG8gZXhlYy5hY3Rpb25cbiAgICAgIC8vXG4gICAgICAvLy8gVE9ETyBSRU1PREVMXG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICBkZWJ1Z2xvZyhcIlNob3cgRW50aXR5XCIpO1xuICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgdmFyIGExID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0ExJyk7XG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG4gICAgICAgIExpc3RBbGwubGlzdEFsbFNob3dNZShhMS5lbnRpdHksIHRoZU1vZGVsKS50aGVuKFxuICAgICAgICAgIHJlc3VsdFNob3dNZSA9PiB7XG4gICAgICAgICAgICBsb2dRdWVyeShzZXNzaW9uLCAnU2hvd01lJywgKHJlc3VsdFNob3dNZSBhcyBhbnkpLmJlc3RVUkkpO1xuICAgICAgICAgICAgLy8gdGVzdC5leHBlY3QoMylcbiAgICAgICAgICAgIC8vICB0ZXN0LmRlZXBFcXVhbChyZXN1bHQud2VpZ2h0LCAxMjAsICdjb3JyZWN0IHdlaWdodCcpO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHRTaG93TWUgfHwgIShyZXN1bHRTaG93TWUgYXMgYW55KS5iZXN0VVJJKSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIlNob3dNZVwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGdldCB3aGF0IHlvdSB3YW50XCIpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJlc3RVUkkgPSAocmVzdWx0U2hvd01lIGFzIGFueSkuYmVzdFVSSTtcbiAgICAgICAgICAgIC8vIGRlYnVnbG9nKCdyZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0LCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdiZXN0IHJlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRTaG93TWUgfHwge30sIHVuZGVmaW5lZCwgMikpO1xuXG4gICAgICAgICAgICAvLyB0ZXh0IDogXCJzdGFydGluZyB1bml0IHRlc3QgXFxcIlwiICsgdW5pdHRlc3QgKyBcIlxcXCJcIisgICh1cmw/ICAoJyB3aXRoIHVybCAnICsgdXJsICkgOiAnbm8gdXJsIDotKCcgKSxcbiAgICAgICAgICAgIC8vICAgICAgYWN0aW9uIDogeyB1cmw6IHVybCB9XG5cbiAgICAgICAgICAgIHZhciByZXBseSA9IG5ldyBidWlsZGVyLk1lc3NhZ2Uoc2Vzc2lvbilcbiAgICAgICAgICAgICAgLnRleHQoXCJzdGFydGluZyB1cmkgXCIgKyBiZXN0VVJJKVxuICAgICAgICAgICAgICAuYWRkRW50aXR5KHsgdXJsOiBiZXN0VVJJIH0pIC8vIGV4ZWMuYWN0aW9uKTtcbiAgICAgICAgICAgIC8vIC5hZGRBdHRhY2htZW50KHsgZmFsbGJhY2tUZXh0OiBcIkkgZG9uJ3Qga25vd1wiLCBjb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnLCBjb250ZW50VXJsOiBcInd3dy53b21iYXQub3JnXCIgfSk7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJTaG93TWVcIiwgc2Vzc2lvbiwgc2VuZChyZXBseSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1doYXRJcycsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuXG4gICAgICAvLyBUT0RPIFNXSVRIIFRPIE1PTkdPUVVFUklFU1xuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuXG4gICAgICAgIGRlYnVnbG9nKFwiV2hhdElzIEVudGl0aWVzXCIpO1xuICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gICAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yeScpO1xuICAgICAgICB2YXIgY2F0ZWdvcmllc2pvaW5lZCA9IGNhdGVnb3J5RW50aXR5LmVudGl0eTtcbiAgICAgICAgdmFyIGluU3RoID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0ExJyk7XG4gICAgICAgIHZhciBjYXRzID0gW107XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2F0cyA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnlNdWx0T25seUFuZENvbW1hKGNhdGVnb3JpZXNqb2luZWQsIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgY2F0czogXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgIC8vIGN1cnJlbnRseSB3ZSBkbyBub3QgZXh0cmFjdCBjYXRlZ29yaWVzIGNvcnJlY3RseSAsIHRodXMgd2UgcmF0aGVyIGlnbm9yZSBhbmQgZ28gb25cbiAgICAgICAgICAgIC8vanVzdCBnbyBvbiAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzam9pbmVkICtcbiAgICAgICAgICAgIC8vICAgICAoZSA/ICcoJyArIGUudG9TdHJpbmcoKSArICcpJyA6IFwiXCIpKSk7XG4gICAgICAgICAgICAvLyAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIC8vICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLnJ1bGVzLndvcmRNYXBbJ2NvLWZpbyddKSk7XG4gICAgICAgIHZhciBxdWVyeSA9IGNhdGVnb3JpZXNqb2luZWQ7XG4gICAgICAgIHZhciBpblNvbWV0aGluZyA9IGluU3RoICYmIGluU3RoLmVudGl0eSB8fCBcIlwiO1xuICAgICAgICBpZiAoaW5TdGgpIHtcbiAgICAgICAgICBxdWVyeSA9IGNhdGVnb3JpZXNqb2luZWQgKyAnIHdpdGggJyArIGluU3RoLmVudGl0eTtcbiAgICAgICAgfVxuICAgICAgICBNb25nb1F1ZXJpZXMubGlzdEFsbChxdWVyeSwgdGhlTW9kZWwpLnRoZW4ocmVzdWx0V0kgPT4ge1xuICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICdnb3QgcmVzdWx0JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSlcblxuICAgICAgICAgIHZhciBlcnJfZXhwbGFpbiA9IExpc3RBbGwucmV0dXJuRXJyb3JUZXh0SWZPbmx5RXJyb3IocmVzdWx0V0kpO1xuICAgICAgICAgIGlmIChlcnJfZXhwbGFpbikge1xuICAgICAgICAgICAgLy9kaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdCArIFwiIChcIiArIGNhdGVnb3J5ICsgJylcXFwiIGluIHJlbGF0aW9uIHRvIFwiJyArIGExLmVudGl0eSArIGBcIi4ke2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzam9pbmVkICsgXCJcXFwiIChcIiArIFV0aWxzLmxpc3RUb1F1b3RlZENvbW1hQW5kKGNhdHMpICsgJykgaW4gcmVsYXRpb24gdG8gXCInICsgaW5TdGguZW50aXR5ICsgYFwiLiR7ZXJyX2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKGVycl90ZXh0KSk7XG4gICAgICAgICAgICAvLyAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHRXSSkpO1xuICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHRXSSk7XG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cgPyAoJ2xpc3RhbGwgcmVzdWx0MiA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpIDogJy0nKTtcbiAgICAgICAgICAvLyBkZWJ1Z2xvZygncmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgnYmVzdCByZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0lbMF0ucmVzdWx0c1swXSB8fCB7fSwgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgICAgIC8vIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQ/ICgndG9wIDogJyArIFdoYXRJcy5kdW1wV2VpZ2h0c1RvcChyZXN1bHQxLnR1cGVsYW5zd2Vyc1swXS5yZXN1bHRbMF0gfHwge30sIHsgdG9wOiAzIH0pKTogJy0nKTtcbiAgICAgICAgICAvLyBUT0RPIGNsZWFuc2VkIHNlbnRlbmNlXG5cbiAgICAgICAgICAvL2RpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdUaGUgJyArIGNhdGVnb3JpZXNqb2luZWQgKyAnIG9mICcgKyBpblN0aC5lbnRpdHkgKyAnIGlzICcgK1xuICAgICAgICAgIC8vcmVzdWx0V0kudHVwZWxhbnN3ZXJzWzBdLnJlc3VsdCArIFwiXFxuXCIpKTtcblxuXG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cgPyAoJ2xpc3RhbGwgcmVzdWx0ID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSkgOiAnLScpO1xuICAgICAgICAgIC8vIFRPRE8gV2h5IG9ubHkgRklSU1QhPz8/XG4gICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwoW3Jlc3VsdFdJWzBdXSkpO1xuICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHRXSSk7XG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cgPyAoJ2xpc3RhbGwgcmVzdWx0MiA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSSkpIDogJy0nKTtcbiAgICAgICAgICBpZiAoam9pbnJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gaW5Tb21ldGhpbmcgPyAnIG9mICcgKyBpblNvbWV0aGluZyA6ICcnO1xuICAgICAgICAgICAgaWYgKGNhdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdUaGUgJyArIGNhdGVnb3JpZXNqb2luZWQgKyBzdWZmaXggKyAnIGlzICcgK1xuICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzICsgXCJcXG5cIikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoXCJUaGUgXCIgKyBjYXRlZ29yaWVzam9pbmVkICsgc3VmZml4ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGVycnByZWZpeCA9IExpc3RBbGwucmV0dXJuRXJyb3JUZXh0SWZPbmx5RXJyb3IocmVzdWx0V0kpIHx8ICcnO1xuICAgICAgICAgICAgdmFyIHN1ZmZpeDIgPSBpblNvbWV0aGluZyA/ICcgZm9yICcgKyBpblNvbWV0aGluZyA6ICcnO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwiaSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcmllc2pvaW5lZCArIHN1ZmZpeDIgKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpICsgXCJcIiArIGVycnByZWZpeCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdMaXN0QWxsJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IExpc3RBbGxcIik7XG4gICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpO1xuICAgICAgdmFyIGNhdGVnb3J5ID0gY2F0ZWdvcnlFbnRpdHkuZW50aXR5O1xuICAgICAgdmFyIGluU3RoRW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2luc3RoJylcbiAgICAgIHZhciBpblNvbWV0aGluZyA9IGluU3RoRW50aXR5ICYmIGluU3RoRW50aXR5LmVudGl0eTtcbiAgICAgIC8vIHNvbWUgbWV0YXF1ZXJpZXM6XG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG5cbiAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcImNhdGVnb3JpZXNcIikge1xuICAgICAgICAgIC8vIGRvIHdlIGhhdmUgYSBmaWx0ZXIgP1xuICAgICAgICAgIHZhciBkb21haW4gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKGluU29tZXRoaW5nKSB7XG4gICAgICAgICAgICBkb21haW4gPSBMaXN0QWxsLmluZmVyRG9tYWluKHRoZU1vZGVsLCBpblNvbWV0aGluZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZG9tYWluKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC5jYXRlZ29yeSkuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBpZiAoaW5Tb21ldGhpbmcpIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwiSSBkaWQgbm90IGluZmVyIGEgZG9tYWluIHJlc3RyaWN0aW9uIGZyb20gXFxcIlwiICsgVXRpbHMuc3RyaXBRdW90ZXMoaW5Tb21ldGhpbmcpICsgXCJcXFwiLCBhbGwgbXkgY2F0ZWdvcmllcyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIm15IGNhdGVnb3JpZXMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhUmVzID0gTW9kZWwuZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIGFSZXMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwibXkgY2F0ZWdvcmllcyBpbiBkb21haW4gXFxcIlwiICsgZG9tYWluICsgXCJcXFwiIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiZG9tYWluc1wiKSB7XG4gICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwuZG9tYWlucykuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwibXkgZG9tYWlucyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGVNb2RlbC5ydWxlcy53b3JkTWFwWydjby1maW8nXSkpO1xuICAgICAgICB2YXIgcXVlcnkgPSBjYXRlZ29yeTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXNqb2luZWQgPSBjYXRlZ29yeTtcbiAgICAgICAgaWYgKGluU29tZXRoaW5nKSB7XG4gICAgICAgICAgcXVlcnkgPSBjYXRlZ29yeSArICcgd2l0aCAnICsgaW5Tb21ldGhpbmc7XG4gICAgICAgIH1cbiAgICAgICAgTW9uZ29RdWVyaWVzLmxpc3RBbGwocXVlcnksIHRoZU1vZGVsKS50aGVuKHJlc3VsdDEgPT4ge1xuICAgICAgICAgIHZhciBjYXRzID0gW107XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdhbmFseXppbmcgY2F0ZWdvcnkgZnJvbSAnICsgY2F0ZWdvcnkpO1xuICAgICAgICAgICAgY2F0cyA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnlNdWx0T25seUFuZENvbW1hKGNhdGVnb3J5LCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgY2F0czogXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uOiBcIiArIGUpO1xuICAgICAgICAgICAgICAvLyBHbyBvbiBmb3Igbm93XG4gICAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgICAgLy8gIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yeSArXG4gICAgICAgICAgICAgIC8vICAgIChlID8gJygnICsgZS50b1N0cmluZygpICsgJyknIDogXCJcIikpKTtcbiAgICAgICAgICAgICAgLy8gIC8vIG5leHQoKTtcbiAgICAgICAgICAgICAgLy8gIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy92YXIgcmVzdWx0MSA9IExpc3RBbGwubGlzdEFsbFdpdGhDb250ZXh0KGNhdCwgaW5Tb21ldGhpbmcsXG4gICAgICAgICAgLy8gIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldCk7XG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cgPyAoJ2xpc3RhbGwgcmVzdWx0ID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDEpKSA6ICctJyk7XG4gICAgICAgICAgdmFyIGVycl9leHBsYWluID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHQxKTtcbiAgICAgICAgICBpZiAoZXJyX2V4cGxhaW4pIHtcbiAgICAgICAgICAgIC8vZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXQgKyBcIiAoXCIgKyBjYXRlZ29yeSArICcpXFxcIiBpbiByZWxhdGlvbiB0byBcIicgKyBhMS5lbnRpdHkgKyBgXCIuJHtleHBsYWlufWApKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSBpblNvbWV0aGluZyA/ICdpbiByZWxhdGlvbiB0byBcIicgKyBpblNvbWV0aGluZyArICdcIicgOiAnJztcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllc2pvaW5lZCArIFwiXFxcIiAoXCIgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChjYXRzKSArICcpJyArIHN1ZmZpeCArIGAuJHtlcnJfZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoZXJyX3RleHQpKTtcbiAgICAgICAgICAgIC8vICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdDEpKTtcbiAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0MSk7XG4gICAgICAgICAgZGVidWdsb2coKCkgPT4gKCdsaXN0YWxsIHJlc3VsdDIgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MSkpKTtcbiAgICAgICAgICB2YXIgc3VmZml4ID0gKGluU29tZXRoaW5nKSA/IFwiIGZvciBcIiArIGluU29tZXRoaW5nIDogXCJcIjtcbiAgICAgICAgICBpZiAoam9pbnJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJ0aGUgXCIgKyBjYXRlZ29yeSArIHN1ZmZpeCArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBlcnJwcmVmaXggPSBcIlwiO1xuICAgICAgICAgICAgdmFyIGVycnByZWZpeCA9IExpc3RBbGwucmV0dXJuRXJyb3JUZXh0SWZPbmx5RXJyb3IocmVzdWx0MSkgfHwgJyc7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgZmluZCBhbnkgXCIgKyBjYXRlZ29yeSArIHN1ZmZpeCArIFwiLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikgKyBcIlwiICsgZXJycHJlZml4KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cblxuICBkaWFsb2cubWF0Y2hlcygnYnVpbGR0YWJsZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBidWlsZHRhYmxlXCIpO1xuICAgICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKS5lbnRpdHk7XG4gICAgICAgIGRlYnVnbG9nKFwiZmFjdE9yQ2F0IGlzXCIgKyBjYXRlZ29yaWVzKTtcbiAgICAgICAgdmFyIGNhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2F0cyA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnlNdWx0T25seUFuZENvbW1hKGNhdGVnb3JpZXMsIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgY2F0c1wiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcmllcyArICdcIignICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghY2F0cyB8fCAoY2F0cy5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRpZCBub3QgZmluZCBhIGNhdGVnb3J5IGluIFwiJyArIGNhdGVnb3JpZXMgKyAnXCInKSk7XG4gICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZXhlYyA9IE1ha2VUYWJsZS5tYWtlVGFibGUoY2F0cywgdGhlTW9kZWwpO1xuICAgICAgICAvLyAgICAgIGNvbnN0IGV4ZWMgPSBFeGVjU2VydmVyLmV4ZWNUb29sKHNlc3Npb24uZGlhbG9nRGF0YS5yZXN1bHQgYXMgSU1hdGNoLklUb29sTWF0Y2gsIHRoZU1vZGVsLnJlY29yZHMpO1xuICAgICAgICB2YXIgcmVwbHkgPSBuZXcgYnVpbGRlci5NZXNzYWdlKHNlc3Npb24pXG4gICAgICAgICAgLnRleHQoZXhlYy50ZXh0KVxuICAgICAgICAgIC5hZGRFbnRpdHkoZXhlYy5hY3Rpb24pO1xuICAgICAgICAvLyAuYWRkQXR0YWNobWVudCh7IGZhbGxiYWNrVGV4dDogXCJJIGRvbid0IGtub3dcIiwgY29udGVudFR5cGU6ICdpbWFnZS9qcGVnJywgY29udGVudFVybDogXCJ3d3cud29tYmF0Lm9yZ1wiIH0pO1xuICAgICAgICBkaWFsb2dsb2coXCJTaG93TWVcIiwgc2Vzc2lvbiwgc2VuZChyZXBseSkpO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnRGVzY3JpYmUnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgZ2V0VGhlTW9kZWwoKS50aGVuKCh0aGVNb2RlbCkgPT4ge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IERlc2NyaWJlXCIpO1xuICAgICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICAgIHZhciBmYWN0RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0ExJyk7XG4gICAgICAgIHZhciBmYWN0T3JDYXQgPSBmYWN0RW50aXR5ICYmIGZhY3RFbnRpdHkuZW50aXR5O1xuICAgICAgICB2YXIgZG9tYWluRW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ0QnKTtcbiAgICAgICAgdmFyIGRvbWFpblMgPSBkb21haW5FbnRpdHkgJiYgZG9tYWluRW50aXR5LmVudGl0eTtcbiAgICAgICAgdmFyIGZpbHRlckRvbWFpbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGRvbWFpblMpIHtcbiAgICAgICAgICBmaWx0ZXJEb21haW4gPSBMaXN0QWxsLmluZmVyRG9tYWluKHRoZU1vZGVsLCBkb21haW5TKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhcImdvdCBkb21haW5cIiArIGZpbHRlckRvbWFpbik7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJEb21haW4pIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgaW5mZXIgYSBkb21haW4gcmVzdHJpY3Rpb24gZnJvbSBcXFwiXCIgKyBkb21haW5TICsgXCJcXFwiLiBTcGVjaWZ5IGFuIGV4aXN0aW5nIGRvbWFpbi4gKExpc3QgYWxsIGRvbWFpbnMpIHRvIGdldCBleGFjdCBuYW1lcy5cXG5cIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnbG9nKFwiZmFjdE9yQ2F0IGlzXCIgKyBmYWN0T3JDYXQpO1xuICAgICAgICBpZiAobWV0YXdvcmRzRGVzY3JpcHRpb25zW2ZhY3RPckNhdC50b0xvd2VyQ2FzZSgpXSkge1xuICAgICAgICAgIC8vIGRvIHdlIGhhdmUgYSBmaWx0ZXIgP1xuICAgICAgICAgIHZhciBwcmVmaXggPSBcIlwiO1xuICAgICAgICAgIGlmIChmaWx0ZXJEb21haW4pIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICdcImluIGRvbWFpbiBcIicgKyBmaWx0ZXJEb21haW4gKyAnXCIgbWFrZSBubyBzZW5zZSB3aGVuIG1hdGNoaW5nIGEgbWV0YXdvcmQuXFxuJztcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVidWdsb2coXCJzaG93aW5nIG1ldGEgcmVzdWx0XCIpO1xuICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQocHJlZml4ICsgJ1wiJyArIGZhY3RPckNhdCArICdcIiBpcyAnICsgbWV0YXdvcmRzRGVzY3JpcHRpb25zW2ZhY3RPckNhdC50b0xvd2VyQ2FzZSgpXSArIFwiXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgaWYgKFdoYXRJcy5zcGxpdEF0Q29tbWFBbmQoZmFjdE9yQ2F0KS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgZGlhbG9nbG9nKFwiRGVzY3JpYmVcIiwgc2Vzc2lvbiwgc2VuZChcIldob2EsIGkgY2FuIG9ubHkgZXhwbGFpbiBvbmUgdGhpbmcgYXQgYSB0aW1lLCBub3QgXFxcIlwiICsgZmFjdE9yQ2F0ICsgXCJcXFwiLiBQbGVhc2UgYXNrIG9uZSBhdCBhIHRpbWUuXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgLy8gZ2V0RG9tYWluc0ZvckNhdGVnb3J5XG4gICAgICAgIH1cblxuXG5cbiAgICAgICAgdmFyIGNhdGVnb3J5ID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeShmYWN0T3JDYXQsIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgLy92YXIgY2F0UmVzdWx0cyA9IFtdO1xuICAgICAgICB2YXIgY2F0UmVzdWx0c1AgPSB1bmRlZmluZWQgYXMgUHJvbWlzZTxzdHJpbmdbXT47XG4gICAgICAgIGlmIChjYXRlZ29yeSkge1xuICAgICAgICAgIC8vVE9ET1xuICAgICAgICAgIGNhdFJlc3VsdHNQID0gRGVzY3JpYmUuZGVzY3JpYmVDYXRlZ29yeShjYXRlZ29yeSwgZmlsdGVyRG9tYWluLCB0aGVNb2RlbCwgbWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0UmVzdWx0c1AgPSAoZ2xvYmFsLlByb21pc2UgYXMgYW55KS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhdFJlc3VsdHNQLnRoZW4oY2F0UmVzdWx0cyA9PiB7XG4gICAgICAgICAgdmFyIHJlc0ZhY3QgPSBEZXNjcmliZS5kZXNjcmliZUZhY3RJbkRvbWFpbihmYWN0T3JDYXQsIGZpbHRlckRvbWFpbiwgdGhlTW9kZWwpLnRoZW4oKHJlc0ZhY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKGNhdFJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgdmFyIHByZWZpeGVkID0gY2F0UmVzdWx0cy5tYXAocmVzID0+XG4gICAgICAgICAgICAgICAgYCR7RGVzY3JpYmUuc2xvcHB5T3JFeGFjdChjYXRlZ29yeSwgZmFjdE9yQ2F0LCB0aGVNb2RlbCl9ICAke3Jlc31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYXRSZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXNGYWN0ID0gcHJlZml4ZWQuam9pbihcIlxcblwiKTsgKyBcIlxcblwiICsgcmVzRmFjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkRlc2NyaWJlXCIsIHNlc3Npb24sIHNlbmQocmVzRmFjdCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8qXG4gICAgICAgICAgICAgIHZhciBhUmVzID0gTW9kZWwuZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcbiAgICAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIGFSZXMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwibXkgY2F0ZWdvcmllcyBpbiBkb21haW4gXFxcIlwiICsgZG9tYWluICsgXCJcXFwiIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJkb21haW5zXCIpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmRvbWFpbnMpLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sIHNlbmQoXCJteSBkb21haW5zIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwidG9vbHNcIikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwudG9vbHMpLm1hcChmdW5jdGlvbiAob1Rvb2wpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9Ub29sLm5hbWU7XG4gICAgICAgICAgICB9KS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbixzZW5kKFwibXkgdG9vbHMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICovXG5cbiAgICAgICAgICAvKlxuICAgICAgICAgIHZhciBjYXRzID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2F0cyA9IFdoYXRJcy5hbmFseXplQ2F0ZWdvcnlNdWx0MihjYXRlZ29yeSwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGNhdHNcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgaWYoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLHNlc3Npb24sc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcnkgKyAnXCIoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFjYXRzIHx8IChjYXRzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICsgJ1wiJykpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgY2F0ID0gXCJcIjtcbiAgICAgICAgICBpZiggY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNhdCA9IGNhdHNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCBjYXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgZGVidWdsb2coJ2NhdGVnb3J5IGlkZW50aWZpZWQ6JyArIGNhdCk7XG4gICAgICAgICAgICBpZiAoYTEgJiYgYTEuZW50aXR5KSB7XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdnb3QgZmlsdGVyOicgKyBhMS5lbnRpdHkpO1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXQgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcnkodGhlTW9kZWwsIGNhdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQxID0gTGlzdEFsbC5saXN0QWxsV2l0aENvbnRleHQoY2F0LCBhMS5lbnRpdHksXG4gICAgICAgICAgICAgICAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICAgICAgLy8gVE9ETyBjbGFzc2lmeWluZyB0aGUgc3RyaW5nIHR3aWNlIGlzIGEgdGVycmlibGUgd2FzdGVcbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQxLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdnb2luZyBmb3IgaGF2aW5nJyk7XG4gICAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeSh0aGVNb2RlbCwgY2F0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0MSA9IExpc3RBbGwubGlzdEFsbEhhdmluZ0NvbnRleHQoY2F0LCBhMS5lbnRpdHksIHRoZU1vZGVsLnJ1bGVzLFxuICAgICAgICAgICAgICAgICAgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXRGdWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdDEpKTtcbiAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzKHJlc3VsdDEpKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXMoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxKTtcbiAgICAgICAgICAgICAgaWYoam9pbnJlc3VsdHMubGVuZ3RoICl7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwiaSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gbm8gZW50aXR5LCBlLmcuIGxpc3QgYWxsIGNvdW50cmllc1xuICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KHRoZU1vZGVsLCBjYXQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IExpc3RBbGwubGlzdEFsbEhhdmluZ0NvbnRleHQoY2F0LCBjYXQsIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJcyhzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgaXMgY2F0PlwiICsgY2F0KTtcbiAgICAgICAgICAgICAgICBpZihjYXQgIT09IFwiZXhhbXBsZSBxdWVzdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0cyhyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSBMaXN0QWxsLmpvaW5SZXN1bHRzKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwidGhlIFwiICsgY2F0ZWdvcnkgKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwiRm91bmQgbm8gZGF0YSBoYXZpbmcgXFxcIlwiICsgY2F0ICsgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG11bHRpcGxlIGNhdGVnb3JpZXNcbiAgICAgICAgICAgIGRlYnVnbG9nKCdjYXRlZ29yaWVzIGlkZW50aWZpZWQ6JyArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgICAgaWYgKGExICYmIGExLmVudGl0eSkge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ290IGZpbHRlcjonICsgYTEuZW50aXR5KTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0ID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3JpZXModGhlTW9kZWwsIGNhdHMsIHRydWUpO1xuICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsc2Vzc2lvbixzZW5kKCdJIGNhbm5vdCBjb21iaW5lIFwiJyArIGNhdGVnb3J5ICsgJygnICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHJlc3VsdDFUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxXaXRoQ29udGV4dChjYXRzLCBhMS5lbnRpdHksXG4gICAgICAgICAgICAgICAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICAgICAgLy8gVE9ETyBjbGFzc2lmeWluZyB0aGUgc3RyaW5nIHR3aWNlIGlzIGEgdGVycmlibGUgd2FzdGVcbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQxVC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZ29pbmcgZm9yIGhhdmluZycpO1xuICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyh0aGVNb2RlbCwgY2F0cywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlc3VsdDFUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxIYXZpbmdDb250ZXh0KGNhdHMsIGExLmVudGl0eSwgdGhlTW9kZWwucnVsZXMsXG4gICAgICAgICAgICAgICAgICB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MVQpKTtcbiAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0MVQpKTtcbiAgICAgICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdDFUKTtcbiAgICAgICAgICAgICAgaWYoam9pbnJlc3VsdHMubGVuZ3RoICl7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgZm9yIFwiICsgYTEuZW50aXR5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwiaSBkaWQgbm90IGZpbmQgYW55IFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gbm8gZW50aXR5LCBlLmcuIGxpc3QgYWxsIGNvdW50cmllc1xuICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0ge30gYXMgeyBba2V5IDogc3RyaW5nXSA6IGJvb2xlYW59O1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKHRoZU1vZGVsLCBjYXRzLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIixzZXNzaW9uLHNlbmQoJ0kgY2Fubm90IGNvbWJpbmUgXCInICsgY2F0ZWdvcnkgKyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciByZXN1bHRUID0gTGlzdEFsbC5saXN0QWxsVHVwZWxIYXZpbmdDb250ZXh0KGNhdHMsIFwiXFxcIlwiICsgY2F0cy5qb2luKFwiXFxcIiBcXFwiXCIpICsgXCJcXFwiXCIsIHRoZU1vZGVsLnJ1bGVzLCB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0VCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHRULmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0VCkpO1xuICAgICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBpcyBjYXQ+XCIgKyBjYXRzLmpvaW4oXCIsIFwiKSk7XG4gICAgICAgICAgICAgICAgaWYoY2F0ICE9PSBcImV4YW1wbGUgcXVlc3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHRUKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdFQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcInRoZSBcIiArIGNhdGVnb3J5ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBcIkZvdW5kIG5vIGRhdGEgaGF2aW5nIFxcXCJcIiArIGNhdCArIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZChyZXNwb25zZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnVHJhaW5NZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgZGVidWdsb2coXCJJbnRlbnQgOiBUcmFpblwiKTtcbiAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJyk7XG4gICAgICBpZiAobWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJrcm9ub3NcIikgPj0gMCB8fCBtZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImtsaW5nb25cIikgPj0gMCkge1xuICAgICAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFUcmFpbk5vS2xpbmdvbikpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHJlcyA9IGdldFJhbmRvbVJlc3VsdChhVHJhaW5SZXBsaWVzKTtcbiAgICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChyZXMpKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdUb29Mb25nJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IFRvb0xvbmdcIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgY2F0ZWdvcnlFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpO1xuICAgICAgZGlhbG9nbG9nKFwiVG9vTG9uZ1wiLCBzZXNzaW9uLCBzZW5kKGdldFJhbmRvbVJlc3VsdChhUmVzcG9uc2VzT25Ub29Mb25nKSkpO1xuICAgIH1cbiAgXSk7XG5cblxuICBkaWFsb2cubWF0Y2hlcygnV3JvbmcnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIC8qXG4gICAgICBkaWFsb2dMb2dnZXIoe1xuICAgICAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgICAgICBpbnRlbnQ6IFwiV3JvbmdcIixcbiAgICAgICAgcmVzcG9uc2U6ICc8YmVnaW4gdXBkb3duPidcbiAgICAgIH0pOyAqL1xuICAgICAgc2Vzc2lvbi5iZWdpbkRpYWxvZygnL3VwZG93bicsIDEpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgIHZhciBhbGFybSA9IHNlc3Npb24uZGlhbG9nRGF0YS5hbGFybTtcbiAgICAgIG5leHQoKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICBzZXNzaW9uLnNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFCYWNrRnJvbVRyYWluaW5nKSk7IC8vICArIEpTT04uc3RyaW5naWZ5KHJlc3VsdHMpKTtcbiAgICAgIC8vc2Vzc2lvbi5zZW5kKCdlbmQgb2Ygd3JvbmcnKTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdFeGl0JywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICBkZWJ1Z2xvZygnZXhpdCA6Jyk7XG4gICAgICBkZWJ1Z2xvZygnZXhpdCcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSk7XG4gICAgICBkaWFsb2dMb2dnZXIoe1xuICAgICAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgICAgICBpbnRlbnQ6IFwiRXhpdFwiLFxuICAgICAgICByZXNwb25zZTogJ3lvdSBhcmUgaW4gYSBsb2dpYyBsb29wJ1xuICAgICAgfSk7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJ5b3UgYXJlIGluIGEgbG9naWMgbG9vcCBcIik7XG4gICAgfVxuICBdKTtcbiAgZGlhbG9nLm1hdGNoZXMoJ0hlbHAnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIGRlYnVnbG9nKCdoZWxwIDonKTtcbiAgICAgIGRlYnVnbG9nKCdoZWxwJyk7XG4gICAgICBzZXNzaW9uLnNlbmQoXCJJIGtub3cgYWJvdXQgLi4uLiA8Y2F0ZWdvcmllcz4+XCIpO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm9uRGVmYXVsdChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgIGxvZ1F1ZXJ5KHNlc3Npb24sIFwib25EZWZhdWx0XCIpO1xuICAgIHZhciBlbGl6YSA9IGdldEVsaXphQm90KGdldENvbnZlcnNhdGlvbklkKHNlc3Npb24pKTtcbiAgICB2YXIgcmVwbHkgPSBlbGl6YS50cmFuc2Zvcm0oc2Vzc2lvbi5tZXNzYWdlLnRleHQpO1xuICAgIGRpYWxvZ2xvZyhcImVsaXphXCIsIHNlc3Npb24sIHNlbmQocmVwbHkpKTtcbiAgICAvL25ldyBFaWx6YWJvdFxuICAgIC8vc2Vzc2lvbi5zZW5kKFwiSSBkbyBub3QgdW5kZXJzdGFuZCB0aGlzIGF0IGFsbFwiKTtcbiAgICAvL2J1aWxkZXIuRGlhbG9nQWN0aW9uLnNlbmQoJ0lcXCdtIHNvcnJ5IEkgZGlkblxcJ3QgdW5kZXJzdGFuZC4gSSBjYW4gb25seSBzaG93IHN0YXJ0IGFuZCByaW5nJyk7XG4gIH0pO1xuXG4gIHJldHVybiBib3Q7XG59XG5cbmlmIChtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYVRyYWluTm9LbGluZ29uOiBhVHJhaW5Ob0tsaW5nb24sXG4gICAgYVRyYWluUmVwbGllczogYVRyYWluUmVwbGllcyxcbiAgICByZXN0cmljdERhdGE6IHJlc3RyaWN0RGF0YSxcbiAgICBpc0Fub255bW91czogaXNBbm9ueW1vdXMsXG4gICAgLy9TaW1wbGVVcERvd25SZWNvZ25pemVyOiBTaW1wbGVVcERvd25SZWNvZ25pemVyLFxuICAgIGFSZXNwb25zZXNPblRvb0xvbmc6IGFSZXNwb25zZXNPblRvb0xvbmcsXG4gICAgbWV0YXdvcmRzRGVzY3JpcHRpb25zOiBtZXRhd29yZHNEZXNjcmlwdGlvbnMsXG4gICAgbWFrZUJvdDogbWFrZUJvdFxuICB9O1xufVxuIl19
