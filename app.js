'use strict';
const _ = require('lodash');

const config = _.defaultsDeep({}, require('./config.js'), {
	port: 5000
});

// config.tmi.handle = 'lck1';

// Init Webserver
const webserver = require('./lib/webserver');
const app = webserver(config);

// Init sockets
const websockets = require('./lib/websockets');
const sockets = websockets(app);

// Init Twitch.tv
const Twitch = require('./lib/twitch');
Twitch(config, sockets.displaySocket, sockets.controlSocket);