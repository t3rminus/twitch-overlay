var child = require('child_process');

var keyCodes = {
	'a': 0,
	's': 1,
	'd': 2,
	'f': 3,
	'g': 5,
	'h': 4,
	'j': 38,
	'k': 40,
	'l': 37,
	'q': 12,
	'w': 13,
	'e': 14,
	'r': 15,
	't': 17,
	'y': 16,
	'u': 32,
	'i': 34,
	'o': 31,
	'p': 35,
	'z': 6,
	'x': 7,
	'c': 8,
	'v': 9,
	'b': 11,
	'n': 45,
	'm': 46,
	'1': 18,
	'2': 19,
	'3': 20,
	'4': 21,
	'5': 23,
	'6': 22,
	'7': 26,
	'8': 28,
	'9': 25,
	'0': 29,
	'-': 27,
	'=': 24,
	'[': 33,
	']': 30,
	'\\': 42,
	';': 41,
	'\'': 39,
	',': 43,
	'.': 47,
	'/': 44,
	'tab': 48,
	'\`': 50,
	' ': 49,
	'space': 49,
	'up': 126,
	'down': 125,
	'left': 123,
	'right': 124,
	'enter': 36,
	'return': 36,
	'f1': 122,
	'f2': 120,
	'f3': 99,
	'f4': 118,
	'f5': 96,
	'f6': 97,
	'f7': 98,
	'f8': 100,
	'f9': 101,
	'f10': 109,
	'f11': 103,
	'f12': 111,
	'delete': 51,
	'backspace': 51
};

module.exports = function(key, modifiers, done) {
	done = done || (function(){});
	var keyCode = keyCodes[key];
	if(!keyCode) {
		throw new Error('Unknown key');
	}

	var mods = [];
	if(Array.isArray(modifiers)) {
		if(modifiers.indexOf('control') !== -1) {
			mods.push('control down');
		}
		if(modifiers.indexOf('option') !== -1) {
			mods.push('option down')
		}
		if(modifiers.indexOf('command') !== -1) {
			mods.push('command down')
		}
		mods = 'using {' + mods.join(', ') + '}';
	} else {
		mods = '';
	}

	var cmd = 'tell application \\"System Events\\" to key code '+keyCode+' '+mods;
	child.exec('osascript -e "'+cmd+'"', done);
};