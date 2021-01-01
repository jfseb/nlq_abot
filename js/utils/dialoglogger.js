"use strict";
/**
 * a logger for dialog conversations
 */
//declare module pg {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.logAnswer = exports.assureColumnLengthNotExceeded = exports.sqlActive = void 0;
const debug = require("debug");
const process = require("process");
exports.sqlActive = !!(process.env.ABOT_LOGDB);
const debuglog = debug('dialoglogger');
;
;
const columns = ["botid", "userid", "message", "response", "action", "intent", "conversationId", "meta", "delta"];
// 0 indicates do not process /truncate, e.g. non string type
const columnLengths = [10, 40, 1024, 1024, 512, 20, 40, 0, 0];
function assureColumnLengthNotExceeded(obj) {
    columns.forEach(function (sCol, iIndex) {
        if (columnLengths[iIndex] && typeof obj[sCol] !== "string") {
            debuglog("Unexpected non-string value " + JSON.stringify(obj[sCol]));
            obj[sCol] = "" + obj[sCol];
        }
        if (obj[sCol] && columnLengths[iIndex] && obj[sCol].length > columnLengths[iIndex]) {
            obj[sCol] = obj[sCol].substring(0, columnLengths[iIndex]);
        }
    });
    return obj;
}
exports.assureColumnLengthNotExceeded = assureColumnLengthNotExceeded;
function logAnswer(answer, callback, ForceSqlActive) {
    "use strict";
    callback = callback || (function () { });
    var session = answer.session;
    var sqlIsActive = ForceSqlActive || exports.sqlActive;
    var pg = this.pg;
    debuglog("here user id of message session.message.address " +
        JSON.stringify(session.message.address.user));
    var oLogEntry = {
        botid: this.name,
        userid: session.message.address
            && session.message.address.user
            && session.message.address.user || "",
        message: session.message.text,
        response: answer.response,
        action: answer.action,
        intent: answer.intent,
        conversationId: session.message.address
            && session.message.address.conversationId || "",
        meta: answer.result || {},
        delta: Date.now() - Date.parse(session.message.timestamp),
    };
    oLogEntry = assureColumnLengthNotExceeded(oLogEntry);
    debuglog("sqlIsActive" + sqlIsActive);
    if (!sqlIsActive) {
        return;
    }
    if (pg) {
        pg.connect(this.dburl, (err, client /*pg.Client*/, pgDone) => {
            if (err) {
                // failed to acquire connection
                //logger.emit('error', err);
                debuglog('Error connecting to db' + err);
                callback(err);
            }
            else {
                var query = `INSERT INTO logconv (` + columns.join(",") + ") " +
                    //   (convid, sessionid, user, message, response, meta) ` +
                    "VALUES ( " +
                    // $1, $2, ...
                    columns.map(function (o, iIndex) { return "$" + (iIndex + 1); }).join(", ") + ")";
                var values = columns.map(function (sCol) {
                    return oLogEntry[sCol];
                });
                //  [level, msg, meta instanceof Array ? JSON.stringify(meta) : meta],
                client.query(query, values, (err, result) => {
                    pgDone();
                    if (err) {
                        // logger.emit('error', err);
                        debuglog('Error inserting record into db ' + err + '\n' +
                            values.join("\n"));
                        callback(err);
                    }
                    else {
                        //  logger.emit('logged');
                        callback(null, true);
                    }
                });
            }
        });
    }
    else {
        callback(null, true);
    }
}
exports.logAnswer = logAnswer;
var loggers = {};
function logger(name, dburl, pg) {
    if (!dburl) {
        throw new Error('need database url');
    }
    if (typeof name !== "string" || !/^[A-Za-z][A-Za-z0-9_]+$/.exec(name)) {
        throw new Error('Logger name must be at least two alphanumeric characters');
    }
    if (!loggers[name]) {
        var alogger = {
            name: name,
            dburl: dburl,
            pg: pg
        };
        alogger.logIt = logAnswer.bind(alogger);
        loggers[name] = alogger;
    }
    if (loggers[name].dburl !== dburl) {
        throw new Error('Flags mismatch in logger' + name);
    }
    return loggers[name].logIt;
}
exports.logger = logger;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9kaWFsb2dsb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHO0FBQ0gsdUJBQXVCOzs7QUFHdkIsK0JBQStCO0FBQy9CLG1DQUFtQztBQUd4QixRQUFBLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRWxELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztBQU90QyxDQUFDO0FBZUQsQ0FBQztBQVVGLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pILDZEQUE2RDtBQUM3RCxNQUFNLGFBQWEsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFFLENBQUM7QUFHOUQsU0FBZ0IsNkJBQTZCLENBQUMsR0FBZTtJQUMzRCxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFDLE1BQU07UUFDbEMsSUFBRyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQU0sUUFBUSxFQUFFO1lBQzFELFFBQVEsQ0FBQyw4QkFBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFDRCxJQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFD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QUFFLEtBQUs7WUFDWixFQUFFLEVBQUcsRUFBRTtTQUNHLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQztLQUN6QjtJQUNELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUU7UUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNwRDtJQUNELE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM3QixDQUFDO0FBcEJDLHdCQW9CRCIsImZpbGUiOiJ1dGlscy9kaWFsb2dsb2dnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGEgbG9nZ2VyIGZvciBkaWFsb2cgY29udmVyc2F0aW9uc1xuICovXG4vL2RlY2xhcmUgbW9kdWxlIHBnIHt9O1xuXG5pbXBvcnQgKiBhcyBidWlsZGVyIGZyb20gJy4uL2JvdC9ib3RidWlsZGVyJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAncHJvY2Vzcyc7XG5cblxuZXhwb3J0IHZhciBzcWxBY3RpdmUgPSAhIShwcm9jZXNzLmVudi5BQk9UX0xPR0RCKTtcblxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnZGlhbG9nbG9nZ2VyJyk7XG5cbmludGVyZmFjZSBJTG9nZ2VyIHtcbiAgbmFtZTogc3RyaW5nLFxuICBkYnVybDogc3RyaW5nLFxuICBsb2dJdD86IChhIDogSUFuc3dlciwgY2FsbGJhY2sgOiAoZXJyIDogYW55LCByZXM/IDogYW55KSA9PiB2b2lkKSA9PiB2b2lkLFxuICBwZyA6IGFueVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJTG9nRW50cnkge1xuICBib3RpZCA6IHN0cmluZywgLyogMTAgKi9cbiAgdXNlcmlkIDogc3RyaW5nLFxuICBtZXNzYWdlIDogc3RyaW5nLFxuICByZXNwb25zZSA6IHN0cmluZyxcbiAgYWN0aW9uIDogc3RyaW5nLFxuICBpbnRlbnQgOiBzdHJpbmcsXG4gIGNvbnZlcnNhdGlvbklkIDogc3RyaW5nLFxuICAvKipcbiAgICogYW4gcmVzdWx0XG4gICAqKi9cbiAgbWV0YSA6IGFueSxcbiAgZGVsdGE6IG51bWJlclxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJQW5zd2VyIHtcbiAgc2Vzc2lvbiA6IGJ1aWxkZXIuU2Vzc2lvbixcbiAgaW50ZW50IDogc3RyaW5nLFxuICByZXNwb25zZSA6IHN0cmluZyxcbiAgYWN0aW9uPyA6IHN0cmluZyxcbiAgcmVzdWx0PyA6IGFueSxcbn1cblxuY29uc3QgY29sdW1ucyA9IFtcImJvdGlkXCIsXCJ1c2VyaWRcIiwgXCJtZXNzYWdlXCIsIFwicmVzcG9uc2VcIiwgXCJhY3Rpb25cIiwgXCJpbnRlbnRcIiwgXCJjb252ZXJzYXRpb25JZFwiLCBcIm1ldGFcIiwgXCJkZWx0YVwiXTtcbi8vIDAgaW5kaWNhdGVzIGRvIG5vdCBwcm9jZXNzIC90cnVuY2F0ZSwgZS5nLiBub24gc3RyaW5nIHR5cGVcbmNvbnN0IGNvbHVtbkxlbmd0aHMgPSBbMTAsIDQwLCAxMDI0LCAxMDI0LCA1MTIsIDIwLCA0MCwgMCwwIF07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc3VyZUNvbHVtbkxlbmd0aE5vdEV4Y2VlZGVkKG9iaiA6IElMb2dFbnRyeSkgOiBJTG9nRW50cnkge1xuICBjb2x1bW5zLmZvckVhY2goZnVuY3Rpb24oc0NvbCxpSW5kZXgpIHtcbiAgICBpZihjb2x1bW5MZW5ndGhzW2lJbmRleF0gJiYgdHlwZW9mIG9ialtzQ29sXSAhPT0gIFwic3RyaW5nXCIpIHtcbiAgICAgIGRlYnVnbG9nKFwiVW5leHBlY3RlZCBub24tc3RyaW5nIHZhbHVlIFwiICsgSlNPTi5zdHJpbmdpZnkob2JqW3NDb2xdKSk7XG4gICAgICBvYmpbc0NvbF0gPSBcIlwiKyBvYmpbc0NvbF07XG4gICAgfVxuICAgIGlmKG9ialtzQ29sXSAmJiBjb2x1bW5MZW5ndGhzW2lJbmRleF0gJiYgb2JqW3NDb2xdLmxlbmd0aCA+IGNvbHVtbkxlbmd0aHNbaUluZGV4XSkge1xuICAgICAgb2JqW3NDb2xdID0gb2JqW3NDb2xdLnN1YnN0cmluZygwLGNvbHVtbkxlbmd0aHNbaUluZGV4XSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0Fuc3dlcihhbnN3ZXI6IElBbnN3ZXIsIGNhbGxiYWNrIDogKGVycjogYW55LCByZXM/OiBhbnkpID0+IHZvaWQgLCBGb3JjZVNxbEFjdGl2ZT8gOiBib29sZWFuKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IChmdW5jdGlvbigpIHt9KTtcbiAgdmFyIHNlc3Npb24gPSBhbnN3ZXIuc2Vzc2lvbjtcbiAgdmFyIHNxbElzQWN0aXZlID0gRm9yY2VTcWxBY3RpdmUgfHwgc3FsQWN0aXZlO1xuICB2YXIgcGcgPSB0aGlzLnBnO1xuICBkZWJ1Z2xvZyhcImhlcmUgdXNlciBpZCBvZiBtZXNzYWdlIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzIFwiICtcbiAgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlcikpO1xuICB2YXIgb0xvZ0VudHJ5IDogSUxvZ0VudHJ5ID0ge1xuICAgIGJvdGlkIDogdGhpcy5uYW1lLCBcbiAgICB1c2VyaWQ6IHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzXG4gICAgJiYgc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3MudXNlclxuICAgICYmIHNlc3Npb24ubWVzc2FnZS5hZGRyZXNzLnVzZXIgfHwgXCJcIixcbiAgICBtZXNzYWdlOiBzZXNzaW9uLm1lc3NhZ2UudGV4dCxcbiAgICByZXNwb25zZSA6IGFuc3dlci5yZXNwb25zZSxcbiAgICBhY3Rpb24gOiBhbnN3ZXIuYWN0aW9uLFxuICAgIGludGVudDogYW5zd2VyLmludGVudCxcbiAgICBjb252ZXJzYXRpb25JZDogc2Vzc2lvbi5tZXNzYWdlLmFkZHJlc3NcbiAgICAmJiBzZXNzaW9uLm1lc3NhZ2UuYWRkcmVzcy5jb252ZXJzYXRpb25JZCB8fCBcIlwiLFxuICAgIG1ldGEgOiBhbnN3ZXIucmVzdWx0IHx8IHt9LFxuICAgIGRlbHRhIDogRGF0ZS5ub3coKSAtIERhdGUucGFyc2Uoc2Vzc2lvbi5tZXNzYWdlLnRpbWVzdGFtcCksXG4gIH07XG5cbiAgb0xvZ0VudHJ5ID0gYXNzdXJlQ29sdW1uTGVuZ3RoTm90RXhjZWVkZWQob0xvZ0VudHJ5KTtcbiAgZGVidWdsb2coXCJzcWxJc0FjdGl2ZVwiICsgc3FsSXNBY3RpdmUpO1xuICBpZiAoIXNxbElzQWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICggcGcgKSB7XG4gICAgcGcuY29ubmVjdCh0aGlzLmRidXJsLCAoZXJyLCBjbGllbnQgOiBhbnkgLypwZy5DbGllbnQqLywgcGdEb25lKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIC8vIGZhaWxlZCB0byBhY3F1aXJlIGNvbm5lY3Rpb25cbiAgICAgICAgLy9sb2dnZXIuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICBkZWJ1Z2xvZygnRXJyb3IgY29ubmVjdGluZyB0byBkYicgKyBlcnIpO1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID1gSU5TRVJUIElOVE8gbG9nY29udiAoYCArIGNvbHVtbnMuam9pbihcIixcIikgKyBcIikgXCIgK1xuICAgICAgICAvLyAgIChjb252aWQsIHNlc3Npb25pZCwgdXNlciwgbWVzc2FnZSwgcmVzcG9uc2UsIG1ldGEpIGAgK1xuICAgICAgICBcIlZBTFVFUyAoIFwiICArXG4gICAgICAgIC8vICQxLCAkMiwgLi4uXG4gICAgICAgIGNvbHVtbnMubWFwKGZ1bmN0aW9uKG8saUluZGV4KSB7IHJldHVybiBcIiRcIiArIChpSW5kZXgrMSk7IH0pLmpvaW4oXCIsIFwiKSArIFwiKVwiO1xuICAgICAgICBcbiAgICAgICAgdmFyIHZhbHVlcyA9IGNvbHVtbnMubWFwKGZ1bmN0aW9uKHNDb2wpIHtcbiAgICAgICAgICByZXR1cm4gb0xvZ0VudHJ5W3NDb2xdO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gIFtsZXZlbCwgbXNnLCBtZXRhIGluc3RhbmNlb2YgQXJyYXkgPyBKU09OLnN0cmluZ2lmeShtZXRhKSA6IG1ldGFdLFxuICAgICAgICBcbiAgICAgICAgY2xpZW50LnF1ZXJ5KHF1ZXJ5LHZhbHVlcyxcbiAgICAgICAgICBcbiAgICAgICAgICAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHBnRG9uZSgpO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAvLyBsb2dnZXIuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygnRXJyb3IgaW5zZXJ0aW5nIHJlY29yZCBpbnRvIGRiICcgKyBlcnIgKyAnXFxuJyArXG4gICAgICAgICAgICAgICAgdmFsdWVzLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gIGxvZ2dlci5lbWl0KCdsb2dnZWQnKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB0cnVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY2FsbGJhY2sobnVsbCx0cnVlKTtcbiAgfVxufVxuXG4gIHZhciBsb2dnZXJzID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJTG9nZ2VyIH07XG4gIFxuICBleHBvcnQgZnVuY3Rpb24gbG9nZ2VyKG5hbWU6IHN0cmluZywgZGJ1cmwgOiBzdHJpbmcsIHBnOiBhbnkpIDogKGE6IElBbnN3ZXIsIGNhbGxiYWNrPzogKGVycjphbnksIHJlcz8gOmFueSkgPT4gdm9pZCkgPT4gdm9pZCAge1xuICAgIGlmICghZGJ1cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbmVlZCBkYXRhYmFzZSB1cmwnKTtcbiAgICB9XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIiB8fCAhL15bQS1aYS16XVtBLVphLXowLTlfXSskLy5leGVjKG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdMb2dnZXIgbmFtZSBtdXN0IGJlIGF0IGxlYXN0IHR3byBhbHBoYW51bWVyaWMgY2hhcmFjdGVycycpXG4gIH1cbiAgaWYgKCFsb2dnZXJzW25hbWVdKSB7XG4gICAgdmFyIGFsb2dnZXIgPSB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZGJ1cmw6IGRidXJsLFxuICAgICAgcGcgOiBwZ1xuICAgIH0gYXMgSUxvZ2dlcjtcbiAgICBhbG9nZ2VyLmxvZ0l0ID0gbG9nQW5zd2VyLmJpbmQoYWxvZ2dlcik7XG4gICAgbG9nZ2Vyc1tuYW1lXSA9IGFsb2dnZXI7XG4gIH1cbiAgaWYgKGxvZ2dlcnNbbmFtZV0uZGJ1cmwgIT09IGRidXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGbGFncyBtaXNtYXRjaCBpbiBsb2dnZXInICsgbmFtZSk7XG4gIH1cbiAgcmV0dXJuIGxvZ2dlcnNbbmFtZV0ubG9nSXQ7XG59Il19
