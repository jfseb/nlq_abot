"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadModel = exports.SmartDialog = exports.HTMLConnector = void 0;
const HTMLConnector = require("./ui/htmlconnector");
exports.HTMLConnector = HTMLConnector;
const SmartDialog = require("./bot/smartdialog");
exports.SmartDialog = SmartDialog;
const SrcHandle = require("./model/srchandle");
const Model = require("./model/index_model");
function LoadModel(modelPath) {
    var srcHandle = SrcHandle.createSourceHandle();
    if (modelPath == './testmodel') {
        modelPath = __dirname + '/../testmodel';
    }
    if (modelPath == './testmodel2') {
        modelPath = __dirname + "/../testmodel2";
    }
    console.log(' modelpath ' + modelPath);
    var res = function loadModel() {
        return Model.Model.loadModelsOpeningConnection(srcHandle, modelPath);
    };
    return res;
}
exports.LoadModel = LoadModel;
//import * as SentenceParser from './sentenceparser';

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxvREFBb0Q7QUFDM0Msc0NBQWE7QUFDdEIsaURBQWlEO0FBQ3hDLGtDQUFXO0FBRXBCLCtDQUErQztBQUMvQyw2Q0FBNkM7QUFFN0MsU0FBZ0IsU0FBUyxDQUFDLFNBQWtCO0lBQzFDLElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQy9DLElBQUssU0FBUyxJQUFJLGFBQWEsRUFBRTtRQUMvQixTQUFTLEdBQUcsU0FBUyxHQUFHLGVBQWUsQ0FBQztLQUN6QztJQUNELElBQUssU0FBUyxJQUFJLGNBQWMsRUFBRTtRQUNoQyxTQUFTLEdBQUcsU0FBUyxHQUFHLGdCQUFnQixDQUFDO0tBQzFDO0lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDLENBQUE7SUFDdEMsSUFBSSxHQUFHLEdBQUcsU0FBUyxTQUFTO1FBQzFCLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkUsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBYkQsOEJBYUM7QUFLRCxxREFBcUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCAqIGFzIEhUTUxDb25uZWN0b3IgZnJvbSAnLi91aS9odG1sY29ubmVjdG9yJztcbmV4cG9ydCB7IEhUTUxDb25uZWN0b3IgfTtcbmltcG9ydCAqIGFzIFNtYXJ0RGlhbG9nIGZyb20gJy4vYm90L3NtYXJ0ZGlhbG9nJztcbmV4cG9ydCB7IFNtYXJ0RGlhbG9nIH07XG5cbmltcG9ydCAqIGFzIFNyY0hhbmRsZSBmcm9tICcuL21vZGVsL3NyY2hhbmRsZSc7XG5pbXBvcnQgKiBhcyBNb2RlbCBmcm9tICcuL21vZGVsL2luZGV4X21vZGVsJztcblxuZXhwb3J0IGZ1bmN0aW9uIExvYWRNb2RlbChtb2RlbFBhdGggOiBzdHJpbmcpIHtcbiAgdmFyIHNyY0hhbmRsZSA9IFNyY0hhbmRsZS5jcmVhdGVTb3VyY2VIYW5kbGUoKTtcbiAgaWYgKCBtb2RlbFBhdGggPT0gJy4vdGVzdG1vZGVsJykge1xuICAgIG1vZGVsUGF0aCA9IF9fZGlybmFtZSArICcvLi4vdGVzdG1vZGVsJztcbiAgfVxuICBpZiAoIG1vZGVsUGF0aCA9PSAnLi90ZXN0bW9kZWwyJykge1xuICAgIG1vZGVsUGF0aCA9IF9fZGlybmFtZSArIFwiLy4uL3Rlc3Rtb2RlbDJcIjtcbiAgfVxuICBjb25zb2xlLmxvZygnIG1vZGVscGF0aCAnICsgbW9kZWxQYXRoKVxuICB2YXIgcmVzID0gZnVuY3Rpb24gbG9hZE1vZGVsKCkge1xuICAgIHJldHVybiBNb2RlbC5Nb2RlbC5sb2FkTW9kZWxzT3BlbmluZ0Nvbm5lY3Rpb24oc3JjSGFuZGxlLCBtb2RlbFBhdGgpO1xuICB9O1xuICByZXR1cm4gcmVzOyAgXG59XG5cblxuXG5cbi8vaW1wb3J0ICogYXMgU2VudGVuY2VQYXJzZXIgZnJvbSAnLi9zZW50ZW5jZXBhcnNlcic7Il19
