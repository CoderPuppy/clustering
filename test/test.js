var cluster = require('clustering')
var http    = require('http')

var server = http.createServer(function(req, res) {
	// console.log('request')
	res.writeHead(200, { "Content-Type": "text/html" })
	res.end('<title>Hello, World!!!</title><h4 style="font-weight: normal;">Hello, World!!!</h4><p>Hello, World!!!</p>')
});

cluster.use(cluster.watch(true))

if(cluster.side == 'master') {
	cluster.spawn()

	// setInterval(function() { cluster.reload() }, 3000)
}

if(cluster.side == 'worker')
	server.listen(3000)