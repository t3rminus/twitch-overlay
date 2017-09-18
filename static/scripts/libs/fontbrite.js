/**
 * @name FontBrite
 * @namespace
 */
(function(){
	var Util = {
		/**
		 * Shortcut to create an image object from a src. Already-created images are simply returned
		 * @param {string} src The image src, or an existing image
		 * @returns {object} The create img DOMElement
		 * @private
		 */
		createImage: function(src) {
			if(src.src) {
				return src;
			}

			var img = document.createElement('img');
			img.src = src;
			return img;
		},

		/**
		 * UTF-8 safe string splitter
		 * Returns array of symbols in string, even if they're multi-byte
		 * @param {string} string T
		 * he input string
		 * @returns {Array} The resulting array of symbols
		 * @private
		 */
		getSymbols: function(string) {
			var index = 0,
				length = string.length,
				output = [];
			for (; index < length - 1; ++index) {
				var charCode = string.charCodeAt(index);
				if (charCode >= 0xD800 && charCode <= 0xDBFF) {
					charCode = string.charCodeAt(index + 1);
					if (charCode >= 0xDC00 && charCode <= 0xDFFF) {
						output.push(string.slice(index, index + 2));
						++index;
						continue;
					}
				}
				output.push(string.charAt(index));
			}
			output.push(string.charAt(index));
			return output;
		},
		toUTF16: function(codePoint) {
			var TEN_BITS = parseInt('1111111111', 2);
			function u(codeUnit) {
				return String.fromCharCode(codeUnit.toString(10));
			}

			if (codePoint <= 0xFFFF) {
				return u(codePoint);
			}
			codePoint -= 0x10000;

			// Shift right to get to most significant 10 bits
			var leadingSurrogate = 0xD800 | (codePoint >> 10);

			// Mask to get least significant 10 bits
			var trailingSurrogate = 0xDC00 | (codePoint & TEN_BITS);

			return u(leadingSurrogate) + u(trailingSurrogate);
		},

		replaceObj: function(string, obj) {
			var regex;
			var find = Object.keys(obj);
			for (var i = 0; i < find.length; i++) {
				regex = new RegExp(Util.escapeRegExp(find[i]), "g");
				string = string.replace(regex, obj[find[i]]);
			}
			return string;
		},

		escapeRegExp: function(str) {
			return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		},

		hue2rgb: function(p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		},
		/**
		 * Applies color to an image, at any shade, for parts that are hot pink (r === b)
		 * @param {object} img The source DOMElement image
		 * @param {number} h The new hue (0-360)
		 * @param {number} [s=100] The saturation of the new hue (0-100)
		 * @param {number} [l=1] The luminosity value. >=0 uses multiply blend (0-1 darkens, >1 lightens) <0 uses divide blend (-1-0 lightens, <-1 darkens)
		 * @returns {object} The new DOMElement image with colors set
		 * @private
		 */
		colorizeImage: function(img, h, s, l) {
			if(!img.complete) {
				throw new Error('Colorize fail - image not yet loaded');
			}

			// Create a temp canvas, and draw the image onto it
			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = img.width;
			tmpCanvas.height = img.height;
			var tmpCtx = tmpCanvas.getContext('2d');
			tmpCtx.drawImage(img, 0, 0);
			var tmpData = tmpCanvas.toDataURL();

			// Reset image
			tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = img.width;
			tmpCanvas.height = img.height;
			tmpCtx = tmpCanvas.getContext('2d');
			tmpCtx.drawImage(Util.createImage(tmpData), 0, 0);

			// Get the pixel data from the canvas
			var imageData = tmpCtx.getImageData(0,0,tmpCanvas.width,tmpCanvas.height),
				data = imageData.data;

			// Loop over pixels
			var r, g, b, newColor;
			for (var i = 0; i < data.length; i += 4) {
				r = data[i];
				g = data[i + 1];
				b = data[i + 2];

				// If all components are identical then we want to colourize
				if(r === b && g === r) {
					// Get the HSV representation
					newColor = FontBrite.rgbToHsl(r, g, b);
					// Set the H & S
					newColor.h = h;
					newColor.s = s;
					// Compressive luminosity
					newColor.l = newColor.l * l;
					// Put it back
					newColor = FontBrite.hslToRgb(newColor.h, newColor.s, newColor.l);
					data[i] = newColor.r;
					data[i + 1] = newColor.g;
					data[i + 2] = newColor.b;
				}
			}
			tmpCtx.putImageData(imageData, 0, 0);
			return Util.createImage(tmpCanvas.toDataURL('image/png'));
		},
		appendImage: function(prevImage, newImage) {
			var tmpCanvas = document.createElement('canvas');
			var tmpCtx = tmpCanvas.getContext('2d');

			// Start an image if there is no prev
			if(!prevImage) {
				tmpCanvas.width = newImage.width + 1;
				tmpCanvas.height = newImage.height;
				tmpCtx.drawImage(newImage, 0, 0, newImage.width, newImage.height, 0, 0, newImage.width, newImage.height);
			} else {
				tmpCanvas.width = (prevImage.width + newImage.width) + 1;
				tmpCanvas.height = Math.max(prevImage.height, newImage.height);
				tmpCtx.drawImage(prevImage, 0, 0);
				tmpCtx.drawImage(newImage, 0, 0, newImage.width, newImage.height, prevImage.width + 1, 0, newImage.width, newImage.height);
			}

			// Create a temp canvas, and draw the image onto it
			return {
				image: Util.createImage(tmpCanvas.toDataURL('image/png')),
				dx: (prevImage && prevImage.width) || 0,
				dy: 0,
				dw: newImage.width + 1,
				dh: newImage.height
			};
		}
	};

	/**
	 * FontBrite - The awesome color-changing bitmap font rendererer
	 * @constructor
	 * @public
	 * @name FontBrite
	 */
	var FontBrite = function() {
		this.fonts = {};
		this.coloredFonts = {};
		this.emoticonMap = {};
		this.emoticons = {};
		this.emoticon = 0xF0000;
		this.renderingBlock = false;
	};

	/**
	 * Retrieves font metrics for a defined font
	 * @param {string} name The name of the font to load
	 * @returns {object} The font metrics object
	 * @public
	 * @name FontBrite#getFont
	 * @function
	 */
	FontBrite.prototype.getFont = function(name) {
		return this.fonts[name] || this.coloredFonts[name];
	};

	/**
	 * Defines (stores) font metrics with a name
	 * @param {object} metrics The metrics object, with dimensions of each character, and source image
	 * @param {string} name The name of the font to define
	 * @returns {string} The name of the defined font
	 * @public
	 * @name FontBrite#defineFont
	 * @function
	 */
	FontBrite.prototype.defineFont = function(metrics, name) {
		// Clone dat font
		var font = {};
		var keys = Object.keys(metrics);
		for(var i = 0; i < keys.length; i++) {
			if(metrics.hasOwnProperty(keys[i])) {
				font[keys[i]] = metrics[keys[i]];
			}
		}

		font.img = Util.createImage(font.img);

		if(!name) {
			name = font.img.src;
		}

		font.name = name;

		if(font.img.complete) {
			font.ready = true;
		} else {
			font.ready = false;
			font.img.addEventListener('load', function() {
				font.ready = true;
			});
		}

		this.fonts[name] = font;
		return name;
	};

	/**
	 * Gets the height of the string for the given font (single lines only)
	 * @param {string} font The name of a defined font to use
	 * @param {string} string The string to get the height of
	 * @returns {number} The height
	 * @public
	 * @name FontBrite#getStringHeight
	 * @function
	 */
	FontBrite.prototype.getStringHeight = function(font, string) {
		var _this = this;
		string = '' + string;

		// Prepare Emoticons
		if(this.emoticons) {
			string = Util.replaceObj(string, this.emoticonMap);
		}
		var chars = Util.getSymbols(string),
			height = 0;

		font = _this.getFont(font);

		if(!font) {
			throw new Error('That font is not defined!');
		}

		for(var i = 0; i < chars.length; i++) {

			// Standard chars
			if(font[chars[i]]) {
				height = Math.max(height, font[chars[i]][4] || font[chars[i]][3]);
			} else if(font['\uFFFD']) {
				height = Math.max(height, font['\uFFFD'][4] || font['\uFFFD'][3]);
			}
		}

		return height;
	};

	/**
	 * Gets the width of the string for the given font (single lines only)
	 * @param {string} font The name of a defined font to use
	 * @param {string} string The string to get the width of
	 * @returns {number} The width
	 * @public
	 * @name FontBrite#getStringWidth
	 * @function
	 */
	FontBrite.prototype.getStringWidth = function(font, string) {
		var _this = this;
		string = '' + string;

		// Prepare Emoticons
		if(this.emoticons) {
			string = Util.replaceObj(string, this.emoticonMap);
		}
		// Get the width of all characters in the string
		var chars = Util.getSymbols(string),
			width = 0;

		font = _this.getFont(font);

		if(!font) {
			throw new Error('That font is not defined!');
		}

		for(var i = 0; i < chars.length; i++) {
			// Handling for whitespace
			if(chars[i] === ' ') {
				width += font.space;
				continue;
			}
			if(chars[i] === '\t') {
				width += font.tab;
				continue;
			}

			// Standard chars
			if(font[chars[i]]) {
				width += font[chars[i]][2];
			} else if(this.emoticons[chars[i]]) {
				width += Math.ceil(font.space * 2.5);
			} else if(font['\uFFFD']) {
				width += font['\uFFFD'][2];
			}
			width += (font.letterspacing || 0);
		}
		width -= (font.letterspacing || 0);

		return width;
	};

	/**
	 * Renders a single line of text in the given font
	 * @param {Object} ctx A 2D rendering context to use
	 * @param {string} font The name of a defined font to use
	 * @param {string} string The string to render
	 * @param {number} x The x-coordinate of the top-left of the output
	 * @param {number} y The y-coordinate of the top-left of the output
	 * @return {number} The bottom y-coordinate of the rendered line
	 * @public
	 * @name FontBrite#renderLine
	 * @function
	 */
	FontBrite.prototype.renderLine = function(ctx, font, string, x, y) {
		string = '' + string;

		// Make sure the font
		var theFont = this.getFont(font);
		var lineHeight = this.getStringHeight(font, string);

		if(!theFont) {
			throw new Error('That font is not defined!');
		}

		if(!theFont.ready) {
			return y + lineHeight;
		}

		// Prepare Emoticons
		if(!this.renderingBlock && this.emoticons) {
			string = Util.replaceObj(string, this.emoticonMap);
		}

		// Drawify the outputings
		var chars = Util.getSymbols(string), height = 0;
		for(var i = 0; i < chars.length; i++) {
			if(chars[i] === '') {
				continue;
			}
			// Handling for whitespace
			if(chars[i] === ' ') {
				x += theFont.space;
				continue;
			}
			if(chars[i] === '\t') {
				x += theFont.tab;
				continue;
			}

			var char; // = theFont[chars[i]] || theFont['\uFFFD'];

			if(theFont[chars[i]]) {
				char = theFont[chars[i]];
				ctx.drawImage(theFont.img, char[0], char[1], char[2], char[3], x, y, char[2], char[3]);
				x += char[2] + (theFont.letterspacing || 0);
				height = Math.max(height, char[4] || char[3]);
			} else if(this.emoticons[chars[i]]) {
				var img = this.emoticons[chars[i]];
				var dw = Math.ceil(theFont.space * 2.5),
					dh = Math.ceil(dw * (img.height / img.width)),
					dy = (lineHeight - dh) / 2;
				ctx.drawImage(img, 0, 0, img.width, img.height, x, y + dy, dw, dh);
				x += dw + (theFont.letterspacing || 0);
				height = Math.max(height, dh);
			} else if(theFont['\uFFFD']) {
				char = theFont['\uFFFD'];
				ctx.drawImage(theFont.img, char[0], char[1], char[2], char[3], x, y, char[2], char[3]);
				x += char[2] + (theFont.letterspacing || 0);
				height = Math.max(height, char[4] || char[3]);
			} else {
				x += theFont.space;
			}
		}

		return height;
	};

	FontBrite.prototype.getBlockHeight = function(font, string, w, lh) {
		var _this = this;
		if(!w) {
			throw new Error('Attempting to get height for text block without defined width');
		}

		string = '' + string;

		// Prepare Emoticons
		if(_this.emoticons) {
			string = Util.replaceObj(string, _this.emoticonMap);
		}

		// Split into "blocks" (paragraphs?)
		var lines = _this.splitBlocks(font, string, w),
			totalHeight = 0;

		// Write out all the lines that fit
		for(var li = 0; li < lines.length; li++) {
			var line = lines[li];
			if(!line) {
				continue;
			}

			totalHeight += lh || Math.ceil(_this.getStringHeight(font, line) * 1.2);
		}

		return totalHeight;
	};

	/**
	 * Renders a block (paragraph) of text in the given font
	 * @param {Object} ctx A 2D rendering context to use
	 * @param {string} font The name of a defined font to use
	 * @param {string} string The string to render
	 * @param {number} [x=0] The x-coordinate of the top-left of the block
	 * @param {number} [y=0] The y-coordinate of the top-left of the block
	 * @param {number} [w=Remaining space in canvas] The desired width of the block. Long lines will be wrapped on whitespace
	 * @param {number} [h=Remaining space in canvas] The desired height of the block. Long blocks will be truncated
	 * @param {number} [lh=Height of each rendered line] The desired line height of each line in the block
	 * @param {string} [align=left] Justification of the text. Can be "left", "center", "right". Defaults to left.
	 * @return {number} The bottom y-coordinate of the rendered line (may be different from y + h, due to font/line height)
	 * @public
	 * @name FontBrite#renderBlock
	 * @function
	 */
	FontBrite.prototype.renderBlock = function(ctx, font, string, x, y, w, h, lh, align) {
		x = x || 0;
		y = y || 0;
		w = w || ctx.canvas.width - x;
		h = h || ctx.canvas.height - y;
		align = align || 'left';
		string = '' + string;
		this.renderingBlock = true;

		// Prepare Emoticons
		if(this.emoticons) {
			string = Util.replaceObj(string, this.emoticonMap);
		}

		var lines = this.splitBlocks(font, string, w);

		// Write out all the lines that fit
		var totalHeight = 0, currentY = y, lw;
		for(var li = 0; li < lines.length; li++) {
			var line = lines[li];
			if(!line) {
				continue;
			}

			var height = lh || Math.ceil(this.getStringHeight(font, line) * 1.2);

			// Are we too high? Stop this madness!
			if(height + totalHeight > h) {
				break;
			}

			if(align == 'right') {
				// Draw the line right-aligned
				lw = this.getStringWidth(font, line);
				this.renderLine(ctx, font, line.replace(/^\s/,''), x + Math.round(w - lw), currentY);
			} else if(align == 'center') {
				// Draw the line centered
				lw = this.getStringWidth(font, line);
				this.renderLine(ctx, font, line.replace(/^\s/,''), x + Math.round((w - lw) / 2), currentY);
			} else {
				// Draw the line
				this.renderLine(ctx, font, line.replace(/^\s/,''), x, currentY);
			}

			// Move down to the next line
			totalHeight += height;
			currentY += height;
		}

		this.renderingBlock = false;
		return totalHeight;
	};

	/**
	 * Splits a string into lines wrapped to a specific width
	 * @param font The font that will be rendered
	 * @param string The string to split
	 * @param width The max width to split on
	 * @returns {Array} An array of lines
	 */
	FontBrite.prototype.splitBlocks = function(font, string, width) {
		// Split into "blocks" (paragraphs?)
		var blocks = string.split('\n');
		var lines = [], lineCount = 0;

		// Split each block into lines depending on the width
		for(var bi = 0; bi < blocks.length; bi++) {
			// Get each word in the block
			var words = blocks[bi].match(/(\S+|\s)/g);
			var lineWidth = 0;

			for(var wi = 0; wi < words.length; wi++) {
				// Get the width of the word
				var word = words[wi],
					wordWidth = this.getStringWidth(font, word);

				// If the current width + word width is less than the max width
				if(lineWidth + wordWidth <= width) {
					// Add to line
					if(lines[lineCount]) {
						lines[lineCount] += word;
					} else {
						lines[lineCount] = word;
					}
					lineWidth += wordWidth;
				} else {
					// Is this the start of the line?
					if(!lines[lineCount]) {
						// Yeah, we should just put it on this line
						lines[lineCount] = word;
						lineWidth = wordWidth;
					} else {
						// Otherwise move down one line
						lineCount++;
						lines[lineCount] = word;
						lineWidth = wordWidth;
					}
				}
			}
			// End of a block triggers a new line
			lineCount++;
		}

		return lines;
	};

	/**
	 * Converts an HSL color to RGB
	 * @param {number} h The input hue (0-360)
	 * @param {number} s The input saturation (0-100)
	 * @param {number} l The input luminosity (0-100)
	 * @returns {{r: number, g: number, b: number}} The output containing the RGB values for that color
	 * @public
	 * @name FontBrite.hslToRgb
	 * @function
	 */
	FontBrite.hslToRgb = function(h, s, l){
		var r, g, b;

		h /= 360;
		s /= 100;
		l /= 100;

		if(s === 0){
			r = g = b = l; // achromatic
		} else {
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = Util.hue2rgb(p, q, h + 1/3);
			g = Util.hue2rgb(p, q, h);
			b = Util.hue2rgb(p, q, h - 1/3);
		}

		return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
	};

	/**
	 * Converts an RGB color to HSL
	 * @param {number} r The input red component
	 * @param {number} g The input green component
	 * @param {number} b The input blue component
	 * @returns {{h: number, s: number, l: number}} The output containing the HSL values for that color
	 * @public
	 * @name FontBrite.rgbToHsl
	 * @function
	 */
	FontBrite.rgbToHsl = function(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;

		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min) {
			h = s = 0; // achromatic
		}
		else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
	};

	/**
	 * Colorizes a font, replacing hot pink in any shade (r === b), with a desired color
	 * @param {string} [name=font__h_s_l] The stored name of the resulting font
	 * @param {string} font The name of a defined font to use
	 * @param {number} h The hue to colorzie the font to
	 * @param {number} [s=100] The saturation to use when colorizing the font
	 * @param {number} [l=Source pixel luminosity] The luminosity to use when colorizing the font
	 * @returns {string} The name of the defined font
	 * @public
	 * @name FontBrite#colorizeFont
	 * @function
	 */
	FontBrite.prototype.colorizeFont = function(name, font, h, s, l) {
		if(typeof(font) === 'number') {
			// "Name" not specified
			l = s;
			s = h;
			h = font;
			font = name;
			name = undefined;
 		}

		s = (s === undefined) ? 100 : s;
		l = (l === undefined) ? 1 : l;

		// Make sure the font
		font = this.getFont(font);
		if(!font) {
			throw new Error('That font is not defined!');
		}

		name = name || (font.name + '__' + h + '_' + s + '_' + l);

		// Color cache
		if(this.coloredFonts[name]) {
			return this.coloredFonts[name];
		}

		// Clone the font metrics
		var newFont = {}, symbols = Object.keys(font);
		for(var i = 0; i < symbols.length; i++) {
			newFont[symbols[i]] = font[symbols[i]];
		}
		newFont.name = name;

		// Recolor only if ready. If not set a callback
		if(font.ready) {
			newFont.img = Util.colorizeImage(font.img, h, s, l);
			newFont.ready = true;
		} else {
			font.img.addEventListener('load', function(){
				newFont.img = Util.colorizeImage(font.img, h, s, l);
				newFont.ready = true;
			});
		}

		// Store in the cache
		this.coloredFonts[name] = newFont;
		return name;
	};
	
	FontBrite.prototype.cloneFont = function(srcFont, newName, img) {
		srcFont = this.getFont(srcFont);
		
		var newFont = {};
		for(var char in srcFont) {
			if (srcFont.hasOwnProperty(char)) {
				newFont[char] = srcFont[char];
			}
		}
		newFont.img = img;
		
		this.defineFont(newFont, newName);
		return newFont;
	};
	
	FontBrite.prototype.defineEmoticon = function(string, image) {
		var _this = this;

		if(_this.emoticonMap[string]) {
			return _this.emoticonMap[string];
		}

		image = Util.createImage(image);
		// Choose a character in the unicode private use area
		var emoteChar = Util.toUTF16(_this.emoticon);
		_this.emoticonMap[string] = emoteChar;

		if(!_this.emoticons[emoteChar]) {
			_this.emoticons[emoteChar] = image;
		}

		// Increment the emoticon counter
		_this.emoticon++;
		return emoteChar;
	};

	// Exporting-- Node, RequireJS, Browser use
	if(typeof define === "function" && define.amd) {
		define(function(){
			return FontBrite;
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = FontBrite;
	} else {
		window.FontBrite = FontBrite;
	}
}());