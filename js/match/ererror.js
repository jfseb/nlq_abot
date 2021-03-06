"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainError = exports.makeError_EMPTY_INPUT = exports.makeError_OFFENDING_WORD = exports.makeError_NO_KNOWN_WORD = void 0;
const debug = require("debug");
const debuglog = debug('erbase');
const debuglogV = debug('erbase');
const perflog = debug('perf');
const AnyObject = Object;
//import { IFModel as IFModel} from 'fdevsta_monmove';
const IMatch = require("./iferbase");
function makeError_NO_KNOWN_WORD(index, tokens) {
    if (index < 0 || index >= tokens.length) {
        throw Error("invalid index in Error construction " + index + "tokens.lenth=" + tokens.length);
    }
    return {
        err_code: IMatch.ERR_NO_KNOWN_WORD,
        text: `I do not understand "${tokens[index]}".`,
        context: {
            tokens: tokens,
            token: tokens[index],
            index: index
        }
    };
}
exports.makeError_NO_KNOWN_WORD = makeError_NO_KNOWN_WORD;
function makeError_OFFENDING_WORD(word, tokens, index) {
    return {
        err_code: IMatch.ERR_NO_KNOWN_WORD,
        text: `I do not understand "${word}".`,
        context: {
            tokens: tokens,
            token: tokens[index],
            index: index
        }
    };
}
exports.makeError_OFFENDING_WORD = makeError_OFFENDING_WORD;
function makeError_EMPTY_INPUT() {
    return {
        err_code: IMatch.ERR_EMPTY_INPUT,
        text: `I did not get an input.`,
    };
}
exports.makeError_EMPTY_INPUT = makeError_EMPTY_INPUT;
function explainError(errors) {
    if (errors.length) {
        return "\n" + errors.map(err => err.text).join("\n");
    }
    return;
}
exports.explainError = explainError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9lcmVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFLSCwrQkFBK0I7QUFFL0IsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFJOUIsTUFBTSxTQUFTLEdBQVEsTUFBTSxDQUFDO0FBSzlCLHNEQUFzRDtBQUN0RCxxQ0FBcUM7QUFFckMsU0FBZ0IsdUJBQXVCLENBQUMsS0FBYyxFQUFFLE1BQWlCO0lBQ3JFLElBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUN0QyxNQUFNLEtBQUssQ0FBQyxzQ0FBc0MsR0FBRyxLQUFLLEdBQUcsZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMvRjtJQUNILE9BQU87UUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtRQUNsQyxJQUFJLEVBQUcsd0JBQXdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSTtRQUNoRCxPQUFPLEVBQUc7WUFDUixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssRUFBRyxLQUFLO1NBQ2Q7S0FDOEIsQ0FBQztBQUNwQyxDQUFDO0FBYkQsMERBYUM7QUFFRCxTQUFnQix3QkFBd0IsQ0FBQyxJQUFhLEVBQUUsTUFBZ0IsRUFBRSxLQUFjO0lBQ3hGLE9BQU87UUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtRQUNsQyxJQUFJLEVBQUcsd0JBQXdCLElBQUksSUFBSTtRQUN2QyxPQUFPLEVBQUc7WUFDUixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssRUFBRyxLQUFLO1NBQ2Q7S0FDOEIsQ0FBQztBQUNsQyxDQUFDO0FBVkQsNERBVUM7QUFJRCxTQUFnQixxQkFBcUI7SUFDbkMsT0FBTztRQUNMLFFBQVEsRUFBRSxNQUFNLENBQUMsZUFBZTtRQUNoQyxJQUFJLEVBQUcseUJBQXlCO0tBQ2QsQ0FBQztBQUN2QixDQUFDO0FBTEQsc0RBS0M7QUFFRCxTQUFnQixZQUFZLENBQUMsTUFBMEI7SUFDckQsSUFBRyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2hCLE9BQU8sSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3REO0lBQ0QsT0FBTztBQUNULENBQUM7QUFMRCxvQ0FLQyIsImZpbGUiOiJtYXRjaC9lcmVycm9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqXHJcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LmFuYWx5emVcclxuICogQGZpbGUgZXJiYXNlXHJcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYgR2VyZCBGb3JzdG1hbm5cclxuICpcclxuICogQmFzaWMgZG9tYWluIGJhc2VkIGVudGl0eSByZWNvZ25pdGlvblxyXG4gKi9cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBJbnB1dEZpbHRlciBmcm9tICcuL2lucHV0RmlsdGVyJztcclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcclxuXHJcbmNvbnN0IGRlYnVnbG9nID0gZGVidWcoJ2VyYmFzZScpO1xyXG5jb25zdCBkZWJ1Z2xvZ1YgPSBkZWJ1ZygnZXJiYXNlJyk7XHJcbmNvbnN0IHBlcmZsb2cgPSBkZWJ1ZygncGVyZicpO1xyXG5cclxuaW1wb3J0IHsgQnJlYWtEb3duICBhcyBicmVha2Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcblxyXG5jb25zdCBBbnlPYmplY3QgPSA8YW55Pk9iamVjdDtcclxuXHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdhYm90X3V0aWxzJztcclxuXHJcbi8vaW1wb3J0IHsgSUZNb2RlbCBhcyBJRk1vZGVsfSBmcm9tICdmZGV2c3RhX21vbm1vdmUnO1xyXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZmVyYmFzZSc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUVycm9yX05PX0tOT1dOX1dPUkQoaW5kZXggOiBudW1iZXIsIHRva2VucyA6IHN0cmluZ1tdKSA6SU1hdGNoLklFUkVycm9yTk9fS05PV05fV09SRCB7XHJcbiAgICBpZihpbmRleCA8IDAgfHwgaW5kZXggPj0gdG9rZW5zLmxlbmd0aCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihcImludmFsaWQgaW5kZXggaW4gRXJyb3IgY29uc3RydWN0aW9uIFwiICsgaW5kZXggKyBcInRva2Vucy5sZW50aD1cIiArIHRva2Vucy5sZW5ndGgpO1xyXG4gICAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBlcnJfY29kZTogSU1hdGNoLkVSUl9OT19LTk9XTl9XT1JELFxyXG4gICAgdGV4dCA6IGBJIGRvIG5vdCB1bmRlcnN0YW5kIFwiJHt0b2tlbnNbaW5kZXhdfVwiLmAsXHJcbiAgICBjb250ZXh0IDoge1xyXG4gICAgICB0b2tlbnM6IHRva2VucyxcclxuICAgICAgdG9rZW4gOiB0b2tlbnNbaW5kZXhdLFxyXG4gICAgICBpbmRleCA6IGluZGV4XHJcbiAgICB9XHJcbiAgfSBhcyBJTWF0Y2guSUVSRXJyb3JOT19LTk9XTl9XT1JEO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUVycm9yX09GRkVORElOR19XT1JEKHdvcmQgOiBzdHJpbmcsIHRva2Vuczogc3RyaW5nW10sIGluZGV4IDogbnVtYmVyKSA6SU1hdGNoLklFUkVycm9yTk9fS05PV05fV09SRCB7XHJcbnJldHVybiB7XHJcbiAgZXJyX2NvZGU6IElNYXRjaC5FUlJfTk9fS05PV05fV09SRCxcclxuICB0ZXh0IDogYEkgZG8gbm90IHVuZGVyc3RhbmQgXCIke3dvcmR9XCIuYCxcclxuICBjb250ZXh0IDoge1xyXG4gICAgdG9rZW5zOiB0b2tlbnMsXHJcbiAgICB0b2tlbiA6IHRva2Vuc1tpbmRleF0sXHJcbiAgICBpbmRleCA6IGluZGV4XHJcbiAgfVxyXG59IGFzIElNYXRjaC5JRVJFcnJvck5PX0tOT1dOX1dPUkQ7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VFcnJvcl9FTVBUWV9JTlBVVCggKSA6SU1hdGNoLklFUkVycm9yIHtcclxuICByZXR1cm4ge1xyXG4gICAgZXJyX2NvZGU6IElNYXRjaC5FUlJfRU1QVFlfSU5QVVQsXHJcbiAgICB0ZXh0IDogYEkgZGlkIG5vdCBnZXQgYW4gaW5wdXQuYCxcclxuICB9IGFzIElNYXRjaC5JRVJFcnJvcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4cGxhaW5FcnJvcihlcnJvcnMgOiBJTWF0Y2guSUVSRXJyb3JbXSkge1xyXG4gIGlmKGVycm9ycy5sZW5ndGgpIHtcclxuICAgIHJldHVybiBcIlxcblwiICsgZXJyb3JzLm1hcChlcnIgPT4gZXJyLnRleHQpLmpvaW4oXCJcXG5cIik7XHJcbiAgfVxyXG4gIHJldHVybjtcclxufSJdfQ==
