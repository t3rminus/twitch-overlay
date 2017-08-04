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

	var Zoetrope = function(file, framerate, animations) {
		this.image = Util.createImage(file);
		this.delay = (1000 / framerate);
		this.animations = animations;
		this.dt = 0;

		// Animations are
		// [origin_x,origin_y,frame_w,frame_h,num_frames,cur_frame,cur_frame_time]
		for(var animation in this.animations) {
			if (this.animations.hasOwnProperty(animation)) {
				this.animations[animation][5] = 0; // Current Frame
				this.animations[animation][6] = 0; // Current Frame time
			}
		}
	};

	Zoetrope.prototype.draw = function(ctx, animation, x, y, dt) {
		if(this.animations[animation]) {
			var a = this.animations[animation];
			var ft = Math.floor((dt - a[6]) / this.delay);
			if(ft > 0) {
				a[5] = (a[5] + ft) % a[4];
				a[6] = dt; // Save frame time
			}
			var xoff = (a[0] + (a[2] * a[5]));
			ctx.drawImage(this.image, xoff, a[1], a[2], a[3], x, y, a[2], a[3]);
		}
	};

	// Exporting-- Node, RequireJS, Browser use
	if(typeof define === "function" && define.amd) {
		define(function(){
			return Zoetrope;
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = Zoetrope;
	} else {
		window.Zoetrope = Zoetrope;
	}
}());