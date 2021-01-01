
import * as HTMLConnector from './ui/htmlconnector';
export { HTMLConnector };
import * as SmartDialog from './bot/smartdialog';
export { SmartDialog };

import * as SrcHandle from './model/srchandle';
import * as Model from './model/index_model';

export function LoadModel(modelPath : string) {
  var srcHandle = SrcHandle.createSourceHandle();
  if ( modelPath == './testmodel') {
    modelPath = __dirname + '/../testmodel';
  }
  if ( modelPath == './testmodel2') {
    modelPath = __dirname + "/../testmodel2";
  }
  console.log(' modelpath ' + modelPath)
  var res = function loadModel() {
    return Model.Model.loadModelsOpeningConnection(srcHandle, modelPath);
  };
  return res;  
}




//import * as SentenceParser from './sentenceparser';