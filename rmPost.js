var models = require('./models/models.js');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

models.Post.remove({}, (err, r) => {
	console.log("removed the posts");
})

models.PostSnapshot.remove({}, (err, r) => {
	console.log("removed the post snapshots");
})
// process.exit();