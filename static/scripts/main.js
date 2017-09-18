'use strict';
requirejs(['libs/socket', 'libs/manager'], function(__, LayoutManager) {
	var lm = new LayoutManager();
	lm.addLayout('169_leftchat', {
		elements: [
			{
				module: 'chat',
				x: 10,
				y: 64,
				w: 106,
				h: 178,
				align: 'left'
			},
			{
				module: 'hud',
				x: 10,
				y: 10,
				w: 106,
				h: 48
			},
			{
				module: 'deaths',
				x: 10,
				y: 244
			}
		]
	});
	lm.setLayout('169_leftchat');
	
	var init = function() {
		var display = document.getElementById('display'),
			ctx = display.getContext("2d");
		
		var render = function(dt) {
			// Clear the frame
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			
			// Render anything in the layout
			lm.renderFrame(ctx, dt);
			
			// Let's go!
			window.requestAnimationFrame(render);
		};
		window.requestAnimationFrame(render);
	};
	
	if(document.readyState === 'complete') {
		setTimeout(init);
	} else {
		document.addEventListener('DOMContentLoaded', init);
	}
});