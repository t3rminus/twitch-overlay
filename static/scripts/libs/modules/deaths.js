'use strict';

define(['libs/fontbrite','libs/fonts/deaths'], function(FontBrite, deathFont) {
	var fb = new FontBrite();
	fb.defineFont(deathFont, 'death-font');
	
	var deaths = '0';
	document.addEventListener('socketio.death', function(event) {
		deaths = '' + event.data;
	});
	
	
	var deathImg = document.createElement('img');
	deathImg.src = 'http://localhost:5000/images/death-graphic.png';
	return function(ctx) {
		ctx.drawImage(deathImg, this.x, this.y);
		fb.renderLine(ctx, 'death-font', deaths, this.x + 24, this.y + 9);
	}
});
