require! {
	cluster
	EE: events.EventEmitter
	os
	child-process: child_process
}

num-cpus = os.cpus!.length

module.exports = new class extends EE
	->
		super!

		if cluster.is-master
			@side = \master

		else if cluster.is-worker
			@side = \worker

		cluster.on \exit, (...args) ~> @emit(\exit, ...args)

		console.log @

	send: (chan, msg) ->
		if @side != \worker
			throw new Error('Can only send messages from workers')

		process.send {chan, msg}

	spawn: (num = num-cpus) ->
		for i from 1 to num
			@spawn-worker!

		@

	spawn-worker: ->
		worker = cluster.fork!

		worker.on \message, ({chan, msg}) ~>
			@emit "message:#{chan}", worker, msg

		@emit \worker, worker

		worker

	killall: (sym) ->
		for id, worker of cluster.workers
			worker.kill sym

		@

	reload: (full) ->
		num = cluster.workers.length
		@killall \SIGQUIT

		if full
			@emit \stop

			child-process.fork(require.main.filename, process.argv)

			process.exit 0
		else
			@spawn num

	use: (plugin) ->
		plugin(@)

		@

	watch: require \./watch