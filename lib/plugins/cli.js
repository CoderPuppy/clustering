var fs = require('fs');
var colors = require('colors');

var commands = [];

var cli = module.exports = function cli() {
	return function cliPlugin(cluster) {
		if(!cluster.pidfileDir) throw new Error('CLI requires pidfiles');
		
		cluster.killall = function killall(sig) {
			var pid = cluster.pid();
			try {
				process.kill(pid, sig);
				
				cluster.pids().forEach(function(pid){
					try {
						process.kill(pid, sig);
					} catch(err) {
						if(err.code != 'ESRCH') throw err;
					}
				});
			} catch (err) {
				if(err.code != 'ESRCH') throw err;
			}
		};
		
		var args = process.argv.slice(2),
		 	len = commands.length, 
		 	command, arg, i;
		
		// parse args
		while(args.length) {
			arg = args.shift();
			for(i = 0; i < len; ++i) {
				command = commands[i];
				if(command.flags.indexOf(arg) != -1) {
					cluster.preventDefault = true;
					command.run(cluster);
				}
			}
		}
	};
};

var define = cli.define = function define(name, run, desc) {
	commands.push({
		flags: name.split(/ *, */),
		run: run,
		desc: desc
	});
};

define('-s, --status, status', function(cluster){
	var dir = cluster.pidfileDir,
		files = fs.readdirSync(dir);
	
	// null signal failed previous
	// to this release
	if(process.version < 'v0.4.1') {
		console.log('status will not work with node < 0.4.1');
		console.log('due to SIGTERM globbering the null signal');
		process.exit(1);
	}

	console.log();

	// only pids
	files.filter(function(file){
		return file.match(/\.pid$/);
	}).forEach(function(file){
		var name = file.replace('.pid', ''),
			pid = cluster.pidof(name),
			name = name.replace('.', ' '),
			color, status;
		
		try {
			process.kill(pid, 0);
			status = 'alive';
			color = 'cyan';//'36'; // cyan
		} catch (err) {
			if(err.code == 'ESRCH') {
				color = 'red';//'31'; // red
				status = 'dead';
			} else {
				throw err;
			}
		}
		
		//console.log('  %s\033[90m %d\033[0m \033[' + color + 'm%s\033[0m', name, pid, status);
		console.log('  %s %s %s', name, pid.toString().grey, status.toString()[color]);
	});

	console.log();
}, 'Output cluster status');

define('-r, --restart, restart', function(cluster){
  cluster.killall('SIGUSR2');
	console.log('Restarted'.green);
}, 'Restart master by sending the SIGUSR2 signal');

define('-g, --shutdown, shutdown', function(cluster){
  cluster.killall('SIGQUIT');
	console.log('Shutdown'.green);
}, 'Graceful shutdown by sending the SIGQUIT signal');

define('-S, --stop, stop', function(cluster){
  cluster.killall('SIGTERM');
	console.log('Stopped'.green);
}, 'Hard shutdown by sending the SIGTERM signal');

define('-h, --help, help', function(cluster){
  console.log('\n  Usage: node <file> <command>\n');
  commands.forEach(function(command){
    console.log('    ' +
      command.flags.join(', ') +
      '\n    ' +
      //'\033[90m' + command.desc + '\033[0m' +
      command.desc.toString().grey +
      '\n');
  });
  console.log();
}, 'Show help information');

define('-b, --background, background', function(cluster) {
	console.log('Started'.green);
	cluster.restart();
}, 'Start the cluster in the background');
