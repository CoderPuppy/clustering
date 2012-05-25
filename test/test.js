var cluster = require('clustering');
var http = require('http');

var server = http.createServer(function(req, res) {
	console.log('request');
	res.writeHead(200, { "Content-Type": "text/html" });
	res.end('<title>Hello, World!!!</title><h4 style="font-weight: normal;">Hello, World!!!</h4><p>Hello, World!!!</p>');
});

cluster(server)
	.use(cluster.pidfiles())
	.use(cluster.cli())
	.use(cluster.watch())
	.listen(3000);
