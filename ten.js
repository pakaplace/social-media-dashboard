var request = require('request');

// the one that happens every 20 mins
request.get(process.env.HOST +`/update/frequent`, function(err, resp, body) {
	if (err) {
		console.log("lmao");
	}
})