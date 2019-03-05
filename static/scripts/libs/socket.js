'use strict';
define(['libs/window-event', 'socket.io'], function(windowEvent, io) {
	var socket = io(window.location.origin + '/overlay');

	var onevent = socket.onevent;
	socket.onevent = function(packet) {
		var args = packet.data || [];
		onevent.call(this, packet);
		packet.data = ['*'].concat(args);
		onevent.call(this, packet);
	};
	
	socket.on('*',function(event, data) {
		windowEvent('socketio.' + event, data);
	});
});