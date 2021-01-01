

import * as SrcHandle from './srchandle';
import { Model as Model, IFModel as IFModel } from './index_model';

var prom1 = null; 

export function getTestModel1(): Promise<void | IFModel.IModels> {
  if ( !prom1 ) {
    var srcHandle = SrcHandle.createSourceHandle();
    prom1 = Model.loadModelsOpeningConnection( srcHandle, "./testmodel");
  }
  return prom1;
}
/**
 * Obtain a model instance,
 *
 * note: the model must be closed via
 * Model.releaseModel(theModelInstance)
 */
export function getTestModel2(): Promise<void | IFModel.IModels> {
  var srcHandle = SrcHandle.createSourceHandle();
  return Model.loadModelsOpeningConnection( srcHandle, "./testmodel2");
}