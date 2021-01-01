/**
 * A helper class to connect the dispatcher to the HTMLConnector
 * maps botbuilder entities to plain strings/JSON objects
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLConnector = void 0;
/* nonglobal process:true*/
const BotBuilder = require("../bot/botbuilder");
// var BotBuilder = require('../bot/botbuilder.js');
var Message = BotBuilder.Message;
class HTMLConnector {
    constructor(options) {
        this.onEvent = function (handler) {
            this.handler = handler;
        };
        this.startConversation = function (address, cb) {
            cb(null, address);
        };
        this.replyCnt = 0;
        this.answerHooks = new Map();
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
    processMessage(line, id) {
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
                    this.answerHook(msg.text, command, "noconvid");
                }
            }
        }
        done(null);
    }
    ;
}
exports.HTMLConnector = HTMLConnector;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91aS9odG1sY29ubmVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7R0FHRztBQUNILFlBQVksQ0FBQzs7O0FBRWIsMkJBQTJCO0FBRTNCLGdEQUFnRDtBQUNoRCxvREFBb0Q7QUFDcEQsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQztBQU1qQyxNQUFhLGFBQWE7SUFPeEIsWUFBWSxPQUFPO1FBOEJuQixZQUFPLEdBQUcsVUFBVSxPQUFPO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLENBQUMsQ0FBQztRQXVCRixzQkFBaUIsR0FBRyxVQUFVLE9BQWdCLEVBQUUsRUFBaUM7WUFDL0UsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUM7UUF4REEsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBc0IsQ0FBQztJQUNuRCxDQUFDO0lBQ0QsYUFBYSxDQUFDLFVBQTRELEVBQUUsRUFBVztRQUNyRixJQUFJLEVBQUUsRUFBRTtZQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDO1NBQ25DO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUFBLENBQUM7SUFDRixXQUFXLENBQUMsUUFBUTtRQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUMzQixDQUFDO0lBQUEsQ0FBQztJQUNGLGNBQWMsQ0FBQyxJQUFhLEVBQUcsRUFBWTtRQUN6QyxJQUFJLE9BQU8sRUFBRSxLQUFLLFFBQVEsRUFBRTtZQUMxQixFQUFFLEdBQUc7Z0JBQ0gsY0FBYyxFQUFHLEVBQUU7Z0JBQ25CLElBQUksRUFBRyxFQUFFO2FBQ1YsQ0FBQztTQUNIO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQztpQkFDeEIsT0FBTyxDQUFDLEVBQUUsQ0FBQztpQkFDWCxTQUFTLEVBQUU7aUJBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFBQSxDQUFDO0lBTUYsSUFBSSxDQUFDLFFBQXFCLEVBQUUsSUFBSTtRQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ3pCLDJCQUEyQjthQUMxQjtZQUNELElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUU7Z0JBQ1osSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDO2dCQUN4QixJQUFHLEdBQUcsQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNyRCxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDM0I7Z0JBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYzt1QkFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFHO29CQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUUsQ0FBQztpQkFDOUY7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDaEQ7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7Q0FJSDtBQWpFRCxzQ0FpRUMiLCJmaWxlIjoidWkvaHRtbGNvbm5lY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBoZWxwZXIgY2xhc3MgdG8gY29ubmVjdCB0aGUgZGlzcGF0Y2hlciB0byB0aGUgSFRNTENvbm5lY3RvclxuICogbWFwcyBib3RidWlsZGVyIGVudGl0aWVzIHRvIHBsYWluIHN0cmluZ3MvSlNPTiBvYmplY3RzXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyogbm9uZ2xvYmFsIHByb2Nlc3M6dHJ1ZSovXG5cbmltcG9ydCAqIGFzIEJvdEJ1aWxkZXIgZnJvbSAnLi4vYm90L2JvdGJ1aWxkZXInO1xuLy8gdmFyIEJvdEJ1aWxkZXIgPSByZXF1aXJlKCcuLi9ib3QvYm90YnVpbGRlci5qcycpO1xudmFyIE1lc3NhZ2UgPSBCb3RCdWlsZGVyLk1lc3NhZ2U7XG50eXBlIElNZXNzYWdlID0gQm90QnVpbGRlci5JTWVzc2FnZTtcbnR5cGUgQWRkcmVzcyA9IEJvdEJ1aWxkZXIuQWRkcmVzcztcblxudHlwZSBBbnN3ZXJIb29rID0gKHR4dDpzdHJpbmcsIGNtZDogc3RyaW5nLCBpZD8gOiBzdHJpbmcpID0+IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBIVE1MQ29ubmVjdG9yIHtcbiAgcmVwbHlDbnQgOiBudW1iZXI7IFxuICBhbnN3ZXJIb29rcyA6IE1hcDxzdHJpbmcsIEFuc3dlckhvb2s+O1xuICBxdWl0aG9vazogYW55O1xuICBoYW5kbGVyIDogYW55O1xuICBxdWl0SG9vayA6IGFueTtcbiAgYW5zd2VySG9vazogQW5zd2VySG9vaztcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMucmVwbHlDbnQgPSAwO1xuICAgIHRoaXMuYW5zd2VySG9va3MgPSBuZXcgTWFwPHN0cmluZywgQW5zd2VySG9vaz4oKTtcbiAgfVxuICBzZXRBbnN3ZXJIb29rKGFuc3dlckhvb2sgOiAodHh0OnN0cmluZywgY21kOiBzdHJpbmcsIGlkPyA6IHN0cmluZykgPT4gdm9pZCwgaWQgOiBzdHJpbmcpIHtcbiAgICBpZiAoaWQpIHtcbiAgICAgIHRoaXMuYW5zd2VySG9va3NbaWRdID0gYW5zd2VySG9vaztcbiAgICB9XG4gICAgdGhpcy5hbnN3ZXJIb29rID0gYW5zd2VySG9vaztcbiAgfTtcbiAgc2V0UXVpdEhvb2socXVpdEhvb2spIHtcbiAgICB0aGlzLnF1aXRIb29rID0gcXVpdEhvb2s7XG4gIH07XG4gIHByb2Nlc3NNZXNzYWdlKGxpbmUgOiBzdHJpbmcgLCBpZCA6IEFkZHJlc3MpIHtcbiAgICBpZiAodHlwZW9mIGlkID09PSAnc3RyaW5nJykge1xuICAgICAgaWQgPSB7XG4gICAgICAgIGNvbnZlcnNhdGlvbklkIDogaWQsXG4gICAgICAgIHVzZXIgOiBpZCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICh0aGlzLmhhbmRsZXIpIHtcbiAgICAgIHZhciBtc2cgPSBuZXcgTWVzc2FnZShudWxsKVxuICAgICAgICAuYWRkcmVzcyhpZClcbiAgICAgICAgLnRpbWVzdGFtcCgpXG4gICAgICAgIC50ZXh0KGxpbmUpO1xuICAgICAgdGhpcy5oYW5kbGVyKFttc2cudG9NZXNzYWdlKCldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgb25FdmVudCA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgdGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcbiAgfTtcblxuICBzZW5kKG1lc3NhZ2VzIDogSU1lc3NhZ2VbXSwgZG9uZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVzc2FnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnJlcGx5Q250KysgPiAwKSB7XG4gICAgICAvLyAgY29uc29sZS5sb2coJyByZXBseSAnKTtcbiAgICAgIH1cbiAgICAgIHZhciBtc2cgPSBtZXNzYWdlc1tpXTtcbiAgICAgIGlmIChtc2cudGV4dCkge1xuICAgICAgICB2YXIgY29tbWFuZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYobXNnLmVudGl0aWVzICYmIG1zZy5lbnRpdGllc1swXSAmJiBtc2cuZW50aXRpZXNbMF0pIHtcbiAgICAgICAgICBjb21tYW5kID0gbXNnLmVudGl0aWVzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtc2cuYWRkcmVzcyAmJiBtc2cuYWRkcmVzcy5jb252ZXJzYXRpb25JZFxuICAgICAgICAmJiB0aGlzLmFuc3dlckhvb2tzW21zZy5hZGRyZXNzLmNvbnZlcnNhdGlvbklkXSApIHtcbiAgICAgICAgICB0aGlzLmFuc3dlckhvb2tzW21zZy5hZGRyZXNzLmNvbnZlcnNhdGlvbklkXShtc2cudGV4dCwgY29tbWFuZCwgbXNnLmFkZHJlc3MuY29udmVyc2F0aW9uSWQgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmFuc3dlckhvb2sobXNnLnRleHQsIGNvbW1hbmQsIFwibm9jb252aWRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZG9uZShudWxsKTtcbiAgfTtcbiAgc3RhcnRDb252ZXJzYXRpb24gPSBmdW5jdGlvbiAoYWRkcmVzczogQWRkcmVzcywgY2IgOiAoZXJyOmFueSwgYTpBZGRyZXNzKSA9PiB2b2lkKSB7XG4gICAgY2IobnVsbCwgYWRkcmVzcyk7XG4gIH07XG59XG4iXX0=
