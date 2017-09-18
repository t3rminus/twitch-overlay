'use strict';

var grepEmote = function(str) {
	var result;
	var matches = str.match(/<img\s+alt="([^"]+)"\s+title="([^"]+)"\s+src="(http:\/\/localhost:5000\/emote[^"]+)" \/>/g);
	if(matches && matches.length) {
		result = {};
		matches.forEach(function(thEmote) {
			var parts = thEmote.match(/<img\s+alt="([^"]+)"\s+title="([^"]+)"\s+src="([^"]+)" \/>/);
			result[parts[0]] = parts[3];
		});
	}
	
	return result;
};

var roundColor = function(color) {
	var r = Math.floor(parseInt(color.substr(0,2),16) / 25) * 25,
		g = Math.floor(parseInt(color.substr(2,2),16) / 25) * 25,
		b = Math.floor(parseInt(color.substr(4,2),16) / 25) * 25;
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);
	return (r.length === 1 ? '0'+r:r) + (g.length === 1 ? '0'+g:g) + (b.length === 1 ? '0'+b:b);
};

define(['libs/fontbrite','libs/fonts/smalltext'], function(FontBrite, smalltext) {
	var fb = new FontBrite();
	fb.defineFont(smalltext, 'smalltext');
	fb.cloneFont('smalltext','smalltext-white', 'http://localhost:5000/images/smallfont-white.png');
	
	var chat = [];
	document.addEventListener('socketio.chat', function(event) {
		var obj = event.data;
		
		var name = (obj.user['display-name'] || obj.user['username'] || 'Unknown??');
		if(!/[a-z]/i.test(name) && /[a-z]/i.test(obj.user['username'])) {
			name = obj.user['username'];
		}
		
		var color = (obj.user && obj.user.color) ? roundColor(obj.user.color.replace('#','')).toUpperCase() : 'FFFFFF';
		chat.push({
			name: name,
			message: obj.message,
			color: 'smalltext-color_'+color
		});
		
		while(chat.length > 20) {
			chat.shift();
		}
		
		if(!fb.getFont('smalltext-color_'+color)) {
			fb.cloneFont('smalltext', 'smalltext-color_'+color,
				'http://localhost:5000/color?color='+color+'&img=smallfont.png&l=1.3');
		}
		
		var emotes = grepEmote(obj.message);
		if(emotes) {
			var emoteKeys = Object.keys(emotes);
			for(var i = 0; i < emoteKeys.length; i++) {
				fb.defineEmoticon(emoteKeys[i], emotes[emoteKeys[i]]);
			}
		}
	});
	
	var yAnim = 0;
	return function(ctx) {
		var line;
		var curY = this.y + this.h;
		ctx.save();
		ctx.beginPath();
		ctx.rect(this.x, this.y, this.w, this.h);
		ctx.clip();
		
		for(var i = chat.length - 1; i >= 0; i--) {
			line = chat[i];
			if(!line.nameHeight) {
				line.nameHeight = fb.getStringHeight(line.color, line.name);
			}
			if(!line.messageHeight) {
				line.messageHeight = fb.getBlockHeight('smalltext-white', line.message, this.w);
			}
			if(!line.onScreen) {
				line.onScreen = true;
				yAnim += line.nameHeight + line.messageHeight;
			}
		}
		
		yAnim -= yAnim / 3;
		yAnim = yAnim < 1 ? 0 : yAnim;
		
		for(var i = chat.length - 1; i >= 0; i--) {
			line = chat[i];
			
			curY -= line.nameHeight + line.messageHeight + 10;
			
			if((curY + line.nameHeight + line.messageHeight + 10) > this.y) {
				if(this.align === 'right') {
					var nameW = fb.getStringWidth('smalltext-white', line.name);
					fb.renderLine(ctx, line.color, line.name, this.x + (this.w - nameW), curY + Math.floor(yAnim));
					curY += line.nameHeight;
					fb.renderBlock(ctx, 'smalltext-white', line.message, this.x, curY +  Math.floor(yAnim), this.w, null, null, 'right');
				} else {
					fb.renderLine(ctx, line.color, line.name, this.x, curY +  Math.floor(yAnim));
					curY += line.nameHeight;
					fb.renderBlock(ctx, 'smalltext-white', line.message, this.x, curY +  Math.floor(yAnim), this.w);
				}
			}
		}
		
		ctx.restore();
	}
});
