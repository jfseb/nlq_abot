"use strict";
/**
 * @file operator
 * @module jfseb.fdevstart.operator
 * @copyright (c) Gerd Forstmann
 *
 * Operator implementation
 *
 * These functions expose parf the underlying model,
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matches = void 0;
/**
 * Note: both arguments are expected to be lowercased
 */
function matches(operator, fragmentLC, strLC) {
    if (!strLC) {
        return false;
    }
    switch (operator.operator) {
        case "starting with":
            return strLC.indexOf(fragmentLC) === 0;
        case "containing":
            return strLC.indexOf(fragmentLC) >= 0;
        case "ending with":
            return strLC.length >= fragmentLC.length &&
                strLC.substring(strLC.length - fragmentLC.length) === fragmentLC;
        default:
            throw new Error('Unknown operator or illegal operator usage: ' + operator.operator);
    }
    //return false;
}
exports.matches = matches;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9vcGVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7QUFXSDs7R0FFRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxRQUEyQixFQUFFLFVBQW1CLEVBQUUsS0FBYztJQUN0RixJQUFHLENBQUMsS0FBSyxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELFFBQU8sUUFBUSxDQUFDLFFBQVEsRUFBRTtRQUN4QixLQUFLLGVBQWU7WUFDbEIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxLQUFLLFlBQVk7WUFDZixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLEtBQUssYUFBYTtZQUNoQixPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksVUFBVSxDQUFDLE1BQU07Z0JBQ3RDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDO1FBQ3JFO1lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDdkY7SUFDRCxlQUFlO0FBQ2pCLENBQUM7QUFoQkQsMEJBZ0JDIiwiZmlsZSI6Im1hdGNoL29wZXJhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSBvcGVyYXRvclxuICogQG1vZHVsZSBqZnNlYi5mZGV2c3RhcnQub3BlcmF0b3JcbiAqIEBjb3B5cmlnaHQgKGMpIEdlcmQgRm9yc3RtYW5uXG4gKlxuICogT3BlcmF0b3IgaW1wbGVtZW50YXRpb25cbiAqXG4gKiBUaGVzZSBmdW5jdGlvbnMgZXhwb3NlIHBhcmYgdGhlIHVuZGVybHlpbmcgbW9kZWwsXG4gKlxuICovXG5cbi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xpYi9ub2RlLTQuZC50c1wiIC8+XG5cblxuaW1wb3J0ICogYXMgSU1hdGNoIGZyb20gJy4vaWZtYXRjaCc7XG5cblxuXG5cblxuLyoqXG4gKiBOb3RlOiBib3RoIGFyZ3VtZW50cyBhcmUgZXhwZWN0ZWQgdG8gYmUgbG93ZXJjYXNlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlcyhvcGVyYXRvciA6IElNYXRjaC5JT3BlcmF0b3IsIGZyYWdtZW50TEMgOiBzdHJpbmcsIHN0ckxDIDogc3RyaW5nKSAgOiBib29sZWFuIHtcbiAgaWYoIXN0ckxDKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHN3aXRjaChvcGVyYXRvci5vcGVyYXRvcikge1xuICAgIGNhc2UgXCJzdGFydGluZyB3aXRoXCI6XG4gICAgICByZXR1cm4gc3RyTEMuaW5kZXhPZihmcmFnbWVudExDKSA9PT0gMDtcbiAgICBjYXNlIFwiY29udGFpbmluZ1wiOlxuICAgICAgcmV0dXJuIHN0ckxDLmluZGV4T2YoZnJhZ21lbnRMQykgPj0gMDtcbiAgICBjYXNlIFwiZW5kaW5nIHdpdGhcIjpcbiAgICAgIHJldHVybiBzdHJMQy5sZW5ndGggPj0gZnJhZ21lbnRMQy5sZW5ndGggJiZcbiAgICAgICAgc3RyTEMuc3Vic3RyaW5nKHN0ckxDLmxlbmd0aCAtIGZyYWdtZW50TEMubGVuZ3RoKSA9PT0gZnJhZ21lbnRMQztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG9wZXJhdG9yIG9yIGlsbGVnYWwgb3BlcmF0b3IgdXNhZ2U6ICcgKyBvcGVyYXRvci5vcGVyYXRvcik7XG4gIH1cbiAgLy9yZXR1cm4gZmFsc2U7XG59XG4iXX0=
