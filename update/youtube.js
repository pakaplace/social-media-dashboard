const Youtube = require("youtube-api");
var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;

Youtube.authenticate({
  type: "key"
, key: process.env.API_KEY
})

// getYoutubeData
// function to get youtube channel/video data
// 
// @param: channelId: Id of the channel to grab all the video data from
// @return: _<Promise>: promise that resolves to youtube data
function getYoutubeData(channelId) {
	return new Promise(function(masterResolve, masterReject) {

		// Get channel stats
		Youtube.channels.list({ part: "statistics" , id: channelId }, (err, list) => {
			if (err) return masterReject(err);
			var channelStats = list.items[0].statistics;

			new Promise(function(interResolve, interReject) {

				// arr to hold all the videos
				var videoArr = [];

				// recurseSearch(pageToken)
				// 
				// recursively call a search as long is there is a pageToken
				// 
				function recurseSearch(pageToken) {

					// Get channel videos
					Youtube.search.list({ part: "snippet", channelId: channelId, maxResults: 50, order: 'date', pageToken: pageToken}, (err, list) => {
						// console.log('[NEW LIST]', list.items);
						if (err) return masterReject(err);

						// console.log("[search results for]", pageToken);

						// Filter for videos
						list.items = list.items.filter(function(item) {
							return item.id.kind === 'youtube#video'
						});

						// console.log("[search results]", list.items);

						// join together the list of videos
						videoArr = videoArr.concat(list.items);

						if (list.nextPageToken) {
							recurseSearch(list.nextPageToken);
						} else {
							interResolve(videoArr);
						}
						
					});

				}

				// start off the search
				recurseSearch();
			})
			.then((videoArr) => {

				// Turn items into promises
				videoArr = videoArr.map(function(video, i) {
					return new Promise(function(resolve, reject) {

						Youtube.videos.list({part: 'snippet, statistics, id', id: video.id.videoId}, (err, video) => {
							if (err) return reject(err);

							var id = video.items[0].id;
							var stats = video.items[0].statistics;
							var snippet = video.items[0].snippet

							resolve({
								id: id,
								snippet: snippet,
								stats: stats
							});
						});
					});
				});

				// get all data
				console.log("[exiting function]");
				Promise
				.all(videoArr)
				.then((results) => {
					// console.log({channel: channelStats, videos: results})
					// return {channel: channelStats, videos: results}
					masterResolve({channel: channelStats, videos: results});
				})
				.catch(masterReject);
			})
		})
	});
}

function youtubeUpdate(user, twentyMinUpdate) {
	return new Promise(function(resolve, reject) {
		getYoutubeData(user.youtube.profile.id)
		.then(function(data) {
			return new Promise(function(interResolve, interReject) {
				Profile.findOne({userId: user._id},function(err, profile) {
					if (err) return next(err);

					if (data.videos.length === 0) {
						return resolve();
					}

					if (!twentyMinUpdate) {
						profile.youtube.last = data.channel.subscriberCount;
						profile.save();
						new ProfileSnapshot({
							platformID: user.youtube.profile.id,
							platform: 'youtube',
							followers: data.channel.subscriberCount,
							posts: data.channel.videoCount,
							views: data.channel.viewCount,
							date: new Date(),
							profileId: profile._id
						}).save(function(err, p) {
							if (err) return next(err);
							var posts=[]
							data.videos.forEach(function(video, i) {
								Post.findOrCreate({postId: video.id}, {
									title: video.snippet.title,
									description: video.snippet.description,
									postId: video.id,
									type: 'youtube',
									profileId: profile._id,
									date: new Date(video.snippet.publishedAt)
								}, function(err, post) {
									// console.log('what does this look like.........', post)
									if (err) return next(err);

									new PostSnapshot({
										profileId: p._id,
										postId: post.postId,
										comments: parseInt(video.stats.commentCount),
										likes: parseInt(video.stats.likeCount),
										favorites: parseInt(video.stats.favoriteCount),
										views: parseInt(video.stats.viewCount),
										dislikes: parseInt(video.stats.dislikeCount),
										date: p.date
									}).save(function(err, psnap) {
										if (err) return next(err);
										posts.push(post);
										if (posts.length === data.videos.length) {
											posts = posts.sort(function(a, b) {
												return b.date - a.date;
											});
											// console.log('post post post..........', posts)
											interResolve(posts[0]);
										}
										post.snapshots.push(psnap._id);
										post.save(function(err) {
											if (err) return next(err);
											resolve();
										});
									});
								});
							});
						});
					} else {
						profile.youtube.followers = data.channel.subscriberCount;
						profile.save();
						data.videos.forEach(function(video, i) {
							Post.findOrCreate({postId: video.id}, {
								postId: video.id,
								title: video.snippet.title,
								description: video.snippet.description,
								type: 'youtube',
								profileId: profile._id,
								date: new Date(video.snippet.publishedAt)
							}, function(err, post) {
								if (err) return console.log(err);

								post.comments = parseInt(video.stats.commentCount);
								post.likes = parseInt(video.stats.likeCount);
								post.favorites = parseInt(video.stats.favoriteCount);
								post.views = parseInt(video.stats.viewCount);
								post.dislikes = parseInt(video.stats.dislikeCount);

								post.save(function(err, p) {
									if (err) return console.log(err);
									resolve();
								});
							});
						});
					}
				});
			}).then((latestPost) => {
				if (user.triggerFrequency.youtube.turnedOn){
					var daysSinceLastPost = Math.floor((new Date() - latestPost.date) / (1000 * 60 * 60 * 24)); // Current unix time - allowed number of days in unix
					user.triggerFrequency.youtube.lastPost = daysSinceLastPost;
					// console.log("[apparently the days since last post]", daysSinceLastPost);

					// has this use updated within the last day?
					user.triggerFrequency.youtube.upToDate = (daysSinceLastPost - user.triggerFrequency.youtube.frequency > 0) ? false : true;
					user.save();
				}
			})
		}).catch((err) => next(err));
	});
}

module.exports = {
  youtubeUpdate: youtubeUpdate,
}