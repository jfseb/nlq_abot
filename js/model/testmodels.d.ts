import { IFModel as IFModel } from './index_model';
export declare function getTestModel1(): Promise<void | IFModel.IModels>;
/**
 * Obtain a model instance,
 *
 * note: the model must be closed via
 * Model.releaseModel(theModelInstance)
 */
export declare function getTestModel2(): Promise<void | IFModel.IModels>;
