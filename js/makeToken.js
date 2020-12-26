
var fs = require('fs');

var debug = require('debug')('makeToken');

function run() {


  var tokens = JSON.parse(fs.readFileSync('src/tokens.json'));

  tokens = tokens.map(tok => {
    var name = Object.keys(tok)[0];
    var val = tok[name];
    debug(' got ' + name + ' '  + val);
    if (typeof val === 'string') {
      if (val !== val.toLowerCase()) {
        return { name : name, value : val , respectCase : true };
      }
      return { name : name, value : val };
    } else {
      return { name : name, value : val.value, pattern : val.pattern, order : val.order || 0 };
    }
  });

  var knownvalues = tokens.reduce( (prev,current) => { prev[current.value] = 1; return prev; }, {});

  var sentences = '' + fs.readFileSync('src/sentences.txt');
  var toks = sentences.split(/\s+/);
  toks.sort();

  toks.forEach(tok =>  {
    if(!knownvalues[tok]) {
      tok = tok.toLowerCase(); // substr(0,1).toUpperCase() + tok.substr(1);
      if(!knownvalues[tok]) {
        knownvalues[tok] = 1;
        tokens.push({ name: tok, value : tok});
      }
    }
  });

  tokens.sort(function(a,b) {
    var ordera = a.order || 0;
    var orderb = b.order || 0;
    if (ordera -orderb) {
      return ordera - orderb;
    }
    // common prefix! longer goes first
    var min = Math.min(a.name.length, b.name.length);
    if (a.name.substr(0,min) === b.name.substr(0,min) ) {
      return (b.name.length - a.name.length);
    }
    return a.name.localeCompare(b.name); });

  function escapeRegex(s) {
    return s;
  }

  debug('here toks' + tokens.map(t=>t.name).join('<\n>'));


  var tokenstrings = tokens.map(tok => {
    var tokName = tok.name.replace(/ /g,'_');
    tok.niceName = tokName;
    var alignPattern = (tok.pattern || tok.value).replace(/ /g, '_');
    if(!tok.respectCase) {
      return `var T${tokName} = createToken({name: "${tokName}", pattern: /${escapeRegex(alignPattern)}/i });`;
    } else {
      return `var T${tokName} = createToken({name: "${tokName}", pattern: /${escapeRegex(alignPattern)}/ });`;
    }
  });

  var tokendefinitions = tokenstrings.join('\n');

  var objexport = `
    export const Tokens = {
  ${ tokens.map(tok => ` ${tok.niceName} : T${tok.niceName} `).join(',\n')}
    };
    export const OperatorLookup = {
      ${ tokens.map(tok => ` "${tok.value}" : T${tok.niceName} `).join(',\n')}
        };
  `;


  var src = `

  'use strict'
  import * as chevrotain from 'chevrotain';
    var createToken = chevrotain.createToken;

    ${tokendefinitions}

    ${objexport}
  `;


  fs.writeFileSync('src/tokens.ts', src);

}

run();
module.exports = {
  run : run
};

