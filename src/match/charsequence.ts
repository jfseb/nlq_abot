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

// <reference path="../../lib/node-4.d.ts" />

// import * as debug from 'debug';

// import * as utils from '../utils/utils';

import * as Algol from './algol';
//import * as IMatch from './iferbase';
// <reference path="../../lib/node-4.d.ts" />
import * as distance from 'abot_stringdist';

export const CharSequence = {
  isSameOrPlural : function( a : string, b : string ) : boolean {
    if ( Math.abs(a.length - b.length ) >  1)
      return false;
    if ( a == b )
      return true;
    if ( a.length > b.length )
      return CharSequence.isSameOrPlural( b, a );
    if (b.length > 3 && b.substr(0, b.length - 1 ) == a)
    {
      return true;
    }
    return false;
  },
  isVeryClose : function(a: string, b: string) : boolean {
    return distance.calcDistance( a, b ) > Algol.Cutoff_rangeCloseMatch ;
  },
  isSameOrPluralOrVeryClose : function(a : string, b : string) : boolean {
    var al = a.toLowerCase();
    var bl = b.toLowerCase();
    return  CharSequence.isSameOrPlural(al, bl)
          || CharSequence.isVeryClose(al,bl);
  }
};
