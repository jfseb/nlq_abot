"use strict";
/**
 * @file word
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Word specific qualifications,
 *
 * These functions expose parf the underlying model,
 * e.g.
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordType = exports.Word = exports.Category = void 0;
const index_model_1 = require("../model/index_model");
const debug = require("debugf");
var debuglog = debug('word');
exports.Category = {
    CAT_CATEGORY: "category",
    CAT_DOMAIN: "domain",
    CAT_OPERATOR: "operator",
    CAT_FILLER: "filler",
    CAT_NUMBER: "number",
    CAT_TOOL: "tool",
    CAT_ANY: "any",
    _aCatFillers: ["filler"],
    isDomain: function (sCategory) {
        return sCategory === exports.Category.CAT_DOMAIN;
    },
    isCategory: function (sCategory) {
        return sCategory === exports.Category.CAT_CATEGORY;
    },
    isFiller: function (sCategory) {
        return exports.Category._aCatFillers.indexOf(sCategory) >= 0;
    }
};
exports.Word = {
    isFiller: function (word) {
        return word.category === undefined || exports.Category.isFiller(word.category);
    },
    isCategory: function (word) {
        return exports.Category.isCategory(word.category);
    },
    isDomain: function (word) {
        if (word.rule && word.rule.wordType) {
            return word.rule.wordType === 'D' /* WORDTYPE_D */;
        }
        return exports.Category.isDomain(word.category);
    }
};
exports.WordType = {
    CAT_CATEGORY: "category",
    CAT_DOMAIN: "domain",
    CAT_FILLER: "filler",
    CAT_OPERATOR: "operator",
    CAT_TOOL: "tool",
    _aCatFillers: ["filler"],
    isDomain: function (sCategory) {
        return sCategory === exports.Category.CAT_DOMAIN;
    },
    isCategory: function (sCategory) {
        return sCategory === exports.Category.CAT_CATEGORY;
    },
    isFiller: function (sCategory) {
        return exports.Category._aCatFillers.indexOf(sCategory) >= 0;
    },
    fromCategoryString: function (sCategory) {
        if (sCategory == exports.Category.CAT_CATEGORY)
            return index_model_1.IFModel.WORDTYPE.CATEGORY;
        if (sCategory == exports.Category.CAT_OPERATOR)
            return index_model_1.IFModel.WORDTYPE.OPERATOR;
        if (sCategory == exports.Category.CAT_FILLER)
            return index_model_1.IFModel.WORDTYPE.FILLER;
        if (sCategory == exports.Category.CAT_NUMBER) {
            //console.log("This is N? " + IFModel.WORDTYPE.NUMERICARG);
            return index_model_1.IFModel.WORDTYPE.NUMERICARG; // "N";
        }
        if (sCategory == exports.Category.CAT_DOMAIN)
            return index_model_1.IFModel.WORDTYPE.DOMAIN;
        if (sCategory == exports.Category.CAT_TOOL)
            return index_model_1.IFModel.WORDTYPE.TOOL;
        if (sCategory == exports.Category.CAT_ANY)
            return index_model_1.IFModel.WORDTYPE.ANY;
        debug(" unable to map to category " + sCategory);
        return undefined;
    }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxJQUFJLFNBQVMsSUFBSSxnQkFBUSxDQUFDLFVBQVUsRUFDcEM7WUFDRSwyREFBMkQ7WUFDM0QsT0FBTyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO1NBQzVDO1FBQ0QsSUFBSSxTQUFTLElBQUksZ0JBQVEsQ0FBQyxVQUFVO1lBQ2xDLE9BQU8scUJBQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ2pDLElBQUksU0FBUyxJQUFJLGdCQUFRLENBQUMsUUFBUTtZQUNoQyxPQUFPLHFCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUMvQixJQUFLLFNBQVMsSUFBSSxnQkFBUSxDQUFDLE9BQU87WUFDaEMsT0FBTyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDOUIsS0FBSyxDQUFDLDZCQUE2QixHQUFHLFNBQVMsQ0FBRSxDQUFDO1FBQ2xELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRixDQUFBIiwiZmlsZSI6Im1hdGNoL3dvcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGZpbGUgd29yZFxyXG4gKiBAbW9kdWxlIGpmc2ViLmZkZXZzdGFydC5zZW50ZW5jZVxyXG4gKiBAY29weXJpZ2h0IChjKSBHZXJkIEZvcnN0bWFublxyXG4gKlxyXG4gKiBXb3JkIHNwZWNpZmljIHF1YWxpZmljYXRpb25zLFxyXG4gKlxyXG4gKiBUaGVzZSBmdW5jdGlvbnMgZXhwb3NlIHBhcmYgdGhlIHVuZGVybHlpbmcgbW9kZWwsXHJcbiAqIGUuZy5cclxuICogTWF0Y2ggYSB0b29sIHJlY29yZCBvbiBhIHNlbnRlbmNlLFxyXG4gKlxyXG4gKiBUaGlzIHdpbGwgdW5pZnkgbWF0Y2hpbmcgcmVxdWlyZWQgYW5kIG9wdGlvbmFsIGNhdGVnb3J5IHdvcmRzXHJcbiAqIHdpdGggdGhlIHJlcXVpcmVtZW50cyBvZiB0aGUgdG9vbC5cclxuICpcclxuICovXHJcblxyXG4vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9saWIvbm9kZS00LmQudHNcIiAvPlxyXG5cclxuLy8gaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWcnO1xyXG5cclxuLy8gaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMvdXRpbHMnO1xyXG5cclxuaW1wb3J0ICogYXMgSU1hdGNoIGZyb20gJy4vaWZlcmJhc2UnO1xyXG5pbXBvcnQgeyBJRk1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5cclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1Zygnd29yZCcpO1xyXG5cclxuZXhwb3J0IGNvbnN0IENhdGVnb3J5ID0ge1xyXG4gIENBVF9DQVRFR09SWSA6ICBcImNhdGVnb3J5XCIsXHJcbiAgQ0FUX0RPTUFJTiA6ICBcImRvbWFpblwiLFxyXG4gIENBVF9PUEVSQVRPUiA6IFwib3BlcmF0b3JcIixcclxuICBDQVRfRklMTEVSIDogXCJmaWxsZXJcIixcclxuICBDQVRfTlVNQkVSIDogXCJudW1iZXJcIixcclxuICBDQVRfVE9PTCA6IFwidG9vbFwiLFxyXG4gIENBVF9BTlkgIDogXCJhbnlcIixcclxuICBfYUNhdEZpbGxlcnMgOiBbXCJmaWxsZXJcIl0sXHJcbiAgaXNEb21haW4gOiBmdW5jdGlvbihzQ2F0ZWdvcnkgOiBzdHJpbmcgKSAgOiBib29sZWFue1xyXG4gICAgcmV0dXJuIHNDYXRlZ29yeSA9PT0gQ2F0ZWdvcnkuQ0FUX0RPTUFJTjtcclxuICB9LFxyXG4gIGlzQ2F0ZWdvcnkgOiBmdW5jdGlvbihzQ2F0ZWdvcnkgOiBzdHJpbmcgKSAgOiBib29sZWFue1xyXG4gICAgcmV0dXJuIHNDYXRlZ29yeSA9PT0gQ2F0ZWdvcnkuQ0FUX0NBVEVHT1JZO1xyXG4gIH0sXHJcbiAgaXNGaWxsZXI6IGZ1bmN0aW9uKHNDYXRlZ29yeSA6IHN0cmluZykgOiBib29sZWFuIHtcclxuICAgIHJldHVybiBDYXRlZ29yeS5fYUNhdEZpbGxlcnMuaW5kZXhPZihzQ2F0ZWdvcnkpID49IDA7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgV29yZCA9IHtcclxuICBpc0ZpbGxlciA6IGZ1bmN0aW9uKHdvcmQgOiBJTWF0Y2guSVdvcmQpIDogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gd29yZC5jYXRlZ29yeSA9PT0gdW5kZWZpbmVkIHx8IENhdGVnb3J5LmlzRmlsbGVyKHdvcmQuY2F0ZWdvcnkpO1xyXG4gIH0sXHJcbiAgaXNDYXRlZ29yeSA6IGZ1bmN0aW9uKHdvcmQgOiBJTWF0Y2guSVdvcmQpIDogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gQ2F0ZWdvcnkuaXNDYXRlZ29yeSh3b3JkLmNhdGVnb3J5KTtcclxuICB9LFxyXG4gIGlzRG9tYWluIDogZnVuY3Rpb24od29yZCA6IElNYXRjaC5JV29yZCkgOiBib29sZWFuIHtcclxuICAgIGlmKHdvcmQucnVsZSAmJiB3b3JkLnJ1bGUud29yZFR5cGUpIHtcclxuICAgICAgcmV0dXJuIHdvcmQucnVsZS53b3JkVHlwZSA9PT0gJ0QnIC8qIFdPUkRUWVBFX0QgKi87XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQ2F0ZWdvcnkuaXNEb21haW4od29yZC5jYXRlZ29yeSk7XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBXb3JkVHlwZSA9IHtcclxuICBDQVRfQ0FURUdPUlkgOiAgXCJjYXRlZ29yeVwiLFxyXG4gIENBVF9ET01BSU4gOiAgXCJkb21haW5cIixcclxuICBDQVRfRklMTEVSIDogXCJmaWxsZXJcIixcclxuICBDQVRfT1BFUkFUT1I6IFwib3BlcmF0b3JcIixcclxuICBDQVRfVE9PTCA6IFwidG9vbFwiLFxyXG4gIF9hQ2F0RmlsbGVycyA6IFtcImZpbGxlclwiXSxcclxuICBpc0RvbWFpbiA6IGZ1bmN0aW9uKHNDYXRlZ29yeSA6IHN0cmluZyApICA6IGJvb2xlYW57XHJcbiAgICByZXR1cm4gc0NhdGVnb3J5ID09PSBDYXRlZ29yeS5DQVRfRE9NQUlOO1xyXG4gIH0sXHJcbiAgaXNDYXRlZ29yeSA6IGZ1bmN0aW9uKHNDYXRlZ29yeSA6IHN0cmluZyApICA6IGJvb2xlYW57XHJcbiAgICByZXR1cm4gc0NhdGVnb3J5ID09PSBDYXRlZ29yeS5DQVRfQ0FURUdPUlk7XHJcbiAgfSxcclxuICBpc0ZpbGxlcjogZnVuY3Rpb24oc0NhdGVnb3J5IDogc3RyaW5nKSA6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIENhdGVnb3J5Ll9hQ2F0RmlsbGVycy5pbmRleE9mKHNDYXRlZ29yeSkgPj0gMDtcclxuICB9LFxyXG4gIGZyb21DYXRlZ29yeVN0cmluZzogZnVuY3Rpb24oc0NhdGVnb3J5IDogc3RyaW5nKSA6IHN0cmluZ1xyXG4gIHtcclxuICAgIGlmKCBzQ2F0ZWdvcnkgPT0gQ2F0ZWdvcnkuQ0FUX0NBVEVHT1JZIClcclxuICAgICAgcmV0dXJuIElGTW9kZWwuV09SRFRZUEUuQ0FURUdPUlk7XHJcbiAgICBpZiggc0NhdGVnb3J5ID09IENhdGVnb3J5LkNBVF9PUEVSQVRPUiApXHJcbiAgICAgIHJldHVybiBJRk1vZGVsLldPUkRUWVBFLk9QRVJBVE9SO1xyXG4gICAgaWYoIHNDYXRlZ29yeSA9PSBDYXRlZ29yeS5DQVRfRklMTEVSIClcclxuICAgICAgcmV0dXJuIElGTW9kZWwuV09SRFRZUEUuRklMTEVSO1xyXG4gICAgaWYoIHNDYXRlZ29yeSA9PSBDYXRlZ29yeS5DQVRfTlVNQkVSIClcclxuICAgIHtcclxuICAgICAgLy9jb25zb2xlLmxvZyhcIlRoaXMgaXMgTj8gXCIgKyBJRk1vZGVsLldPUkRUWVBFLk5VTUVSSUNBUkcpO1xyXG4gICAgICByZXR1cm4gSUZNb2RlbC5XT1JEVFlQRS5OVU1FUklDQVJHOyAvLyBcIk5cIjtcclxuICAgIH1cclxuICAgIGlmKCBzQ2F0ZWdvcnkgPT0gQ2F0ZWdvcnkuQ0FUX0RPTUFJTiApXHJcbiAgICAgIHJldHVybiBJRk1vZGVsLldPUkRUWVBFLkRPTUFJTjtcclxuICAgIGlmKCBzQ2F0ZWdvcnkgPT0gQ2F0ZWdvcnkuQ0FUX1RPT0wgKVxyXG4gICAgICByZXR1cm4gSUZNb2RlbC5XT1JEVFlQRS5UT09MO1xyXG4gICAgaWYgKCBzQ2F0ZWdvcnkgPT0gQ2F0ZWdvcnkuQ0FUX0FOWSApXHJcbiAgICAgIHJldHVybiBJRk1vZGVsLldPUkRUWVBFLkFOWTtcclxuICAgIGRlYnVnKFwiIHVuYWJsZSB0byBtYXAgdG8gY2F0ZWdvcnkgXCIgKyBzQ2F0ZWdvcnkgKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcbiJdfQ==
