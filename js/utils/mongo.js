"use strict";
/**
 * Utiltities for mongo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionNames = exports.disconnectReset = exports.clearModels = exports.openMongoose = void 0;
const debugf = require("debugf");
var debuglog = debugf('model');
function openMongoose(srcHandle, mongoConnectionString) {
    console.log(' srcHandle.connect ' + mongoConnectionString);
    srcHandle.connect(mongoConnectionString);
    var db = srcHandle;
    var mgopen = new Promise(function (resolve, reject) {
        //db.on.setMaxListeners(0);
        resolve(srcHandle);
        /*
        if((typeof db.setMaxListeners) === "function") {
            db.setMaxListeners(0);
        }
        if((typeof db.on.setMaxListeners) === "function") {
            db.on.setMaxListeners(0);
        }
        db.on('error', (err) => {
          console.error(err);
          reject(err);}
        );
        if((typeof db.once.setMaxListeners) === "function") {
            db.once.setMaxListeners(0);
        }
        db.once('open', function () {
          debuglog('connected to ' + mongoConnectionString);
          resolve(db);
        });
        */
    });
    return mgopen;
}
exports.openMongoose = openMongoose;
function clearModels(srcHandle) {
    debuglog(' clear Models ');
    srcHandle.connection.modelNames().forEach(modelName => delete srcHandle.connection.models[modelName]);
}
exports.clearModels = clearModels;
function disconnectReset(srcHandle) {
    clearModels(srcHandle);
}
exports.disconnectReset = disconnectReset;
function getCollectionNames(srcHandle) {
    return srcHandle.connection.db.collections().then((cols) => cols.map(col => col.collectionName));
}
exports.getCollectionNames = getCollectionNames;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9tb25nby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILGlDQUFpQztBQUlqQyxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFL0IsU0FBZ0IsWUFBWSxDQUFDLFNBQXFCLEVBQUUscUJBQThCO0lBQ2hGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUUsQ0FBQztJQUM1RCxTQUFTLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDekMsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDO0lBQ25CLElBQUksTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU07UUFDaEQsMkJBQTJCO1FBQzNCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQjs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBa0JFO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE1BQTZCLENBQUM7QUFDdkMsQ0FBQztBQTVCRCxvQ0E0QkM7QUFFRCxTQUFnQixXQUFXLENBQUMsU0FBZTtJQUN2QyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMzQixTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUNsRCxPQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUNoRCxDQUFDO0FBQ04sQ0FBQztBQUxELGtDQUtDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLFNBQWU7SUFDM0MsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLGtCQUFrQixDQUFDLFNBQWM7SUFDN0MsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQzdDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUNoRCxDQUFDO0FBQ04sQ0FBQztBQUpELGdEQUlDIiwiZmlsZSI6InV0aWxzL21vbmdvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFV0aWx0aXRpZXMgZm9yIG1vbmdvXHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWdmIGZyb20gJ2RlYnVnZic7XHJcbmltcG9ydCB7IG9uY2UgfSBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0IHsgSVNyY0hhbmRsZSB9IGZyb20gJy4uL21vZGVsL3NyY2hhbmRsZSc7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1Z2YoJ21vZGVsJyk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb3Blbk1vbmdvb3NlKHNyY0hhbmRsZTogSVNyY0hhbmRsZSwgbW9uZ29Db25uZWN0aW9uU3RyaW5nIDogc3RyaW5nKSA6IFByb21pc2U8SVNyY0hhbmRsZT4ge1xyXG4gIGNvbnNvbGUubG9nKCcgc3JjSGFuZGxlLmNvbm5lY3QgJyArIG1vbmdvQ29ubmVjdGlvblN0cmluZyApO1xyXG4gIHNyY0hhbmRsZS5jb25uZWN0KG1vbmdvQ29ubmVjdGlvblN0cmluZyk7XHJcbiAgdmFyIGRiID0gc3JjSGFuZGxlO1xyXG4gIHZhciBtZ29wZW4gPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAvL2RiLm9uLnNldE1heExpc3RlbmVycygwKTtcclxuICAgIHJlc29sdmUoc3JjSGFuZGxlKTtcclxuICAgIC8qXHJcbiAgICBpZigodHlwZW9mIGRiLnNldE1heExpc3RlbmVycykgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIGRiLnNldE1heExpc3RlbmVycygwKTtcclxuICAgIH1cclxuICAgIGlmKCh0eXBlb2YgZGIub24uc2V0TWF4TGlzdGVuZXJzKSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgZGIub24uc2V0TWF4TGlzdGVuZXJzKDApO1xyXG4gICAgfVxyXG4gICAgZGIub24oJ2Vycm9yJywgKGVycikgPT4ge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgIHJlamVjdChlcnIpO31cclxuICAgICk7XHJcbiAgICBpZigodHlwZW9mIGRiLm9uY2Uuc2V0TWF4TGlzdGVuZXJzKSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgZGIub25jZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XHJcbiAgICB9XHJcbiAgICBkYi5vbmNlKCdvcGVuJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBkZWJ1Z2xvZygnY29ubmVjdGVkIHRvICcgKyBtb25nb0Nvbm5lY3Rpb25TdHJpbmcpO1xyXG4gICAgICByZXNvbHZlKGRiKTtcclxuICAgIH0pO1xyXG4gICAgKi9cclxuICB9KTtcclxuICByZXR1cm4gbWdvcGVuIGFzIFByb21pc2U8SVNyY0hhbmRsZT47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhck1vZGVscyhzcmNIYW5kbGUgOiBhbnkpIHtcclxuICAgIGRlYnVnbG9nKCcgY2xlYXIgTW9kZWxzICcpO1xyXG4gICAgc3JjSGFuZGxlLmNvbm5lY3Rpb24ubW9kZWxOYW1lcygpLmZvckVhY2gobW9kZWxOYW1lID0+XHJcbiAgICAgICAgZGVsZXRlIHNyY0hhbmRsZS5jb25uZWN0aW9uLm1vZGVsc1ttb2RlbE5hbWVdXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlzY29ubmVjdFJlc2V0KHNyY0hhbmRsZSA6IGFueSkge1xyXG4gICAgY2xlYXJNb2RlbHMoc3JjSGFuZGxlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbGxlY3Rpb25OYW1lcyhzcmNIYW5kbGU6IGFueSkgOiBQcm9taXNlPFN0cmluZ1tdPiB7XHJcbiAgICByZXR1cm4gc3JjSGFuZGxlLmNvbm5lY3Rpb24uZGIuY29sbGVjdGlvbnMoKS50aGVuKFxyXG4gICAgICAgIChjb2xzKSA9PiBjb2xzLm1hcChjb2wgPT4gY29sLmNvbGxlY3Rpb25OYW1lKVxyXG4gICAgKTtcclxufSJdfQ==
