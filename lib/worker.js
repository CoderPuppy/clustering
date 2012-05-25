var n = require('natives');
var util = n.util;
var events = n.events;
var colors = require('colors');
var uuid = require('./uuid').context('workers');

var Worker = module.exports = (function WorkerClass() {
	function Worker(proc) {
		var self = this;
		
		this.proc = proc;
		this.pid = proc.pid;
		this.id = uuid();
		
		this.proc.on('message', function(msg) {
			if(msg === 'cluster:online') {
				self.emit('online');
			} else {
				self.emit('message', msg);
			}
		}).on('exit', function(code, signal) {
			if(self.stopping) {
				console.log(util.format('Worker %d shutdown', self.id).green);
			} else {
				console.log(util.format('Worker %d died with code %d', self.id, code).red);
			}
			
			self.emit('shutdown', code, signal);
		});
	}
	util.inherits(Worker, events.EventEmitter);
	
	Worker.prototype.kill = function kill(signal) {
		this.proc.kill(signal);
		
		return this;
	};
	
	Worker.prototype.shutdown = function shutdown(signal) {
		var hard = !!signal;
		
		if(this.stopping) return this;
		
		this.stopping = true;
		
		uuid.release();
		
		if(hard) return this.kill(signal);
		
		try {
			this.proc.send('cluster:shutdown');
		} catch(e) {
			// problably "channel closed" indicating that this's process has exited
		}
		
		return this;
	};
	
	Worker.prototype.hardShutdown = function hardShutdown(signal) {
		return this.kill(signal);
	};
	
	return Worker;
})();
