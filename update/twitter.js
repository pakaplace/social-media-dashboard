var Twitter = require('twitter');
var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;

function twitterInformation(accessToken, accessTokenSecret, id){
	return new Promise(function(resolve, reject){
		var client = new Twitter({
		  consumer_key: process.env.TWITTER_CONSUMER_KEY,
		  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		  access_token_key: accessToken,
		  access_token_secret: accessTokenSecret
		});
		var params = {user_id: id};
		client.get('statuses/user_timeline', params, function(error, tweets, response) {

		  if (error) return next(error); 
		  // console.log("tweets", tweets)
		  	resolve(tweets)
		});
	});		
}

function twitterUpdate(user, twentyMinUpdate){
	return new Promise(function(resolve, reject) {
		Profile.findOne({userId: user._id}, function(err, profile){
			if (err) return console.log(err);
			if (!user.twitter.twitterToken) {
				return resolve();
			}

			// get twitter info
			twitterInformation(user.twitter.twitterToken, user.twitter.twitterTokenSecret)
			.then(function(data) {
				return new Promise(function(interResolve, interReject) {
					if (!twentyMinUpdate) {
						profile.twitter.last = data[0].user.followers_count;
						profile.save();
						new ProfileSnapshot({
							platformID: user.twitter.twitterProfile._json.id,
							platform: 'twitter', 
							followers: data[0].user.followers_count, 
							posts: data[0].user.statuses_count,
							date: new Date(),
							profileId: profile._id
						})
						.save(function(err, p) {
							if (err) return reject(err);

							// iterate through posts
							var posts =[];
							data.forEach(function(postData, i){
								// console.log('what does this look like.........', postData.created_at)

								// If post doesn't exist, create it
								Post.findOrCreate({postId: postData.id}, {
									description: postData.text,
									postId: postData.id,
									type: 'twitter',
									profileId: profile._id,
									date: new Date(postData.created_at)
								}, function(err, post){
									if(err) return next(err);
									// console.log('is this the same............', post.date);

									// snapshot it
									new PostSnapshot({
										profileId: p._id, 
										postId: post.postId,
										shares: postData.retweet_count,
										likes: postData.favorite_count,
										date: p.date
									})
									.save(function(err, psnap){
										if(err) return next(err);
										post.snapshots.push(psnap._id);
										post.save(function(err){
											if(err) return next(err);
											posts.push(post);
											if (posts.length === data.length) {
												posts = posts.sort(function(a, b) {
													return b.date - a.date;
												});
												// console.log('post post post..........', posts)
												interResolve(posts[0]);
											}
											resolve();
										});			
									});
								});
							});
						});
					} else {
						profile.twitter.followers = data[0].user.followers_count;
						profile.save();
						data.forEach(function(postData, i) {

							// If post doesn't exist, create it
							Post.findOrCreate({postId: postData.id}, {
								description: postData.text,
								postId: postData.id,
								type: 'twitter',
								profileId: profile._id,
								date: new Date(postData.created_at)
							}, function(err, post) {
								if(err) return next(err);

								post.shares = postData.retweet_count;
								post.likes = postData.favorite_count;

								post.save(function(err, p) {
									if (err) return console.log(err);
									resolve();
								});
							});
						});
					}
				})
				.then((latestPost)=>{
					// console.log('what does this look like..........', latestPost)
					if(user.triggerFrequency.twitter.turnedOn) {
						var daysSinceLastPost = Math.floor((new Date() - latestPost.date) / (1000 * 60 * 60 * 24)); // Current unix time - allowed number of days in unix
						user.triggerFrequency.twitter.lastPost = daysSinceLastPost;
						// console.log("[apparently the days since last post]", daysSinceLastPost);

						// has this use updated within the last day?
						user.triggerFrequency.twitter.upToDate = (daysSinceLastPost - user.triggerFrequency.twitter.frequency > 0) ? false : true;
						user.save();
					}
				})	
			}).catch((err) => console.log(err));
		});
	});
}




module.exports = {
	twitterUpdate: twitterUpdate
}