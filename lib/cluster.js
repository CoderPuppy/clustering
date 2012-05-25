var n = require('natives');
var cluster = n.cluster;
var os = n.os;
var path = n.path;
var events = n.events;
var util = n.util;
var childProcess = n.child_process;
var colors = require('colors');
var Worker = require('./worker');
var uuid = require('./uuid');

var isMaster = cluster.isMaster,
	isWorker = cluster.isWorker;

var Cluster = module.exports = (function ClusterClass() {
	function Cluster(server) {
		var self = this;
		
		this.server = server;
		this.running = false;
		this.workers = [];
		this.plugins = [];
		this.main = require.main;
		this.dir = path.dirname(this.main.filename);
		this.preventDefault = false;
		this.listening = false;
		this.reloading = false;
		this.options = { // defaults
			'workers': os.cpus().length, // how many workers to start
			'working directory': this.dir, // where to start stuff in EG. workers, restarted master
			'title': 'cluster master',
			'worker title': 'cluster worker'
		};

		if(isWorker) {
			process.on('message', function(msg) {
				if(msg === 'cluster:shutdown') {
					if(self.running) {
						self.server.close();
					}
					process.exit();
				}
			});
		} else if(isMaster) {
			process.on('SIGUSR2', function() {
				self.restart();
			});
		}
	}
	util.inherits(Cluster, events.EventEmitter);
	
	Cluster.prototype.use = function use(plugin) {
		if(!this.environmentMatches) return this;
		
		this.plugins.push(plugin);
		
		if(!this.preventDefault && ( isWorker ? plugin.enableInWorker : true )) {
			plugin(this);
		}
		
		return this;
	};
	
	Cluster.prototype.in = function(env) {
		this.__env = env;
		
		return this;
	};
	
	Cluster.prototype.out = function out() {
		this.__env = undefined;
		
		return this;
	};
	
	Cluster.prototype.spawnWorker = function spawnWorker() {
		var self = this,
			worker;
		
		console.log('Spawning Worker'.green);
		
		this.workers.push(worker = new Worker(cluster.fork()));
		
		this.emit('spawning', worker);
		
		worker.on('online', function() {
			self.emit('spawned', worker);
		}).on('shutdown', function(code, signal) {
			self.workers.splice(self.workers.indexOf(worker), 1);
			
			if(!worker.stopping) {
				self.spawnWorker();
			}
		});
	};
	
	Cluster.prototype.spawn = function spawn(num) {
		num = typeof(num) === 'number' ? num : 1;
		
		for(var i = 0; i < num; i++) {
			this.spawnWorker();
		}
	};	
	
	Cluster.prototype.listen = function listen(port, host, callback) {
		var self = this;
		
		if(this.preventDefault) return this;
		
		this.listening = true;
		this.emit('listen');
		
		if(isMaster) {
			//process.title = this.options['title'];
			// spawn workers
			this.spawn(this.options['workers']);
		} else if(isWorker) {
			//process.title = this.options['worker title'];
			// start server
			this.requireServer();
			this.server.on('listening', function() {
				process.send('cluster:online');
				self.running = true;
			});
			this.server.listen(port, host, callback);
		}
	};
	
	Cluster.prototype.requireServer = function requireServer() {
		if(typeof(this.server) === 'string') {
			this.server = require(path.resolve(this.dir, this.server));
		}
	};
	
	Cluster.prototype.set = function set(name, val) {
		this.options[name] = val;
		
		return this;
	};
	
	Cluster.prototype.get = function get(name) {
		return this.options[name];
	};
	
	Cluster.prototype.resolve = function resolve() {
		return path.resolve.apply(path, [ this.dir ].concat([].slice.call(arguments)));
	};
	
	Cluster.prototype.restart = function restart(args) {
		this.emit('restart');
		this.stop();
		childProcess.spawn(process.execPath, [ this.main.filename ].concat(args || []), {
			cwd: this.options['working directory'],
			customFds: [-1, 1, 2]
		});
		
		process.exit();
	};
	
	Cluster.prototype.reload = function reload(fn) {
		var reload = [].concat(this.workers),
			self = this;
		
		if(this.reloading) return this;
		
		this.reloading = true;
		
		this.spawn(reload.length);
		
		this.once('spawned', function(w) {
			self.emit('reload');
			if(fn) fn();
			
			for(var i = 0; i < reload.length; i++) {
				reload[i].shutdown();
			}
			
			self.reloading = false;
		});
	};
	
	Cluster.prototype.kill = function kill(signal) {
		return this.shutdown(signal || 'SIGTERM');
	};
	
	Cluster.prototype.stop = function stop(signal) {
		return this.shutdown(signal);
	};
	
	Cluster.prototype.shutdown = function shutdown(signal) {
		this.emit('shutdown', signal);
		
		this.workers.forEach(function(worker) {
			worker.shutdown(signal);
		});
		
		return this;
	};
	
	Object.defineProperties(Cluster.prototype, {
		environmentMatches: {
			get: function() {
				if(typeof(this.__env) === 'string') {
					return this.env === this.__env;
				}
				
				return true;
			}
		}
	});
	
	return Cluster;
})();
