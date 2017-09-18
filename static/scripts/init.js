requirejs.config({
	'baseUrl': 'scripts',
	'paths': {
		'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js',
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['./main']);