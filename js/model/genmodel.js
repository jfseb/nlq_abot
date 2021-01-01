"use strict";
/**
 * Enrich model folder, generating
 * a) lunr files for every model
 * b) tabModel files for the full model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexModel = void 0;
//var debug = require('debug')('vismodel.nunit');
const fs = require("fs");
const Vismodel = require("./vismodel");
const Model = require("./model");
function indexModel(modelPath) {
    // we index everything but the metamodels. 
    return Model.LoadModels(modelPath).then(imodels => {
        var path = imodels.mongoHandle.srcHandle.getPath();
        var mdls = JSON.parse('' + fs.readFileSync(path + '/models.json'));
        var models = mdls.filter(mdl => mdl != 'metamodels');
        Promise.all(models.map(modelName => {
            //if ( modelName == "iupacs") {
            return Vismodel.makeLunrIndex(imodels, modelName);
            //}
            //return 1;
        })).then(() => {
            Vismodel.tabModels(imodels);
        }).then(() => console.log("indexed all models"));
    });
}
exports.indexModel = indexModel;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC9nZW5tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBRUgsaURBQWlEO0FBQ2pELHlCQUF5QjtBQUN6Qix1Q0FBeUM7QUFDekMsaUNBQWlDO0FBRWpDLFNBQWdCLFVBQVUsQ0FBQyxTQUFrQjtJQUMzQywyQ0FBMkM7SUFDM0MsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBRSxPQUFPLENBQUMsRUFBRTtRQUNqRCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ25FLElBQUksTUFBTSxHQUFjLElBQUksQ0FBQyxNQUFNLENBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDLENBQUM7UUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ2xDLCtCQUErQjtZQUM3QixPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELEdBQUc7WUFDSCxXQUFXO1FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsR0FBRSxFQUFFO1lBQ1osUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsR0FBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBZkQsZ0NBZUMiLCJmaWxlIjoibW9kZWwvZ2VubW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEVucmljaCBtb2RlbCBmb2xkZXIsIGdlbmVyYXRpbmcgXG4gKiBhKSBsdW5yIGZpbGVzIGZvciBldmVyeSBtb2RlbFxuICogYikgdGFiTW9kZWwgZmlsZXMgZm9yIHRoZSBmdWxsIG1vZGVsXG4gKi9cblxuLy92YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd2aXNtb2RlbC5udW5pdCcpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICAqIGFzICBWaXNtb2RlbCBmcm9tICcuL3Zpc21vZGVsJztcbmltcG9ydCAqIGFzIE1vZGVsIGZyb20gJy4vbW9kZWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhNb2RlbChtb2RlbFBhdGggOiBzdHJpbmcpIDogUHJvbWlzZTxhbnk+IHtcbiAgLy8gd2UgaW5kZXggZXZlcnl0aGluZyBidXQgdGhlIG1ldGFtb2RlbHMuIFxuICByZXR1cm4gTW9kZWwuTG9hZE1vZGVscyhtb2RlbFBhdGgpLnRoZW4oIGltb2RlbHMgPT4ge1xuICAgIHZhciBwYXRoID0gaW1vZGVscy5tb25nb0hhbmRsZS5zcmNIYW5kbGUuZ2V0UGF0aCgpOyBcbiAgICB2YXIgbWRscyA9IEpTT04ucGFyc2UoJycgKyBmcy5yZWFkRmlsZVN5bmMocGF0aCArICcvbW9kZWxzLmpzb24nKSk7XG4gICAgdmFyIG1vZGVscyA6IHN0cmluZ1tdID0gbWRscy5maWx0ZXIoIG1kbCA9PiBtZGwgIT0gJ21ldGFtb2RlbHMnKTtcbiAgICBQcm9taXNlLmFsbCggbW9kZWxzLm1hcChtb2RlbE5hbWUgPT4ge1xuICAgICAgLy9pZiAoIG1vZGVsTmFtZSA9PSBcIml1cGFjc1wiKSB7XG4gICAgICAgIHJldHVybiBWaXNtb2RlbC5tYWtlTHVuckluZGV4KGltb2RlbHMsIG1vZGVsTmFtZSk7XG4gICAgICAvL31cbiAgICAgIC8vcmV0dXJuIDE7XG4gICAgfSkpLnRoZW4oICgpPT4geyBcbiAgICAgIFZpc21vZGVsLnRhYk1vZGVscyhpbW9kZWxzKVxuICAgIH0pLnRoZW4oICgpPT4gY29uc29sZS5sb2coXCJpbmRleGVkIGFsbCBtb2RlbHNcIikpO1xuICB9KTtcbn1cbiJdfQ==
