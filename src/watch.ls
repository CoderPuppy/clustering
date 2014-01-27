require! chokidar

watch = (full = true) ->
	(cluster) ->
		watcher = chokidar.watch(Object.keys(require.cache), persistent: true)

		watcher.on \change, ->
			cluster.reload(full)

		cluster.on \stop, ->
			watcher.close!

		if cluster.side == \worker
			cluster.send \watch, Object.keys(require.cache)
		else if cluster.side == \master
			cluster.on \message:watch, (worker, msg) ->
				watcher.add msg

module.exports = watch