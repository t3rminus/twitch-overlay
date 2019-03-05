'use strict';
requirejs(['libs/socket', 'libs/manager', 'libs/animations'], function(__, LayoutManager, Animations) {
	var lm = new LayoutManager();
	lm.addLayout('window_main', window._layout || {}, true);
	

	
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