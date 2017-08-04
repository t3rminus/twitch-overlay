'use strict';
const _ = require('lodash');

function makeImage(name, url) {
	if(name.indexOf('"') >= 0 || url.indexOf('"') >= 0)  {
		return name;
	}
	return '<img alt="' + name + '" title="' + name + '" src="' + url + '" />';
}

module.exports = function parseEmotes(message, emotes) {
	let newMessage = message;
	
	let tmp = _.map(emotes, function(emote, index) {
		return _.map(emote, function(chars) {
			const indexes = chars.split("-");
			const oldUrl = encodeURIComponent("http://static-cdn.jtvnw.net/emoticons/v1/" + index + "/1.0");
			
			return {
				url: 'http://localhost:5000/emote?url=' + oldUrl, //url: "http://static-cdn.jtvnw.net/emoticons/v1/" + index + "/1.0",
				startIndex: parseInt(indexes[0]),
				endIndex: parseInt(indexes[1]) + 1
			};
		});
	});
	tmp = _.flatten(tmp);
	
	tmp = _.sortBy(tmp, (item) => -1 * item.startIndex);
	
	_.forEach(tmp, (emote) => {
		const emoteName = newMessage.substring(emote.startIndex, emote.endIndex);
		
		const leftPart = newMessage.substring(0, emote.startIndex);
		const middlePart = makeImage(emoteName, emote.url);
		const rightPart = newMessage.substring(emote.endIndex);
		
		newMessage = leftPart + middlePart + rightPart;
	});

	return newMessage;
};