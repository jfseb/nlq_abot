"use strict";
/**
 * this emulates the Microsoft BotBuilder SDK V3.
 */
/**
 * @file
 * @module jfseb.nlq_abot.botbuilder
 * @copyright (c) 2016-2109 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleConnector = exports.IntentDialog = exports.UniversalBot = exports.Prompts = exports.Message = exports.EntityRecognizer = void 0;
const debug = require("debugf");
let debuglog = debug('botbuilder');
class EntityRecognizer {
    static findEntity(entities, type) {
        for (let en of entities) {
            if (en.type == type) {
                return en;
            }
        }
        return undefined;
    }
}
exports.EntityRecognizer = EntityRecognizer;
;
class Message {
    constructor(s) {
        this._theMsg = {
            type: "message",
        };
    }
    toMessage() {
        return this._theMsg;
    }
    ;
    address(adr) {
        this._theMsg.address = adr;
        return this;
    }
    text(txt) {
        this._theMsg.text = txt;
        return this;
    }
    timestamp() {
        this._theMsg.timestamp = new Date().toISOString();
        return this;
    }
    addEntity(o) {
        if (!this._theMsg.entities) {
            this._theMsg.entities = [];
        }
        this._theMsg.entities.push(o);
        return this;
    }
}
exports.Message = Message;
class Prompts {
    static text(session, a) {
    }
}
exports.Prompts = Prompts;
class UniversalBot {
    constructor(connector) {
        this._dialogs = new Map();
        this._connector = connector;
        this._connector.onEvent(this._onEvent.bind(this));
        return this;
    }
    // connector calls handler -> 
    // after analysis we whall call _connector.send(messages, done() ) with result in messages .text 
    _onEvent(msgs) {
        // run messages through all dialogs 
        var self = this;
        this._dialogs.forEach((id, key) => {
            msgs.forEach(msg => id._processMessage(msg, self._connector));
        });
    }
    dialog(path, dialog) {
        this._dialogs.set(path, dialog);
    }
}
exports.UniversalBot = UniversalBot;
class IntentDialog {
    constructor(a) {
        this._matches = new Map();
        this._recognizers = a;
    }
    _processMessage(msg, connector) {
        var Bfound = { found: false };
        var session;
        session = {
            message: msg,
            send(response) {
                if (typeof response == "string") {
                    connector.send([{ text: response }], (a) => { });
                }
                else {
                    connector.send([response.toMessage()], (a) => { });
                }
            }
        };
        this._recognizers.recognizers.forEach((ir) => {
            var irc;
            irc = { message: msg };
            ir.recognize(irc, (err, result) => {
                var intent = result.intent;
                if (result.score > 0.1 && intent !== 'None') {
                    debuglog(' intent fits' + intent);
                    this._matches.get(intent).forEach(a => a(session, result, () => { }));
                    Bfound.found = true;
                }
            });
        });
        if (!Bfound.found) {
            this._default(session);
        }
    }
    onBegin(cb) {
    }
    onDefault(cb) {
        this._default = cb;
    }
    matches(intent, sess) {
        this._matches.set(intent, sess);
    }
}
exports.IntentDialog = IntentDialog;
const readline = require("readline");
class ConsoleConnector {
    constructor(options) {
        this.processMessage = function (line, id) {
            if (typeof id === 'string') {
                id = {
                    conversationId: id,
                    user: id,
                };
            }
            if (this.handler) {
                var msg = new Message(null)
                    .address(id)
                    .timestamp()
                    .text(line);
                this.handler([msg.toMessage()]);
            }
            return this;
        };
        this.startConversation = function (address, cb) {
            // TODO invoke this at an appropriate time
            var adr = Object.assign({}, address);
            cb(null, adr);
        };
        options = options || {};
        this.stdin = options.stdin || process.stdin;
        this.stdout = options.stdout || process.stdout;
        this.replyCnt = 0;
        this.conversationId = options && options.conversationId || ('' + Date.now());
        return this;
    }
    listen() {
        var self = this;
        var rl = readline.createInterface(this.stdin, this.stdout); // output: this.stdout } );
        this.answerHook = (txt, cmd, conversationId) => {
            console.log(txt);
            if (cmd) {
                console.log("cmd " + JSON.stringify(cmd));
            }
            rl.prompt();
        };
        // forever .... 
        rl.setPrompt(">");
        rl.prompt();
        rl.on('close', () => { process.exit(-1); });
        rl.on('line', (line) => {
            self.processMessage(line, { conversationId: "conv1", user: "nouser" });
        });
        return this;
    }
    setAnswerHook(answerHook, id) {
        if (id) {
            this.answerHooks[id] = answerHook;
        }
        this.answerHook = answerHook;
    }
    ;
    setQuitHook(quitHook) {
        this.quitHook = quitHook;
    }
    ;
    onEvent(handler) {
        this.handler = handler;
    }
    ;
    send(messages, done) {
        for (var i = 0; i < messages.length; i++) {
            if (this.replyCnt++ > 0) {
                //  console.log(' reply ');
            }
            var msg = messages[i];
            if (msg.text) {
                var command = undefined;
                if (msg.entities && msg.entities[0] && msg.entities[0]) {
                    command = msg.entities[0];
                }
                if (msg.address && msg.address.conversationId
                    && this.answerHooks[msg.address.conversationId]) {
                    this.answerHooks[msg.address.conversationId](msg.text, command, msg.address.conversationId);
                }
                else {
                    this.answerHook(msg.text, command, "singletarget");
                }
            }
        }
        done(null);
    }
    ;
}
exports.ConsoleConnector = ConsoleConnector;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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RUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ3pCLDJCQUEyQjthQUMxQjtZQUNELElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUU7Z0JBQ1osSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDO2dCQUN4QixJQUFHLEdBQUcsQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNyRCxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDM0I7Z0JBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYzt1QkFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFHO29CQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUUsQ0FBQztpQkFDOUY7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztpQkFDcEQ7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7Q0FNSDtBQTdGRCw0Q0E2RkMiLCJmaWxlIjoiYm90L2JvdGJ1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHRoaXMgZW11bGF0ZXMgdGhlIE1pY3Jvc29mdCBCb3RCdWlsZGVyIFNESyBWMy4gXG4gKi9cbi8qKlxuICogQGZpbGVcbiAqIEBtb2R1bGUgamZzZWIubmxxX2Fib3QuYm90YnVpbGRlclxuICogQGNvcHlyaWdodCAoYykgMjAxNi0yMTA5IEdlcmQgRm9yc3RtYW5uXG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgcmVtb3ZlTGlzdGVuZXIsIHNlbmQgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XG5sZXQgZGVidWdsb2cgPSBkZWJ1ZygnYm90YnVpbGRlcicpO1xuXG5pbnRlcmZhY2UgQm90QnVpbGRlciB7XG5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBCb3Qge1xuICBpZCA6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcbiAgc3RhcnRJbmRleCA6IG51bWJlcjtcbiAgZW50aXR5IDogc3RyaW5nO1xuICB0eXBlIDogc3RyaW5nO1xuICBlbmRJbmRleCA6IG51bWJlcjtcbiAgc2NvcmUgOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBFbnRpdHlSZWNvZ25pemVyIHtcbiAgc3RhdGljIGZpbmRFbnRpdHkoZW50aXRpZXM6IElFbnRpdHlbXSwgdHlwZTogc3RyaW5nKSA6IGFueSB7XG4gICAgZm9yKGxldCBlbiBvZiBlbnRpdGllcykge1xuICAgICAgaWYoZW4udHlwZSA9PSB0eXBlICkge1xuICAgICAgICByZXR1cm4gZW47XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlY29nbml6ZUNvbnRleHQge1xuICBtZXNzYWdlIDogSU1lc3NhZ2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUludGVudFJlY29nbml6ZXJSZXN1bHQge1xuICBpbnRlbnQgOiBzdHJpbmc7IFxuICBzY29yZSA6IG51bWJlcjtcbiAgZW50aXRpZXMgOiBJRW50aXR5W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUludGVudFJlY29nbml6ZXIge1xuICByZWNvZ25pemUoY29udGV4dDogSVJlY29nbml6ZUNvbnRleHQsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgcmVzdWx0OiBJSW50ZW50UmVjb2duaXplclJlc3VsdCkgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRkcmVzcyB7XG4gIGNvbnZlcnNhdGlvbklkOiBzdHJpbmc7XG4gIHVzZXIgOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJTWVzc2FnZSB7XG4gIGFkZHJlc3MgOiBBZGRyZXNzO1xuICB0eXBlPzpzdHJpbmc7XG4gIHRleHQgOiBzdHJpbmc7XG4gIHRpbWVzdGFtcCA6IHN0cmluZztcbiAgZW50aXRpZXM/IDogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNzYWdlIHtcbiAgX3RoZU1zZyA6IElNZXNzYWdlO1xuICBjb25zdHJ1Y3RvcihzOiBTZXNzaW9uKSB7IFxuICAgIHRoaXMuX3RoZU1zZyA9IHtcbiAgICAgIHR5cGUgOiBcIm1lc3NhZ2VcIixcbiAgICAgICB9IGFzIElNZXNzYWdlO1xuICB9XG4gIHRvTWVzc2FnZSgpIDogSU1lc3NhZ2Uge1xuICAgIHJldHVybiB0aGlzLl90aGVNc2c7IFxuICB9O1xuICBhZGRyZXNzKGFkcjogQWRkcmVzcykgOiBNZXNzYWdlIHtcbiAgICB0aGlzLl90aGVNc2cuYWRkcmVzcyA9IGFkcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICB0ZXh0KHR4dDpzdHJpbmcpIDogTWVzc2FnZSB7XG4gICAgdGhpcy5fdGhlTXNnLnRleHQgPSB0eHQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgdGltZXN0YW1wKCkgOiBNZXNzYWdlIHtcbiAgICB0aGlzLl90aGVNc2cudGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIGFkZEVudGl0eShvIDogYW55KSA6IE1lc3NhZ2Uge1xuICAgIGlmICggIXRoaXMuX3RoZU1zZy5lbnRpdGllcyApIHtcbiAgICAgIHRoaXMuX3RoZU1zZy5lbnRpdGllcyA9IFtdO1xuICAgIH1cbiAgICB0aGlzLl90aGVNc2cuZW50aXRpZXMucHVzaChvKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG50eXBlIHN0cmluZ09yTWVzc2FnZSA9IHN0cmluZyB8IE1lc3NhZ2U7XG5cbmV4cG9ydCBjbGFzcyBQcm9tcHRzIHtcbiAgc3RhdGljIHRleHQoc2Vzc2lvbjogU2Vzc2lvbiwgYTpzdHJpbmcpIDogdm9pZCB7XG4gIH1cbn1cblxuXG4vLyBhdCB0aGUgZW5kIGludm9rZSBzZW5kKG1lc3NhZ2VzLCBkb25lKSBvbiB0aGUgY29ubmVjdG9yIFxuLy8gXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5kRGlhbG9nQXJnIHtcbiAgcmVzcG9uc2UgOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlckRhdGEge1xuICBjb3VudCA6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uIHtcbiAgbWVzc2FnZSA6IElNZXNzYWdlO1xuICBkaWFsb2dEYXRhIDogYW55O1xuICBzZW5kKGFyZyA6IHN0cmluZ09yTWVzc2FnZSkgOiB2b2lkO1xuICBlbmREaWFsb2dXaXRoUmVzdWx0KCBhcmcgOiBFbmREaWFsb2dBcmcpO1xuICBiZWdpbkRpYWxvZyhtYXRjaDogc3RyaW5nLCBhOiBudW1iZXIpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDb25uZWN0b3Ige1xuICBvbkV2ZW50KCBmbjogKG1zZ3M6IElNZXNzYWdlW10pID0+IHZvaWQgKSA6IHZvaWQ7IFxuICBzZW5kKG1lc3NhZ2VzOiBJTWVzc2FnZVtdLGZuOiAoYTphbnkpID0+IHZvaWQpO1xufVxuXG5leHBvcnQgY2xhc3MgVW5pdmVyc2FsQm90IHtcbiAgX2RpYWxvZ3MgOiBNYXA8c3RyaW5nLEludGVudERpYWxvZz47IFxuICBfY29ubmVjdG9yIDogSUNvbm5lY3RvcjtcblxuICAvLyBjb25uZWN0b3IgY2FsbHMgaGFuZGxlciAtPiBcbiAgLy8gYWZ0ZXIgYW5hbHlzaXMgd2Ugd2hhbGwgY2FsbCBfY29ubmVjdG9yLnNlbmQobWVzc2FnZXMsIGRvbmUoKSApIHdpdGggcmVzdWx0IGluIG1lc3NhZ2VzIC50ZXh0IFxuXG4gIF9vbkV2ZW50KCBtc2dzOiBJTWVzc2FnZVtdICkgOiB2b2lkIHtcbiAgICAvLyBydW4gbWVzc2FnZXMgdGhyb3VnaCBhbGwgZGlhbG9ncyBcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5fZGlhbG9ncy5mb3JFYWNoKCAoaWQ6SW50ZW50RGlhbG9nLCBrZXk6IHN0cmluZykgPT57XG4gICAgICBtc2dzLmZvckVhY2goIG1zZyA9PiBpZC5fcHJvY2Vzc01lc3NhZ2UobXNnLCBzZWxmLl9jb25uZWN0b3IgKSk7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvciggY29ubmVjdG9yOiBJQ29ubmVjdG9yKSB7XG4gICAgdGhpcy5fZGlhbG9ncyA9IG5ldyBNYXA8c3RyaW5nLEludGVudERpYWxvZz4oKTtcbiAgICB0aGlzLl9jb25uZWN0b3IgPSBjb25uZWN0b3I7XG4gICAgdGhpcy5fY29ubmVjdG9yLm9uRXZlbnQodGhpcy5fb25FdmVudC5iaW5kKHRoaXMpKVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGlhbG9nKHBhdGg6IHN0cmluZywgZGlhbG9nIDogSW50ZW50RGlhbG9nKSB7XG4gICAgdGhpcy5fZGlhbG9ncy5zZXQocGF0aCxkaWFsb2cpO1xuICB9XG59XG5cblxuXG50eXBlIENvbnRpbnVlRnVuY3Rpb24gPSAoc2Vzc2lvbjpTZXNzaW9uLCBhcmdzOmFueSwgbmV4dDogKCk9PnZvaWQpID0+IHZvaWRcblxuZXhwb3J0IGNsYXNzIEludGVudERpYWxvZyB7XG5cbiAgX2RlZmF1bHQgOiAoc2Vzc2lvbjpTZXNzaW9uKT0+IHZvaWQ7XG4gIF9tYXRjaGVzIDogTWFwPHN0cmluZywgQ29udGludWVGdW5jdGlvbltdPjtcbiAgX3JlY29nbml6ZXJzIDoge3JlY29nbml6ZXJzIDogSUludGVudFJlY29nbml6ZXJbXX07XG5cbiAgY29uc3RydWN0b3IoIGEgOiB7cmVjb2duaXplcnMgOiBJSW50ZW50UmVjb2duaXplcltdfSkge1xuICAgIHRoaXMuX21hdGNoZXMgPSBuZXcgTWFwPHN0cmluZywgQ29udGludWVGdW5jdGlvbltdPigpO1xuICAgIHRoaXMuX3JlY29nbml6ZXJzID0gYTtcbiAgfVxuXG4gIF9wcm9jZXNzTWVzc2FnZSggbXNnOiBJTWVzc2FnZSwgY29ubmVjdG9yOiBJQ29ubmVjdG9yICkge1xuICAgIHZhciBCZm91bmQgPSB7IGZvdW5kIDogZmFsc2V9OyBcbiAgICB2YXIgc2Vzc2lvbiA6IFNlc3Npb247XG4gICAgc2Vzc2lvbiA9IHtcbiAgICAgIG1lc3NhZ2UgOiBtc2csXG4gICAgICBzZW5kKHJlc3BvbnNlIDogc3RyaW5nT3JNZXNzYWdlKSA6dm9pZCB7XG4gICAgICAgIGlmICggdHlwZW9mIHJlc3BvbnNlID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBjb25uZWN0b3Iuc2VuZCggW3sgdGV4dCA6IHJlc3BvbnNlIH0gYXMgSU1lc3NhZ2VdLCAoYTphbnkpPT57fSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25uZWN0b3Iuc2VuZCggW3Jlc3BvbnNlLnRvTWVzc2FnZSgpXSwgKGE6YW55KT0+e30pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGFzIFNlc3Npb247XG4gICAgdGhpcy5fcmVjb2duaXplcnMucmVjb2duaXplcnMuZm9yRWFjaCggKGlyKSA9PiB7XG4gICAgICB2YXIgaXJjOiBJUmVjb2duaXplQ29udGV4dDtcbiAgICAgIGlyYyA9IHsgbWVzc2FnZTogbXNnIH07XG4gICAgICBpci5yZWNvZ25pemUoIGlyYywgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIHZhciBpbnRlbnQgPSByZXN1bHQuaW50ZW50O1xuICAgICAgICBpZiAoIHJlc3VsdC5zY29yZSA+IDAuMSAmJiBpbnRlbnQgIT09ICdOb25lJykge1xuICAgICAgICAgIGRlYnVnbG9nKCcgaW50ZW50IGZpdHMnICsgaW50ZW50KTtcbiAgICAgICAgICB0aGlzLl9tYXRjaGVzLmdldChpbnRlbnQpLmZvckVhY2goIGEgPT4gYShzZXNzaW9uLHJlc3VsdCwgKCk9Pnt9KSApO1xuICAgICAgICAgIEJmb3VuZC5mb3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmICggIUJmb3VuZC5mb3VuZCkge1xuICAgICAgdGhpcy5fZGVmYXVsdChzZXNzaW9uKTtcbiAgICB9XG4gIH1cblxuICBvbkJlZ2luKCBjYjogKHNlc3Npb246IFNlc3Npb24pID0+IHZvaWQpIDogdm9pZCB7XG4gIH1cblxuICBvbkRlZmF1bHQoIGNiIDogKHNlc3Npb246IFNlc3Npb24pID0+IHZvaWQgKSB7XG4gICAgdGhpcy5fZGVmYXVsdCA9IGNiO1xuICB9XG5cbiAgbWF0Y2hlcyggaW50ZW50OiBzdHJpbmcsIHNlc3MgOiBDb250aW51ZUZ1bmN0aW9uW10gKSA6IHZvaWQge1xuICAgIHRoaXMuX21hdGNoZXMuc2V0KGludGVudCwgc2Vzcyk7XG4gIH1cbn1cblxuaW1wb3J0ICogYXMgcmVhZGxpbmUgZnJvbSAncmVhZGxpbmUnO1xuXG5pbXBvcnQgeyBTdHJlYW0gfSBmcm9tICdzdHJlYW0nO1xuXG5leHBvcnQgY2xhc3MgQ29uc29sZUNvbm5lY3RvciB7XG4gIHN0ZGluIDogTm9kZUpTLlJlYWRhYmxlU3RyZWFtO1xuICBzdGRvdXQgOiBOb2RlSlMuV3JpdGFibGVTdHJlYW07XG4gIGFuc3dlckhvb2tzIDogYW55O1xuICBhbnN3ZXJIb29rIDogYW55O1xuICBxdWl0SG9vazogYW55O1xuICByZXBseUNudCA6IG51bWJlcjtcbiAgaGFuZGxlciA6IGFueTtcblxuICBjb252ZXJzYXRpb25JZCA6IHN0cmluZztcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuc3RkaW4gPSBvcHRpb25zLnN0ZGluIHx8IHByb2Nlc3Muc3RkaW47IFxuICAgIHRoaXMuc3Rkb3V0ID0gb3B0aW9ucy5zdGRvdXQgfHwgcHJvY2Vzcy5zdGRvdXQ7XG4gICAgdGhpcy5yZXBseUNudCA9IDA7XG4gICAgdGhpcy5jb252ZXJzYXRpb25JZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb252ZXJzYXRpb25JZCB8fCAoJycgKyBEYXRlLm5vdygpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKCB0aGlzLnN0ZGluLCB0aGlzLnN0ZG91dCk7IC8vIG91dHB1dDogdGhpcy5zdGRvdXQgfSApO1xuICAgIHRoaXMuYW5zd2VySG9vayA9ICh0eHQsY21kLCBjb252ZXJzYXRpb25JZCkgPT4ge1xuICAgICAgY29uc29sZS5sb2codHh0KTsgXG4gICAgICBpZiAoIGNtZCApIHtcbiAgICAgICAgY29uc29sZS5sb2coIFwiY21kIFwiICsgSlNPTi5zdHJpbmdpZnkoY21kKSk7XG4gICAgICB9XG4gICAgICBybC5wcm9tcHQoKTtcbiAgICB9O1xuICAgIC8vIGZvcmV2ZXIgLi4uLiBcbiAgICBybC5zZXRQcm9tcHQoXCI+XCIpO1xuICAgIHJsLnByb21wdCgpO1xuICAgIHJsLm9uKCdjbG9zZScsICgpID0+IHsgcHJvY2Vzcy5leGl0KC0xKTt9IClcbiAgICBybC5vbignbGluZScsIChsaW5lKSA9PiB7XG4gICAgICBzZWxmLnByb2Nlc3NNZXNzYWdlKGxpbmUsIHsgY29udmVyc2F0aW9uSWQgOiBcImNvbnYxXCIsIHVzZXI6XCJub3VzZXJcIiB9KTsgICAgICBcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEFuc3dlckhvb2soYW5zd2VySG9vaywgaWQpIHtcbiAgICBpZiAoaWQpIHtcbiAgICAgIHRoaXMuYW5zd2VySG9va3NbaWRdID0gYW5zd2VySG9vaztcbiAgICB9XG4gICAgdGhpcy5hbnN3ZXJIb29rID0gYW5zd2VySG9vaztcbiAgfTtcbiAgc2V0UXVpdEhvb2socXVpdEhvb2spIHtcbiAgICB0aGlzLnF1aXRIb29rID0gcXVpdEhvb2s7XG4gIH07XG4gIHByb2Nlc3NNZXNzYWdlID0gZnVuY3Rpb24gKGxpbmUsIGlkIDogQWRkcmVzcykge1xuICAgIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZCA9IHtcbiAgICAgICAgY29udmVyc2F0aW9uSWQgOiBpZCxcbiAgICAgICAgdXNlciA6IGlkLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFuZGxlcikge1xuICAgICAgdmFyIG1zZyA9IG5ldyBNZXNzYWdlKG51bGwpXG4gICAgICAgIC5hZGRyZXNzKGlkKVxuICAgICAgICAudGltZXN0YW1wKClcbiAgICAgICAgLnRleHQobGluZSk7XG4gICAgICB0aGlzLmhhbmRsZXIoW21zZy50b01lc3NhZ2UoKV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgb25FdmVudChoYW5kbGVyKSB7XG4gICAgdGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcbiAgfTtcbiAgc2VuZChtZXNzYWdlcyA6IElNZXNzYWdlW10sIGRvbmUpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5yZXBseUNudCsrID4gMCkge1xuICAgICAgLy8gIGNvbnNvbGUubG9nKCcgcmVwbHkgJyk7XG4gICAgICB9XG4gICAgICB2YXIgbXNnID0gbWVzc2FnZXNbaV07XG4gICAgICBpZiAobXNnLnRleHQpIHtcbiAgICAgICAgdmFyIGNvbW1hbmQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmKG1zZy5lbnRpdGllcyAmJiBtc2cuZW50aXRpZXNbMF0gJiYgbXNnLmVudGl0aWVzWzBdKSB7XG4gICAgICAgICAgY29tbWFuZCA9IG1zZy5lbnRpdGllc1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobXNnLmFkZHJlc3MgJiYgbXNnLmFkZHJlc3MuY29udmVyc2F0aW9uSWRcbiAgICAgICAgJiYgdGhpcy5hbnN3ZXJIb29rc1ttc2cuYWRkcmVzcy5jb252ZXJzYXRpb25JZF0gKSB7XG4gICAgICAgICAgdGhpcy5hbnN3ZXJIb29rc1ttc2cuYWRkcmVzcy5jb252ZXJzYXRpb25JZF0obXNnLnRleHQsIGNvbW1hbmQsIG1zZy5hZGRyZXNzLmNvbnZlcnNhdGlvbklkICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5hbnN3ZXJIb29rKG1zZy50ZXh0LCBjb21tYW5kLCBcInNpbmdsZXRhcmdldFwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBkb25lKG51bGwpO1xuICB9O1xuICBzdGFydENvbnZlcnNhdGlvbiA9IGZ1bmN0aW9uIChhZGRyZXNzIDogQWRkcmVzcywgY2IpIHtcbiAgICAvLyBUT0RPIGludm9rZSB0aGlzIGF0IGFuIGFwcHJvcHJpYXRlIHRpbWVcbiAgICB2YXIgYWRyID0gT2JqZWN0LmFzc2lnbih7fSwgYWRkcmVzcyk7IFxuICAgIGNiKG51bGwsIGFkcik7XG4gIH07XG59XG4iXX0=
