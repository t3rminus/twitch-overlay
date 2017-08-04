$(function(){
	// Canvas, renderer
	var display = document.getElementById('display'),
		ctx = display.getContext("2d"),
		renderer = new FontBrite(ctx),
		animator = new PuppetMaster(ctx);

	var cloneFont = function(srcFont, img) {
		var newFont = {};
		for(var char in srcFont) {
			if (srcFont.hasOwnProperty(char)) {
				newFont[char] = srcFont[char];
			}
		}
		newFont.img = img;
		return newFont;
	};

	// Fonts
	renderer.defineFont(
		cloneFont(baseHud, 'http://localhost:5000/color?color=ffff00&img=font3.png'), 'yellowHud');

	renderer.defineFont(
		cloneFont(baseHud, 'http://localhost:5000/color?color=ff0000&img=font3.png'), 'redHud');

	renderer.defineFont(
		cloneFont(baseHud, 'http://localhost:5000/images/font3-white.png'), 'whiteHud');

	renderer.defineFont(
		cloneFont(smallText, 'http://localhost:5000/images/smallfont-white.png'), 'whiteText');

	renderer.defineFont(deathFont, 'deathFont');

	var renderHud = function(x, y, align) {
			if(align == 'right') {
				var clockStr = clock(),
					scoreStr = '0',
					viewerStr = '' + viewercount;

				var clockW = renderer.getStringWidth('whiteHud', clockStr),
					scoreW = renderer.getStringWidth('whiteHud', scoreStr),
					viewerW = renderer.getStringWidth('whiteHud', viewerStr);

				renderer.renderLine('whiteHud', clockStr, x - clockW, y);
				renderer.renderLine('whiteHud', '0', x - scoreW, y + 16);
				renderer.renderLine('whiteHud', viewerStr, x - viewerW, y + 32);

				// 30 is width of "TIME", 39 "SCORE", 55 "VIEWERS"
				if(timer === null || timer === 0 || (timer > 60 || timer % 2 == 1)) {
					renderer.renderLine(timer !== null && redTimer ? 'redHud' : 'yellowHud', 'TIME', x - clockW - 40, y);
				}
				renderer.renderLine('yellowHud', 'SCORE', x - scoreW - 59, y + 16);
				renderer.renderLine('yellowHud', 'VIEWERS', x - viewerW - 65, y + 32);
			} else {
				if(timer === null || timer === 0 || (timer > 60 || timer % 2 == 1)) {
					renderer.renderLine(timer !== null && redTimer ? 'redHud' : 'yellowHud', 'TIME', x, y);
				}
				renderer.renderLine('yellowHud', 'SCORE', x, y + 16);
				renderer.renderLine('yellowHud', 'VIEWERS', x, y + 32);

				renderer.renderLine('whiteHud', clock(), x + 40, y);
				renderer.renderLine('whiteHud', '0', x + 49, y + 16);
				renderer.renderLine('whiteHud', viewercount, x + 65, y + 32);
			}
		},
		renderChat = function(theChat, x, y, w, h, align) {
			var line;
			var curY = y + h;
			getChatHeight(theChat, w);
			for(var i = chatArr.length - 1; i >= 0; i--) {
				line = chatArr[i];

				curY -= line.nameHeight + line.messageHeight + 10;

				if(curY > y) {
					if(align == 'left') {
						renderer.renderLine(line.color, line.name, x, curY);
						curY += line.nameHeight;
						renderer.renderBlock('whiteText', line.message, x, curY, w);
					} else if(align == 'right') {
						var nameW = renderer.getStringWidth('whiteText', line.name);
						renderer.renderLine(line.color, line.name, x + (w - nameW), curY);
						curY += line.nameHeight;
						renderer.renderBlock('whiteText', line.message, x, curY, w, null, null, 'right');
					}
				}
			}
		},
		getChatHeight = function(theChat, w) {
			var i, line, chatHeight = 0;
			for(i = 0; i < theChat.length; i++) {
				line = theChat[i];
				if(!line.nameHeight) {
					line.nameHeight = renderer.getStringHeight('whiteText', line.name);
				}
				if(!line.messageHeight) {
					line.messageHeight = renderer.getBlockHeight('whiteText', line.message, w);
				}
				chatHeight += line.nameHeight + line.messageHeight;
			}
			return chatHeight;
		};


	// Socket, state
	var socket = io(window.location.origin + '/overlay');
	var chatPadding = 10,
		chatWidth = 106,
		deaths = 0;
	var mode = 'mode-169-cam';

	var chatArr = [], viewercount = 0;

	socket.on('viewercount', function(msg) { viewercount = msg; });

	socket.on('mode', function(newMode) { mode = newMode; console.log('Switching', newMode); });

	socket.on('chat', function(obj) {
		var name = (obj.user['display-name'] || obj.user['username'] || 'Unknown??');
		var color = (obj.user && obj.user.color) ? obj.user.color.replace('#','') : 'FFFFFF';
		chatArr.push({
			name: name,
			message: obj.message,
			color: 'color_'+color
		});

		while(chatArr.length > 20) {
			chatArr.shift();
		}

		if(renderer) {
			if(!renderer.getFont('color_'+color)) {
				renderer.defineFont(cloneFont(smallText, 'http://192.168.1.60:5000/color?color='+color+'&img=smallfont.png&l=1.3'), 'color_'+color);
			}
		}

		var emotes = grepEmote(obj.message);
		if(emotes) {
			$.each(emotes, function(key, val) {
				if(renderer) {
					renderer.defineEmoticon(key, val);
				}
			});
		}
	});

	socket.on('death', function(newDeaths) {
		deaths = newDeaths;
	});

	var redTimer = false;
	var timerFn = function(){
		if(timer) {
			timer--;
		}
		redTimer = !redTimer;

		if(timer == 0) {
			clearInterval(timerInterval);
			timeOver();
		}
	};

	// Time/Timer controls
	var timer = null, timerInterval;
	socket.on('timer', function(message) {
		console.log('timer', message);
		switch(message) {
			case '5-timer':
				timer = 10;
				if(timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}
				timerInterval = setInterval(timerFn, 1000);
				break;
			case '10-timer':
				timer = 300;
				if(timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}
				timerInterval = setInterval(timerFn, 1000);
				break;
			case 'pause-timer':
				if(timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				} else {
					timerInterval = setInterval(timerFn, 1000);
				}
				break;
			case 'time-timer':
				timer = null;
				if(timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}
				break;
		}
	});

	var clock = function() {
		if(timer == null) {
			var today = new Date();
			var h = (today.getHours() % 12) + '';
			var m = today.getMinutes() + '';
			var s = today.getSeconds() + '';

			if (h == '0') {
				h = '12';
			}
			m = m.length == 1 ? '0' + m : m;
			s = s.length == 1 ? '0' + s : s;
			return h + ':' + m + ':' + s;
		} else {
			var m = Math.floor(timer / 60) + '';
			var s = (timer % 60) + '';

			s = s.length == 1 ? '0' + s : s;
			return m + ':' + s;
		}
	};

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

	var deathImg = document.createElement('img');
	deathImg.src = 'http://localhost:5000/images/deathGraphic.png';
	var drawDeaths = function(x,y) {
		ctx.drawImage(deathImg, x, y);
		renderer.renderLine('deathFont', '' + deaths, x + 24, y + 9);
	};

	animator.defineAnimation('time_over', {
		actors: {
			'time': 'http://localhost:5000/images/time.png',
			'over': 'http://localhost:5000/images/over.png'
		},
		steps: [
			{
				startTime: 0,
				duration: 1500,
				'time': function(percent) {
					var x = Math.round(-50 + (230 * percent));
					this.render(x, 127);
				},
				'over': function(percent) {
					var x = Math.round(480 + (-230 * percent));
					this.render(x, 127);
				}
			},
			{
				startTime: 1500,
				duration: 10000,
				'time': function() {
					this.render(180, 127);
				},
				'over': function() {
					this.render(250, 127);
				}
			},
			{
				startTime: 11500,
				duration: 2000,
				'time': function(percent) {
					this.render(180, 127, null, null, Math.max(0, 1 - percent));
				},
				'over': function(percent) {
					this.render(250, 127, null, null, Math.max(0, 1 - percent));
				}
			}
		]
	});


	var timeOver = function() {
		animator.play('time_over');
	};

	window.timeOver = timeOver;

	if(Zoetrope) {
		var testanim = new Zoetrope('images/testanim.png', 15, {
			'run': [0, 0, 48, 48, 6]
		});
	}

	var renderFrame = function(dt) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if(mode == 'mode-169-cam') {
			renderHud(ctx.canvas.width - 10, 10, 'right');
			renderChat(chatArr, 364, 52, 106, 148, 'right');
			drawDeaths(10, ctx.canvas.height - 26);
		} else if(mode == 'mode-169-nocam') {
			renderHud(ctx.canvas.width - 10, 10, 'right');
			renderChat(chatArr, 364, 52, 106, 208, 'right');
			drawDeaths(10, ctx.canvas.height - 26);
		} else if(mode =='mode-43-nocam') {
			renderHud(10, 10, 'left');
			renderChat(chatArr, 10, 52, 106, 208, 'left');
			drawDeaths(116, ctx.canvas.height - 26);
		} else {
			renderHud(10, 10, 'left');
			renderChat(chatArr, 10, 52, 106, 118, 'left');
			drawDeaths(116, ctx.canvas.height - 26);
		}

		testanim.draw(ctx, 'run', 0, 0, dt);

		animator.update(dt);
		window.requestAnimationFrame(renderFrame);
	};

	window.requestAnimationFrame(renderFrame);
});