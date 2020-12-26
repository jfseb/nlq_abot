"use strict";
/**
 * @file charsequence
 * @module jfseb.mnglq_er.charsequence
 * @copyright (c) Gerd Forstmann
 *
 * Char sequence specific comparisons
 *
 * Very simple comparisons based on plain strings
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharSequence = void 0;
// <reference path="../../lib/node-4.d.ts" />
// import * as debug from 'debug';
// import * as utils from '../utils/utils';
const Algol = require("./algol");
//import * as IMatch from './iferbase';
// <reference path="../../lib/node-4.d.ts" />
const distance = require("abot_stringdist");
exports.CharSequence = {
    isSameOrPlural: function (a, b) {
        if (Math.abs(a.length - b.length) > 1)
            return false;
        if (a == b)
            return true;
        if (a.length > b.length)
            return exports.CharSequence.isSameOrPlural(b, a);
        if (b.length > 3 && b.substr(0, b.length - 1) == a) {
            return true;
        }
        return false;
    },
    isVeryClose: function (a, b) {
        return distance.calcDistance(a, b) > Algol.Cutoff_rangeCloseMatch;
    },
    isSameOrPluralOrVeryClose: function (a, b) {
        var al = a.toLowerCase();
        var bl = b.toLowerCase();
        return exports.CharSequence.isSameOrPlural(al, bl)
            || exports.CharSequence.isVeryClose(al, bl);
    }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9jaGFyc2VxdWVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7O0FBRUgsNkNBQTZDO0FBRTdDLGtDQUFrQztBQUVsQywyQ0FBMkM7QUFFM0MsaUNBQWlDO0FBQ2pDLHVDQUF1QztBQUN2Qyw2Q0FBNkM7QUFDN0MsNENBQTRDO0FBRS9CLFFBQUEsWUFBWSxHQUFHO0lBQzFCLGNBQWMsRUFBRyxVQUFVLENBQVUsRUFBRSxDQUFVO1FBQy9DLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUUsR0FBSSxDQUFDO1lBQ3RDLE9BQU8sS0FBSyxDQUFDO1FBQ2YsSUFBSyxDQUFDLElBQUksQ0FBQztZQUNULE9BQU8sSUFBSSxDQUFDO1FBQ2QsSUFBSyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNO1lBQ3RCLE9BQU8sb0JBQVksQ0FBQyxjQUFjLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzdDLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFDLEVBQ25EO1lBQ0UsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELFdBQVcsRUFBRyxVQUFTLENBQVMsRUFBRSxDQUFTO1FBQ3pDLE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFFO0lBQ3ZFLENBQUM7SUFDRCx5QkFBeUIsRUFBRyxVQUFTLENBQVUsRUFBRSxDQUFVO1FBQ3pELElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6QixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDekIsT0FBUSxvQkFBWSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2VBQ2xDLG9CQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQ0YsQ0FBQyIsImZpbGUiOiJtYXRjaC9jaGFyc2VxdWVuY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGZpbGUgY2hhcnNlcXVlbmNlXHJcbiAqIEBtb2R1bGUgamZzZWIubW5nbHFfZXIuY2hhcnNlcXVlbmNlXHJcbiAqIEBjb3B5cmlnaHQgKGMpIEdlcmQgRm9yc3RtYW5uXHJcbiAqXHJcbiAqIENoYXIgc2VxdWVuY2Ugc3BlY2lmaWMgY29tcGFyaXNvbnNcclxuICpcclxuICogVmVyeSBzaW1wbGUgY29tcGFyaXNvbnMgYmFzZWQgb24gcGxhaW4gc3RyaW5nc1xyXG4gKlxyXG4gKi9cclxuXHJcbi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xpYi9ub2RlLTQuZC50c1wiIC8+XHJcblxyXG4vLyBpbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcblxyXG4vLyBpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscy91dGlscyc7XHJcblxyXG5pbXBvcnQgKiBhcyBBbGdvbCBmcm9tICcuL2FsZ29sJztcclxuLy9pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZmVyYmFzZSc7XHJcbi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xpYi9ub2RlLTQuZC50c1wiIC8+XHJcbmltcG9ydCAqIGFzIGRpc3RhbmNlIGZyb20gJ2Fib3Rfc3RyaW5nZGlzdCc7XHJcblxyXG5leHBvcnQgY29uc3QgQ2hhclNlcXVlbmNlID0ge1xyXG4gIGlzU2FtZU9yUGx1cmFsIDogZnVuY3Rpb24oIGEgOiBzdHJpbmcsIGIgOiBzdHJpbmcgKSA6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCBNYXRoLmFicyhhLmxlbmd0aCAtIGIubGVuZ3RoICkgPiAgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgaWYgKCBhID09IGIgKVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIGlmICggYS5sZW5ndGggPiBiLmxlbmd0aCApXHJcbiAgICAgIHJldHVybiBDaGFyU2VxdWVuY2UuaXNTYW1lT3JQbHVyYWwoIGIsIGEgKTtcclxuICAgIGlmIChiLmxlbmd0aCA+IDMgJiYgYi5zdWJzdHIoMCwgYi5sZW5ndGggLSAxICkgPT0gYSlcclxuICAgIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuICBpc1ZlcnlDbG9zZSA6IGZ1bmN0aW9uKGE6IHN0cmluZywgYjogc3RyaW5nKSA6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGRpc3RhbmNlLmNhbGNEaXN0YW5jZSggYSwgYiApID4gQWxnb2wuQ3V0b2ZmX3JhbmdlQ2xvc2VNYXRjaCA7XHJcbiAgfSxcclxuICBpc1NhbWVPclBsdXJhbE9yVmVyeUNsb3NlIDogZnVuY3Rpb24oYSA6IHN0cmluZywgYiA6IHN0cmluZykgOiBib29sZWFuIHtcclxuICAgIHZhciBhbCA9IGEudG9Mb3dlckNhc2UoKTtcclxuICAgIHZhciBibCA9IGIudG9Mb3dlckNhc2UoKTtcclxuICAgIHJldHVybiAgQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsKGFsLCBibClcclxuICAgICAgICAgIHx8IENoYXJTZXF1ZW5jZS5pc1ZlcnlDbG9zZShhbCxibCk7XHJcbiAgfVxyXG59O1xyXG4iXX0=
