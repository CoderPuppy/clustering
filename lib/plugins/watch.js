var fs = require('fs');
var cluster = require('cluster');

var isWorker = cluster.isWorker,
	isMaster = cluster.isMaster;

function getDeps(mod) {
	var deps = mod.children;
	
	return [ mod ].concat(deps.length ? deps.map(function(dep) {
		return [ dep ].concat(getDeps(dep));
	}).reduce(function(a, b) {
		return a.concat(b);
	}) : []);
}

module.exports = function watch(paths, full) {
	if(typeof(paths) === 'boolean') {
		full = paths;
		paths = undefined;
	}
	if(typeof(paths) === 'undefined') paths = getDeps(require.main).map(function(m) {
		return m.filename;
	});
	if(typeof(paths) === 'string') paths = [ paths ];
	
	function watchPlugin(cluster) {
		if(isMaster) {
			paths.forEach(function(p) {
				fs.watchFile(cluster.resolve(p), function(cur, prev) {
					if(cur.mtime > prev.mtime) {
						console.log('modification in: %s', p);
						if(full) {
							cluster.restart();
						} else {
							cluster.reload();
						}
					}
				});
			});
		
			cluster.on('stop', function() {
				paths.forEach(function(p) {
					fs.unwatchFile(cluster.resolve(p));
				});
			}).on('spawning', function(w) {
				w.on('message', function(msg) {
					if(msg.name === 'cluster:plugin:watch:full') {
						full = !!msg.value;
					}
				});
			});
		} else if(isWorker && full) {
			process.send({ name: 'cluster:plugin:watch:full', value: true });
		}
	};
	
	watchPlugin.enableInWorker = true;
	
	return watchPlugin;
};
