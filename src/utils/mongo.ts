/**
 * Utiltities for mongo
 */

import * as debugf from 'debugf';
import { once } from 'process';
import { ISrcHandle } from '../model/srchandle';

var debuglog = debugf('model');

export function openMongoose(srcHandle: ISrcHandle, mongoConnectionString : string) : Promise<ISrcHandle> {
  console.log(' srcHandle.connect ' + mongoConnectionString );
  srcHandle.connect(mongoConnectionString);
  var db = srcHandle;
  var mgopen = new Promise(function (resolve, reject) {
    //db.on.setMaxListeners(0);
    resolve(srcHandle);
    /*
    if((typeof db.setMaxListeners) === "function") {
        db.setMaxListeners(0);
    }
    if((typeof db.on.setMaxListeners) === "function") {
        db.on.setMaxListeners(0);
    }
    db.on('error', (err) => {
      console.error(err);
      reject(err);}
    );
    if((typeof db.once.setMaxListeners) === "function") {
        db.once.setMaxListeners(0);
    }
    db.once('open', function () {
      debuglog('connected to ' + mongoConnectionString);
      resolve(db);
    });
    */
  });
  return mgopen as Promise<ISrcHandle>;
}

export function clearModels(srcHandle : any) {
    debuglog(' clear Models ');
    srcHandle.connection.modelNames().forEach(modelName =>
        delete srcHandle.connection.models[modelName]
    );
}

export function disconnectReset(srcHandle : any) {
    clearModels(srcHandle);
}

export function getCollectionNames(srcHandle: any) : Promise<String[]> {
    return srcHandle.connection.db.collections().then(
        (cols) => cols.map(col => col.collectionName)
    );
}