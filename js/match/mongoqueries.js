"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listShowMe = exports.listAll = void 0;
const debug = require("debugf");
const debuglog = debug('mongoqueries');
const logger = require("../utils/logger");
var logPerf = logger.perf("mongoqueries");
var perflog = debug('perf');
;
;
;
const index_model_1 = require("../model/index_model");
const index_parser_1 = require("../index_parser");
;
var sWords = {};
/* we have sentences */
/* sentences lead to queries */
/* queries have columns, results */
function listAll(query, theModel) {
    return index_parser_1.MongoQ.query(query, theModel).then(res => {
        debuglog(() => 'got a query result' + JSON.stringify(res, undefined, 2));
        return res;
    });
}
exports.listAll = listAll;
/*
var tupelanswers = [] as IMatch.IWhatIsTupelAnswer[];
res.queryresults.map((qr, index) => {
  qr.results.forEach(function (result) {
    tupelanswers.push({
      record: {},
      categories: qr.columns,
      sentence: qr.sentence,
      result: result,
      _ranking: 1.0 // res.sentences[index]._ranking
    });
  });
});
return {
  tupelanswers: tupelanswers,
  errors: res.errors,
  tokens: res.tokens
}
}
)
}

/**
* Query for a showMe result
* @param query
* @param theModel
*/
function listShowMe(query, theModel) {
    // Todo: preprocess query
    // Show me FAct =>  url with CAT is FACT
    //
    return index_parser_1.MongoQ.queryWithURI(query, theModel, []).then(res => {
        debuglog(() => 'got a query result' + JSON.stringify(res, undefined, 2));
        // we find the "best" uri
        var bestURI = undefined;
        res.forEach((qr, index) => {
            var domain = qr.domain;
            if (!bestURI && qr.results.length && domain) {
                var uriCategories = index_model_1.Model.getShowURICategoriesForDomain(theModel, domain);
                var uriCategory = uriCategories[0];
                // EXTEND: do some priorization and search for all
                if (uriCategory &&
                    ((qr.columns.indexOf(uriCategory) >= 0)
                        || qr.auxcolumns.indexOf(uriCategory) >= 0)) {
                    //var colIndex = qr.columns.indexOf(showMeCategories[0]);
                    qr.results.forEach(res => {
                        debuglog(() => 'result + ' + JSON.stringify(res));
                        if (!bestURI && res[uriCategory]) {
                            bestURI = res[uriCategory];
                        }
                    });
                }
            }
        });
        return Object.assign(res, { bestURI: bestURI });
    });
}
exports.listShowMe = listShowMe;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9tb25nb3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFHSCxnQ0FBZ0M7QUFFaEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLDBDQUEwQztBQUMxQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzFDLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQVMyQixDQUFDO0FBRVQsQ0FBQztBQUdLLENBQUM7QUFDdEQsc0RBQTZDO0FBQzdDLGtEQUFtRDtBQUFBLENBQUM7QUFFcEQsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBRWhCLHVCQUF1QjtBQUN2QiwrQkFBK0I7QUFDL0IsbUNBQW1DO0FBRW5DLFNBQWdCLE9BQU8sQ0FBQyxLQUFhLEVBQUUsUUFBd0I7SUFDN0QsT0FBTyxxQkFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUN2QyxHQUFHLENBQUMsRUFBRTtRQUNKLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUMsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQVBELDBCQU9DO0FBQ0s7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBMEJIO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLEtBQWEsRUFBRSxRQUF3QjtJQUNoRSx5QkFBeUI7SUFDekIsd0NBQXdDO0lBQ3hDLEVBQUU7SUFDRixPQUFPLHFCQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUNsRCxHQUFHLENBQUMsRUFBRTtRQUNKLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSx5QkFBeUI7UUFDekIsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDeEIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRTtnQkFDM0MsSUFBSSxhQUFhLEdBQUcsbUJBQUssQ0FBQyw2QkFBNkIsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzFFLElBQUksV0FBVyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsa0RBQWtEO2dCQUNsRCxJQUFJLFdBQVc7b0JBQ1gsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzsyQkFDckMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQzdDO29CQUNBLHlEQUF5RDtvQkFDekQsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ3ZCLFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDaEMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQzt5QkFDNUI7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7aUJBQ0o7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELENBQUMsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQWhDRCxnQ0FnQ0MiLCJmaWxlIjoibWF0Y2gvbW9uZ29xdWVyaWVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQG1vZHVsZSBqZnNlYi5mZGV2c3RhcnQuYW5hbHl6ZVxuICogQGZpbGUgYW5hbHl6ZS50c1xuICogQGNvcHlyaWdodCAoYykgMjAxNiBHZXJkIEZvcnN0bWFublxuICovXG5cblxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcblxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnbW9uZ29xdWVyaWVzJyk7XG5pbXBvcnQgKiBhcyBsb2dnZXIgZnJvbSAnLi4vdXRpbHMvbG9nZ2VyJztcbnZhciBsb2dQZXJmID0gbG9nZ2VyLnBlcmYoXCJtb25nb3F1ZXJpZXNcIik7XG52YXIgcGVyZmxvZyA9IGRlYnVnKCdwZXJmJyk7XG4vL2NvbnN0IHBlcmZsb2cgPSBsb2dnZXIucGVyZihcInBlcmZsaXN0YWxsXCIpO1xuXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICdhYm90X3V0aWxzJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuL2lmbWF0Y2gnO1xuXG5pbXBvcnQgeyBCcmVha0Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cbmltcG9ydCB7IFNlbnRlbmNlIGFzIFNlbnRlbmNlIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJzs7XG5cbmltcG9ydCB7IFdvcmQgYXMgV29yZCB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7O1xuaW1wb3J0ICogYXMgT3BlcmF0b3IgZnJvbSAnLi9vcGVyYXRvcic7XG5pbXBvcnQgKiBhcyBXaGF0SXMgZnJvbSAnLi93aGF0aXMnO1xuaW1wb3J0IHsgRXJFcnJvciBhcyBFckVycm9yIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJzs7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcbmltcG9ydCB7IE1vbmdvUSBhcyBNb25nb1EgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcblxudmFyIHNXb3JkcyA9IHt9O1xuXG4vKiB3ZSBoYXZlIHNlbnRlbmNlcyAqL1xuLyogc2VudGVuY2VzIGxlYWQgdG8gcXVlcmllcyAqL1xuLyogcXVlcmllcyBoYXZlIGNvbHVtbnMsIHJlc3VsdHMgKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RBbGwocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogUHJvbWlzZTxNb25nb1EuSVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xuICByZXR1cm4gTW9uZ29RLnF1ZXJ5KHF1ZXJ5LCB0aGVNb2RlbCkudGhlbihcbiAgICByZXMgPT4ge1xuICAgICAgZGVidWdsb2coKCkgPT4gJ2dvdCBhIHF1ZXJ5IHJlc3VsdCcgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICk7XG59XG4gICAgICAvKlxuICAgICAgdmFyIHR1cGVsYW5zd2VycyA9IFtdIGFzIElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXJbXTtcbiAgICAgIHJlcy5xdWVyeXJlc3VsdHMubWFwKChxciwgaW5kZXgpID0+IHtcbiAgICAgICAgcXIucmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICB0dXBlbGFuc3dlcnMucHVzaCh7XG4gICAgICAgICAgICByZWNvcmQ6IHt9LFxuICAgICAgICAgICAgY2F0ZWdvcmllczogcXIuY29sdW1ucyxcbiAgICAgICAgICAgIHNlbnRlbmNlOiBxci5zZW50ZW5jZSxcbiAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxuICAgICAgICAgICAgX3Jhbmtpbmc6IDEuMCAvLyByZXMuc2VudGVuY2VzW2luZGV4XS5fcmFua2luZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHVwZWxhbnN3ZXJzOiB0dXBlbGFuc3dlcnMsXG4gICAgICAgIGVycm9yczogcmVzLmVycm9ycyxcbiAgICAgICAgdG9rZW5zOiByZXMudG9rZW5zXG4gICAgICB9XG4gICAgfVxuICApXG59XG5cbi8qKlxuICogUXVlcnkgZm9yIGEgc2hvd01lIHJlc3VsdFxuICogQHBhcmFtIHF1ZXJ5XG4gKiBAcGFyYW0gdGhlTW9kZWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RTaG93TWUocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogUHJvbWlzZTxNb25nb1EuSVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xuICAvLyBUb2RvOiBwcmVwcm9jZXNzIHF1ZXJ5XG4gIC8vIFNob3cgbWUgRkFjdCA9PiAgdXJsIHdpdGggQ0FUIGlzIEZBQ1RcbiAgLy9cbiAgcmV0dXJuIE1vbmdvUS5xdWVyeVdpdGhVUkkocXVlcnksIHRoZU1vZGVsLCBbXSkudGhlbihcbiAgICByZXMgPT4ge1xuICAgICAgZGVidWdsb2coKCkgPT4gJ2dvdCBhIHF1ZXJ5IHJlc3VsdCcgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgLy8gd2UgZmluZCB0aGUgXCJiZXN0XCIgdXJpXG4gICAgICB2YXIgYmVzdFVSSSA9IHVuZGVmaW5lZDtcbiAgICAgIHJlcy5mb3JFYWNoKChxciwgaW5kZXgpID0+IHtcbiAgICAgICAgdmFyIGRvbWFpbiA9IHFyLmRvbWFpbjtcbiAgICAgICAgaWYgKCFiZXN0VVJJICYmIHFyLnJlc3VsdHMubGVuZ3RoICYmIGRvbWFpbikge1xuICAgICAgICAgIHZhciB1cmlDYXRlZ29yaWVzID0gTW9kZWwuZ2V0U2hvd1VSSUNhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XG4gICAgICAgICAgdmFyIHVyaUNhdGVnb3J5ID0gdXJpQ2F0ZWdvcmllc1swXTtcbiAgICAgICAgICAvLyBFWFRFTkQ6IGRvIHNvbWUgcHJpb3JpemF0aW9uIGFuZCBzZWFyY2ggZm9yIGFsbFxuICAgICAgICAgIGlmICh1cmlDYXRlZ29yeSAmJlxuICAgICAgICAgICAgICAoKCBxci5jb2x1bW5zLmluZGV4T2YodXJpQ2F0ZWdvcnkpID49IDApXG4gICAgICAgICAgICAgIHx8IHFyLmF1eGNvbHVtbnMuaW5kZXhPZih1cmlDYXRlZ29yeSkgPj0gMCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAvL3ZhciBjb2xJbmRleCA9IHFyLmNvbHVtbnMuaW5kZXhPZihzaG93TWVDYXRlZ29yaWVzWzBdKTtcbiAgICAgICAgICAgIHFyLnJlc3VsdHMuZm9yRWFjaChyZXMgPT4ge1xuICAgICAgICAgICAgICBkZWJ1Z2xvZygoKT0+ICdyZXN1bHQgKyAnICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XG4gICAgICAgICAgICAgIGlmICghYmVzdFVSSSAmJiByZXNbdXJpQ2F0ZWdvcnldKSB7XG4gICAgICAgICAgICAgICAgYmVzdFVSSSA9IHJlc1t1cmlDYXRlZ29yeV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihyZXMsIHsgYmVzdFVSSTogYmVzdFVSSSB9KTtcbiAgICB9XG4gICk7XG59XG4iXX0=
