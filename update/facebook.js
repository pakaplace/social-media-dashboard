var FB = require('fb');
var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;
var request = require('request');

function pageViewsTotal(days, pageId){
	var timeframe = time(days);
	return new Promise(function(resolve, reject){
		FB.api('/'+pageId+'/insights/page_views_total?since='+timeframe.since+'&until='+timeframe.until, 
			function (response) {
			  if(!response || response.error) {
			   // console.log(!response ? 'error occurred' : response.error);
			   reject(response.error);
			  }
	
			  resolve (response.data[2].values); //get's 28 day values
		})
	})
}
	//GETS PAGE IMPRESSIONS OVER 1 MONTH, PERIOD (**, week, day) 
	//~~~~~~~~~~~~~~FUNCTION TO GET TIME IN UNIX BY NUMBER OF DAYS
function time(days){
	var days = days*24*60*60;
	var until = Math.floor(Date.now() / 1000); //datenow
	var since = until - days;
	// console.log("UNTIL AND SINCE ", until, since)
	return {until: until, since: since}
}

// ~~~~~~~~~~~~~~FUNCTION TO GET IMPRESSIONS PER DAY FOR XX DAYS
function pageImpressions(days, pageId){
	var timeframe = time(days);
	return new Promise(function(resolve, reject){
		FB.api(
			  "/"+pageId+"/insights/page_impressions?since="+timeframe.since+"&until="+timeframe.until, //handles pagination by time

			  function (response) {
			  	// console.log("COOL",response)
			    var arr = [];
			    if (response && !response.error) {
			      response.data[0].values.forEach(function(day){
			        arr.push({value: day.value, end_time: day.end_time}) 
			      })
			    }
			    // console.log("arrarrarr",arr)
			    resolve(arr);
			  }
		)
	})
};
function pagePosts(days, pageId){
	var timeframe = time(days);
	return new Promise(function(resolve, reject){
		FB.api(
			  "/"+pageId+"/posts?since="+timeframe.since+"&until="+timeframe.until+"&fields=message,created_time,shares,likes.summary(true),comments.summary(true)",
			   //handles pagination by time
			  function (response) {
			  	var arr = [];
			  	var index= 0;
			  	// console.log("COOL SHIT", response.data);
			  	var data = response.data.map(function(post){
			  		return {postId: post.id, message: post.message, shares: (post.shares) ? post.shares.count : 0, date: new Date(post.created_time).getTime(),
			  				likes: (post.likes)? post.likes.data.length : 0, comments: (post.comments)? post.comments.data.length : 0}
			  	})
			  	resolve(data)
			  })
		
	})
};
// ~~~~~~~~~~~~~~FUNCTION TO GET NUMBER OF IMPRESSIONS THAT CAME FROM ALL YOUR POSTS
function pagePostImpressions(days, pageId){
	return new Promise(function(resolve, reject){
		var timeframe = time(days);
		FB.api(
		  "/"+pageId+"/insights/page_posts_impressions?since="+timeframe.since+"&&+until="+timeframe.until, //handles pagination by time
		  
		  function (response) {
		    var arr = [];
		    if (response && !response.error) {
		      response.data[0].values.forEach(function(day){
		        arr.push({value: day.value, end_time: day.end_time}) 
		      })
		      /* handle the result */ 
		    }resolve(arr);
		 })
	});
};


function postImpressions(days, postId){
	var timeframe = time(days);
	FB.api( //might have to use post id and not blog id
	      "/"+postId+"/insights/post_impressions?since="+timeframe.since+"&until="+timeframe.until, //The number of impressions per post
	      //MAP OR PUSH TO AN ARRAY 
	      function (response) {
	        if (response && !response.error) {
	          /* handle the result */
	          // console.log("post_impressions",response)
	        }
	      }
	);
}

function pageFanAdds(days, pageId){
	FB.api(
      "/"+pageId+"/insights/page_fan_adds?since="+timeframe.since+"&until="+timeframe.until, //The number of People Talking About the Page by user age and gender
      function (response) {
        if (response && !response.error) {
          /* handle the result */
          resolve(response)
        }
      }
  	);
}
//~~~~~~~~~~~~~~~~~~~~~ page_fans
function pageFans(days, pageId){
	var timeframe = time(days);
	return new Promise(function(resolve, reject){
		FB.api(
	      "/"+pageId+"/insights/page_fans?"+timeframe.since+"&until="+timeframe.until, //The number of People Talking About the Page by user age and gender
	      function (response) {
	        if (response && !response.error) {
	          /* handle the result */
	          var numLikes = response.data[0].values[response.data[0].values.length-1].value
	          // console.log("yomane", numLikes)
	          resolve(numLikes);
	        }
	        else{ 

	        }
	      }
	 	);
	 })
}



function facebookUpdate(user, twentyMinUpdate) {
	return new Promise(function(resolve, reject) {
		Profile.findOne({userId: user._id}, function(err, profile) {
			if(err) return console.log(err);
	

			FB.setAccessToken(user.facebook.token);
			console.log("69", user)
			if (user.facebook.pages.length === 0) {
				return resolve();
			}
			
			var pageId = user.facebook.pages[0].pageId;
			var functions= [ 
				pageImpressions(92, pageId),
				pageViewsTotal(92, pageId), //fix- currently only had last 3 days
				pagePostImpressions(92, pageId), 
				pagePosts(92, pageId), //
				pageFans(92, pageId) //fix-undefiened
			];
			Promise
			.all(functions)
			.then((result) => { // creates and profile snapshot here
				// console.log("$$0")

				return new Promise(function(interResolve, interReject) {
					if (!twentyMinUpdate) {
						profile.facebook.last = result[4];
						profile.save();
						new ProfileSnapshot({
							platformId: user.facebook.id,
							platform: 'facebook',
							followers: result[4],
							views: result[0][result[0].length-1].value,
							posts: result[3].length,
							date: new Date(),
							profileId: profile._id
						})
						.save(function(err, p) {
							if(err) return next(err);

							var posts = [];
							result[3].forEach(function(post, i) {

								Post.findOrCreate({postId: post.postId}, {
									description: post.message,
									postId: post.postId,
									type: 'facebook',
									date: post.date,
									profileId: profile._id
								}, function(err, postData) {
									// console.log("HERE1")
									
									if(err) return next(err);
									// snapshot it
									new PostSnapshot({
										profileId: p._id, 
										postId: postData.postId,
										comments: post.comments,
										likes: post.likes,
										shares: post.shares,
										date: p.date
									})
									.save(function(err, psnap) {

										if(err) return next(err);

										postData.snapshots.push(psnap._id);
										postData.save(function(err) {
											if(err) return next(err);

											posts.push(post);
											// console.log("posts.length~~~~", posts.length,"result.length~~~~", result[3].length);

											if (posts.length === result[3].length) {
												posts = posts.sort(function(a, b) {
													return b.date - a.date;
												});
												interResolve(posts[0]);
											}
											resolve();
										});			
									});
								});
							});
						});
					} else {
					
						profile.facebook.followers = result[4];
						profile.save();
						result[3].forEach(function(post, i) {

							Post.findOrCreate({postId: post.postId}, {
								description: post.message,
								postId: post.postId,
								type: 'facebook',
								date: post.date,
								profileId: profile._id
							}, function(err, postData) {
								if (err) return console.log(err);
								postData.comments = post.comments;
								postData.likes = post.likes;
								postData.shares = post.shares;

								postData.save(function(err, p) {
									if (err) return console.log(err);
									interResolve();
								});
							});
						});
					}
				})
				.then((latestPost)=>{
			
					if(user.triggerFrequency.facebook.turnedOn){
						var daysSinceLastPost = Math.floor((new Date() - latestPost.date) / (1000 * 60 * 60 * 24)); // Current unix time - allowed number of days in unix
						user.triggerFrequency.facebook.lastPost = daysSinceLastPost;

						// has this use updated within the last day?
						user.triggerFrequency.facebook.upToDate = (daysSinceLastPost - user.triggerFrequency.facebook.frequency > 0) ? false : true;
						user.save();
					}
				})	
				.catch((err) => console.log(err));
			});
		});
	});
}


module.exports = {
  time: time,
  pageImpressions: pageImpressions,
  pageViewsTotal: pageViewsTotal,
  pagePostImpressions: pagePostImpressions,
  pagePosts: pagePosts,
  pageFans: pageFans,
  pageFanAdds: pageFanAdds,
  facebookUpdate: facebookUpdate

}
//make function for rendering page names by id, and then adding that page to the dashboard by id