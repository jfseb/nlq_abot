// var globalTunnel = require('global-tunnel')
//  host: 'proxy.exxxample.com',
//  port: 8080
// })

var builder = require('botbuilder');
var process = require('process');
var ABOT_MONGODB = process.env.ABOT_MONGODB || 'testdb';

var MONGO_DBURL = 'mongodb://localhost/' + ABOT_MONGODB;

// Create bot and bind to console
var connector = new builder.ConsoleConnector().listen();

var botdialog = require('./js/bot/smartdialog.js');


var srcHandle = require('srcHandle');

var Model = require(root + '/model/index_model.js').Model;

function loadModel() {
  return Model.loadModelsOpeningConnection(srcHandle, MONGO_DBURL, 'smbmodel');
}


botdialog.makeBot(connector, loadModel, { showModelLoadTime: true});
