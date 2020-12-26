

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var Parser = require(root + '/parser.js');


function parseInput(text,startrule) {
  var lexingResult = Parser.SelectLexer.tokenize(text);
  console.log(JSON.stringify(lexingResult));
  const parser = new Parser.SelectParser(lexingResult.tokens);
  if(typeof parser[startrule] !== 'function') {
    console.log('where is the startrule '+ startrule);
  }
  var res = parser[startrule]();
  //console.log('here res: ' + JSON.stringify(res));
  if (parser.errors.length > 0) {
    throw new Error('parsing error in  input' + JSON.stringify(parser.errors));
  }
  return res;
}

test('ParserListAll', ()=> {
  var inputText = 'LIST ALL CAT, CAT';
  var result = parseInput(inputText,'listAll');
  expect(result.map(a => a.image)).toEqual(['CAT','CAT']);
});

/*
describe /DDF/DDEL_MON;
*/

test('testOpCat', ()=> {
  [ 'First', 'latest', 'newest', 'Oldest'].forEach(function(op) {
    var inputText = op;
    try {
      parseInput(inputText,'opCat');
    } catch(e) {
      console.log(e);
      expect().toBeTruthy();
    }
    expect().toBeFalsy();
  });
});

test('testFilterEntry', ()=> {
  [ 'in', 'with', 'for', 'relating'].forEach(function(op) {
    var inputText = op;
    try {
      parseInput(inputText,'filterEntry');
    } catch(e) {
      console.log(e);
      expect().toBeTruthy();
    }
    expect().toBeFalsy();
  });
});


test('test_CatFilterDOM', ()=> {
  [ 'in', 'with', 'for', 'relating'].forEach(function(op) {
    var inputText = op + ' DOM in FACT';
    try {
      parseInput(inputText,'catFilter');
    } catch(e) {
      console.log(e);
      expect().toBeTruthy();
    }
    expect().toBeFalsy();
  });
});

it('test_CatFilterDOMmultiFact', done => {
  [ 'in', 'with', 'for', 'relating'].forEach(function(op) {
    var inputText = op + ' DOM in FACT, FACT';
    try {
      parseInput(inputText,'catFilter');
    } catch(e) {
      console.log(e);
      expect(1).toEqual(0);
    }
    expect(1).toEqual(1);
  });
  done();
});

it('test_CatFilterDOM2', done => {
  [ 'in', 'with', 'for', 'relating' ].forEach(function(op) {
    var inputText = op + ' domain DOM';
    try {
      parseInput(inputText,'catFilter');
    } catch(e) {
      console.log(e);
      expect(1).toEqual(0);
    }
    expect(1).toEqual(1);
  });
  done();
});



it('testUnarySetOp', done => {
  [ 'All', 'First', 'Newest', 'Oldest','Any', 'Latest', 'Last', 'Every', 'All', 'At least one', 'Every'].forEach(function(val) {
    var inputText = `${val}`;
    parseInput(inputText,'unarySetOp');
    expect(1).toEqual(1);
  });
  done();
});


it('testCatListMore', done => {
  [ 'First', 'Newest', 'Oldest', 'All'].forEach(function(op) {
    var inputText = 'CAT, CAT, CAT';
    parseInput(inputText,'catListOpMore');
    expect(1).toEqual(1);
  });
  done();
});




it('testCatListMoreInFact', done => {
  [ 'First', 'Newest', 'Oldest', 'All'].forEach(function() {
    var inputText = 'CAT In FACT';
    parseInput(inputText,'catListOpMore');
    expect(1).toEqual(1);
  });
  done();
});

it('testCatListMoreInFactCommaFact', done => {
  var inputText = 'CAT, CAT in FACT, FACT'; // in FACT and FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndFact2', done => {
  var inputText = 'CAT, CAT, CAT in FACT'; // in FACT and FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});


it('testCatListMoreInFactCommaFact', done => {
  var inputText = 'CAT, CAT in FACT, FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactCommaFact2', done => {
  var inputText = 'CAT, CAT in FACT, CAT FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndFact2', done => {
  var inputText = 'CAT, CAT in FACT and FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndFact2', done => {
  var inputText = 'CAT, CAT with FACT and FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndFact3', done => {
  var inputText = 'CAT, CAT with FACT and FACT and FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndFactorFact', done => {
  var inputText = 'CAT, CAT with FACT and FACT or FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndCatFact', done => {
  var inputText = 'CAT, CAT with FACT and CAT FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListMoreInFactAndCatFact2', done => {
  var inputText = 'CAT, CAT for CAT FACT and CAT FACT;';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});


it('testCatListMoreInFactCFAndCF', done => {
  var inputText = 'CAT, CAT with CAT FACT , FACT , CAT FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

//'CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT'

it('testCatListMoreInFactCFFCFnoComma', done => {
  var inputText = 'CAT, CAT with CAT FACT FACT  CAT FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});


it('testCatListMoreInFactCFCFFnocomma', done => {
  var inputText = 'CAT CAT CAT CAT with CAT FACT CAT FACT FACT';
  parseInput(inputText,'catListOpMore');
  expect(1).toEqual(1);
  done();
});

it('testCatListCFopF', done => {
  var inputText =  [  'CAT with CAT is FACT', 
    'CAT with CAT less_than 0123',
    'CAT with less_than 0123 CAT',
    'CAT with CAT > 0123',
    'CAT with CAT more_than 0123',
    'CAT with CAT > 0123 or CAT < 0123',
    'CAT with CAT > 0123 and CAT contains 0123',
    'CAT with CAT > 0123 and CAT more_than 0123',
    'CAT with CAT < 0123',  'CAT with CAT = FACT',
    'CAT with CAT < AnANY'];
  inputText.forEach( a => { 
    try {
      parseInput(a,'catListOpMore');
      expect(1).toEqual(1);
    } catch( e) {
      console.log('Expected this to succeed  ' + a + ' ' + e + e.stack);
      expect(a).toEqual(0);
    }
  });
  done();
});

it('testCatListCFinvalids', done => {
  var inputText = ['CAT with CAT AnANY', 
    'CAT with CAT is 0123', // questionable
    'CAT with CAT <  < AnANY', ];
  inputText.forEach( a => { 
    try {
      parseInput(a,'catListOpMore');
      console.log('Expected this to fail ' + a);
      expect(a).toEqual(0);
    } catch( e) {
      expect(1).toEqual(1);
    }
  });
  done();
});



/*
exports.testCatSEtExpression = function (test) {
  var inputText = 'latest CAT';
  parseInput(inputText,'catSetExpression');
  test.equal(1,1);
  test.done();
};
*/
/*

exports.testCatListMoreCATequalsFact = function (test) {
  var inputText = 'CAT equals FACT';
  parseInput(inputText,'filterExpression');
  test.equal(1,1);
  test.done();
};

/*
exports.testCatListMoreCATisFact = function (test) {
  var inputText = 'CAT is FACT';
  parseInput(inputText,'filterExpression');
  test.equal(1,1);
  test.done();
};*/



it('testCatListMoreInFaommaABC', done => {
  ['contains', 'containing', 'ends_with', 'ending_with', 'starts_with', 'starting_with'].forEach((op)=> {
    var inputText = `CAT CAT CAT CAT with CAT FACT CAT ${op} FACT FACT`;
    parseInput(inputText,'catListOpMore');
    expect(1).toEqual(1);
  });
  done();
});


/*
describe Application Component;
list all AppIds for FI-FIO-GL with ApplicationType "Reuse Component";
list all Application Component, BSPName, ODataService, fiori intent for maintain;
list all Application Components starting with FIN-;
list all ApplicationTypes for #GLAccount-manage;
List all appNames in ApplicationComponent PLM-FIO-RCP;
list all BSP Urls for ui.ssuite.s2p.mm.pur.po.create.s1;
list all categories;
list all element names starting with ni;
list all element names starting with ni in domain IUPAC;
list all example commands;
list all fiori intents in FIN-FIO-CCD with ApplicationType Analytical;
list all hints;
list all intents for FI-FIO-GL with ApplicationType "FPM/WebDynpro";
list all OData Services for retail.store.stockcorrection;
List all ODataServices for FI-FIO-GL;
make table with AppId, "fiori intent", ApplicationComponent, AppName, BusinessRoleName, BSPName;
Show me #RequestForQuotation-manage;
what are the sanitation facilities in tuvalu;
what is the "ui5 component name" for fiori intent #RequestForQuotation-manage;
what is the ApplicationComponent for sap.cus.sd.lib.processflow;
what is the ApplicationType for #ControllingDocument-setControllingArea;
What is the BSPName for Fiori App "Manage Labels";
what is the element name for element number 117;
What is the TransactionCode for Fiori App "Manage Labels"
*/