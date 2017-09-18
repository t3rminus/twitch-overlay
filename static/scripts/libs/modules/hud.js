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

define(['libs/fontbrite','libs/fonts/basehud', 'libs/fonts/mania-score',
		'libs/fonts/mania-score-white','libs/fonts/mania-score-red'],

	function(FontBrite, basehud, maniaScore, maniaScoreWhite, maniaScoreRed) {
	var fb = new FontBrite();
	fb.defineFont(maniaScore, 'mania-score');
	fb.defineFont(maniaScoreWhite, 'mania-score-white');
	fb.defineFont(maniaScoreRed, 'mania-score-red');
	
	var viewers = '0';
	document.addEventListener('socketio.viewercount', function(event) {
		viewers = '' + event.data;
	});
	
	var timer = null, redTimer = false;
	document.addEventListener('socketio.timer', function(event) {
		timer = event.data;
	});
	
	var fontHeight = fb.getStringHeight('mania-score','TIMESCOREVIEWERS09123456789:') - 4;
	var lineHeight = fontHeight + 4;
	
	return function(ctx) {
		var timerFont = timer !== null && redTimer ? 'mania-score-red' : 'mania-score';
		
		var clockStr = clock(timer),
			scoreStr = '0';
		
		var clockW = fb.getStringWidth('mania-score-white', clockStr),
			scoreW = fb.getStringWidth('mania-score-white', scoreStr),
			viewerW = fb.getStringWidth('mania-score-white', viewers);
		
		fb.renderLine(ctx, 'mania-score-white', clockStr, this.x + this.w - clockW, this.y);
		fb.renderLine(ctx, 'mania-score-white', '0', this.x + this.w - scoreW, this.y + lineHeight);
		fb.renderLine(ctx, 'mania-score-white', viewers, this.x + this.w - viewerW, this.y + (lineHeight * 2));
		
		// Cause timer to blink in last minute
		if(timer === null || timer === 0 || (timer > 60 || timer % 2 === 1)) {
			fb.renderLine(ctx, timerFont, 'TIME', this.x, this.y);
		}
		
		fb.renderLine(ctx, 'mania-score', 'SCORE', this.x, this.y + lineHeight);
		fb.renderLine(ctx, 'mania-score', 'VIEWERS', this.x, this.y + (lineHeight * 2));
	}
});
