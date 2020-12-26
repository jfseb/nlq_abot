// var globalTunnel = require('global-tunnel')
//  host: 'proxy.exxxample.com',
//  port: 8080
// })

var builder = require('botbuilder');
// Create bot and bind to console
var connector = new builder.ConsoleConnector().listen();

var botdialog = require('./js/bot/smartdialog.js');

var root = './js';

var srcHandle = require(root + '/model/srchandle.js').createSourceHandle();

var Model = require(root + '/model/index_model.js').Model;

function loadModel() {
  return Model.loadModelsOpeningConnection(srcHandle, 'testmodel', './testmodel');
}


botdialog.makeBot(connector, loadModel, { showModelLoadTime: true});
