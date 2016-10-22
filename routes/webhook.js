var router = require('express').Router();

var twilio = require('../test/trigger.js');
var trigger = twilio.sendMessage;

var update = require('../update/update');
var updateDaily = update.updateDaily;
var updateFrequent = update.updateFrequent;
var clear1 = update.clearProfileSnaps;
var clear2 = update.clearPostSnaps;

var facebook = require('../update/facebook');
var facebookUpdate = facebook.facebookUpdate;

var vine = require('../update/vine');
var vineUpdate = vine.vineUpdate;

var instagram = require('../update/ig');
var instagramUpdate = instagram.instagramUpdate;

var twitter = require('../update/twitter');
var twitterUpdate = twitter.twitterUpdate;

var youtubeFunctions = require('../update/youtube');
var youtubeUpdate = youtubeFunctions.youtubeUpdate;

var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;


// DAILY SNAPSHOTS

router.get('/update/facebook', function(req, res, next) {  //should be /update/page
  User.find(function(err, users) {
    users.forEach((user) => {
      facebookUpdate(user)
      .then(() => res.redirect('/integrate'));
    });
  });
});

router.get('/update/instagram', function(req, res, next) {
  User.find(function(err, users) {
    users.forEach((user) => {
      instagramUpdate(user)
      .then(() => res.redirect('/integrate'));
    });
  });
});

router.get('/update/youtube', function(req, res, next) {
  User.find(function(err, users) {
    users.forEach((user) => {
      youtubeUpdate(user)
      .then(() => res.redirect('/integrate'));
    });
  });
});

router.get('/update/twitter', function(req, res, next) {
  User.find(function(err, users) {
    users.forEach((user) => {
      twitterUpdate(user)
      .then(() => res.redirect('/integrate'));
    });
  });
});

router.get('/update/vine', function(req, res, next) {
  User.find(function(err, users) {
    users.forEach((user) => {
      vineUpdate(user)
      .then(() => res.redirect('/integrate'));
    });
  });
});

router.get('/update', (req, res, next) => {
  clear1()
  .then(() => {
    console.log('clearing profile snaps................');
    clear2()
  })
  .then(() => {
    console.log('clearing post snaps....................');
    updateDaily()
  })
  .then(() => {
    console.log('updating all posts and snaps..............');
    res.sendStatus(200);
  });
});

// call this FUNction every 20 minutes, does not make snapshots

router.get('/update/frequent', (req, res, next) => {
  updateFrequent()
  .then(() => res.sendStatus(200));
});

router.get('/update/trigger', (req, res, next) => {
  var platforms = ['youtube', 'instagram', 'vine', 'twitter', 'facebook'];
  User.find(function(err, users) {
    if (err) return next(err);
    users.forEach((user)=> {
      var userTrigger = user.triggerFrequency;
      var willsend = false;
      var msg = "You're behind on posting to the following channels: ";
      platforms.forEach((p) => {
        if (userTrigger[p].turnedOn) {
          if (userTrigger[p].upToDate) {
            console.log('nice');
          } else {
            if (!willsend) {
              willsend = true;
            }
            msg = msg + p + " (" +userTrigger[p].lastPost+ " days) ";
          }
        }
      });
      if (willsend) {
        trigger(msg, user);
      }
    });
    res.sendStatus(200);
  });
});

router.get("/privacy",function(req, res, next) {
  req.session.unlockDate = new Date();
  res.render("privacy");
});


router.get("/terms",function(req, res, next) {
  req.session.unlockDate = new Date();
  res.render("terms");
})


module.exports = router;

