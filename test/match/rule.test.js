var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../js';
//var debuglog = require('debug')('rule.nunit');

const Rule = require(root + '/match/rule.js');


it('testcompareMRuleFull1', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
  },{category : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});




it('testcompareMRuleFull2', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    matchedString : 'AAA'
  },{
    category : 'AAA',
    matchedString : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});


it('testcompareMRuleFullType', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    type : 1,
    matchedString : 'AAA'
  },{
    category : 'AAA',
    type : 2,
    matchedString : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});





it('testcompareMRuleFullWordType', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    type : 1,
    matchedString : 'AAA',
    word : 'AAA'
  },{
    category : 'AAA',
    type : 1,
    matchedString : 'AAA',
    word : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});



it('testcompareMRuleFullRaking', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    type : 1,
    _ranking : 0.8,
    matchedString : 'AAA',
    word : 'AAA'
  },{
    category : 'AAA',
    type : 1,
    _ranking : 0.9,
    matchedString : 'AAA',
    word : 'AAA'});
  expect(res < 0).toEqual(true);

  //test.done()

});


it('testcompareMRuleFullExactOnly', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    type : 1,
    _ranking : 0.7,
    matchedString : 'AAA',
    exactOnly:false,
    word : 'AAA'
  },{
    category : 'AAA',
    type : 1,
    _ranking : 0.7,
    matchedString : 'AAA',
    exactOnly : true,
    word : 'AAA'});
  expect(res > 0).toEqual(true);

  //test.done()

});


it('testcompareMRuleFullExactOnlyOne', async () => {
  const res = Rule.compareMRuleFull({
    category : 'AAA',
    type : 1,
    _ranking : 0.7,
    matchedString : 'AAA',
    exactOnly: true,
    word : 'AAA'
  },{
    category : 'AAA',
    type : 1,
    _ranking : 0.7,
    matchedString : 'AAA',
    exactOnly : false,
    word : 'AAA'});
  expect(res < 0).toEqual(true);

  //test.done()

});



it('testcmpMRule1', async () => {
  const res = Rule.cmpMRule({
    category : 'AAA',
  },{category : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});




it('testcmpMRuleFull2', async () => {
  const res = Rule.cmpMRule({
    category : 'AAA',
    matchedString : 'AAA'
  },{
    category : 'AAA',
    matchedString : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});


it('testcmpMRuleType', async () => {
  const res = Rule.cmpMRule({
    category : 'AAA',
    type : 1,
    matchedString : 'AAA'
  },{
    category : 'AAA',
    type : 2,
    matchedString : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});



it('testcmpMRuleWordType', async () => {
  const res = Rule.cmpMRule({
    category : 'AAA',
    type : 1,
    matchedString : 'AAA',
    word : 'AAA'
  },{
    category : 'AAA',
    type : 1,
    matchedString : 'AAA',
    word : 'BBB'});
  expect(res < 0).toEqual(true);

  //test.done()

});



