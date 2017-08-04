
module.exports = function(cmd){
	if(commands[cmd]) {
		commands[cmd]();
	}
};


var commands = {
	'1': function() {
		//robot.keyTap('3', ['control','command','shift']);
	}
};