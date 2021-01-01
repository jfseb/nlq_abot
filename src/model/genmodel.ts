/**
 * Enrich model folder, generating 
 * a) lunr files for every model
 * b) tabModel files for the full model
 */

//var debug = require('debug')('vismodel.nunit');
import * as fs from 'fs';
import  * as  Vismodel from './vismodel';
import * as Model from './model';

export function indexModel(modelPath : string) : Promise<any> {
  // we index everything but the metamodels. 
  return Model.LoadModels(modelPath).then( imodels => {
    var path = imodels.mongoHandle.srcHandle.getPath(); 
    var mdls = JSON.parse('' + fs.readFileSync(path + '/models.json'));
    var models : string[] = mdls.filter( mdl => mdl != 'metamodels');
    Promise.all( models.map(modelName => {
      //if ( modelName == "iupacs") {
        return Vismodel.makeLunrIndex(imodels, modelName);
      //}
      //return 1;
    })).then( ()=> { 
      Vismodel.tabModels(imodels)
    }).then( ()=> console.log("indexed all models"));
  });
}
