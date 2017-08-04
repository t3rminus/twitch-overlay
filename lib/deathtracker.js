var currentGame = '', deaths;

var addDeaths = function (amt) {
	if (deaths && currentGame) {
		deaths[currentGame] = deaths[currentGame] ? deaths[currentGame] + amt : amt;
		
		fs.writeFile(__dirname + '/deaths.json', JSON.stringify(deaths), 'utf-8');
		ovSocket.emit('death', deaths[currentGame] || 0);
	} else {
		ovSocket.emit('death', 0);
	}
};


// TODO: Death counter

currentGame = '*'; //(body && body.stream && body.stream.game) || 'Default Game';

if (!deaths) {
	fs.readFile(__dirname + '/deaths.json', 'utf-8', function (err, body) {
		if (body) {
			try {
				deaths = JSON.parse(body);
			} catch (e) {
				console.log('Error loading deathdb: ', e);
			}
		}
		
		ovSocket.emit('death', deaths[currentGame] || 0);
	});
}

ovSocket.emit('death', (deaths && currentGame && deaths[currentGame]) || 0);