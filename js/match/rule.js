"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmpMRule = exports.compareMRuleFull = exports.oKeyOrder = void 0;
exports.oKeyOrder = ["systemObjectCategory", "systemId", "systemObjectId"];
function compareMRuleFull(a, b) {
    var r = a.category.localeCompare(b.category);
    if (r) {
        return r;
    }
    r = a.type - b.type;
    if (r) {
        return r;
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    if (a.word && b.word) {
        var r = a.word.localeCompare(b.word);
        if (r) {
            return r;
        }
    }
    r = (a._ranking || 1.0) - (b._ranking || 1.0);
    if (r) {
        return r;
    }
    if (a.exactOnly && !b.exactOnly) {
        return -1;
    }
    if (b.exactOnly && !a.exactOnly) {
        return +1;
    }
    return 0;
}
exports.compareMRuleFull = compareMRuleFull;
function cmpMRule(a, b) {
    var r = a.category.localeCompare(b.category);
    if (r) {
        return r;
    }
    r = a.type - b.type;
    if (r) {
        return r;
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    if (a.word && b.word) {
        r = a.word.localeCompare(b.word);
        if (r) {
            return r;
        }
    }
    if (typeof a._ranking === "number" && typeof b._ranking === "number") {
        r = (a._ranking || 1.0) - (b._ranking || 1.0);
        if (r) {
            return r;
        }
    }
    r = a.wordType.localeCompare(b.wordType);
    if (r) {
        return r;
    }
    r = a.bitindex - b.bitindex;
    if (r) {
        return r;
    }
    if (a.range && b.range) {
        r = a.range.rule.word.localeCompare(b.range.rule.word);
        if (r) {
            return r;
        }
        r = a.range.low - b.range.low;
        if (r) {
            return r;
        }
    }
    if (a.range && !b.range) {
        return -1;
    }
    if (!a.range && b.range) {
        return +1;
    }
    return 0;
}
exports.cmpMRule = cmpMRule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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IiwiZmlsZSI6Im1hdGNoL3J1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuL2lmbWF0Y2gnO1xyXG5cclxuaW1wb3J0ICogYXMgTW9kZWwgZnJvbSAnLi4vbW9kZWwvbW9kZWwnO1xyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBvS2V5T3JkZXI6IEFycmF5PFN0cmluZz4gPSBbXCJzeXN0ZW1PYmplY3RDYXRlZ29yeVwiLCBcInN5c3RlbUlkXCIsIFwic3lzdGVtT2JqZWN0SWRcIl07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVNUnVsZUZ1bGwoYTogSU1hdGNoLm1SdWxlLCBiOiBJTWF0Y2gubVJ1bGUpIHtcclxuICB2YXIgciA9IGEuY2F0ZWdvcnkubG9jYWxlQ29tcGFyZShiLmNhdGVnb3J5KTtcclxuICBpZiAocikge1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG4gIHIgPSBhLnR5cGUgLSBiLnR5cGU7XHJcbiAgaWYgKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICBpZiAoYS5tYXRjaGVkU3RyaW5nICYmIGIubWF0Y2hlZFN0cmluZykge1xyXG4gICAgciA9IGEubWF0Y2hlZFN0cmluZy5sb2NhbGVDb21wYXJlKGIubWF0Y2hlZFN0cmluZyk7XHJcbiAgICBpZiAocikge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuICB9XHJcbiAgaWYgKGEud29yZCAmJiBiLndvcmQpIHtcclxuICAgIHZhciByID0gYS53b3JkLmxvY2FsZUNvbXBhcmUoYi53b3JkKTtcclxuICAgIGlmKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHIgPSAoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKTtcclxuICBpZihyKSB7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcbiAgaWYoYS5leGFjdE9ubHkgJiYgIWIuZXhhY3RPbmx5KSB7XHJcbiAgICByZXR1cm4gLTE7XHJcbiAgfVxyXG4gIGlmKGIuZXhhY3RPbmx5ICYmICFhLmV4YWN0T25seSkge1xyXG4gICAgcmV0dXJuICsxO1xyXG4gIH1cclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNtcE1SdWxlKGE6IElNYXRjaC5tUnVsZSwgYjogSU1hdGNoLm1SdWxlKSB7XHJcbiAgdmFyIHIgPSBhLmNhdGVnb3J5LmxvY2FsZUNvbXBhcmUoYi5jYXRlZ29yeSk7XHJcbiAgaWYgKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICByID0gYS50eXBlIC0gYi50eXBlO1xyXG4gIGlmIChyKSB7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcbiAgaWYgKGEubWF0Y2hlZFN0cmluZyAmJiBiLm1hdGNoZWRTdHJpbmcpIHtcclxuICAgIHIgPSBhLm1hdGNoZWRTdHJpbmcubG9jYWxlQ29tcGFyZShiLm1hdGNoZWRTdHJpbmcpO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChhLndvcmQgJiYgYi53b3JkKSB7XHJcbiAgICByID0gYS53b3JkLmxvY2FsZUNvbXBhcmUoYi53b3JkKTtcclxuICAgIGlmKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmKHR5cGVvZiBhLl9yYW5raW5nID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBiLl9yYW5raW5nID09PSBcIm51bWJlclwiKSB7XHJcbiAgICByID0gKGEuX3JhbmtpbmcgfHwgMS4wKSAtIChiLl9yYW5raW5nIHx8IDEuMCk7XHJcbiAgICBpZihyKSB7XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gIH1cclxuICByID0gYS53b3JkVHlwZS5sb2NhbGVDb21wYXJlKGIud29yZFR5cGUpO1xyXG4gIGlmIChyKSB7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcbiAgciA9IGEuYml0aW5kZXggLSBiLmJpdGluZGV4O1xyXG4gIGlmIChyKSB7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcbiAgaWYoYS5yYW5nZSAmJiBiLnJhbmdlKSB7XHJcbiAgICByID0gYS5yYW5nZS5ydWxlLndvcmQubG9jYWxlQ29tcGFyZShiLnJhbmdlLnJ1bGUud29yZCk7XHJcbiAgICBpZiAocikge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuICAgIHIgPSBhLnJhbmdlLmxvdyAtIGIucmFuZ2UubG93O1xyXG4gICAgaWYocikge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmKGEucmFuZ2UgJiYgIWIucmFuZ2UpIHtcclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcblxyXG4gIGlmKCFhLnJhbmdlICYmIGIucmFuZ2UpIHtcclxuICAgIHJldHVybiArMTtcclxuICB9XHJcblxyXG4gIHJldHVybiAwO1xyXG5cclxufVxyXG4iXX0=
