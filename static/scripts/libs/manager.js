'use strict';
define([], function() {
	var LayoutManager = function() {
		this.layouts = {};
		this.currentLayout = null;
	};
	
	LayoutManager.prototype.addLayout = function(name, def, activate) {
		var _this = this;
		if(def.elements && def.elements.length) {
			var modules = def.elements.map(function(e) { return 'libs/modules/' + e.module; });
			require(modules, function() {
				for(var i = 0; i < def.elements.length; i++) {
					def.elements[i].render = arguments[i];
				}
				_this.layouts[name] = def;
				if(activate) {
					_this.currentLayout = name;
				}
			});
		}
	};
	
	LayoutManager.prototype.setLayout = function(name) {
		this.currentLayout = name;
	};
	
	LayoutManager.prototype.renderFrame = function(ctx, dt) {
		if(this.layouts[this.currentLayout]) {
			var currentLayout = this.layouts[this.currentLayout];
			if(currentLayout.elements && currentLayout.elements.length) {
				for(var i = 0; i < currentLayout.elements.length; i++) {
					// cE = currentElement
					var cE = currentLayout.elements[i];
					cE.render.call(cE, ctx, dt);
				}
			}
		}
	};
	
	return LayoutManager;
});