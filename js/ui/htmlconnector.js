/**
 * A helper class to connect the dispatcher to the HTMLConnector
 * maps botbuilder entities to plain strings /JSON objects
 */
'use strict';

/* nonglobal process:true*/

var BotBuilder = require('botbuilder');
var Message = BotBuilder.Message;
var HTMLConnector = (function () {
  function HTMLConnector(options) {
    this.replyCnt = 0;
    this.answerHooks = {};
    this.user = options && options.user || 'user1';
    this.bot = options && options.bot || 'fdevstart';
    //this.conversationID = options && options.conversationid || ('' + Date.now());
  }

  HTMLConnector.prototype.setAnswerHook = function (answerHook, id) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };
  HTMLConnector.prototype.setQuitHook = function (quitHook) {
    this.quitHook = quitHook;
  };
  /*
    this.processMessage(line);
    return this;
  };
  */
  HTMLConnector.prototype.processMessage = function (line, id) {
    if (typeof id === 'string') {
      id = {
        conversationid : id,
        user : id,
      };
    }
    if (this.handler) {
      var msg = new Message()
        .address({
          channelId: 'console',
          user: { id: id.user, name: id.user },
          bot: { id: this.bot, name: this.bot },
          conversation: { id: id.conversationid }
        })
        .timestamp()
        .text(line);
      this.handler([msg.toMessage()]);
    }
    return this;
  };
  HTMLConnector.prototype.onEvent = function (handler) {
    this.handler = handler;
  };
  HTMLConnector.prototype.send = function (messages, done) {
    for (var i = 0; i < messages.length; i++) {
      if (this.replyCnt++ > 0) {
      //  console.log(' reply ');
      }
      var msg = messages[i];
      if (msg.text) {
        var command = undefined;
        if(msg.entities && msg.entities[0] && msg.entities[0]) {
          command = msg.entities[0];
        }
        if (msg.address && msg.address.conversation && msg.address.conversation.id
        && this.answerHooks[msg.address.conversation.id] ) {
          this.answerHooks[msg.address.conversation.id](msg.text, command, msg.address.conversation.id );
        } else {
          this.answerHook(msg.text, command, this.conversationID);
        }
        //log(msg.text);
      }
      /*
      if (msg.attachments && msg.attachments.length > 0) {
        for (var k = 0; i < msg.attachments.length; i++) {
          if (k > 0) {
            //console.log();
          }
          //renderAttachment(msg.attachments[k]);
        }
      }*/
    }
    done(null);
  };
  HTMLConnector.prototype.startConversation = function (address, cb) {
    var adr = Object.assign({}, address); // utils.clone(address)
    adr.conversation = { id: 'Convo1' };
    cb(null, adr);
  };
  return HTMLConnector;
} ());

exports.HTMLConnector = HTMLConnector;


/*
function renderAttachment(a) {
  switch (a.contentType) {
  case 'application/vnd.microsoft.card.hero':
  case 'application/vnd.microsoft.card.thumbnail': {
    var tc = a.content;
    if (tc.title) {
      if (tc.title.length <= 40) {
        line('=', 60, tc.title);
      } else {
        line('=', 60);
        wrap(tc.title, 60, 3);
      }
    }
    if (tc.subtitle) {
      wrap(tc.subtitle, 60, 3);
    }
    if (tc.text) {
      wrap(tc.text, 60, 3);
    }
    renderImages(tc.images);
    renderButtons(tc.buttons);
    break;
  }
  case 'application/vnd.microsoft.card.signin':
  case 'application/vnd.microsoft.card.receipt':
  default:
    line('.', 60, a.contentType);
    if (a.contentUrl) {
      wrap(a.contentUrl, 60, 3);
    } else {
      log(JSON.stringify(a.content));
    }
    break;
  }
}
function renderImages(images) {
  if (images && images.length) {
    line('.', 60, 'images');
    var bullet = images.length > 1 ? '* ' : '';
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.alt) {
        wrap(bullet + img.alt + ': ' + img.url, 60, 3);
      } else {
        wrap(bullet + img.url, 60, 3);
      }
    }
  }
}
function renderButtons(actions) {
  if (actions && actions.length) {
    line('.', 60, 'buttons');
    var bullet = actions.length > 1 ? '* ' : '';
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      if (a.title === a.value) {
        wrap(bullet + a.title, 60, 3);
      } else {
        wrap(bullet + a.title + ' [' + a.value + ']', 60, 3);
      }
    }
  }
}
function line(char, length, title) {
  if (title) {
    var txt = repeat(char, 2);
    txt += '[' + title + ']';
    if (length > txt.length) {
      txt += repeat(char, length - txt.length);
    }
    log(txt);
  } else {
    log(repeat(char, length));
  }
}
function wrap(text, length, indent) {
  if (indent === void 0) { indent = 0; }
  var buffer = '';
  var pad = indent ? repeat(' ', indent) : '';
  var tokens = text.split(' ');
  length -= pad.length;
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if (buffer.length) {
      if ((buffer.length + 1 + t.length) > length) {
        log(pad + buffer);
        buffer = t;
      } else {
        buffer += ' ' + t;
      }
    } else if (t.length < length) {
      buffer = t;
    } else {
      log(pad + t);
    }
  }
  if (buffer.length) {
    log(pad + buffer);
  }
}
function repeat(char, length) {
  var txt = '';
  for (var i = 0; i < length; i++) {
    txt += char;
  }
  return txt;
}
function log(text) {
  //console.log('XXXXXXXXXXXXXXXXXXX' + text);
}
*/
