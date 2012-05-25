# Clustering
### A small cluster module with a plugin system

## Usage

```javascript
var clustering = require('clustering');

cluster(yourServer)
	.listen(3000);
```

And that will create a cluster running `yourServer`.

You can also `use` a `plugin` EG. `use(clustering.watch())` (watches the main file)
Or `set` a property EG. `set('workers', 128)` (gives you a rediculous amount of workers)

## API

### Cluster

- `use(plugin(Cluster))` => Use a plugin (execute it passing in the cluster)
- `listen(port, host, callback)`** => Listen in workers or Start workers in master
- `set(prop, value)` => Set options (see `options`)
- `restart()` => Restart the cluster (Start a new master and exit)
- `reload()` => Reload the workers
- `shutdown([signal])` => Shutdown the workers if there is a signal it sends that to them
- `kill([signal])` => See `shutdown`
- `stop([signal])` => See `shutdown`

### Options

- `workers` => The number of workers to spawn
- `working directory` => Where to start new masters and (maybe?) workers

### Plugins

- `cli()` => CLI to the cluster
	- Requires `pidfiles`
	- Define new commands => Look at the source
	- Built-in commands
		- `status` (`-s`, `--status`) => Shows the status of the cluster
		- `restart` (`-r`, `--restart`) => Restarts the cluster
		- `stop` (`-S`, `--stop`) => Kills the cluster
		- `shutdown` (`-g`, `--shutdown`) => Shuts the cluster down (gracefully)
		- `help` (`-h`, `--help`) => Shows the help for the commands
		- `background` (`-b`, `--background`) => Starts the cluster in the background (actually just restarts it)
- `watch([files[]], [full])` => Automatically restart / reload the cluster
	- `files` => The files to watch. Defaults to the main module
	- `full` => Whether or not to to a full restart
- `pidfiles(dir)` => Save pidfiles for the master and workers
	- `dir` => Where to save them
