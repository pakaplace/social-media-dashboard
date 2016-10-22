var router = require('express').Router();
var passport = require('passport');
var FB = require('fb');
var ig = require('instagram-node').instagram();

var dashboardFunctions = require('../update/dashboard');
var getPosts = dashboardFunctions.getPosts;
var getGeneral = dashboardFunctions.getGeneral;
var checkAdmin = dashboardFunctions.checkAdmin;
var getPlatformPosts = dashboardFunctions.getPlatformPosts;
var getAllUrls = dashboardFunctions.getAllUrls;

var getAll = dashboardFunctions.getAll;

var update = require('../update/update');
var updateUser = update.updateUser;

// MODELS
var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;

var facebook = require('../update/facebook');

var time = facebook.time; //DO NOT COMMENT THIS SHIT OUT **** !!!

/* GET home page. */
router.get('/', function(req, res, next) {
	req.session.unlockDate = new Date();
	res.redirect('/dashboard/'+req.user._id);
});


router.get('/integrate', function(req, res, next) {
	req.session.unlockDate = new Date();
	Profile.findOne({userId: req.user._id}, function(err, profile) {
		if (err) return next(err);
		// console.log('profile..........', profile)
		res.render('integrate', {
			userId: req.user._id,
			profile
		});
	});
});

router.get('/fbPageSelector', function(req, res, next) {
	new Promise(function(resolve, reject) {

		FB.setAccessToken(req.user.facebook.token);

		FB.api('/'+req.user.facebook.id+'/accounts', function (res) { //takes facebook user id and gets pages that they administer
			if(!res || res.error) {
				console.log(!res ? 'error occurred' : res.error);
				reject(res.error);
			}
			resolve(res);
		});
	})
	.then((result) => {
		return res.render('fbPageSelector', {result: result.data})
	})
	.catch((err) => console.log(err));
});

//GETS PAGE DATA FROM INDIVIDUAL FACEBOOK PAGE
router.get('/fbPageConfirmation/', function(req, res, next) {
	if (req.query.pageId) {
		FB.setAccessToken(req.user.facebook.token);

		req.user.facebook.pages.push({pageId: req.query.pageId, pageName: req.query.name})
		console.log("USER FACEBOOK PAGES", req.user.facebook.pages);
		req.user.url.facebook = "www.facebook.com/"+req.query.pageId
		req.user.save(function(err, success) {
			if(err) {
				console.log("ERROR ", err);
			}
			new Promise(function(resolve, reject) {

				FB.api(`/${req.query.pageId}/insights/page_views_total`, function (res) {
					if(!res || res.error) {
						console.log(!res ? 'error occurred' : res.error);
						reject(res.error);
					}
				    resolve(res);
				});
			})
			.then(function(result){
				res.render('fbPageSelector')
			}).catch((err) => console.log(err))
		});
	} else {
		res.status(400).json({
			message: "Kinda missing a pageId there bud"
		});
	}
});

// DASHBOARD ROUTES

router.get('/dashboard', function(req, res, next) {
	req.session.unlockDate = new Date();
	updateUser(req.user)
	.then(() => res.redirect('/dashboard/'+req.user._id));
});

router.get('/dashboard/:id', function(req, res, next) {
	req.session.unlockDate = new Date();
	var id = req.params.id;
	User.findById(id)
	.lean() 
	.exec(function(err, user) {
		getAll()
		.then((tot) => {
			checkAdmin(req.user)
			.then((userArray) => {
				getGeneral(id) // gets subscriber, follower/data
				.then((platformData) => { 
					var platforms = ['youtube', 'instagram', 'vine', 'twitter', 'facebook'];
					var change = {};
					var direction = {};
					var posts;
					platforms.map((p) => {
						if (platformData.recent[p]) {
							change[p] = (((platformData.recent[p].followers - platformData.recent[p].last) / platformData.recent[p].last) * 100).toFixed(2);
							if (isNaN(change[p])) {
								change[p] = 0;
							}
							if (change[p] > 0) {
								direction[p] = {
									up: true,
									down: false
								}
							} else if (change[p] < 0) {
								direction[p] = {
									up: false,
									down: true
								}
							} else {
								direction[p] = {
									up: false,
									down: false
								}
							}
						}
					});
					getPosts(id) // get posts for the person
					.then((postData)=>{
						posts = postData;
						// console.log("got posts");
						getAllUrls(req.user)
							.then((urlArray)=>{
								// console.log("Gets to this ish", urlArray)
								var on = {};
								for (var key in user.triggerFrequency) {
									if (user.triggerFrequency[key].turnedOn) {
										on[key] = "true";
									}
								}
								// console.log("tototototototototootototot", tot)

								Profile.findOne({userId: user._id}, function(err, p) {
									var d = {
										tot,
										snapchat: p.snapchat,
										music: p.music,
										postData: postData,
										platformData: platformData,
										admin: req.user.isAdmin,
										userArray: userArray,
										user,
										me: req.user,
										change,
										direction,
										on,
										urlArray
									}
									res.render('dashboard', d);
								});
							})
						// console.log("here x2")
					})
				})
			})
		}).catch(console.log.bind(this, "[error]"));
	});
});

router.get('/dashboard/:platform/:id', function(req, res, next) {
	req.session.unlockDate = new Date();
	var id = req.params.id;
	var users;
	checkAdmin(req.user)
	.then((userArray) => {
		users = userArray;
		return getPlatformPosts(id, req.params.platform)
	})
	.then((data) => {
		console.log('data data data........', data.change);
		// console.log('is this defined..............', users);
		res.render('platform', {
			me: req.user,
			admin: req.user.isAdmin,
			userArray: users,
			data: data
		})
	});
});

router.post('/dashboard/:id',(req, res, next) => {
	req.session.unlockDate = new Date();
	User.findById(req.params.id, function(err, user) {
	    if (req.body.youtube) {
	    	user.triggerFrequency.youtube.turnedOn = true;
	    	user.triggerFrequency.youtube.frequency = req.body.youtubeDays;
	    } else {
	    	user.triggerFrequency.youtube.turnedOn = false;
	    }
	    if (req.body.vine) {
	    	user.triggerFrequency.vine.turnedOn = true;
	    	user.triggerFrequency.vine.frequency = req.body.vineDays;
	    } else {
	    	user.triggerFrequency.vine.turnedOn = false;
	    }
	    if (req.body.instagram) {
	    	user.triggerFrequency.instagram.turnedOn = true;
	    	user.triggerFrequency.instagram.frequency = req.body.instagramDays;
	    } else {
	    	user.triggerFrequency.instagram.turnedOn = false;
	    }
	    if (req.body.twitter) {
	    	user.triggerFrequency.twitter.turnedOn = true;
	    	user.triggerFrequency.twitter.frequency = req.body.twitterDays;
	    } else {
	    	user.triggerFrequency.twitter.turnedOn = false;
	    }
	    if (req.body.facebook) {
	    	user.triggerFrequency.facebook.turnedOn = true;
	    	user.triggerFrequency.facebook.frequency = req.body.facebookDays;
	    } else {
	    	user.triggerFrequency.facebook.turnedOn = false;
	    }
	    user.save(function(err, user) {
	   	  	if (err) return console.log('asshole....', err);
	   	  	res.redirect('/dashboard/'+req.params.id);
	    });
	});
});

router.post('/snapchat', function(req, res, next) {
	User.findById(req.body.user, function(err, user) {
		if(err) return console.log(err);
		user.url.snapchat = req.body.snapHandle;
		Profile.findOne({userId: user._id}, function(err, profile) {
			if (err) return next(err);
			// console.log('profile..........', profile)
			profile.snapchat.displayName = req.body.snapHandle;
			profile.snapchat.followers = req.body.snapFollowers;
			profile.save(function(err) {
				if(err) return next(err);
				user.save(function(err) {
					if(err) return next(err);
					res.redirect('/dashboard/' + user._id);
				});
			});
		});	
	});
});

router.post('/music', function(req, res, next) {
	User.findById(req.body.user, function(err,user) {
		if (err) return next(err);
		user.url.music = req.body.musicHandle;
		Profile.findOne({userId: user._id}, function(err, profile) {
			if (err) return next(err);
			// console.log('profile..........', profile)
			profile.music.displayName = req.body.musicHandle;
			profile.music.followers = req.body.musicFollowers;
			profile.save(function(err) {
				if(err) return next(err);
				user.save(function(err) {
					if(err) return next(err);
					res.redirect('/dashboard/' + user._id);
				});
			});
		});	
	})
});

router.post('/search', function(req, res, next){
	// inser search functionality here
})

module.exports = router;


