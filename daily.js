var request = require('request');

// this also happens every 20 but doesn't do anything when it gets to the server lol
request.get(process.env.HOST +`/update`, function(err, resp, body) {
	if (err) {
		console.log("lmao")
	}
})
