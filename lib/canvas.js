'use strict';

const fs = require('fs'),
	Bluebird = require('bluebird'),
	Jimp = require('jimp');

const Util = {
	hue2rgb: function(p, q, t) {
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1/6) return p + (q - p) * 6 * t;
		if(t < 1/2) return q;
		if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	},
	hexToR: function(h) { return parseInt(h.substring(0,2),16); },
	hexToG: function(h) { return parseInt(h.substring(2,4),16); },
	hexToB: function(h) { return parseInt(h.substring(4,6),16); },
	
	/**
	 * Converts an HSL color to RGB
	 * @param {number} h The input hue (0-360)
	 * @param {number} s The input saturation (0-100)
	 * @param {number} l The input luminosity (0-100)
	 * @returns {{r: number, g: number, b: number}} The output containing the RGB values for that color
	 */
	hslToRgb: function(h, s, l){
		let r, g, b;

		h /= 360;
		s /= 100;
		l /= 100;

		if(s === 0){
			r = g = b = l; // achromatic
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = Util.hue2rgb(p, q, h + 1/3);
			g = Util.hue2rgb(p, q, h);
			b = Util.hue2rgb(p, q, h - 1/3);
		}

		return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
	},

	/**
	 * Converts an RGB color to HSL
	 * @param {number} r The input red component
	 * @param {number} g The input green component
	 * @param {number} b The input blue component
	 * @returns {{h: number, s: number, l: number}} The output containing the HSL values for that color
	 */
	rgbToHsl: function(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;

		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;

		if(max === min) {
			h = s = 0; // achromatic
		}
		else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
	},
	
	/**
	 * Swaps one color for another, with a multiplicative luminosity
	 * @param r The source red component
	 * @param g The source green component
	 * @param b The source blue component
	 * @param h The new hue
	 * @param s The new saturation
	 * @param l The luminosity multiplication factor
	 * @returns {{h: number, s: number, l: number}} The output containing the HSL values for the new color
	 */
	calculateColor: function(r,g,b,h,s,l) {
		const newColor = Util.rgbToHsl(r, g, b);
		// Set the H & S
		newColor.h = h;
		newColor.s = s;
		newColor.l = newColor.l * l;
		// Back to RGB
		return Util.hslToRgb(newColor.h, newColor.s, newColor.l);
	}
};

module.exports = {
	colorizeImage: function(htmlColor, img, l) {
		const hsl = Util.rgbToHsl(Util.hexToR(htmlColor), Util.hexToG(htmlColor), Util.hexToB(htmlColor));
		l = parseFloat('' + l) || 1;
		
		return Jimp.read(__dirname + '/../static/images/' + img)
			.then((img) => {
				img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
					const r = this.bitmap.data[ idx ];
					const g = this.bitmap.data[ idx + 1 ];
					const b = this.bitmap.data[ idx + 2 ];
					
					// If all components are the same (pure greyscale), swap colors
					if(r === b && g === r) {
						const newColor = Util.calculateColor(r, g, b, hsl.h, hsl.s, l);
						this.bitmap.data[ idx ] = newColor.r;
						this.bitmap.data[ idx + 1 ] = newColor.g;
						this.bitmap.data[ idx + 2 ] = newColor.b;
					}
				});
				
				return Bluebird.fromNode(function(cb) {
					const mime = img.getMIME();
					img.getBuffer(mime, function(err, buffer) {
						if(err) {
							return cb(err);
						}
						
						cb(null, {
							buffer: buffer,
							mime: mime
						});
					});
				});
			});
	}
};