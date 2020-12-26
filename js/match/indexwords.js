"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpWords = exports.insertWord = exports.mockPG = void 0;
const IMatch = require("./ifmatch");
const pg = require("pg");
const debug = require("debug");
const debuglog = debug('indexwords');
var pgInstance = pg;
function mockPG(pg) {
    pgInstance = pg;
}
exports.mockPG = mockPG;
var columns = ['lowercaseword', 'matchedstring', 'category'];
function insertWord(dburl, lowercaseword, matchedstring, category, callback) {
    pgInstance.connect(dburl, (err, client, pgDone) => {
        var oEntry = {
            matchedstring: matchedstring,
            lowercaseword: lowercaseword,
            category: category
        };
        if (err) {
            // failed to acquire connection
            //logger.emit('error', err);
            debuglog('Error connecting to db' + err);
            callback(err);
        }
        else {
            var query = `INSERT INTO words (` + columns.join(",") + ") " +
                //   (convid, sessionid, user, message, response, meta) ` +
                "VALUES ( " +
                // $1, $2, ...
                columns.map(function (o, iIndex) { return "$" + (iIndex + 1); }).join(", ") + ")";
            var values = columns.map(function (sCol) {
                return oEntry[sCol];
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
exports.insertWord = insertWord;
function dumpWords(dburl, model) {
    // move
    model.mRules.forEach(function (mRule) {
        if (mRule.type === IMatch.EnumRuleType.WORD) {
            insertWord(dburl, mRule.lowercaseword, mRule.matchedString, mRule.category, function () { });
        }
    });
}
exports.dumpWords = dumpWords;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9pbmRleHdvcmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLG9DQUFvQztBQUNwQyx5QkFBeUI7QUFDekIsK0JBQStCO0FBRS9CLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQyxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFFcEIsU0FBZ0IsTUFBTSxDQUFDLEVBQUU7SUFDdkIsVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBRkQsd0JBRUM7QUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0QsU0FBZ0IsVUFBVSxDQUFDLEtBQWMsRUFBQyxhQUFzQixFQUFFLGFBQXNCLEVBQUUsUUFBZ0IsRUFBRSxRQUErQztJQUN6SixVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFrQixFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQzFELElBQUksTUFBTSxHQUFJO1lBQ1osYUFBYSxFQUFHLGFBQWE7WUFDN0IsYUFBYSxFQUFHLGFBQWE7WUFDN0IsUUFBUSxFQUFHLFFBQVE7U0FDcEIsQ0FBQTtRQUNELElBQUksR0FBRyxFQUFFO1lBQ1AsK0JBQStCO1lBQy9CLDRCQUE0QjtZQUM1QixRQUFRLENBQUMsd0JBQXdCLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDekMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Y7YUFBTTtZQUNMLElBQUksS0FBSyxHQUFFLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSTtnQkFDM0QsMkRBQTJEO2dCQUMzRCxXQUFXO2dCQUNYLGNBQWM7Z0JBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFTLENBQUMsRUFBQyxNQUFNLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBRS9FLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFJO2dCQUNqQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQztZQUNILHNFQUFzRTtZQUN6RSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBQyxNQUFNLEVBQ1osQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sRUFBRSxDQUFDO2dCQUNULElBQUksR0FBRyxFQUFFO29CQUNSLDZCQUE2QjtvQkFDN0IsUUFBUSxDQUFDLGlDQUFpQyxHQUFHLEdBQUcsR0FBRyxJQUFJO3dCQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3JCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDZjtxQkFBTTtvQkFDUCwwQkFBMEI7b0JBQ3hCLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3RCO1lBQ0wsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXRDRCxnQ0FzQ0M7QUFHRCxTQUFnQixTQUFTLENBQUMsS0FBYyxFQUFHLEtBQXFCO0lBQzlELE9BQU87SUFDUCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFTLEtBQUs7UUFDakMsSUFBRyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQzFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsY0FBWSxDQUFDLENBQUMsQ0FBQztTQUM1RjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQztBQVJELDhCQVFDIiwiZmlsZSI6Im1hdGNoL2luZGV4d29yZHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZm1hdGNoJztcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnaW5kZXh3b3JkcycpO1xuXG52YXIgcGdJbnN0YW5jZSA9IHBnO1xuXG5leHBvcnQgZnVuY3Rpb24gbW9ja1BHKHBnKSB7XG4gIHBnSW5zdGFuY2UgPSBwZztcbn1cblxudmFyIGNvbHVtbnMgPSBbJ2xvd2VyY2FzZXdvcmQnLCAnbWF0Y2hlZHN0cmluZycsICdjYXRlZ29yeSddO1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFdvcmQoZGJ1cmwgOiBzdHJpbmcsbG93ZXJjYXNld29yZCA6IHN0cmluZywgbWF0Y2hlZHN0cmluZyA6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZywgY2FsbGJhY2sgOiAoZXJyOiBFcnJvciwgcmVzPyA6IGJvb2xlYW4pID0+IHZvaWQgKSB7XG4gIHBnSW5zdGFuY2UuY29ubmVjdChkYnVybCwgKGVyciwgY2xpZW50IDogcGcuQ2xpZW50LCBwZ0RvbmUpID0+IHtcbiAgICAgIHZhciBvRW50cnkgPSAge1xuICAgICAgICBtYXRjaGVkc3RyaW5nIDogbWF0Y2hlZHN0cmluZyxcbiAgICAgICAgbG93ZXJjYXNld29yZCA6IGxvd2VyY2FzZXdvcmQsXG4gICAgICAgIGNhdGVnb3J5IDogY2F0ZWdvcnlcbiAgICAgIH1cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gZmFpbGVkIHRvIGFjcXVpcmUgY29ubmVjdGlvblxuICAgICAgICAvL2xvZ2dlci5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgIGRlYnVnbG9nKCdFcnJvciBjb25uZWN0aW5nIHRvIGRiJyArIGVycik7XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcXVlcnkgPWBJTlNFUlQgSU5UTyB3b3JkcyAoYCArIGNvbHVtbnMuam9pbihcIixcIikgKyBcIikgXCIgK1xuICAgICAgICAvLyAgIChjb252aWQsIHNlc3Npb25pZCwgdXNlciwgbWVzc2FnZSwgcmVzcG9uc2UsIG1ldGEpIGAgK1xuICAgICAgICBcIlZBTFVFUyAoIFwiICArXG4gICAgICAgIC8vICQxLCAkMiwgLi4uXG4gICAgICAgICBjb2x1bW5zLm1hcChmdW5jdGlvbihvLGlJbmRleCkgeyByZXR1cm4gXCIkXCIgKyAoaUluZGV4KzEpOyB9KS5qb2luKFwiLCBcIikgKyBcIilcIjtcblxuICAgICAgICB2YXIgdmFsdWVzID0gY29sdW1ucy5tYXAoZnVuY3Rpb24oc0NvbCkge1xuICAgICAgICAgICAgIHJldHVybiBvRW50cnlbc0NvbF07XG4gICAgICAgICAgIH0pO1xuICAgICAgICAgICAvLyAgW2xldmVsLCBtc2csIG1ldGEgaW5zdGFuY2VvZiBBcnJheSA/IEpTT04uc3RyaW5naWZ5KG1ldGEpIDogbWV0YV0sXG4gICAgICAgIGNsaWVudC5xdWVyeShxdWVyeSx2YWx1ZXMsXG4gICAgICAgICAgICAgICAgICAgICAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHBnRG9uZSgpO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgIC8vIGxvZ2dlci5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgICAgICAgZGVidWdsb2coJ0Vycm9yIGluc2VydGluZyByZWNvcmQgaW50byBkYiAnICsgZXJyICsgJ1xcbicgK1xuICAgICAgICAgICAgICAgIHZhbHVlcy5qb2luKFwiXFxuXCIpKTtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgbG9nZ2VyLmVtaXQoJ2xvZ2dlZCcpO1xuICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBXb3JkcyhkYnVybCA6IHN0cmluZywgIG1vZGVsOiBJTWF0Y2guSU1vZGVscykge1xuICAvLyBtb3ZlXG4gIG1vZGVsLm1SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG1SdWxlKSB7XG4gICAgaWYobVJ1bGUudHlwZSA9PT0gSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JEKSB7XG4gICAgICBpbnNlcnRXb3JkKGRidXJsLCBtUnVsZS5sb3dlcmNhc2V3b3JkLCBtUnVsZS5tYXRjaGVkU3RyaW5nLCBtUnVsZS5jYXRlZ29yeSwgZnVuY3Rpb24oKSB7fSk7XG4gICAgfVxuICB9KTtcblxufSJdfQ==
