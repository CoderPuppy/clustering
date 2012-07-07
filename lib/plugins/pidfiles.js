var n = require('natives');
var path = n.path;
var util = n.util;
var fs = require('node-fs');
var colors = require('colors');

var pidfiles = module.exports = function pidfiles(dir) {
	return function(cluster) {
		dir = cluster.pidfileDir = cluster.resolve(dir || 'pids');
		
		cluster.pidof = function pidof(id) {
			return parseInt(fs.readFileSync(cluster.resolve(dir, id + '.pid')).toString());
		};
		
		cluster.pids = function pids() {
			return fs.readdirSync(dir).filter(function(name) {
				return /^worker\.\d+\.pid$/.test(name);
			}).map(function(name) {
				return parseInt(fs.readFileSync(cluster.resolve(dir, name)));
			});
		};
		
		cluster.pid = function pid() {
			return parseInt(fs.readFileSync(cluster.resolve(dir, 'master.pid')));
		};
		
		function listeners() {
			cluster.on('spawned', function(w) {
				fs.writeFile(cluster.resolve(dir, 'worker.' + w.id + '.pid'), w.pid, function(e) {
					if(e) console.error(util.format('Error writing worker %d pidfile:', w.id, e).red);
					
					cluster.emit('worker:pidfile', w);
					console.log(util.format('Wrote pidfile for worker %d', w.id).green);
				});
				
				w.on('shutdown', function(code, signal) {
					if(this.stopping) {
						fs.unlink(cluster.resolve(dir, 'worker.' + w.id + '.pid'), function(e) {
							if(e) console.error(util.format('Error deleting worker %d pidfile:', w.id, e).red);
							
							console.log(util.format('Deleted pidfile for worker %d', w.id).green);
						});
					}
				});
			})
			
			function writeMasterPid() {
				fs.writeFile(cluster.resolve(dir, 'master.pid'), process.pid, function(e) {
					if(e) console.error(util.format('Error writing master pidfile:', e).red);
		
					cluster.emit('master:pidfile');
					console.log('Wrote pidfile for master'.green);
				});
			}
			
			if(cluster.listening) {
				writeMasterPid();
			} else {
				cluster.on('listen', function() {
					writeMasterPid();
				});
			}
			
			process.on('exit', function() {
				if(cluster.listening) {
					fs.unlink(cluster.resolve(dir, 'master.pid'), function(e) {
						if(e) console.error(util.format('Error deleting master pidfile:', e).red);
						console.log('Deleted pidfile for master'.green);
					});
				}
			});
		}
		
		fs.exists(dir, function(exists) {
			if(!exists) {
				fs.mkdir(dir, 0755, true, function(e) {
					if(e) throw e;
					
					listeners();
				});
			} else {
				listeners();
			}
		});
	};
};
