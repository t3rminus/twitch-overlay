'use strict';

const express = require('express'),
	app = express(),
	http = require('http'),
	request = require('request-promise'),
	Canvas = require('./canvas');

require('http').createServer(app);

module.exports = function(config) {
	// Create the HTTP server
	require('http').createServer(app);
	
	// Allow cross-domain stuff
	app.all('/', function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'referer, range, accept-encoding, x-requested-with');
		next();
	});
	
	// Simple proxy for emotes
	app.get('/emote', function(req, res){
		if(!req.query['url']) {
			res.send(400);
			res.end();
			return;
		}
		
		http.get(req.query['url'], function(eRes) {
			if(eRes.statusCode !== 200) {
				return res.sendStatus(400);
			}
			
			eRes.pipe(res);
		});
	});
	
	app.get('/color', function(req, res) {
		return Canvas.colorizeImage(req.query['color'], req.query['img'], req.query['l'])
			.then(function(imgResult) {
				res.header('Content-type', imgResult.mime);
				res.write(imgResult.buffer);
				res.end();
			});
	});
	
	// Static routes
	app.use(express.static(__dirname + '/../static'));
	
	return app.listen(config.port, function() {
		console.log('Listening on ' + config.port);
	});
};