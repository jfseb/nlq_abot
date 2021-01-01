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

import * as fs from 'fs';

import * as builder from './botbuilder';
import * as debug from 'debug';

import * as WhatIs from '../match/whatis';
import * as ListAll from '../match/listall';
import * as Describe from '../match/describe';
import * as MakeTable from '../exec/makeqbetable';
import * as MongoQueries from '../match/mongoqueries';

import * as Utils from 'abot_utils';

import { ErError as ErError } from '../index_parser';

import * as _ from 'lodash';

import * as DialogLogger from '../utils/dialoglogger';

import { MongoQ as MongoQ } from '../index_parser';
import * as process from 'process';

var dburl = process.env.DATABASE_URL || "";

var pglocalurl = "postgres://joe:abcdef@localhost:5432/abot";
var dburl = process.env.DATABASE_URL || pglocalurl;
import * as pg from 'pg';
var o = pg as any;
if (!(process.env.ABOT_DBNOSSL)) {
  o.defaults.ssl = true; // Only used internally !
}
var dialogLogger = DialogLogger.logger("smartbot", dburl, pg);

type stringOrMessage = string | builder.Message;

function send<T extends stringOrMessage>(o: T): T { return o; };

function dialoglog(intent: string, session: builder.Session, response: stringOrMessage) {
  var sResponse: string;
  var sAction: string;
  if (typeof response === "string") {
    sAction = "";
    sResponse = response;
  } else {
    var aMessage: builder.Message = response;
    var iMessage: builder.IMessage = aMessage.toMessage();
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
import * as PlainRecognizer from './plainrecognizer';
//var builder = require('botbuilder');

function getConversationId(session: builder.Session): string {
  return session.message &&
    session.message.address &&
    session.message.address.conversationId;
}

var elizabots = {};

function getElizaBot(id: string) {
  if (!elizabots[id]) {
    elizabots[id] = {
      access: new Date(),
      elizabot: new elizabot()
    };
  }
  elizabots[id].access = new Date();
  return elizabots[id].elizabot;
}

import * as IMatch from '../match/ifmatch';
//import * as Tools from '../match/tools';

var newFlow = true;

import { Model } from '../model/index_model';

//var models = {};


function isAnonymous(userid: string): boolean {
  return userid.indexOf("ano:") === 0;
}

export function restrictData(arr: any[]): any[] {
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

function restrictLoggedOn(session: builder.Session, arr: any[]): any[] {
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
  ""];

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
]

export const aResponsesOnTooLong = [
  "Your input should be eloquent in it's brevity. This one was too long.",
  "my wisdom is severly bound by my limited input processing capabilities. Could you formulate a shorter input? Thank you.",
  "The length of you input indicates you probably know more about the topic than me? Can i humbly ask you to formulate a shorter question?",
  '\"What ever you want to teach, be brief\" (Horace). While this does not always applies to my answers, it is require for your questions. Please try again with a refined questions.',
  'I understand more than 4-letter words, but not more than 20 word sentences. Please try to shorten your input.',
  'the sky is the limit? Air force member or not, you can ask longer questions than \"the sky\", but not this long',
  'My answers may be exhaustive, but I understand more than 4-letter words, but not more than 20 word sentences. Sorry.',
  'Our conversation must be highly assymmetric: my answers may be verbose and exhaustive and fuzzy, questions and input must be brief. Try to reformulate it',
];

export const metawordsDescriptions = {
  "category": "an attribute of a record in a model, example: a Planet has a \"name\" attribute",
  "domain": "a group of facts which are typically unrelated",
  "key": "an attribute value (of a category) which  is unique for the record",
  "tool": "is potentialy command to execute",
  "record": "a specific set of \"fact\"s of a domain, a \"record\" has a set of attributes values (\"fact\"s) of the categories, often a record has a \"key\"",
  "fact": "a specific category value of a record in a domain, may be a \"key\" value",
};

function getRandomResult(arr: string[]): string {
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

const AnyObject = Object as any;

var bot;

var oJSON = JSON.parse('' + fs.readFileSync(__dirname + '/../../resources/model/intents.json'));
var oRules = PlainRecognizer.parseRules(oJSON);
// var Recognizer = new (recognizer.RegExpRecognizer)(oRules);


function logQuery(session: builder.Session, intent: string, result?: Array<any>) {

  fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
    text: session.message.text,
    timestamp: session.message.timestamp,
    intent: intent,
    res: result && result.length && JSON.stringify(result[0]) || "0",
    conversationId: session.message.address
    && session.message.address.conversationId || "",
    userid: session.message.address
    && session.message.address.user || ""
  }) , function (err) {
    if (err) {
      debuglog("logging failed " + err);
    }
  });
}


function logQueryWhatIsTupel(session: builder.Session, intent: string, result?: Array<IMatch.IWhatIsTupelAnswer>) {

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
function makeBot(connector,
  modelProvider: () => Promise<IMatch.IModels>, options?: any): builder.UniversalBot {
  var t0 = Date.now();
  var theModelP = modelProvider();
  theModelP.then(
    (theModel) => {
      var t = (Date.now() - t0)/1000;
      if (options && options.showModelLoadTime) {
        console.log(`model load time ${(t)}s`);
      }
    });

  function getTheModel(): Promise<IMatch.IModels> {
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
        ListAll.listAllShowMe(a1.entity, theModel).then(
          resultShowMe => {
            logQuery(session, 'ShowMe', (resultShowMe as any).bestURI);
            // test.expect(3)
            //  test.deepEqual(result.weight, 120, 'correct weight');
            if (!resultShowMe || !(resultShowMe as any).bestURI) {
              dialoglog("ShowMe", session, send("I did not get what you want"));
              return;
            }
            var bestURI = (resultShowMe as any).bestURI;
            // debuglog('result : ' + JSON.stringify(result, undefined, 2));
            debuglog('best result : ' + JSON.stringify(resultShowMe || {}, undefined, 2));

            // text : "starting unit test \"" + unittest + "\""+  (url?  (' with url ' + url ) : 'no url :-(' ),
            //      action : { url: url }

            var reply = new builder.Message(session)
              .text("starting uri " + bestURI)
              .addEntity({ url: bestURI }) // exec.action);
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
        } catch (e) {
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
          debuglog(() => 'got result' + JSON.stringify(resultWI))

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
            } else {
              dialoglog("WhatIs", session, send("The " + categoriesjoined + suffix + " are ...\n" + joinresults.join(";\n")));
            }
          } else {
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
      var inSthEntity = builder.EntityRecognizer.findEntity(args.entities, 'insth')
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
            } else {
              dialoglog("ListAll", session, send("my categories are ...\n" + res));
            }
            return;
          } else {
            var aRes = Model.getCategoriesForDomain(theModel, domain);
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
          } catch (e) {
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
          } else {
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
        } catch (e) {
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
        if (metawordsDescriptions[factOrCat.toLowerCase()]) {
          // do we have a filter ?
          var prefix = "";
          if (filterDomain) {
            prefix = '"in domain "' + filterDomain + '" make no sense when matching a metaword.\n';
          }
          debuglog("showing meta result");
          dialoglog("Describe", session, send(prefix + '"' + factOrCat + '" is ' + metawordsDescriptions[factOrCat.toLowerCase()] + ""));
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
        var catResultsP = undefined as Promise<string[]>;
        if (category) {
          //TODO
          catResultsP = Describe.describeCategory(category, filterDomain, theModel, message);
        } else {
          catResultsP = (global.Promise as any).resolve([]);
        }

        catResultsP.then(catResults => {
          var resFact = Describe.describeFactInDomain(factOrCat, filterDomain, theModel).then((resFact) => {

            if (catResults) {
              var prefixed = catResults.map(res =>
                `${Describe.sloppyOrExact(category, factOrCat, theModel)}  ${res}`);
            }
            if (catResults.length) {
              resFact = prefixed.join("\n"); + "\n" + resFact;
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
      dialoglog("TooLong", session, send(getRandomResult(aResponsesOnTooLong)));
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
    aResponsesOnTooLong: aResponsesOnTooLong,
    metawordsDescriptions: metawordsDescriptions,
    makeBot: makeBot
  };
}
