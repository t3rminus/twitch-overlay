'use strict';

const tmi = require("tmi.js"),
	_ = require('lodash'),
	parseEmotes = require('./emotes');

module.exports = function(config, displaySocket, controlSocket) {
	const client = new tmi.client({
		options: {
			debug: false
		},
		connection: {
			reconnect: true
		},
		identity: {
			username: config.tmi.login,
			password: config.tmi.oauth.replace(/^oauth:/, '')
		},
		channels: ['#' + config.tmi.handle]
	});
	
	client.connect();
	
	client.on('join', function(_, user){
		controlSocket.emit('action', user + ' joined!');
		console.log('JOIN', user);
	});
	
	client.on('part', function(_, user){
		controlSocket.emit('action', user + ' left');
		console.log('LEAVE', user);
	});
	
	client.on("chat", function (channel, user, message, self) {
		const username = (user['display-name'] || user['username']);
		if(user.emotes) {
			message = parseEmotes(message, user.emotes);
		}
		
		console.log('CHAT', username);
		
		if(username !== config.tmi.handle) {
			displaySocket.emit('chat', { channel: channel, user: user, message: message });
			controlSocket.emit('chat', { channel: channel, user: user, message: message });
		}
	});
	
	function updateViewercount() {
		client.api({
			url: 'https://api.twitch.tv/kraken/streams/' + config.tmi.handle + '?oauth_token=' + config.tmi.oauth.replace(/^oauth:/, '')
		}, function(err, res, body) {
			if(_.isString(body)) {
				try {
					body = JSON.parse(body);
				} catch(e) { }
			}
			
			const viewers = (body && body.stream && body.stream.viewers) || 0;
			
			displaySocket.emit('viewercount', viewers);
			controlSocket.emit('viewercount', viewers);
		});
	}
	
	setInterval(updateViewercount, 10000);
	updateViewercount();
};