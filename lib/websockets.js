'use strict';

const SocketIO = require('socket.io');

module.exports = function(server) {
	const io = SocketIO.listen(server);
	
	const displaySocket = io.of('/overlay');
	const controlSocket = io.of('/controls');
	
	displaySocket.on('connection', function(socket){
		console.log('Display Socket Connected');
	});
	
	controlSocket.on('connect', function(socket) {
		socket.on('command', function(command) {
			switch(command) {
				case 'mode-169-cam':
					//kb('1', ['control', 'command']);
					displaySocket.emit('mode', command);
					break;
				case 'mode-43-cam':
					//kb('2', ['control', 'command']);
					displaySocket.emit('mode', command);
					break;
				case 'mode-43-nocam':
					//kb('4', ['control', 'command']);
					displaySocket.emit('mode', command);
					break;
				case 'mode-169-nocam':
					//kb('3', ['control', 'command']);
					displaySocket.emit('mode', command);
					break;
				case 'pause-timer':
				case 'time-timer':
				case '5-timer':
				case '10-timer':
					displaySocket.emit('timer', command);
					break;
				case 'death-add':
					console.log('Add Deaths');
					// addDeaths(1);
					break;
				case 'death-sub':
					console.log('Sub Deaths');
					// addDeaths(-1);
					break;
			}
		});
	});
	
	return {
		displaySocket: displaySocket,
		controlSocket: controlSocket
	};
};