/**
 * @name FontBrite
 * @namespace
 */
(function(){
	var Util = {
		createImage: function(src) {
			if(src.src) {
				return src;
			}

			var img = document.createElement('img');
			img.src = src;
			return img;
		},
		isFunction: function(func) {
			return func && Object.prototype.toString.call(func) === '[object Function]';
		},
		bind: function(obj, func) {
			return function() {
				return func.apply(obj, arguments);
			};
		}
	};


	var genImageFn = function(pm, obj) {
			obj.render = Util.bind(obj, function(x, y, w, h, opacity, degrees) {
				w = w || obj.img.width; h = h || obj.img.height;
				pm.ctx.save();
				pm.ctx.translate(x + (w / 2), y + (h / 2));
				if(opacity) {
					pm.ctx.globalAlpha = opacity;
				}
				if(degrees) {
					pm.ctx.rotate(degrees * Math.PI / 180);
				}
				pm.ctx.drawImage(obj.img, (w / -2), (h / -2), w, h);
				pm.ctx.globalAlpha = 1;
				pm.ctx.restore();
			});

			return obj;
		},
		genActor = function(pm, obj) {
			// Defaults
			var def = {
				x: 0,
				y: 0,
				rot: 0,
				opacity: 1
			};

			for(var prop in def) {
				if(!obj.hasOwnProperty(prop)) {
					obj[prop] = def[prop];
				}
			}

			return genImageFn(pm, obj);
		};

	var PuppetMaster = function(ctx) {
		var pm = this;
		pm.ctx = ctx;
		pm.animations = {};
		pm.activeAnimations = [];
	};

	PuppetMaster.prototype.defineAnimation = function(name, definition) {
		var pm = this;
		for(var actor in definition.actors) {
			if (definition.actors.hasOwnProperty(actor)) {
				if (typeof(definition.actors[actor]) === 'string') {
					// Just a string. Generate the whole thing
					var img = Util.createImage(definition.actors[actor]);
					definition.actors[actor] = genActor(pm, { img: img });
				} else if (definition.actors[actor].render && typeof(definition.actors[actor].render) === 'function') {
					// Everything is good. Don't generate anything, just bind the render function
					definition.actors[actor].img = Util.createImage(definition.actors[actor].img);
					definition.actors[actor].render = Util.bind(definition.actors[actor], definition.actors[actor].render);
					definition.actors[actor] = genActor(pm, definition.actors[actor])
				} else if (definition.actors[actor].img && !definition.actors[actor].render) {
					// No Render function. We need that!
					definition.actors[actor].img = Util.createImage(definition.actors[actor].img);
					definition.actors[actor] = genImageFn(pm, definition.actors[actor].img);
				} else {
					throw new Error('Invalid actor defined');
				}
			}
		}

		var endTime = 0;
		definition.steps.forEach(function(step) {
			// Calculate end time
			endTime = Math.max(endTime, step.startTime + step.duration);

			for(var actor in step) {
				// Bind the actor functions to the actors
				if(Util.isFunction(step[actor]) && step.hasOwnProperty(actor)) {
					step[actor] = Util.bind(definition.actors[actor], step[actor]);
				}
			}
		});
		// Set the end time
		if(!definition.endTime) {
			definition.endTime = endTime;
		}

		// Save it!
		this.animations[name] = definition;
	};

	PuppetMaster.prototype.play = function(name) {
		// Copy the animation to the active list
		// We have to clone so we can keep track of start times
		// for multiple instances of the same animation at different times
		// TODO: verify this works/is necessary
		var temp = {};
		for(var key in this.animations[name]) {
			if(this.animations[name].hasOwnProperty(key)) {
				temp[key] = this.animations[name][key];
			}
		}

		this.activeAnimations.push(temp);
	};

	PuppetMaster.prototype.update = function(dt) {
		// Track the delta time, since last update was called
		var pm = this;
		if(typeof(pm.lastTimestamp) === 'undefined') {
			pm.lastTimestamp = 0;
			dt = 0;
		} else {
			var tmp = dt - pm.lastTimestamp;
			pm.lastTimestamp = dt;
			dt = tmp;
		}

		// Loop over active animations
		pm.activeAnimations.forEach(function(animation) {
			// Track the amount of time since the animation was started
			if(typeof(animation.currentTime) === 'undefined') {
				animation.currentTime = 0;
			} else {
				animation.currentTime += dt;
			}

			// Loop over all steps and update the active ones
			animation.steps.forEach(function(step) {
				if(step.startTime <= animation.currentTime && Math.max(0, animation.currentTime - step.startTime) < step.duration) {
					var currentPercent = Math.min(Math.max(0, animation.currentTime - step.startTime) / step.duration, 1);

					for(var actor in step) {
						if(Util.isFunction(step[actor]) && step.hasOwnProperty(actor)) {
							step[actor](currentPercent);
						}
					}
				}
			});

			// If we reach the end of the animation, remove it from the active list
			if(animation.currentTime >= animation.endTime) {
				var animNo = pm.activeAnimations.indexOf(animation);
				pm.activeAnimations.splice(animNo, 1);
			}
		});
	};

	// Exporting-- Node, RequireJS, Browser use
	if(typeof define === "function" && define.amd) {
		define(function(){
			return PuppetMaster;
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = PuppetMaster;
	} else {
		window.PuppetMaster = PuppetMaster;
	}
}());