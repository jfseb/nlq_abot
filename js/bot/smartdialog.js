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
var dialogLogger = DialogLogger.logger("smartbot", dburl, null);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEVBQUUsV0FBVztRQUN4QixpREFBaUQ7UUFDakQsbUJBQW1CLEVBQUUsMkJBQW1CO1FBQ3hDLHFCQUFxQixFQUFFLDZCQUFxQjtRQUM1QyxPQUFPLEVBQUUsT0FBTztLQUNqQixDQUFDO0NBQ0giLCJmaWxlIjoiYm90L3NtYXJ0ZGlhbG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGUgYm90IGltcGxlbWVudGF0aW9uXG4gKlxuICogSW5zdGFudGlhdGUgY3JlYXRpb24gdmlhIG1ha2VCb3RcbiAqXG4gKi9cbi8qKlxuICogQGZpbGVcbiAqIEBtb2R1bGUgamZzZWIubWdubHFfYWJvdC5zbWFydGRpYWxvZ1xuICogQGNvcHlyaWdodCAoYykgMjAxNi0yMTA5IEdlcmQgRm9yc3RtYW5uXG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgKiBhcyBidWlsZGVyIGZyb20gJy4vYm90YnVpbGRlcic7XG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbmltcG9ydCAqIGFzIFdoYXRJcyBmcm9tICcuLi9tYXRjaC93aGF0aXMnO1xuaW1wb3J0ICogYXMgTGlzdEFsbCBmcm9tICcuLi9tYXRjaC9saXN0YWxsJztcbmltcG9ydCAqIGFzIERlc2NyaWJlIGZyb20gJy4uL21hdGNoL2Rlc2NyaWJlJztcbmltcG9ydCAqIGFzIE1ha2VUYWJsZSBmcm9tICcuLi9leGVjL21ha2VxYmV0YWJsZSc7XG5pbXBvcnQgKiBhcyBNb25nb1F1ZXJpZXMgZnJvbSAnLi4vbWF0Y2gvbW9uZ29xdWVyaWVzJztcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XG5cbmltcG9ydCB7IEVyRXJyb3IgYXMgRXJFcnJvciB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7XG5cbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0ICogYXMgRGlhbG9nTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2RpYWxvZ2xvZ2dlcic7XG5cbmltcG9ydCB7IE1vbmdvUSBhcyBNb25nb1EgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInO1xuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcblxudmFyIGRidXJsID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMIHx8IFwiXCI7XG5cbnZhciBkaWFsb2dMb2dnZXIgPSBEaWFsb2dMb2dnZXIubG9nZ2VyKFwic21hcnRib3RcIiwgZGJ1cmwsIG51bGwpO1xuXG50eXBlIHN0cmluZ09yTWVzc2FnZSA9IHN0cmluZyB8IGJ1aWxkZXIuTWVzc2FnZTtcblxuZnVuY3Rpb24gc2VuZDxUIGV4dGVuZHMgc3RyaW5nT3JNZXNzYWdlPihvOiBUKTogVCB7IHJldHVybiBvOyB9O1xuXG5mdW5jdGlvbiBkaWFsb2dsb2coaW50ZW50OiBzdHJpbmcsIHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgcmVzcG9uc2U6IHN0cmluZ09yTWVzc2FnZSkge1xuICB2YXIgc1Jlc3BvbnNlOiBzdHJpbmc7XG4gIHZhciBzQWN0aW9uOiBzdHJpbmc7XG4gIGlmICh0eXBlb2YgcmVzcG9uc2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICBzQWN0aW9uID0gXCJcIjtcbiAgICBzUmVzcG9uc2UgPSByZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgYU1lc3NhZ2U6IGJ1aWxkZXIuTWVzc2FnZSA9IHJlc3BvbnNlO1xuICAgIHZhciBpTWVzc2FnZTogYnVpbGRlci5JTWVzc2FnZSA9IGFNZXNzYWdlLnRvTWVzc2FnZSgpO1xuICAgIHNSZXNwb25zZSA9IGlNZXNzYWdlLnRleHQ7XG4gICAgc0FjdGlvbiA9IChpTWVzc2FnZS5lbnRpdGllcyAmJiBpTWVzc2FnZS5lbnRpdGllc1swXSkgPyAoSlNPTi5zdHJpbmdpZnkoaU1lc3NhZ2UuZW50aXRpZXMgJiYgaU1lc3NhZ2UuZW50aXRpZXNbMF0pKSA6IFwiXCI7XG4gIH1cbiAgZGlhbG9nTG9nZ2VyKHtcbiAgICBpbnRlbnQ6IGludGVudCxcbiAgICBzZXNzaW9uOiBzZXNzaW9uLFxuICAgIHJlc3BvbnNlOiBzUmVzcG9uc2UsXG4gICAgYWN0aW9uOiBzQWN0aW9uXG4gIH0pO1xuICBzZXNzaW9uLnNlbmQocmVzcG9uc2UpO1xufVxuXG52YXIgZWxpemFib3QgPSByZXF1aXJlKCcuLi9leHRlcm4vZWxpemFib3QvZWxpemFib3QuanMnKTtcbi8vaW1wb3J0ICogYXMgZWxpemFib3QgZnJvbSAnZWxpemFib3QnO1xuXG5sZXQgZGVidWdsb2cgPSBkZWJ1Zygnc21hcnRkaWFsb2cnKTtcbmltcG9ydCAqIGFzIFBsYWluUmVjb2duaXplciBmcm9tICcuL3BsYWlucmVjb2duaXplcic7XG4vL3ZhciBidWlsZGVyID0gcmVxdWlyZSgnYm90YnVpbGRlcicpO1xuXG5mdW5jdGlvbiBnZXRDb252ZXJzYXRpb25JZChzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24pOiBzdHJpbmcge1xuICByZXR1cm4gc2Vzc2lvbi5tZXNzYWdlICYmXG4gICAgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MgJiZcbiAgICBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy5jb252ZXJzYXRpb25JZDtcbn1cblxudmFyIGVsaXphYm90cyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRFbGl6YUJvdChpZDogc3RyaW5nKSB7XG4gIGlmICghZWxpemFib3RzW2lkXSkge1xuICAgIGVsaXphYm90c1tpZF0gPSB7XG4gICAgICBhY2Nlc3M6IG5ldyBEYXRlKCksXG4gICAgICBlbGl6YWJvdDogbmV3IGVsaXphYm90KClcbiAgICB9O1xuICB9XG4gIGVsaXphYm90c1tpZF0uYWNjZXNzID0gbmV3IERhdGUoKTtcbiAgcmV0dXJuIGVsaXphYm90c1tpZF0uZWxpemFib3Q7XG59XG5cbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcbi8vaW1wb3J0ICogYXMgVG9vbHMgZnJvbSAnLi4vbWF0Y2gvdG9vbHMnO1xuXG52YXIgbmV3RmxvdyA9IHRydWU7XG5cbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuXG4vL3ZhciBtb2RlbHMgPSB7fTtcblxuXG5mdW5jdGlvbiBpc0Fub255bW91cyh1c2VyaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdXNlcmlkLmluZGV4T2YoXCJhbm86XCIpID09PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzdHJpY3REYXRhKGFycjogYW55W10pOiBhbnlbXSB7XG4gIGlmIChhcnIubGVuZ3RoIDwgNikge1xuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciByZXMgPSBhcnIuc2xpY2UoMCwgTWF0aC5taW4oTWF0aC5tYXgoTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gMyksIDcpLCBhcnIubGVuZ3RoKSk7XG4gIGlmICh0eXBlb2YgYXJyWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgdmFyIGRlbHRhID0gbGVuIC0gcmVzLmxlbmd0aDtcbiAgICByZXMucHVzaChcIi4uLiBhbmQgXCIgKyBkZWx0YSArIFwiIG1vcmUgZW50cmllcyBmb3IgcmVnaXN0ZXJlZCB1c2Vyc1wiKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiByZXN0cmljdExvZ2dlZE9uKHNlc3Npb246IGJ1aWxkZXIuU2Vzc2lvbiwgYXJyOiBhbnlbXSk6IGFueVtdIHtcbiAgdmFyIHVzZXJpZCA9IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlciB8fCBcIlwiO1xuICBpZiAocHJvY2Vzcy5lbnYuQUJPVF9FTUFJTF9VU0VSICYmIGlzQW5vbnltb3VzKHVzZXJpZCkpIHtcbiAgICByZXR1cm4gcmVzdHJpY3REYXRhKGFycik7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuY29uc3QgYVRyYWluUmVwbGllcyA9IFtcIlRoYW5rIHlvdSBmb3Igc2hhcmluZyB0aGlzIHN1Z2dlc3Rpb24gd2l0aCB1c1wiLFxuICBcIlRoYW5rIGZvciBmb3IgdGhpcyB2YWx1YWJsZSBpbmZvcm1hdGlvbi5cIixcbiAgXCJUaGFuayBmb3IgZm9yIHRoaXMgaW50ZXJlc3RpbmcgZmFjdCFcIixcbiAgXCJUaGF0cyBhIHBsZXRob3JpYSBvZiBpbmZvcm1hdGlvbi5cIixcbiAgXCJUaGF0J3MgYSBudWdnZXQgb2YgaW5mb3JtYXRpb24uXCIsXG4gIFwiTG92ZWx5LCBJIG1heSBjb25zaWRlciB5b3UgaW5wdXQuXCIsXG4gIFwiV2VsbCBkb25lLCBhbnl0aGluZyBtb3JlIHRvIGxldCBtZSBrbm93P1wiLFxuICBcIkkgZG8gYXBwcmVjaWF0ZSB5b3VyIHRlYWNoaW5nIGFuZCBteSBsZWFybmluZyBleHBlcmllbmNlLCBvciB3YXMgaXQgdGhlIG90aGVyIHdheSByb3VuZD9cIixcbiAgXCJZb3VyIGhlbHBmdWwgaW5wdXQgaGFzIGJlZW4gc3RvcmVkIGluIHNvbWUgZHVzdHkgY29ybmVyIG9mIHRoZSBXb3JsZCB3aWRlIHdlYiFcIixcbiAgXCJUaGFuayB5b3UgZm9yIG15IGxlYXJuaW5nIGV4cGVyaWVuY2UhXCIsXG4gIFwiSSBoYXZlIGluY29ycG9yYXRlZCB5b3VyIHZhbHVhYmxlIHN1Z2dlc3Rpb24gaW4gdGhlIHdpc2RvbSBvZiB0aGUgaW50ZXJuZXRcIlxuXTtcblxudmFyIGFUcmFpbkRpYWxvZyA9IGFUcmFpblJlcGxpZXM7XG5cbnZhciBhVHJhaW5FeGl0SGludCA9IFtcbiAgXCJcXG50eXBlIFxcXCJkb25lXFxcIiB3aGVuIHlvdSBhcmUgZG9uZSB0cmFpbmluZyBtZS5cIixcbiAgXCJcIixcbiAgXCJcIixcbiAgXCJcIixcbiAgXCJcXG5yZW1lbWJlciwgeW91IGFyZSBzdHVjayBoZXJlIGluc3RydWN0aW5nIG1lLCB0eXBlIFxcXCJkb25lXFxcIiB0byByZXR1cm4uXCIsXG4gIFwiXCJdO1xuXG5jb25zdCBhRW50ZXJUcmFpbiA9IFsnU28geW91IHRoaW5rIHRoaXMgaXMgd3Jvbmc/IFlvdSBjYW4gb2ZmZXIgeW91ciBhZHZpc2UgaGVyZS5cXG4gVHlwZSBcImRvbmVcIiBpZiB5b3UgYXJlIGRvbmUgd2l0aCBpbnN0cnVjdGluZyBtZScsXG4gICdGZWVsIGZyZWUgdG8gb2ZmZXIgbWUgeW91ciBiZXR0ZXIgc29sdXRpb24gaGVyZS5cXG5UeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbiAgJ1NvbWUgc2F5IFwiVGhlIHNlY3JldCB0byBoYXBwaW5lc3MgaXMgdG8gbG93ZXIgeW91ciBleHBlY3RhdGlvbnMgdG8gdGhlIHBvaW50IHRoZXkgYXJlIGFscmVhZHkgbWV0LlwiLCBcXG50IGlmIHlvdSBjb3VsZCBoZWxwIG1lIHRvIGJlY29tZSBiZXR0ZXIsIGluc3RydWN0IG1lLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIHRlYWNoaW5nIG1lJyxcbiAgJ0ZlZWwgZnJlZSB0byBvZmZlciBtZSB5b3VyIGJldHRlciBzb2x1dGlvbiBoZXJlLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbiAgJ0ZlZWwgZnJlZSB0byBvZmZlciBtZSB5b3VyIGJldHRlciBzb2x1dGlvbiBoZXJlLlxcbiBUeXBlIFwiZG9uZVwiIGlmIHlvdSBhcmUgZG9uZSB3aXRoIGluc3RydWN0aW5nIG1lJyxcbl07XG5jb25zdCBhQmFja0Zyb21UcmFpbmluZyA9IFtcbiAgJ1B1dWgsIGJhY2sgZnJvbSB0cmFpbmluZyEgTm93IGZvciB0aGUgZWFzeSBwYXJ0IC4uLlxcbiBhc2sgbWUgYSBuZXcgcXVlc3Rpb24uJyxcbiAgJ0xpdmUgYW5kIGRvblxcJ3QgbGVhcm4sIHRoYXRcXCdzIHVzLiBOYWFoLCB3ZVxcJ2xsIHNlZS5cXG5Bc2sgbWUgYW5vdGhlciBxdWVzdGlvbi4nLFxuICAnVGhlIHNlY3JldCB0byBoYXBwaW5lc3MgaXMgdG8gbG93ZXIgeW91ciBleHBlY3RhdGlvbnMgdG8gdGhlIHBvaW50IHRoZXkgYXJlIGFscmVhZHkgbWV0LlxcbiBBc2sgbWUgYSBxdWVzdGlvbi4nLFxuICAnVGhhbmtzIGZvciBoYXZpbmcgdGhpcyBsZWN0dXJlIHNlc3Npb24sIG5vdyBpIGFtIGJhY2sgdG8gb3VyIHVzdWFsIHNlbGYuXFxuIEFzayBtZSBhIHF1ZXN0aW9uLidcbl07XG5cblxuY29uc3QgYVRyYWluTm9LbGluZ29uID0gW1xuICBcIkhlIHdobyBtYXN0ZXJzIHRoZSBkYXJrIGFydHMgb2YgU0FQIG11c3Qgbm90IGR3ZWxsIGluIHRoZSBlYXJ0aGx5IHJlYWxtcyBvZiBTdGFyIFRyZWsuXCIsXG4gIFwiU0FQIGlzIGEgY2xvdWQgY29tcGFueSwgbm90IGEgc3BhY2UgY29tcGFueS5cIixcbiAgXCJUaGUgZGVwdGggb2YgUi8zIGFyZSBkZWVwZXIgdGhhbiBEZWVwIFNwYWNlIDQyLlwiLFxuICBcIk15IGJyYWlucG93ZXIgaXMgZnVsbHkgYWJzb3JiZWQgd2l0aCBtYXN0ZXJpbmcgb3RoZXIgcmVhbG1zLlwiLFxuICBcIkZvciB0aGUgd29zYXAsIHRoZSBza3kgaXMgdGhlIGxpbWl0LiBGZWVsIGZyZWUgdG8gY2hlY2sgb3V0IG5hc2EuZ292IC5cIixcbiAgXCJUaGUgZnV0dXJlIGlzIFNBUCBvciBJQk0gYmx1ZSwgbm90IHNwYWNlIGJsYWNrLlwiLFxuICBcIlRoYXQncyBsZWZ0IHRvIHNvbWUgbXVya3kgZnV0dXJlLlwiXG5dXG5cbmV4cG9ydCBjb25zdCBhUmVzcG9uc2VzT25Ub29Mb25nID0gW1xuICBcIllvdXIgaW5wdXQgc2hvdWxkIGJlIGVsb3F1ZW50IGluIGl0J3MgYnJldml0eS4gVGhpcyBvbmUgd2FzIHRvbyBsb25nLlwiLFxuICBcIm15IHdpc2RvbSBpcyBzZXZlcmx5IGJvdW5kIGJ5IG15IGxpbWl0ZWQgaW5wdXQgcHJvY2Vzc2luZyBjYXBhYmlsaXRpZXMuIENvdWxkIHlvdSBmb3JtdWxhdGUgYSBzaG9ydGVyIGlucHV0PyBUaGFuayB5b3UuXCIsXG4gIFwiVGhlIGxlbmd0aCBvZiB5b3UgaW5wdXQgaW5kaWNhdGVzIHlvdSBwcm9iYWJseSBrbm93IG1vcmUgYWJvdXQgdGhlIHRvcGljIHRoYW4gbWU/IENhbiBpIGh1bWJseSBhc2sgeW91IHRvIGZvcm11bGF0ZSBhIHNob3J0ZXIgcXVlc3Rpb24/XCIsXG4gICdcXFwiV2hhdCBldmVyIHlvdSB3YW50IHRvIHRlYWNoLCBiZSBicmllZlxcXCIgKEhvcmFjZSkuIFdoaWxlIHRoaXMgZG9lcyBub3QgYWx3YXlzIGFwcGxpZXMgdG8gbXkgYW5zd2VycywgaXQgaXMgcmVxdWlyZSBmb3IgeW91ciBxdWVzdGlvbnMuIFBsZWFzZSB0cnkgYWdhaW4gd2l0aCBhIHJlZmluZWQgcXVlc3Rpb25zLicsXG4gICdJIHVuZGVyc3RhbmQgbW9yZSB0aGFuIDQtbGV0dGVyIHdvcmRzLCBidXQgbm90IG1vcmUgdGhhbiAyMCB3b3JkIHNlbnRlbmNlcy4gUGxlYXNlIHRyeSB0byBzaG9ydGVuIHlvdXIgaW5wdXQuJyxcbiAgJ3RoZSBza3kgaXMgdGhlIGxpbWl0PyBBaXIgZm9yY2UgbWVtYmVyIG9yIG5vdCwgeW91IGNhbiBhc2sgbG9uZ2VyIHF1ZXN0aW9ucyB0aGFuIFxcXCJ0aGUgc2t5XFxcIiwgYnV0IG5vdCB0aGlzIGxvbmcnLFxuICAnTXkgYW5zd2VycyBtYXkgYmUgZXhoYXVzdGl2ZSwgYnV0IEkgdW5kZXJzdGFuZCBtb3JlIHRoYW4gNC1sZXR0ZXIgd29yZHMsIGJ1dCBub3QgbW9yZSB0aGFuIDIwIHdvcmQgc2VudGVuY2VzLiBTb3JyeS4nLFxuICAnT3VyIGNvbnZlcnNhdGlvbiBtdXN0IGJlIGhpZ2hseSBhc3N5bW1ldHJpYzogbXkgYW5zd2VycyBtYXkgYmUgdmVyYm9zZSBhbmQgZXhoYXVzdGl2ZSBhbmQgZnV6enksIHF1ZXN0aW9ucyBhbmQgaW5wdXQgbXVzdCBiZSBicmllZi4gVHJ5IHRvIHJlZm9ybXVsYXRlIGl0Jyxcbl07XG5cbmV4cG9ydCBjb25zdCBtZXRhd29yZHNEZXNjcmlwdGlvbnMgPSB7XG4gIFwiY2F0ZWdvcnlcIjogXCJhbiBhdHRyaWJ1dGUgb2YgYSByZWNvcmQgaW4gYSBtb2RlbCwgZXhhbXBsZTogYSBQbGFuZXQgaGFzIGEgXFxcIm5hbWVcXFwiIGF0dHJpYnV0ZVwiLFxuICBcImRvbWFpblwiOiBcImEgZ3JvdXAgb2YgZmFjdHMgd2hpY2ggYXJlIHR5cGljYWxseSB1bnJlbGF0ZWRcIixcbiAgXCJrZXlcIjogXCJhbiBhdHRyaWJ1dGUgdmFsdWUgKG9mIGEgY2F0ZWdvcnkpIHdoaWNoICBpcyB1bmlxdWUgZm9yIHRoZSByZWNvcmRcIixcbiAgXCJ0b29sXCI6IFwiaXMgcG90ZW50aWFseSBjb21tYW5kIHRvIGV4ZWN1dGVcIixcbiAgXCJyZWNvcmRcIjogXCJhIHNwZWNpZmljIHNldCBvZiBcXFwiZmFjdFxcXCJzIG9mIGEgZG9tYWluLCBhIFxcXCJyZWNvcmRcXFwiIGhhcyBhIHNldCBvZiBhdHRyaWJ1dGVzIHZhbHVlcyAoXFxcImZhY3RcXFwicykgb2YgdGhlIGNhdGVnb3JpZXMsIG9mdGVuIGEgcmVjb3JkIGhhcyBhIFxcXCJrZXlcXFwiXCIsXG4gIFwiZmFjdFwiOiBcImEgc3BlY2lmaWMgY2F0ZWdvcnkgdmFsdWUgb2YgYSByZWNvcmQgaW4gYSBkb21haW4sIG1heSBiZSBhIFxcXCJrZXlcXFwiIHZhbHVlXCIsXG59O1xuXG5mdW5jdGlvbiBnZXRSYW5kb21SZXN1bHQoYXJyOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCkgJSBhcnIubGVuZ3RoXTtcbn1cblxuLypcbmV4cG9ydCBjbGFzcyBTaW1wbGVVcERvd25SZWNvZ25pemVyIGltcGxlbWVudHMgYnVpbGRlci5JSW50ZW50UmVjb2duaXplciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gIH1cblxuICByZWNvZ25pemUoY29udGV4dDogYnVpbGRlci5JUmVjb2duaXplQ29udGV4dCwgY2FsbGJhY2s6IChlcnI6IEVycm9yLCByZXN1bHQ6IGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXJSZXN1bHQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB2YXIgdSA9IHt9IGFzIGJ1aWxkZXIuSUludGVudFJlY29nbml6ZXJSZXN1bHQ7XG5cbiAgICBkZWJ1Z2xvZyhcInJlY29nbml6aW5nIFwiICsgY29udGV4dC5tZXNzYWdlLnRleHQpO1xuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwiZG93blwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LmRvd25cIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJzdGFydCBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcInVwXCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb250ZXh0Lm1lc3NhZ2UudGV4dC5pbmRleE9mKFwiZG9uZVwiKSA+PSAwKSB7XG4gICAgICB1LmludGVudCA9IFwiaW50ZW50LnVwXCI7XG4gICAgICB1LnNjb3JlID0gMC45O1xuICAgICAgdmFyIGUxID0ge30gYXMgYnVpbGRlci5JRW50aXR5O1xuICAgICAgZTEuc3RhcnRJbmRleCA9IFwidXBcIi5sZW5ndGg7XG4gICAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICAgIGUxLnNjb3JlID0gMC4zO1xuICAgICAgdS5lbnRpdGllcyA9IFtlMV07XG4gICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5tZXNzYWdlLnRleHQuaW5kZXhPZihcImV4aXRcIikgPj0gMCkge1xuICAgICAgdS5pbnRlbnQgPSBcImludGVudC51cFwiO1xuICAgICAgdS5zY29yZSA9IDAuOTtcbiAgICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICAgIGUxLnN0YXJ0SW5kZXggPSBcInVwXCIubGVuZ3RoO1xuICAgICAgZTEuZW5kSW5kZXggPSBjb250ZXh0Lm1lc3NhZ2UudGV4dC5sZW5ndGg7XG4gICAgICBlMS5zY29yZSA9IDAuMztcbiAgICAgIHUuZW50aXRpZXMgPSBbZTFdO1xuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQubWVzc2FnZS50ZXh0LmluZGV4T2YoXCJxdWl0XCIpID49IDApIHtcbiAgICAgIHUuaW50ZW50ID0gXCJpbnRlbnQudXBcIjtcbiAgICAgIHUuc2NvcmUgPSAwLjk7XG4gICAgICB2YXIgZTEgPSB7fSBhcyBidWlsZGVyLklFbnRpdHk7XG4gICAgICBlMS5zdGFydEluZGV4ID0gXCJ1cFwiLmxlbmd0aDtcbiAgICAgIGUxLmVuZEluZGV4ID0gY29udGV4dC5tZXNzYWdlLnRleHQubGVuZ3RoO1xuICAgICAgZTEuc2NvcmUgPSAwLjM7XG4gICAgICB1LmVudGl0aWVzID0gW2UxXTtcbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgdSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYnVnbG9nKCdyZWNvZ25pemluZyBub3RoaW5nJyk7XG4gICAgdS5pbnRlbnQgPSBcIk5vbmVcIjtcbiAgICB1LnNjb3JlID0gMC4xO1xuICAgIHZhciBlMSA9IHt9IGFzIGJ1aWxkZXIuSUVudGl0eTtcbiAgICBlMS5zdGFydEluZGV4ID0gXCJleGl0IFwiLmxlbmd0aDtcbiAgICBlMS5lbmRJbmRleCA9IGNvbnRleHQubWVzc2FnZS50ZXh0Lmxlbmd0aDtcbiAgICBlMS5zY29yZSA9IDAuMTtcbiAgICB1LmVudGl0aWVzID0gW107XG4gICAgY2FsbGJhY2sodW5kZWZpbmVkLCB1KTtcbiAgfVxufVxuKi9cblxuY29uc3QgQW55T2JqZWN0ID0gT2JqZWN0IGFzIGFueTtcblxudmFyIGJvdDtcblxudmFyIG9KU09OID0gSlNPTi5wYXJzZSgnJyArIGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyAnLy4uLy4uL3Jlc291cmNlcy9tb2RlbC9pbnRlbnRzLmpzb24nKSk7XG52YXIgb1J1bGVzID0gUGxhaW5SZWNvZ25pemVyLnBhcnNlUnVsZXMob0pTT04pO1xuLy8gdmFyIFJlY29nbml6ZXIgPSBuZXcgKHJlY29nbml6ZXIuUmVnRXhwUmVjb2duaXplcikob1J1bGVzKTtcblxuXG5mdW5jdGlvbiBsb2dRdWVyeShzZXNzaW9uOiBidWlsZGVyLlNlc3Npb24sIGludGVudDogc3RyaW5nLCByZXN1bHQ/OiBBcnJheTxhbnk+KSB7XG5cbiAgZnMuYXBwZW5kRmlsZSgnLi9sb2dzL3Nob3dtZXF1ZXJpZXMudHh0JywgXCJcXG5cIiArIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0ZXh0OiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICB0aW1lc3RhbXA6IHNlc3Npb24ubWVzc2FnZS50aW1lc3RhbXAsXG4gICAgaW50ZW50OiBpbnRlbnQsXG4gICAgcmVzOiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBKU09OLnN0cmluZ2lmeShyZXN1bHRbMF0pIHx8IFwiMFwiLFxuICAgIGNvbnZlcnNhdGlvbklkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLmNvbnZlcnNhdGlvbklkIHx8IFwiXCIsXG4gICAgdXNlcmlkOiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzc1xuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXIgfHwgXCJcIlxuICB9KSAsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBkZWJ1Z2xvZyhcImxvZ2dpbmcgZmFpbGVkIFwiICsgZXJyKTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbjogYnVpbGRlci5TZXNzaW9uLCBpbnRlbnQ6IHN0cmluZywgcmVzdWx0PzogQXJyYXk8SU1hdGNoLklXaGF0SXNUdXBlbEFuc3dlcj4pIHtcblxuICBmcy5hcHBlbmRGaWxlKCcuL2xvZ3Mvc2hvd21lcXVlcmllcy50eHQnLCBcIlxcblwiICsgSlNPTi5zdHJpbmdpZnkoe1xuICAgIHRleHQ6IHNlc3Npb24ubWVzc2FnZS50ZXh0LFxuICAgIHRpbWVzdGFtcDogc2Vzc2lvbi5tZXNzYWdlLnRpbWVzdGFtcCxcbiAgICBpbnRlbnQ6IGludGVudCxcbiAgICByZXM6IHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoICYmIFdoYXRJcy5kdW1wTmljZVR1cGVsKHJlc3VsdFswXSkgfHwgXCIwXCIsXG4gICAgY29udmVyc2F0aW9uSWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MuY29udmVyc2F0aW9uSWRcbiAgICB8fCBcIlwiLFxuICAgIHVzZXJpZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy51c2VyIHx8IFwiXCJcbiAgfSksIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBkZWJ1Z2xvZyhcImxvZ2dpbmcgZmFpbGVkIFwiICsgZXJyKTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgZ3dvcmRzID0ge307XG4vKipcbiAqIENvbnN0cnVjdCBhIGJvdFxuICogQHBhcmFtIGNvbm5lY3RvciB7Q29ubmVjdG9yfSB0aGUgY29ubmVjdG9yIHRvIHVzZVxuICogSFRNTENvbm5lY3RvclxuICogb3IgY29ubmVjdG9yID0gbmV3IGJ1aWxkZXIuQ29uc29sZUNvbm5lY3RvcigpLmxpc3RlbigpXG4gKi9cbmZ1bmN0aW9uIG1ha2VCb3QoY29ubmVjdG9yLFxuICBtb2RlbFByb3ZpZGVyOiAoKSA9PiBQcm9taXNlPElNYXRjaC5JTW9kZWxzPiwgb3B0aW9ucz86IGFueSk6IGJ1aWxkZXIuVW5pdmVyc2FsQm90IHtcbiAgdmFyIHQwID0gRGF0ZS5ub3coKTtcbiAgdmFyIHRoZU1vZGVsUCA9IG1vZGVsUHJvdmlkZXIoKTtcbiAgdGhlTW9kZWxQLnRoZW4oXG4gICAgKHRoZU1vZGVsKSA9PiB7XG4gICAgICB2YXIgdCA9IChEYXRlLm5vdygpIC0gdDApLzEwMDA7XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNob3dNb2RlbExvYWRUaW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBtb2RlbCBsb2FkIHRpbWUgJHsodCl9c2ApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIGZ1bmN0aW9uIGdldFRoZU1vZGVsKCk6IFByb21pc2U8SU1hdGNoLklNb2RlbHM+IHtcbiAgICByZXR1cm4gdGhlTW9kZWxQO1xuICB9XG5cbiAgYm90ID0gbmV3IGJ1aWxkZXIuVW5pdmVyc2FsQm90KGNvbm5lY3Rvcik7XG4gIHZhciByZWNvZ25pemVyID0gbmV3IFBsYWluUmVjb2duaXplci5SZWdFeHBSZWNvZ25pemVyKG9SdWxlcyk7XG4gIHZhciBkaWFsb2cgPSBuZXcgYnVpbGRlci5JbnRlbnREaWFsb2coeyByZWNvZ25pemVyczogW3JlY29nbml6ZXJdIH0pO1xuICAvLyB2YXIgZGlhbG9nVXBEb3duID0gbmV3IGJ1aWxkZXIuSW50ZW50RGlhbG9nKHsgcmVjb2duaXplcnM6IFtuZXcgU2ltcGxlVXBEb3duUmVjb2duaXplcigpXSB9KTtcblxuICAvKlxuICBib3QuZGlhbG9nKCcvdXBkb3duJywgZGlhbG9nVXBEb3duKTtcbiAgZGlhbG9nVXBEb3duLm9uQmVnaW4oZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICBkaWFsb2dsb2coXCJUcmFpbk1lXCIsIHNlc3Npb24sIHNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFFbnRlclRyYWluKSkpO1xuICAgIC8vc2Vzc2lvbi5zZW5kKFwiSGkgdGhlcmUsIHVwZG93biBpcyB3YWl0aW5nIGZvciB5b3VcIik7XG4gIH0pXG5cbiAgZGlhbG9nVXBEb3duLm1hdGNoZXMoJ2ludGVudC51cCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IGFyZ3MgfHwge307XG4gICAgICBidWlsZGVyLlByb21wdHMudGV4dChzZXNzaW9uLCAneW91IHdhbnQgdG8gZXhpdCB0cmFpbmluZz8gdHlwZSBcXFwiZG9uZVxcXCIgYWdhaW4uJyk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IHJlc3VsdHMucmVwb25zZTtcbiAgICAgIG5leHQoKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCByZXN1bHRzKSB7XG4gICAgICBzZXNzaW9uLmVuZERpYWxvZ1dpdGhSZXN1bHQoeyByZXNwb25zZTogc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyB9KTtcbiAgICB9XG4gIF1cbiAgKTtcblxuICBkaWFsb2dVcERvd24ubWF0Y2hlcygnaW50ZW50LmRvd24nLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHNlc3Npb24uZGlhbG9nRGF0YS5hYmMgPSBhcmdzIHx8IHt9O1xuICAgICAgYnVpbGRlci5Qcm9tcHRzLnRleHQoc2Vzc2lvbiwgJ3lvdSB3YW50IHRvIGdvIGRvd24hJyk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IC0xOyAvLyByZXN1bHRzLnJlcG9uc2U7XG4gICAgICBuZXh0KCk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgc2Vzc2lvbi5zZW5kKFwic3RpbGwgZ29pbmcgZG93bj9cIik7XG4gICAgfVxuICBdXG4gICk7XG4gIGRpYWxvZ1VwRG93bi5vbkRlZmF1bHQoZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICBsb2dRdWVyeShzZXNzaW9uLCBcIm9uRGVmYXVsdFwiKTtcbiAgICB2YXIgcmVzID0gZ2V0UmFuZG9tUmVzdWx0KGFUcmFpbkRpYWxvZykgKyBnZXRSYW5kb21SZXN1bHQoYVRyYWluRXhpdEhpbnQpO1xuICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChyZXMpKTtcbiAgfSk7XG4gICovXG5cbiAgLypcbiAgICBib3QuZGlhbG9nKCcvdHJhaW4nLCBbXG4gICAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgICBzZXNzaW9uLmRpYWxnb0RhdGEuYWJjID0gYXJncyB8fCB7fTtcbiAgICAgICAgYnVpbGRlci5Qcm9tcHRzLnRleHQoc2Vzc2lvbiwgJ0RvIHlvdSB3YW50IHRvIHRyYWluIG1lJyk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMsIG5leHQpIHtcbiAgICAgICAgc2Vzc2lvbi5kaWFsb2dEYXRhLmFiYyA9IHJlc3VsdHMucmVwb25zZTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cykge1xuICAgICAgICBzZXNzaW9uLmVuZERpYWxvZ1dpdGhSZXN1bHQoeyByZXNwb25zZTogc2Vzc2lvbi5EaWFsb2dEYXRhLmFiYyB9KTtcbiAgICAgIH1cbiAgICBdKTtcbiAgKi9cblxuICBib3QuZGlhbG9nKCcvJywgZGlhbG9nKTtcblxuICBkaWFsb2cubWF0Y2hlcygnU2hvd01lJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIFNob3dNZSBpcyBhIHNwZWNpYWwgZm9ybSBvZiBXaGF0SXMgd2hpY2ggYWxzbyBzZWxlY3RzIHRoZVxuICAgICAgLy8gXCJjbG9zZXN0IF91cmxcIiByYW5rZWQgYnkgX3ByZWZlcnJlZFVybE9yZGVyXG4gICAgICAvLyBpZiBwcmVzZW50LCB0aGUgX3VybCBpcyBwdXQgaW50byBleGVjLmFjdGlvblxuICAgICAgLy9cbiAgICAgIC8vLyBUT0RPIFJFTU9ERUxcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGRlYnVnbG9nKFwiU2hvdyBFbnRpdHlcIik7XG4gICAgICBkZWJ1Z2xvZygncmF3OiAnICsgSlNPTi5zdHJpbmdpZnkoYXJncy5lbnRpdGllcyksIHVuZGVmaW5lZCwgMik7XG4gICAgICB2YXIgYTEgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnQTEnKTtcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcbiAgICAgICAgTGlzdEFsbC5saXN0QWxsU2hvd01lKGExLmVudGl0eSwgdGhlTW9kZWwpLnRoZW4oXG4gICAgICAgICAgcmVzdWx0U2hvd01lID0+IHtcbiAgICAgICAgICAgIGxvZ1F1ZXJ5KHNlc3Npb24sICdTaG93TWUnLCAocmVzdWx0U2hvd01lIGFzIGFueSkuYmVzdFVSSSk7XG4gICAgICAgICAgICAvLyB0ZXN0LmV4cGVjdCgzKVxuICAgICAgICAgICAgLy8gIHRlc3QuZGVlcEVxdWFsKHJlc3VsdC53ZWlnaHQsIDEyMCwgJ2NvcnJlY3Qgd2VpZ2h0Jyk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdFNob3dNZSB8fCAhKHJlc3VsdFNob3dNZSBhcyBhbnkpLmJlc3RVUkkpIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiU2hvd01lXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgZ2V0IHdoYXQgeW91IHdhbnRcIikpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYmVzdFVSSSA9IChyZXN1bHRTaG93TWUgYXMgYW55KS5iZXN0VVJJO1xuICAgICAgICAgICAgLy8gZGVidWdsb2coJ3Jlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAgICAgZGVidWdsb2coJ2Jlc3QgcmVzdWx0IDogJyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFNob3dNZSB8fCB7fSwgdW5kZWZpbmVkLCAyKSk7XG5cbiAgICAgICAgICAgIC8vIHRleHQgOiBcInN0YXJ0aW5nIHVuaXQgdGVzdCBcXFwiXCIgKyB1bml0dGVzdCArIFwiXFxcIlwiKyAgKHVybD8gICgnIHdpdGggdXJsICcgKyB1cmwgKSA6ICdubyB1cmwgOi0oJyApLFxuICAgICAgICAgICAgLy8gICAgICBhY3Rpb24gOiB7IHVybDogdXJsIH1cblxuICAgICAgICAgICAgdmFyIHJlcGx5ID0gbmV3IGJ1aWxkZXIuTWVzc2FnZShzZXNzaW9uKVxuICAgICAgICAgICAgICAudGV4dChcInN0YXJ0aW5nIHVyaSBcIiArIGJlc3RVUkkpXG4gICAgICAgICAgICAgIC5hZGRFbnRpdHkoeyB1cmw6IGJlc3RVUkkgfSkgLy8gZXhlYy5hY3Rpb24pO1xuICAgICAgICAgICAgLy8gLmFkZEF0dGFjaG1lbnQoeyBmYWxsYmFja1RleHQ6IFwiSSBkb24ndCBrbm93XCIsIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZycsIGNvbnRlbnRVcmw6IFwid3d3LndvbWJhdC5vcmdcIiB9KTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIlNob3dNZVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICBdKTtcblxuICBkaWFsb2cubWF0Y2hlcygnV2hhdElzJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG5cbiAgICAgIC8vIFRPRE8gU1dJVEggVE8gTU9OR09RVUVSSUVTXG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG5cbiAgICAgICAgZGVidWdsb2coXCJXaGF0SXMgRW50aXRpZXNcIik7XG4gICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMsIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3J5Jyk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzam9pbmVkID0gY2F0ZWdvcnlFbnRpdHkuZW50aXR5O1xuICAgICAgICB2YXIgaW5TdGggPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnQTEnKTtcbiAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcmllc2pvaW5lZCwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzOiBcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb25cIiArIGUpO1xuICAgICAgICAgICAgLy8gY3VycmVudGx5IHdlIGRvIG5vdCBleHRyYWN0IGNhdGVnb3JpZXMgY29ycmVjdGx5ICwgdGh1cyB3ZSByYXRoZXIgaWdub3JlIGFuZCBnbyBvblxuICAgICAgICAgICAgLy9qdXN0IGdvIG9uICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgK1xuICAgICAgICAgICAgLy8gICAgIChlID8gJygnICsgZS50b1N0cmluZygpICsgJyknIDogXCJcIikpKTtcbiAgICAgICAgICAgIC8vICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgLy8gICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhlTW9kZWwucnVsZXMud29yZE1hcFsnY28tZmlvJ10pKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gY2F0ZWdvcmllc2pvaW5lZDtcbiAgICAgICAgdmFyIGluU29tZXRoaW5nID0gaW5TdGggJiYgaW5TdGguZW50aXR5IHx8IFwiXCI7XG4gICAgICAgIGlmIChpblN0aCkge1xuICAgICAgICAgIHF1ZXJ5ID0gY2F0ZWdvcmllc2pvaW5lZCArICcgd2l0aCAnICsgaW5TdGguZW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIE1vbmdvUXVlcmllcy5saXN0QWxsKHF1ZXJ5LCB0aGVNb2RlbCkudGhlbihyZXN1bHRXSSA9PiB7XG4gICAgICAgICAgZGVidWdsb2coKCkgPT4gJ2dvdCByZXN1bHQnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKVxuXG4gICAgICAgICAgdmFyIGVycl9leHBsYWluID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHRXSSk7XG4gICAgICAgICAgaWYgKGVycl9leHBsYWluKSB7XG4gICAgICAgICAgICAvL2RpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ICsgXCIgKFwiICsgY2F0ZWdvcnkgKyAnKVxcXCIgaW4gcmVsYXRpb24gdG8gXCInICsgYTEuZW50aXR5ICsgYFwiLiR7ZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3JpZXNqb2luZWQgKyBcIlxcXCIgKFwiICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0cykgKyAnKSBpbiByZWxhdGlvbiB0byBcIicgKyBpblN0aC5lbnRpdHkgKyBgXCIuJHtlcnJfZXhwbGFpbn1gKSk7XG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoZXJyX3RleHQpKTtcbiAgICAgICAgICAgIC8vICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdFdJKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFdJKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSkgOiAnLScpO1xuICAgICAgICAgIC8vIGRlYnVnbG9nKCdyZXN1bHQgOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0LCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdiZXN0IHJlc3VsdCA6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRXSVswXS5yZXN1bHRzWzBdIHx8IHt9LCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gICAgICAgICAgLy8gZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZD8gKCd0b3AgOiAnICsgV2hhdElzLmR1bXBXZWlnaHRzVG9wKHJlc3VsdDEudHVwZWxhbnN3ZXJzWzBdLnJlc3VsdFswXSB8fCB7fSwgeyB0b3A6IDMgfSkpOiAnLScpO1xuICAgICAgICAgIC8vIFRPRE8gY2xlYW5zZWQgc2VudGVuY2VcblxuICAgICAgICAgIC8vZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ1RoZSAnICsgY2F0ZWdvcmllc2pvaW5lZCArICcgb2YgJyArIGluU3RoLmVudGl0eSArICcgaXMgJyArXG4gICAgICAgICAgLy9yZXN1bHRXSS50dXBlbGFuc3dlcnNbMF0ucmVzdWx0ICsgXCJcXG5cIikpO1xuXG5cbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0V0kpKSA6ICctJyk7XG4gICAgICAgICAgLy8gVE9ETyBXaHkgb25seSBGSVJTVCE/Pz9cbiAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChbcmVzdWx0V0lbMF1dKSk7XG4gICAgICAgICAgbG9nUXVlcnlXaGF0SXNUdXBlbChzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdFdJKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQyID46JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdFdJKSkgOiAnLScpO1xuICAgICAgICAgIGlmIChqb2lucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSBpblNvbWV0aGluZyA/ICcgb2YgJyArIGluU29tZXRoaW5nIDogJyc7XG4gICAgICAgICAgICBpZiAoY2F0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ1RoZSAnICsgY2F0ZWdvcmllc2pvaW5lZCArIHN1ZmZpeCArICcgaXMgJyArXG4gICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgKyBcIlxcblwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIiwgc2Vzc2lvbiwgc2VuZChcIlRoZSBcIiArIGNhdGVnb3JpZXNqb2luZWQgKyBzdWZmaXggKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHRXSSkgfHwgJyc7XG4gICAgICAgICAgICB2YXIgc3VmZml4MiA9IGluU29tZXRoaW5nID8gJyBmb3IgJyArIGluU29tZXRoaW5nIDogJyc7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJpIGRpZCBub3QgZmluZCBhbnkgXCIgKyBjYXRlZ29yaWVzam9pbmVkICsgc3VmZml4MiArIFwiLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikgKyBcIlwiICsgZXJycHJlZml4KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ0xpc3RBbGwnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogTGlzdEFsbFwiKTtcbiAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMsIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcbiAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJyk7XG4gICAgICB2YXIgY2F0ZWdvcnkgPSBjYXRlZ29yeUVudGl0eS5lbnRpdHk7XG4gICAgICB2YXIgaW5TdGhFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnaW5zdGgnKVxuICAgICAgdmFyIGluU29tZXRoaW5nID0gaW5TdGhFbnRpdHkgJiYgaW5TdGhFbnRpdHkuZW50aXR5O1xuICAgICAgLy8gc29tZSBtZXRhcXVlcmllczpcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcmllc1wiKSB7XG4gICAgICAgICAgLy8gZG8gd2UgaGF2ZSBhIGZpbHRlciA/XG4gICAgICAgICAgdmFyIGRvbWFpbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoaW5Tb21ldGhpbmcpIHtcbiAgICAgICAgICAgIGRvbWFpbiA9IExpc3RBbGwuaW5mZXJEb21haW4odGhlTW9kZWwsIGluU29tZXRoaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkb21haW4pIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIHRoZU1vZGVsLmNhdGVnb3J5KS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgIGlmIChpblNvbWV0aGluZykge1xuICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJJIGRpZCBub3QgaW5mZXIgYSBkb21haW4gcmVzdHJpY3Rpb24gZnJvbSBcXFwiXCIgKyBVdGlscy5zdHJpcFF1b3RlcyhpblNvbWV0aGluZykgKyBcIlxcXCIsIGFsbCBteSBjYXRlZ29yaWVzIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKFwibXkgY2F0ZWdvcmllcyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGFSZXMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgYVJlcykuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBjYXRlZ29yaWVzIGluIGRvbWFpbiBcXFwiXCIgKyBkb21haW4gKyBcIlxcXCIgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJkb21haW5zXCIpIHtcbiAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC5kb21haW5zKS5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoXCJteSBkb21haW5zIGFyZSAuLi5cXG5cIiArIHJlcykpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLnJ1bGVzLndvcmRNYXBbJ2NvLWZpbyddKSk7XG4gICAgICAgIHZhciBxdWVyeSA9IGNhdGVnb3J5O1xuICAgICAgICB2YXIgY2F0ZWdvcmllc2pvaW5lZCA9IGNhdGVnb3J5O1xuICAgICAgICBpZiAoaW5Tb21ldGhpbmcpIHtcbiAgICAgICAgICBxdWVyeSA9IGNhdGVnb3J5ICsgJyB3aXRoICcgKyBpblNvbWV0aGluZztcbiAgICAgICAgfVxuICAgICAgICBNb25nb1F1ZXJpZXMubGlzdEFsbChxdWVyeSwgdGhlTW9kZWwpLnRoZW4ocmVzdWx0MSA9PiB7XG4gICAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGVidWdsb2coJ2FuYWx5emluZyBjYXRlZ29yeSBmcm9tICcgKyBjYXRlZ29yeSk7XG4gICAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcnksIHRoZU1vZGVsLnJ1bGVzLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzOiBcIiArIGNhdHMuam9pbihcIixcIikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBleGNlcHRpb246IFwiICsgZSk7XG4gICAgICAgICAgICAgIC8vIEdvIG9uIGZvciBub3dcbiAgICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgICAvLyAgZGlhbG9nbG9nKFwiV2hhdElzXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdGVnb3J5ICtcbiAgICAgICAgICAgICAgLy8gICAgKGUgPyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScgOiBcIlwiKSkpO1xuICAgICAgICAgICAgICAvLyAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgICAvLyAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvL3ZhciByZXN1bHQxID0gTGlzdEFsbC5saXN0QWxsV2l0aENvbnRleHQoY2F0LCBpblNvbWV0aGluZyxcbiAgICAgICAgICAvLyAgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0KTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZyA/ICgnbGlzdGFsbCByZXN1bHQgPjonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MSkpIDogJy0nKTtcbiAgICAgICAgICB2YXIgZXJyX2V4cGxhaW4gPSBMaXN0QWxsLnJldHVybkVycm9yVGV4dElmT25seUVycm9yKHJlc3VsdDEpO1xuICAgICAgICAgIGlmIChlcnJfZXhwbGFpbikge1xuICAgICAgICAgICAgLy9kaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZG9uXFwndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJyArIGNhdCArIFwiIChcIiArIGNhdGVnb3J5ICsgJylcXFwiIGluIHJlbGF0aW9uIHRvIFwiJyArIGExLmVudGl0eSArIGBcIi4ke2V4cGxhaW59YCkpO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IGluU29tZXRoaW5nID8gJ2luIHJlbGF0aW9uIHRvIFwiJyArIGluU29tZXRoaW5nICsgJ1wiJyA6ICcnO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzam9pbmVkICsgXCJcXFwiIChcIiArIFV0aWxzLmxpc3RUb1F1b3RlZENvbW1hQW5kKGNhdHMpICsgJyknICsgc3VmZml4ICsgYC4ke2Vycl9leHBsYWlufWApKTtcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChlcnJfdGV4dCkpO1xuICAgICAgICAgICAgLy8gIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0MSkpO1xuICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHQxKTtcbiAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAoJ2xpc3RhbGwgcmVzdWx0MiA+OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxKSkpO1xuICAgICAgICAgIHZhciBzdWZmaXggPSAoaW5Tb21ldGhpbmcpID8gXCIgZm9yIFwiICsgaW5Tb21ldGhpbmcgOiBcIlwiO1xuICAgICAgICAgIGlmIChqb2lucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcInRoZSBcIiArIGNhdGVnb3J5ICsgc3VmZml4ICsgXCIgYXJlIC4uLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGVycnByZWZpeCA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgZXJycHJlZml4ID0gTGlzdEFsbC5yZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHQxKSB8fCAnJztcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBmaW5kIGFueSBcIiArIGNhdGVnb3J5ICsgc3VmZml4ICsgXCIuXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSArIFwiXCIgKyBlcnJwcmVmaXgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuXG4gIGRpYWxvZy5tYXRjaGVzKCdidWlsZHRhYmxlJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIGdldFRoZU1vZGVsKCkudGhlbigodGhlTW9kZWwpID0+IHtcblxuICAgICAgICB2YXIgbWVzc2FnZSA9IHNlc3Npb24ubWVzc2FnZS50ZXh0O1xuICAgICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IGJ1aWxkdGFibGVcIik7XG4gICAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnY2F0ZWdvcmllcycpLmVudGl0eTtcbiAgICAgICAgZGVidWdsb2coXCJmYWN0T3JDYXQgaXNcIiArIGNhdGVnb3JpZXMpO1xuICAgICAgICB2YXIgY2F0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcmllcywgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBjYXRzXCIgKyBjYXRzLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLCBzZXNzaW9uLCBzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yaWVzICsgJ1wiKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgIC8vIG5leHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjYXRzIHx8IChjYXRzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsIHNlc3Npb24sIHNlbmQoJ0kgZGlkIG5vdCBmaW5kIGEgY2F0ZWdvcnkgaW4gXCInICsgY2F0ZWdvcmllcyArICdcIicpKTtcbiAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBleGVjID0gTWFrZVRhYmxlLm1ha2VUYWJsZShjYXRzLCB0aGVNb2RlbCk7XG4gICAgICAgIC8vICAgICAgY29uc3QgZXhlYyA9IEV4ZWNTZXJ2ZXIuZXhlY1Rvb2woc2Vzc2lvbi5kaWFsb2dEYXRhLnJlc3VsdCBhcyBJTWF0Y2guSVRvb2xNYXRjaCwgdGhlTW9kZWwucmVjb3Jkcyk7XG4gICAgICAgIHZhciByZXBseSA9IG5ldyBidWlsZGVyLk1lc3NhZ2Uoc2Vzc2lvbilcbiAgICAgICAgICAudGV4dChleGVjLnRleHQpXG4gICAgICAgICAgLmFkZEVudGl0eShleGVjLmFjdGlvbik7XG4gICAgICAgIC8vIC5hZGRBdHRhY2htZW50KHsgZmFsbGJhY2tUZXh0OiBcIkkgZG9uJ3Qga25vd1wiLCBjb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnLCBjb250ZW50VXJsOiBcInd3dy53b21iYXQub3JnXCIgfSk7XG4gICAgICAgIGRpYWxvZ2xvZyhcIlNob3dNZVwiLCBzZXNzaW9uLCBzZW5kKHJlcGx5KSk7XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdEZXNjcmliZScsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgdmFyIGlzQ29tYmluZWRJbmRleCA9IHt9O1xuICAgICAgdmFyIG9OZXdFbnRpdHk7XG4gICAgICAvLyBleHBlY3RpbmcgZW50aXR5IEExXG4gICAgICBnZXRUaGVNb2RlbCgpLnRoZW4oKHRoZU1vZGVsKSA9PiB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogRGVzY3JpYmVcIik7XG4gICAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgICAgdmFyIGZhY3RFbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnQTEnKTtcbiAgICAgICAgdmFyIGZhY3RPckNhdCA9IGZhY3RFbnRpdHkgJiYgZmFjdEVudGl0eS5lbnRpdHk7XG4gICAgICAgIHZhciBkb21haW5FbnRpdHkgPSBidWlsZGVyLkVudGl0eVJlY29nbml6ZXIuZmluZEVudGl0eShhcmdzLmVudGl0aWVzLCAnRCcpO1xuICAgICAgICB2YXIgZG9tYWluUyA9IGRvbWFpbkVudGl0eSAmJiBkb21haW5FbnRpdHkuZW50aXR5O1xuICAgICAgICB2YXIgZmlsdGVyRG9tYWluID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZG9tYWluUykge1xuICAgICAgICAgIGZpbHRlckRvbWFpbiA9IExpc3RBbGwuaW5mZXJEb21haW4odGhlTW9kZWwsIGRvbWFpblMpO1xuICAgICAgICAgIGRlYnVnbG9nKFwiZ290IGRvbWFpblwiICsgZmlsdGVyRG9tYWluKTtcbiAgICAgICAgICBpZiAoIWZpbHRlckRvbWFpbikge1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiRGVzY3JpYmVcIiwgc2Vzc2lvbiwgc2VuZChcIkkgZGlkIG5vdCBpbmZlciBhIGRvbWFpbiByZXN0cmljdGlvbiBmcm9tIFxcXCJcIiArIGRvbWFpblMgKyBcIlxcXCIuIFNwZWNpZnkgYW4gZXhpc3RpbmcgZG9tYWluLiAoTGlzdCBhbGwgZG9tYWlucykgdG8gZ2V0IGV4YWN0IG5hbWVzLlxcblwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGVidWdsb2coXCJmYWN0T3JDYXQgaXNcIiArIGZhY3RPckNhdCk7XG4gICAgICAgIGlmIChtZXRhd29yZHNEZXNjcmlwdGlvbnNbZmFjdE9yQ2F0LnRvTG93ZXJDYXNlKCldKSB7XG4gICAgICAgICAgLy8gZG8gd2UgaGF2ZSBhIGZpbHRlciA/XG4gICAgICAgICAgdmFyIHByZWZpeCA9IFwiXCI7XG4gICAgICAgICAgaWYgKGZpbHRlckRvbWFpbikge1xuICAgICAgICAgICAgcHJlZml4ID0gJ1wiaW4gZG9tYWluIFwiJyArIGZpbHRlckRvbWFpbiArICdcIiBtYWtlIG5vIHNlbnNlIHdoZW4gbWF0Y2hpbmcgYSBtZXRhd29yZC5cXG4nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWJ1Z2xvZyhcInNob3dpbmcgbWV0YSByZXN1bHRcIik7XG4gICAgICAgICAgZGlhbG9nbG9nKFwiRGVzY3JpYmVcIiwgc2Vzc2lvbiwgc2VuZChwcmVmaXggKyAnXCInICsgZmFjdE9yQ2F0ICsgJ1wiIGlzICcgKyBtZXRhd29yZHNEZXNjcmlwdGlvbnNbZmFjdE9yQ2F0LnRvTG93ZXJDYXNlKCldICsgXCJcIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBpZiAoV2hhdElzLnNwbGl0QXRDb21tYUFuZChmYWN0T3JDYXQpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBkaWFsb2dsb2coXCJEZXNjcmliZVwiLCBzZXNzaW9uLCBzZW5kKFwiV2hvYSwgaSBjYW4gb25seSBleHBsYWluIG9uZSB0aGluZyBhdCBhIHRpbWUsIG5vdCBcXFwiXCIgKyBmYWN0T3JDYXQgKyBcIlxcXCIuIFBsZWFzZSBhc2sgb25lIGF0IGEgdGltZS5cIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAvLyBnZXREb21haW5zRm9yQ2F0ZWdvcnlcbiAgICAgICAgfVxuXG5cblxuICAgICAgICB2YXIgY2F0ZWdvcnkgPSBXaGF0SXMuYW5hbHl6ZUNhdGVnb3J5KGZhY3RPckNhdCwgdGhlTW9kZWwucnVsZXMsIG1lc3NhZ2UpO1xuICAgICAgICAvL3ZhciBjYXRSZXN1bHRzID0gW107XG4gICAgICAgIHZhciBjYXRSZXN1bHRzUCA9IHVuZGVmaW5lZCBhcyBQcm9taXNlPHN0cmluZ1tdPjtcbiAgICAgICAgaWYgKGNhdGVnb3J5KSB7XG4gICAgICAgICAgLy9UT0RPXG4gICAgICAgICAgY2F0UmVzdWx0c1AgPSBEZXNjcmliZS5kZXNjcmliZUNhdGVnb3J5KGNhdGVnb3J5LCBmaWx0ZXJEb21haW4sIHRoZU1vZGVsLCBtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXRSZXN1bHRzUCA9IChnbG9iYWwuUHJvbWlzZSBhcyBhbnkpLnJlc29sdmUoW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgY2F0UmVzdWx0c1AudGhlbihjYXRSZXN1bHRzID0+IHtcbiAgICAgICAgICB2YXIgcmVzRmFjdCA9IERlc2NyaWJlLmRlc2NyaWJlRmFjdEluRG9tYWluKGZhY3RPckNhdCwgZmlsdGVyRG9tYWluLCB0aGVNb2RlbCkudGhlbigocmVzRmFjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoY2F0UmVzdWx0cykge1xuICAgICAgICAgICAgICB2YXIgcHJlZml4ZWQgPSBjYXRSZXN1bHRzLm1hcChyZXMgPT5cbiAgICAgICAgICAgICAgICBgJHtEZXNjcmliZS5zbG9wcHlPckV4YWN0KGNhdGVnb3J5LCBmYWN0T3JDYXQsIHRoZU1vZGVsKX0gICR7cmVzfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNhdFJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJlc0ZhY3QgPSBwcmVmaXhlZC5qb2luKFwiXFxuXCIpOyArIFwiXFxuXCIgKyByZXNGYWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlhbG9nbG9nKFwiRGVzY3JpYmVcIiwgc2Vzc2lvbiwgc2VuZChyZXNGYWN0KSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLypcbiAgICAgICAgICAgICAgdmFyIGFSZXMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xuICAgICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgYVJlcykuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJteSBjYXRlZ29yaWVzIGluIGRvbWFpbiBcXFwiXCIgKyBkb21haW4gKyBcIlxcXCIgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcImRvbWFpbnNcIikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgdGhlTW9kZWwuZG9tYWlucykuam9pbihcIjtcXG5cIik7XG4gICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbiwgc2VuZChcIm15IGRvbWFpbnMgYXJlIC4uLlxcblwiICsgcmVzKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJ0b29sc1wiKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCB0aGVNb2RlbC50b29scykubWFwKGZ1bmN0aW9uIChvVG9vbCkge1xuICAgICAgICAgICAgICByZXR1cm4gb1Rvb2wubmFtZTtcbiAgICAgICAgICAgIH0pLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLCBzZXNzaW9uLHNlbmQoXCJteSB0b29scyBhcmUgLi4uXFxuXCIgKyByZXMpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgKi9cblxuICAgICAgICAgIC8qXG4gICAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYXRzID0gV2hhdElzLmFuYWx5emVDYXRlZ29yeU11bHQyKGNhdGVnb3J5LCB0aGVNb2RlbC5ydWxlcywgbWVzc2FnZSk7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgY2F0c1wiICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICBpZihlKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAgICAgZGlhbG9nbG9nKFwiV2hhdElzXCIsc2Vzc2lvbixzZW5kKCdJIGRvblxcJ3Qga25vdyBhbnl0aGluZyBhYm91dCBcIicgKyBjYXRlZ29yeSArICdcIignICsgZS50b1N0cmluZygpICsgJyknKSk7XG4gICAgICAgICAgICAgICAgLy8gbmV4dCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWNhdHMgfHwgKGNhdHMubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgZGlhbG9nbG9nKFwiTGlzdEFsbFwiLHNlc3Npb24sc2VuZCgnSSBkb25cXCd0IGtub3cgYW55dGhpbmcgYWJvdXQgXCInICsgY2F0ZWdvcnkgKyAnXCInKSk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBjYXQgPSBcIlwiO1xuICAgICAgICAgIGlmKCBjYXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2F0ID0gY2F0c1swXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoIGNhdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZygnY2F0ZWdvcnkgaWRlbnRpZmllZDonICsgY2F0KTtcbiAgICAgICAgICAgIGlmIChhMSAmJiBhMS5lbnRpdHkpIHtcbiAgICAgICAgICAgICAgZGVidWdsb2coJ2dvdCBmaWx0ZXI6JyArIGExLmVudGl0eSk7XG4gICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeSh0aGVNb2RlbCwgY2F0LCB0cnVlKTtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdDEgPSBMaXN0QWxsLmxpc3RBbGxXaXRoQ29udGV4dChjYXQsIGExLmVudGl0eSxcbiAgICAgICAgICAgICAgICB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXQpO1xuICAgICAgICAgICAgICAvLyBUT0RPIGNsYXNzaWZ5aW5nIHRoZSBzdHJpbmcgdHdpY2UgaXMgYSB0ZXJyaWJsZSB3YXN0ZVxuICAgICAgICAgICAgICBpZiAoIXJlc3VsdDEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2dvaW5nIGZvciBoYXZpbmcnKTtcbiAgICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KHRoZU1vZGVsLCBjYXQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQxID0gTGlzdEFsbC5saXN0QWxsSGF2aW5nQ29udGV4dChjYXQsIGExLmVudGl0eSwgdGhlTW9kZWwucnVsZXMsXG4gICAgICAgICAgICAgICAgICB0aGVNb2RlbC5yZWNvcmRzLCBjYXRlZ29yeVNldEZ1bGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdsaXN0YWxsIHJlc3VsdDonICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0MSkpO1xuICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHMocmVzdWx0MSkpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJcyhzZXNzaW9uLCAnTGlzdEFsbCcsIHJlc3VsdDEpO1xuICAgICAgICAgICAgICBpZihqb2lucmVzdWx0cy5sZW5ndGggKXtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwidGhlIFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJpIGRpZCBub3QgZmluZCBhbnkgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBubyBlbnRpdHksIGUuZy4gbGlzdCBhbGwgY291bnRyaWVzXG4gICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcnkodGhlTW9kZWwsIGNhdCwgZmFsc2UpO1xuICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gTGlzdEFsbC5saXN0QWxsSGF2aW5nQ29udGV4dChjYXQsIGNhdCwgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0RnVsbCk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGlzdGFsbCByZXN1bHQ6JyArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgIHZhciBqb2lucmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiaGVyZSBpcyBjYXQ+XCIgKyBjYXQpO1xuICAgICAgICAgICAgICAgIGlmKGNhdCAhPT0gXCJleGFtcGxlIHF1ZXN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgIGpvaW5yZXN1bHRzID0gcmVzdHJpY3RMb2dnZWRPbihzZXNzaW9uLCBMaXN0QWxsLmpvaW5SZXN1bHRzKHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IExpc3RBbGwuam9pblJlc3VsdHMocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJ0aGUgXCIgKyBjYXRlZ29yeSArIFwiIGFyZSAuLi5cXG5cIiArIGpvaW5yZXN1bHRzLmpvaW4oXCI7XFxuXCIpO1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gXCJGb3VuZCBubyBkYXRhIGhhdmluZyBcXFwiXCIgKyBjYXQgKyBcIlxcXCJcIlxuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQocmVzcG9uc2UpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbXVsdGlwbGUgY2F0ZWdvcmllc1xuICAgICAgICAgICAgZGVidWdsb2coJ2NhdGVnb3JpZXMgaWRlbnRpZmllZDonICsgY2F0cy5qb2luKFwiLFwiKSk7XG4gICAgICAgICAgICBpZiAoYTEgJiYgYTEuZW50aXR5KSB7XG4gICAgICAgICAgICAgIGRlYnVnbG9nKCdnb3QgZmlsdGVyOicgKyBhMS5lbnRpdHkpO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXQgPSBNb2RlbC5nZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyh0aGVNb2RlbCwgY2F0cywgdHJ1ZSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGV4Y2VwdGlvblwiICsgZSk7XG4gICAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJXaGF0SXNcIixzZXNzaW9uLHNlbmQoJ0kgY2Fubm90IGNvbWJpbmUgXCInICsgY2F0ZWdvcnkgKyAnKCcgKyBlLnRvU3RyaW5nKCkgKyAnKScpKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgcmVzdWx0MVQgPSBMaXN0QWxsLmxpc3RBbGxUdXBlbFdpdGhDb250ZXh0KGNhdHMsIGExLmVudGl0eSxcbiAgICAgICAgICAgICAgICB0aGVNb2RlbC5ydWxlcywgdGhlTW9kZWwucmVjb3JkcywgY2F0ZWdvcnlTZXQpO1xuICAgICAgICAgICAgICAvLyBUT0RPIGNsYXNzaWZ5aW5nIHRoZSBzdHJpbmcgdHdpY2UgaXMgYSB0ZXJyaWJsZSB3YXN0ZVxuICAgICAgICAgICAgICBpZiAoIXJlc3VsdDFULmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdnb2luZyBmb3IgaGF2aW5nJyk7XG4gICAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5U2V0RnVsbCA9IE1vZGVsLmdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKHRoZU1vZGVsLCBjYXRzLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0MVQgPSBMaXN0QWxsLmxpc3RBbGxUdXBlbEhhdmluZ0NvbnRleHQoY2F0cywgYTEuZW50aXR5LCB0aGVNb2RlbC5ydWxlcyxcbiAgICAgICAgICAgICAgICAgIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0RnVsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQxVCkpO1xuICAgICAgICAgICAgICB2YXIgam9pbnJlc3VsdHMgPSByZXN0cmljdExvZ2dlZE9uKHNlc3Npb24sIExpc3RBbGwuam9pblJlc3VsdHNUdXBlbChyZXN1bHQxVCkpO1xuICAgICAgICAgICAgICBsb2dRdWVyeVdoYXRJc1R1cGVsKHNlc3Npb24sICdMaXN0QWxsJywgcmVzdWx0MVQpO1xuICAgICAgICAgICAgICBpZihqb2lucmVzdWx0cy5sZW5ndGggKXtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKFwidGhlIFwiICsgY2F0ZWdvcnkgKyBcIiBmb3IgXCIgKyBhMS5lbnRpdHkgKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIkxpc3RBbGxcIixzZXNzaW9uLHNlbmQoXCJpIGRpZCBub3QgZmluZCBhbnkgXCIgKyBjYXRlZ29yeSArIFwiIGZvciBcIiArIGExLmVudGl0eSArIFwiLlxcblwiICsgam9pbnJlc3VsdHMuam9pbihcIjtcXG5cIikpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBubyBlbnRpdHksIGUuZy4gbGlzdCBhbGwgY291bnRyaWVzXG4gICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldEZ1bGwgPSB7fSBhcyB7IFtrZXkgOiBzdHJpbmddIDogYm9vbGVhbn07XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlTZXRGdWxsID0gTW9kZWwuZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3JpZXModGhlTW9kZWwsIGNhdHMsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgZXhjZXB0aW9uXCIgKyBlKTtcbiAgICAgICAgICAgICAgICAgIGRpYWxvZ2xvZyhcIldoYXRJc1wiLHNlc3Npb24sc2VuZCgnSSBjYW5ub3QgY29tYmluZSBcIicgKyBjYXRlZ29yeSArICcoJyArIGUudG9TdHJpbmcoKSArICcpJykpO1xuICAgICAgICAgICAgICAvLyBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHJlc3VsdFQgPSBMaXN0QWxsLmxpc3RBbGxUdXBlbEhhdmluZ0NvbnRleHQoY2F0cywgXCJcXFwiXCIgKyBjYXRzLmpvaW4oXCJcXFwiIFxcXCJcIikgKyBcIlxcXCJcIiwgdGhlTW9kZWwucnVsZXMsIHRoZU1vZGVsLnJlY29yZHMsIGNhdGVnb3J5U2V0RnVsbCk7XG4gICAgICAgICAgICAgIGxvZ1F1ZXJ5V2hhdElzVHVwZWwoc2Vzc2lvbiwgJ0xpc3RBbGwnLCByZXN1bHRUKTtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdFQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coJ2xpc3RhbGwgcmVzdWx0OicgKyBKU09OLnN0cmluZ2lmeShyZXN1bHRUKSk7XG4gICAgICAgICAgICAgICAgdmFyIGpvaW5yZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgZGVidWdsb2coXCJoZXJlIGlzIGNhdD5cIiArIGNhdHMuam9pbihcIiwgXCIpKTtcbiAgICAgICAgICAgICAgICBpZihjYXQgIT09IFwiZXhhbXBsZSBxdWVzdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICBqb2lucmVzdWx0cyA9IHJlc3RyaWN0TG9nZ2VkT24oc2Vzc2lvbiwgTGlzdEFsbC5qb2luUmVzdWx0c1R1cGVsKHJlc3VsdFQpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgam9pbnJlc3VsdHMgPSBMaXN0QWxsLmpvaW5SZXN1bHRzVHVwZWwocmVzdWx0VCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwidGhlIFwiICsgY2F0ZWdvcnkgKyBcIiBhcmUgLi4uXFxuXCIgKyBqb2lucmVzdWx0cy5qb2luKFwiO1xcblwiKTtcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IFwiRm91bmQgbm8gZGF0YSBoYXZpbmcgXFxcIlwiICsgY2F0ICsgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICBkaWFsb2dsb2coXCJMaXN0QWxsXCIsc2Vzc2lvbixzZW5kKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpYWxvZy5tYXRjaGVzKCdUcmFpbk1lJywgW1xuICAgIGZ1bmN0aW9uIChzZXNzaW9uLCBhcmdzLCBuZXh0KSB7XG4gICAgICB2YXIgaXNDb21iaW5lZEluZGV4ID0ge307XG4gICAgICB2YXIgb05ld0VudGl0eTtcbiAgICAgIC8vIGV4cGVjdGluZyBlbnRpdHkgQTFcbiAgICAgIHZhciBtZXNzYWdlID0gc2Vzc2lvbi5tZXNzYWdlLnRleHQ7XG4gICAgICBkZWJ1Z2xvZyhcIkludGVudCA6IFRyYWluXCIpO1xuICAgICAgZGVidWdsb2coJ3JhdzogJyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpLCB1bmRlZmluZWQsIDIpO1xuICAgICAgdmFyIGNhdGVnb3J5RW50aXR5ID0gYnVpbGRlci5FbnRpdHlSZWNvZ25pemVyLmZpbmRFbnRpdHkoYXJncy5lbnRpdGllcywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgIGlmIChtZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImtyb25vc1wiKSA+PSAwIHx8IG1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmRleE9mKFwia2xpbmdvblwiKSA+PSAwKSB7XG4gICAgICAgIGRpYWxvZ2xvZyhcIlRyYWluTWVcIiwgc2Vzc2lvbiwgc2VuZChnZXRSYW5kb21SZXN1bHQoYVRyYWluTm9LbGluZ29uKSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcmVzID0gZ2V0UmFuZG9tUmVzdWx0KGFUcmFpblJlcGxpZXMpO1xuICAgICAgZGlhbG9nbG9nKFwiVHJhaW5NZVwiLCBzZXNzaW9uLCBzZW5kKHJlcykpO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ1Rvb0xvbmcnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIHZhciBpc0NvbWJpbmVkSW5kZXggPSB7fTtcbiAgICAgIHZhciBvTmV3RW50aXR5O1xuICAgICAgLy8gZXhwZWN0aW5nIGVudGl0eSBBMVxuICAgICAgdmFyIG1lc3NhZ2UgPSBzZXNzaW9uLm1lc3NhZ2UudGV4dDtcbiAgICAgIGRlYnVnbG9nKFwiSW50ZW50IDogVG9vTG9uZ1wiKTtcbiAgICAgIGRlYnVnbG9nKCdyYXc6ICcgKyBKU09OLnN0cmluZ2lmeShhcmdzLmVudGl0aWVzKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIHZhciBjYXRlZ29yeUVudGl0eSA9IGJ1aWxkZXIuRW50aXR5UmVjb2duaXplci5maW5kRW50aXR5KGFyZ3MuZW50aXRpZXMsICdjYXRlZ29yaWVzJyk7XG4gICAgICBkaWFsb2dsb2coXCJUb29Mb25nXCIsIHNlc3Npb24sIHNlbmQoZ2V0UmFuZG9tUmVzdWx0KGFSZXNwb25zZXNPblRvb0xvbmcpKSk7XG4gICAgfVxuICBdKTtcblxuXG4gIGRpYWxvZy5tYXRjaGVzKCdXcm9uZycsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgLypcbiAgICAgIGRpYWxvZ0xvZ2dlcih7XG4gICAgICAgIHNlc3Npb246IHNlc3Npb24sXG4gICAgICAgIGludGVudDogXCJXcm9uZ1wiLFxuICAgICAgICByZXNwb25zZTogJzxiZWdpbiB1cGRvd24+J1xuICAgICAgfSk7ICovXG4gICAgICBzZXNzaW9uLmJlZ2luRGlhbG9nKCcvdXBkb3duJywgMSk7XG4gICAgfSxcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgcmVzdWx0cywgbmV4dCkge1xuICAgICAgdmFyIGFsYXJtID0gc2Vzc2lvbi5kaWFsb2dEYXRhLmFsYXJtO1xuICAgICAgbmV4dCgpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIHJlc3VsdHMpIHtcbiAgICAgIHNlc3Npb24uc2VuZChnZXRSYW5kb21SZXN1bHQoYUJhY2tGcm9tVHJhaW5pbmcpKTsgLy8gICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0cykpO1xuICAgICAgLy9zZXNzaW9uLnNlbmQoJ2VuZCBvZiB3cm9uZycpO1xuICAgIH1cbiAgXSk7XG5cbiAgZGlhbG9nLm1hdGNoZXMoJ0V4aXQnLCBbXG4gICAgZnVuY3Rpb24gKHNlc3Npb24sIGFyZ3MsIG5leHQpIHtcbiAgICAgIGRlYnVnbG9nKCdleGl0IDonKTtcbiAgICAgIGRlYnVnbG9nKCdleGl0JyArIEpTT04uc3RyaW5naWZ5KGFyZ3MuZW50aXRpZXMpKTtcbiAgICAgIGRpYWxvZ0xvZ2dlcih7XG4gICAgICAgIHNlc3Npb246IHNlc3Npb24sXG4gICAgICAgIGludGVudDogXCJFeGl0XCIsXG4gICAgICAgIHJlc3BvbnNlOiAneW91IGFyZSBpbiBhIGxvZ2ljIGxvb3AnXG4gICAgICB9KTtcbiAgICAgIHNlc3Npb24uc2VuZChcInlvdSBhcmUgaW4gYSBsb2dpYyBsb29wIFwiKTtcbiAgICB9XG4gIF0pO1xuICBkaWFsb2cubWF0Y2hlcygnSGVscCcsIFtcbiAgICBmdW5jdGlvbiAoc2Vzc2lvbiwgYXJncywgbmV4dCkge1xuICAgICAgZGVidWdsb2coJ2hlbHAgOicpO1xuICAgICAgZGVidWdsb2coJ2hlbHAnKTtcbiAgICAgIHNlc3Npb24uc2VuZChcIkkga25vdyBhYm91dCAuLi4uIDxjYXRlZ29yaWVzPj5cIik7XG4gICAgfVxuICBdKTtcblxuICBkaWFsb2cub25EZWZhdWx0KGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgbG9nUXVlcnkoc2Vzc2lvbiwgXCJvbkRlZmF1bHRcIik7XG4gICAgdmFyIGVsaXphID0gZ2V0RWxpemFCb3QoZ2V0Q29udmVyc2F0aW9uSWQoc2Vzc2lvbikpO1xuICAgIHZhciByZXBseSA9IGVsaXphLnRyYW5zZm9ybShzZXNzaW9uLm1lc3NhZ2UudGV4dCk7XG4gICAgZGlhbG9nbG9nKFwiZWxpemFcIiwgc2Vzc2lvbiwgc2VuZChyZXBseSkpO1xuICAgIC8vbmV3IEVpbHphYm90XG4gICAgLy9zZXNzaW9uLnNlbmQoXCJJIGRvIG5vdCB1bmRlcnN0YW5kIHRoaXMgYXQgYWxsXCIpO1xuICAgIC8vYnVpbGRlci5EaWFsb2dBY3Rpb24uc2VuZCgnSVxcJ20gc29ycnkgSSBkaWRuXFwndCB1bmRlcnN0YW5kLiBJIGNhbiBvbmx5IHNob3cgc3RhcnQgYW5kIHJpbmcnKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGJvdDtcbn1cblxuaWYgKG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhVHJhaW5Ob0tsaW5nb246IGFUcmFpbk5vS2xpbmdvbixcbiAgICBhVHJhaW5SZXBsaWVzOiBhVHJhaW5SZXBsaWVzLFxuICAgIHJlc3RyaWN0RGF0YTogcmVzdHJpY3REYXRhLFxuICAgIGlzQW5vbnltb3VzOiBpc0Fub255bW91cyxcbiAgICAvL1NpbXBsZVVwRG93blJlY29nbml6ZXI6IFNpbXBsZVVwRG93blJlY29nbml6ZXIsXG4gICAgYVJlc3BvbnNlc09uVG9vTG9uZzogYVJlc3BvbnNlc09uVG9vTG9uZyxcbiAgICBtZXRhd29yZHNEZXNjcmlwdGlvbnM6IG1ldGF3b3Jkc0Rlc2NyaXB0aW9ucyxcbiAgICBtYWtlQm90OiBtYWtlQm90XG4gIH07XG59XG4iXX0=
