'use strict';
requirejs(['libs/puppet-master'], function(PuppetMaster) {
	document.addEventListener('animation', function(event) {
		var theAnimation = event.data;
		
	});
	
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
});