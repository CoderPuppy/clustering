# Clustering
### A small cluster module with a plugin system

## Install

```shell
npm install clustering
```

## Usage

```javascript
var clustering = require('clustering');

if(clustering.side == 'master')
	clustering.spawn()

if(clustering.side == 'worker')
	yourServer.listen(3000)
```

And that will create a cluster running `yourServer`.

You can also `use` a `plugin` EG. `use(clustering.watch())` (watches all files that are loaded)

## API

- `use(plugin(Cluster))` => Use a plugin (execute it passing in the cluster)
- `reload(full = false)` => Reload the workers, if full is true then also reload the master
- `kill(signal = 'SIGKILL')` => Killall the workers with _signal_
- `side` => 'master' if it's the master, 'worker' if it's a worker

### Plugins

- `watch(full = true)` => Automatically reload the cluster
	- `full` => Whether or not to to a full restart