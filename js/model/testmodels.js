"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestModel2 = exports.getTestModel1 = void 0;
const SrcHandle = require("./srchandle");
const index_model_1 = require("./index_model");
var prom1 = null;
function getTestModel1() {
    if (!prom1) {
        var srcHandle = SrcHandle.createSourceHandle();
        prom1 = index_model_1.Model.loadModelsOpeningConnection(srcHandle, "testmodel", "./testmodel");
    }
    return prom1;
}
exports.getTestModel1 = getTestModel1;
/**
 * Obtain a model instance,
 *
 * note: the model must be closed via
 * Model.releaseModel(theModelInstance)
 */
function getTestModel2() {
    debugger;
    var srcHandle = SrcHandle.createSourceHandle();
    return index_model_1.Model.loadModelsOpeningConnection(srcHandle, "testmodel2", "./testmodel2");
}
exports.getTestModel2 = getTestModel2;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC90ZXN0bW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlDQUF5QztBQUN6QywrQ0FBbUU7QUFFbkUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBRWpCLFNBQWdCLGFBQWE7SUFDM0IsSUFBSyxDQUFDLEtBQUssRUFBRztRQUNaLElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQy9DLEtBQUssR0FBRyxtQkFBSyxDQUFDLDJCQUEyQixDQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDbkY7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFORCxzQ0FNQztBQUNEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsYUFBYTtJQUMzQixRQUFRLENBQUM7SUFDVCxJQUFJLFNBQVMsR0FBRyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUMvQyxPQUFPLG1CQUFLLENBQUMsMkJBQTJCLENBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNyRixDQUFDO0FBSkQsc0NBSUMiLCJmaWxlIjoibW9kZWwvdGVzdG1vZGVscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5pbXBvcnQgKiBhcyBTcmNIYW5kbGUgZnJvbSAnLi9zcmNoYW5kbGUnO1xuaW1wb3J0IHsgTW9kZWwgYXMgTW9kZWwsIElGTW9kZWwgYXMgSUZNb2RlbCB9IGZyb20gJy4vaW5kZXhfbW9kZWwnO1xuXG52YXIgcHJvbTEgPSBudWxsOyBcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlc3RNb2RlbDEoKTogUHJvbWlzZTx2b2lkIHwgSUZNb2RlbC5JTW9kZWxzPiB7XG4gIGlmICggIXByb20xICkge1xuICAgIHZhciBzcmNIYW5kbGUgPSBTcmNIYW5kbGUuY3JlYXRlU291cmNlSGFuZGxlKCk7XG4gICAgcHJvbTEgPSBNb2RlbC5sb2FkTW9kZWxzT3BlbmluZ0Nvbm5lY3Rpb24oIHNyY0hhbmRsZSwgXCJ0ZXN0bW9kZWxcIiwgXCIuL3Rlc3Rtb2RlbFwiKTtcbiAgfVxuICByZXR1cm4gcHJvbTE7XG59XG4vKipcbiAqIE9idGFpbiBhIG1vZGVsIGluc3RhbmNlLFxuICpcbiAqIG5vdGU6IHRoZSBtb2RlbCBtdXN0IGJlIGNsb3NlZCB2aWFcbiAqIE1vZGVsLnJlbGVhc2VNb2RlbCh0aGVNb2RlbEluc3RhbmNlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdE1vZGVsMigpOiBQcm9taXNlPHZvaWQgfCBJRk1vZGVsLklNb2RlbHM+IHtcbiAgZGVidWdnZXI7XG4gIHZhciBzcmNIYW5kbGUgPSBTcmNIYW5kbGUuY3JlYXRlU291cmNlSGFuZGxlKCk7XG4gIHJldHVybiBNb2RlbC5sb2FkTW9kZWxzT3BlbmluZ0Nvbm5lY3Rpb24oIHNyY0hhbmRsZSwgXCJ0ZXN0bW9kZWwyXCIsIFwiLi90ZXN0bW9kZWwyXCIpO1xufSJdfQ==
