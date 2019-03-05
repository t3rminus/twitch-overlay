'use strict';
define([], function() {
	if(!document.triggerEvent) {
		document.triggerEvent = function(name, data) {
			var tmpEvent = new Event(name, { 'bubbles': false, 'cancelable': true });
			tmpEvent.data = data;
			document.dispatchEvent(tmpEvent);
		};
	}
	return function(name, data) {
		document.triggerEvent(name, data);
	};
});