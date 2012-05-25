var n = require('natives');
var cluster = n.cluster;
var os = n.os;
var path = n.path;
var events = n.events;
var util = n.util;
var fs = n.fs;
var childProcess = n.child_process;
var Cluster = require('./cluster');

var isMaster = cluster.isMaster,
	isWorker = cluster.isWorker;

exports = module.exports = function cluster(server) {
	return new Cluster(server);
};

exports.isMaster = isMaster;
exports.isWorker = isWorker;

fs.readdirSync(path.resolve(__dirname, 'plugins')).filter(function(name) {
	return /\.js$/.test(name);
}).forEach(function(name) {
	name = name.replace(/\.js$/, '');
	var plugin = path.resolve(__dirname, 'plugins', name);
	
	Object.defineProperty(exports, name, {
		get: function() {
			return require(plugin);
		}
	});
});
