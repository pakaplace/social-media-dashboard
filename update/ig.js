var ig = require('instagram-node').instagram()
var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;

function instagramInformation(id, accessToken){
	return new Promise(function(resolve, reject){
		var bigArr = [];
		var instagramPages = function (err, medias, pagination, remaining, limit) {
			// console.log("medias", medias)
		 	bigArr = bigArr.concat(medias);
			if(pagination.next) {
			    pagination.next(instagramPages); // Will get second page results 
			  } else {
			 	ig.user(id, function(err, result, remaining, limit) {
			 		if(err) return next(err);
			 			resolve({bigArr, profile: result.counts.followed_by})
			 	});
			  }
			}
			
		ig.use({ access_token: accessToken });
		ig.user_media_recent(id, {cursor: 30}, instagramPages);
	})
}

function instagramUpdate(user, twentyMinUpdate) {
	// console.log("[instagram : user]", user);
	return new Promise(function(resolve, reject) {
		Profile.findOne({userId: user._id}, function(err, profile){
			if (err) return next(err);

			if (!user.instagram.instagramProfile) {
				return resolve();
			}

			// Get instagram data
			instagramInformation(user.instagram.instagramProfile.id, user.instagram.AccessToken)
			.then(function(data) {
				return new Promise(function(interResolve, interReject) {
					if (!twentyMinUpdate) {
						profile.instagram.last = data.profile;
						profile.save();
						// Create new profile snapshot
						new ProfileSnapshot({
							platformID: user.instagram.instagramProfile.id,
							platform: 'instagram', 
							followers: data.profile, 
							posts: data.bigArr.length,
							date: new Date(),
							profileId: profile._id
						})
						.save(function(err, p) {
							if(err) return next(err);

							// Iterate through posts and create new snapshots
							var posts = [];
							data.bigArr.forEach(function(post, i) {
								var desc = null;
								if(post.caption) {
									desc = post.caption.text
								}

								// console.log("[post.created_time]", post.created_time);
								// console.log("[post.created_time as Date]", new Date(post.created_time * 1000));
								// If post doesn't exist, create it
								Post.findOrCreate({postId: post.id}, {
									description: desc,
									postId: post.id,
									type: 'instagram',
									profileId: profile._id,
									date: post.created_time * 1000 // it's in s
								}, function(err, postData){
									// if(err) return console.log(err);
									if (err) return next(err);
									// console.log("[creating post] for:", post.id);

									// snapshot it
									new PostSnapshot({
										profileId: p._id, 
										postId: postData.postId,
										comments: post.comments.count,
										likes: post.likes.count,
										date: p.date
									})
									.save(function(err, psnap){
										if(err) return next(err);
										postData.snapshots.push(psnap._id);
										postData.save(function(err){
											if(err) return next(err);
											resolve();
											posts.push(postData);

											if (posts.length === data.bigArr.length) {
												posts = posts.sort(function(a, b) {
													return b.date - a.date;
												})
												// mapping to see posts better
												// cPosts = posts.map(function(p, i) {
												// 	return `#${i} - ${p.date}`;
												// })
												// console.log("[see these posts]", cPosts);
												interResolve(posts[0]);
											}
										});			
									});
								});
							});
						});
					} else {
						profile.instagram.followers = data.profile;
						profile.save();
						data.bigArr.forEach(function(post, i) {
							var desc = null;
							if (post.caption) {
								desc = post.caption.text;
							}
							Post.findOrCreate({postId: post.id}, {
								description: desc,
								postId: post.id, //coming from february?
								type: 'instagram',
								profileId: profile._id,
								date: parseInt(post.created_time)*1000
							}, function(err, postData) {
								if (err) return console.log(err);

								postData.comments = post.comments.count;
								postData.likes = post.likes.count;

								postData.save(function(err) {
									if (err) return console.log(err);
									resolve();
								});
							});
						});
					}
				})
				.then((latestPost) => {
					if (user.triggerFrequency.instagram.turnedOn) {
						// console.log("fuck fuck fuck date", (latestPost.date))

						// how many days ago did the user post?
						var daysSinceLastPost = Math.floor((new Date() - latestPost.date) / (1000 * 60 * 60 * 24)); // Current unix time - allowed number of days in unix
						user.triggerFrequency.instagram.lastPost = daysSinceLastPost;
						// console.log("[apparently the days since last post]", daysSinceLastPost);

						// has this use updated within the last day?
						user.triggerFrequency.instagram.upToDate = (daysSinceLastPost - user.triggerFrequency.instagram.frequency > 0) ? false : true;
						user.save();
					}
				})
			}).catch(function(err){ next(err)});
		});
	});
}

module.exports = {
	instagramInformation: instagramInformation,
	instagramUpdate: instagramUpdate
}
