'use strict';
define(['socket.io'], function(io) {
	var socket = io(window.location.origin + '/overlay');

	var onevent = socket.onevent;
	socket.onevent = function(packet) {
		var args = packet.data || [];
		onevent.call(this, packet);
		packet.data = ['*'].concat(args);
		onevent.call(this, packet);
	};
	
	socket.on('*',function(event, data) {
		var tmpEvent = new Event('socketio.' + event, { 'bubbles': false, 'cancelable': true });
		tmpEvent.data = data;
		document.dispatchEvent(tmpEvent);
	});
});