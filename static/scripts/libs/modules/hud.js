'use strict';

var clock = function(timer) {
	if(timer === null) {
		var today = new Date();
		var h = (today.getHours() % 12) + '';
		var m = today.getMinutes() + '';
		var s = today.getSeconds() + '';
		
		if (h === '0') {
			h = '12';
		}
		m = m.length === 1 ? '0' + m : m;
		s = s.length === 1 ? '0' + s : s;
		return h + ':' + m;
	} else {
		var m = Math.floor(timer / 60) + '';
		var s = (timer % 60) + '';
		
		s = s.length === 1 ? '0' + s : s;
		return m + ':' + s;
	}
};

define(['libs/window-event','libs/fontbrite','libs/fonts/basehud', 'libs/fonts/mania-score',
		'libs/fonts/mania-score-white','libs/fonts/mania-score-red'],

	function(windowEvent, FontBrite, basehud, maniaScore, maniaScoreWhite, maniaScoreRed) {
	var fb = new FontBrite();
	fb.defineFont(maniaScore, 'mania-score');
	fb.defineFont(maniaScoreWhite, 'mania-score-white');
	fb.defineFont(maniaScoreRed, 'mania-score-red');
	
	var viewers = '0';
	document.addEventListener('socketio.viewercount', function(event) {
		viewers = '' + event.data;
	});
	
	var timer = null, pausedTimer = false;
	document.addEventListener('socketio.timer', function(event) {
		switch(event.data) {
			case 'pause-timer':
				pausedTimer = !pausedTimer;
				break;
			case 'time-timer':
				timer = null;
				break;
			case '5-timer':
				timer = 100;
				break;
			case '10-timer':
				timer = 600;
				break;
		}
	});
	
	setInterval(function(){
		if(!pausedTimer && timer !== null && timer > 0) {
			timer--;
		} else if(timer === 0) {
			timer = null;
			windowEvent('animation','time-over');
			windowEvent('sound','time-over');
		}
	}, 1000);
	
	var fontHeight = fb.getStringHeight('mania-score','TIMESCOREVIEWERS09123456789:') - 4;
	var lineHeight = fontHeight + 4;
	
	return function(ctx) {
		var timerFont = timer !== null && (timer < 120 && timer % 2 === 1) ? 'mania-score-red' : 'mania-score';
		
		var clockStr = clock(timer),
			scoreStr = '0';
		
		var clockW = fb.getStringWidth('mania-score-white', clockStr),
			scoreW = fb.getStringWidth('mania-score-white', scoreStr),
			viewerW = fb.getStringWidth('mania-score-white', viewers);
		
		fb.renderLine(ctx, 'mania-score-white', clockStr, this.x + this.w - clockW, this.y);
		//fb.renderLine(ctx, 'mania-score-white', '0', this.x + this.w - scoreW, this.y + lineHeight);
		fb.renderLine(ctx, 'mania-score-white', viewers, this.x + this.w - viewerW, this.y + (lineHeight));
		
		// Cause timer to blink in last minute
		if(timer === null || timer === 0 || (timer > 60 || timer % 2 === 1)) {
			fb.renderLine(ctx, timerFont, (timer !== null) ? 'TIMER' : 'TIME', this.x, this.y);
		}
		
		//fb.renderLine(ctx, 'mania-score', 'SCORE', this.x, this.y + lineHeight);
		fb.renderLine(ctx, 'mania-score', 'VIEWERS', this.x, this.y + (lineHeight));
	}
});
