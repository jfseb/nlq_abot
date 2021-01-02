/*! copyright gerd forstmann, all rights reserved */
var root = '../../js';

//var debuglog = require('debugf')('srchandle.test');
var SrcHandle = require(root + '/model/srchandle.js');

it('testevalMatch', async () => {
  expect(SrcHandle.evalSet('$lt', [444,333,555], [344])).toEqual(true); 
  expect(SrcHandle.evalSet('$lt', [444,333,555], [34])).toEqual(false); 
  expect(SrcHandle.evalSet('$lte', [444,333,555], [333])).toEqual(true); 
  expect(SrcHandle.evalSet('$exists', [444,333,555], [true])).toEqual(true); 
  expect(SrcHandle.evalSet('$exists', [444,333,555], [false])).toEqual(false); 
  expect(SrcHandle.evalSet('$exists', [], [false])).toEqual(true); 
  expect(SrcHandle.evalSet('$lt', ['444','333','555'], [2000])).toEqual(true); 
  expect(SrcHandle.evalSet('$lt', ['444','333','555'], ['2000'])).toEqual(false); 
  expect(SrcHandle.evalSet('$regex', [444,'333',555],  /33$/i)).toEqual(true); 
  expect(SrcHandle.evalSet('$regex', [444,333,555],  /33$/i)).toEqual(true); 
});

it('testcollectMemberByPath', async () => {
  var recs =  [{'domain':'IUPAC','_categories':[{'category':'element name','category_description':'element name','QBEColumnProps':{'defaultWidth':120,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['name']},{'category':'element symbol','category_description':'element symbol','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['symbol']},{'category':'atomic weight','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':80,'QBE':true},'category_synonyms':['element weight']},{'category':'element number','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true}],'columns':['element symbol','element number','element name']}
  ]; 
  expect(SrcHandle.satisfiesMatch(recs[0], { '$lt' : [ { '$eval': '_categories.category'},  'aa' ]} )).toEqual(false); 
  expect(SrcHandle.satisfiesMatch(recs[0], { '$gt' : [ { '$eval': '_categories.category'},  'aa' ]} )).toEqual(true); 
  expect(SrcHandle.satisfiesMatch(recs[0], { '$regex' : [ { '$eval': '_categories.category'},  { '$regex': /^ato/i } ]} )).toEqual(true); 
});

it('testFlattenDeep', async () => {
  expect(SrcHandle.flattenDeep( { 'ab' : 123, 'x' : ['A','B']}, ['x'])).toEqual( [ { 'ab' : 123, 'x' : 'A'}, { 'ab' : 123, 'x' : 'B'}, ]);
  expect(SrcHandle.flattenDeep( { 'ab' : 123, 'x' : [{ u:'A', i : 1} ,{ u:'B', i: 2}]}, ['x'])).toEqual( [ { 'ab' : 123, u : 'A', i:1 }, { 'ab' : 123, u:'B', i: 2 }, ]);
  expect(SrcHandle.flattenDeep( { 'ab' : 123, 'x' : [{ u:'A', i : 1} ,{ u:'B', i: 2}], 'k' : [ 'k', 'l','m']}, ['x','k'])).toEqual( 
    [ { 'ab' : 123, u: 'A', i:1, 'k':'k' }, 
      { 'ab' : 123, u: 'A', i:1, 'k':'l' }, 
      { 'ab' : 123, u: 'A', i:1, 'k':'m' }, 
      { 'ab' : 123, u: 'B', i:2, 'k':'k' },
      { 'ab' : 123, u: 'B', i:2, 'k':'l' },
      { 'ab' : 123, u: 'B', i:2, 'k':'m' },
    ]);
});

it('testcollectRelevantCategoriesWithSingleArrayOnPath', async () => {
  var recs = [ { 'abc' : '123', 'BusinessGroup' : 44}, {'abc' : ['A', 'B'], 'BusinessGroup' : [2]}];
  expect(SrcHandle.collectRelevantCategoriesWithSingleArrayOnPath( recs, { $match : { $and : [ { $lt : [{$eval : 'BusinessGroup' } ,3 ]  },
    { $gt: [{ $eval : '_table.BBB' },
      { $eval :'abc'}
    ]
    }]}})).toEqual( [{ pathToArr : 'abc'}]);
});





it('testApplyProjectCollection', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , n : 'B', i : 4 }, columns :['A','B'] }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.n', columns: 1 },[])).toEqual( 
    [ {a: 'b'}, 
      { ab: 123, category : 'A', n: 'B', columns : 'A' },
      { ab: 123, category : 'A', n: 'B', columns : 'B' }
    ]
  );
});

it('testApplyProjectCollection', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , n : 'B', i : 4 } }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.n' })).toEqual( 
    [ {a: 'b'}, { ab: 123, category : 'A', n: 'B' }]
  );
});


it('testApplyProjectCollection', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { n: 'X', i:4 }] } }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' })).toEqual( 
    [ {a: 'b'}, { ab: 123, category : 'A', n: 'B' },
      { ab: 123, category : 'A', n: 'X' }
    ]
  );
});

it('testApplyProjectCollection2', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] } }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' })).toEqual( 
    [ {a: 'b'}, { ab: 123, category : 'A', n: 'B' },
      { ab: 123, category : 'A', n: undefined }
    ]
  );
});

it('testApplyProjectCollection3', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] }, _d : [ { x: 2}, {x: 3} ] }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' })).toEqual( 
    [ {a: 'b'}, { ab: 123, category : 'A', n: 'B' },
      { ab: 123, category : 'A', n: undefined }
    ]
  );
});

it('testApplyProjectCollection4', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] }, _d : [ { x: 2}, {x: 3} ] }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' , x : '_d.x'})).toEqual( 
    [ {a:'b'}, 
      { ab: 123, category : 'A', n: 'B', x:2 },
      { ab: 123, category : 'A', n: 'B', x:3 },
      { ab: 123, category : 'A', n: undefined, x:2},
      { ab: 123, category : 'A', n: undefined, x:3},
    ]
  );
});


it('testApplyProjectCollectionKeep', async () => {
  expect(SrcHandle.applyProject( [ { 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] }, _d : [ { x: 2}, {x: 3} ] }], 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' , x : '_d.x'}, ['x'])).toEqual( 
    [ 
      { ab: 123, category : 'A', n: 'B', x:[2,3] },
      { ab: 123, category : 'A', n: undefined, x:[2,3]},
    ]
  );
});


it('testApplyProjectCollectionKeep', async () => {
  expect(SrcHandle.applyProject( [{ 'ab': 123, 'de': 2, _category : { category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] }, _d : [ { x: 2}, {x: 3} ] }], 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n',  i: '_category.Luxidx.i' , x : '_d.x'}, ['n','i', 'x'])).toEqual( 
    [
      { ab: 123, category : 'A', n: ['B'], i:[4,4], x:[2,3] }
    ]
  );
});



it('testApplyProjectCollection5', async () => {
  expect(SrcHandle.applyProjectCollecting( [ {a: 'b'}], { 'ab': 123, 'de': 2, _category : [{ category: 'A' , Luxidx : [{ n : 'B', i : 4 }, { i:4 }] }], _d : [ { x: 2}, {x: 3} ] }, 
    { 'ab': 1, 'category': '_category.category' , n: '_category.Luxidx.n' , x : '_d.x'})).toEqual( 
    [ {a:'b'}, 
      { ab: 123, category : 'A', n: 'B', x:2 },
      { ab: 123, category : 'A', n: 'B', x:3 },
      { ab: 123, category : 'A', n: undefined, x:2},
      { ab: 123, category : 'A', n: undefined, x:3},
    ]
  );
});


it('testfilterProject', async () => {
  expect(SrcHandle.filterProject(  { 'domain' : 1, 'category' : '_categories.category' , 'LUNRIndex' : '_categories.category.QBEColumnProps.LUNRIndex', 'columns': 1 }, '_categories' )).toEqual( 
    { 'category' : 'category', 'LUNRIndex' : 'category.QBEColumnProps.LUNRIndex'} );
});

it('testProject', async () => {
  var recs =  [{'domain':'IUPAC','_categories':[{'category':'element name','category_description':'element name','QBEColumnProps':{'defaultWidth':120,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['name']},{'category':'element symbol','category_description':'element symbol','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true,'category_synonyms':['symbol']},{'category':'atomic weight','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':80,'QBE':true},'category_synonyms':['element weight']},{'category':'element number','category_description':'weight of the element','QBEColumnProps':{'defaultWidth':60,'QBE':true,'LUNRIndex':true},'wordindex':true}],'columns':['element symbol','element number','element name']}
  ]; 
  expect(SrcHandle.applyProject(recs, { 'domain': 1 },[])).toEqual( [{ 'domain' : 'IUPAC'}],[]);
  var project = { 'domain' : 1, 'category' : '_categories.category' , 'LUNRIndex' : '_categories.QBEColumnProps.LUNRIndex', 'columns': 1 };
  expect(SrcHandle.applyProject(recs,project,[])).toEqual( [{
    'LUNRIndex': true,
    'category': 'element name',
    'columns': 'element symbol',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element name',
    'columns': 'element number',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element name',
    'columns': 'element name',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element symbol',
    'columns': 'element symbol',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element symbol',
    'columns': 'element number',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element symbol',
    'columns': 'element name',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': undefined,
    'category': 'atomic weight',
    'columns': 'element symbol',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': undefined,
    'category': 'atomic weight',
    'columns': 'element number',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': undefined,
    'category': 'atomic weight',
    'columns': 'element name',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element number',
    'columns': 'element symbol',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element number',
    'columns': 'element number',
    'domain': 'IUPAC',
  },
  {
    'LUNRIndex': true,
    'category': 'element number',
    'columns': 'element name',
    'domain': 'IUPAC',
  }
  ]);
});
