var facebook = require('./facebook');
var facebookUpdate = facebook.facebookUpdate;

var vine = require('./vine');
var vineUpdate = vine.vineUpdate;

var instagram = require('./ig');
var instagramUpdate = instagram.instagramUpdate;

var twitter = require('./twitter');
var twitterUpdate = twitter.twitterUpdate;

var youtubeFunctions = require('./youtube');
var youtubeUpdate = youtubeFunctions.youtubeUpdate;

var models = require('../models/models');
var User = models.User;
var Profile = models.Profile;
var ProfileSnapshot = models.ProfileSnapshot;
var Post = models.Post;
var PostSnapshot = models.PostSnapshot;


var updateDaily = function() {
    return new Promise(function(resolve, reject) {
        User.find(function(err, users) {
            users.forEach(function(user) {
                instagramUpdate(user)
                .then(() => {
                    console.log('instagram......success');
                    youtubeUpdate(user)
                })
                .then(() => {
                    console.log('youtube........success');
                    twitterUpdate(user)
                })
                .then(() => {
                    console.log('twitter........success');
                    vineUpdate(user)
                })
                .then(() => {
                    console.log('vine...........success');
                    facebookUpdate(user)
                }) //fix pauses the update route
                .then(() => {
                    console.log('facebook.......success');
                    resolve();
                });
            });
        });
    });
}

var updateFrequent = function() {
    return new Promise(function(resolve, reject) {
        User.find(function(err, users) {
            users.forEach(function(user) {
                var isTwenty = true;
                instagramUpdate(user, isTwenty)
                .then(() => {
                    console.log('instagram......success');
                    youtubeUpdate(user, isTwenty)
                })
                .then(() => {
                    console.log('youtube........success');
                    twitterUpdate(user, isTwenty)
                })
                .then(() => {
                    console.log('twitter........success');
                    vineUpdate(user, isTwenty)
                })
                .then(() => {
                    console.log('vine...........success');
                    facebookUpdate(user, isTwenty)
                })
                .then(() => {
                    console.log('facebook.......success');
                    resolve();
                });
            });
        });
    });
}

var updateUser = function(user) {
    return new Promise(function(resolve, reject) {
        var isTwenty = true;
        instagramUpdate(user, isTwenty)
        .then(() => {
            console.log('instagram......success');
            youtubeUpdate(user, isTwenty)
        })
        .then(() => {
            console.log('youtube........success');
            twitterUpdate(user, isTwenty)
        })
        .then(() => {
            console.log('twitter........success');
            vineUpdate(user, isTwenty)
        })
        .then(() => {
            console.log('vine...........success');
            facebookUpdate(user, isTwenty)
        })
        .then(() => {
            console.log('facebook.......success');
            resolve();
        });
    });
}

var clearProfileSnaps = function() {
    return new Promise(function(resolve, reject) {
        var d = new Date();
        d.setDate(d.getDate() - 30);
        ProfileSnapshot.find({date: {$lt: d}})
        .remove(function(err) {
            if (err) reject(err);
            resolve();
        });
    });
}

var clearPostSnaps = function() {
    return new Promise(function(resolve, reject) {
        var d = new Date();
        d.setDate(d.getDate() - 30);
        PostSnapshot.find({date: {$lt: d}})
        .remove(function(err) {
            if (err) reject(err);
            resolve();
        });
    });
}

module.exports = {
    updateFrequent: updateFrequent,
    updateDaily: updateDaily,
    updateUser: updateUser,
    clearProfileSnaps,
    clearPostSnaps
}