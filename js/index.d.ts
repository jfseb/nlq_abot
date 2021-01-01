import * as HTMLConnector from './ui/htmlconnector';
export { HTMLConnector };
import * as SmartDialog from './bot/smartdialog';
export { SmartDialog };
import * as Model from './model/index_model';
export declare function LoadModel(modelPath: string): () => Promise<Model.IFModel.IModels>;
