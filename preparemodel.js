// build generated model files 

var genmodel = require('./js/model/genmodel.js');
var process = require('process');
var theModel = process.env.NLQ_ABOT_MODELPATH || './testmodel';
if ( theModel.endsWith('/') || theModel.endsWith('\\')) {
  theModel = theModel.substr(0, theModel.length - 1);
}
console.log('processing models at path ' + theModel);
genmodel.indexModel(theModel).then( () => 
  console.log('indexed models at path ' + theModel)
);
