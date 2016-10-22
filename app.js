var express = require('express');
var util = require('util');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);
var app = express();

//** for passport auth **
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook');
var YoutubeStrategy = require('passport-youtube-v3').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var Vineapple = require('vineapple');
var Facebook = require('fb');

var bcrypt = require('bcrypt');

//** end passport auth **
//Checks if all the process.env tokensar e there
var REQUIRED_ENV = "MONGODB_URI SECRET FB_CLIENT_ID FB_CLIENT_SECRET".split(" ");
REQUIRED_ENV.forEach(function(el) {
  if (!process.env[el])
    throw new Error("Missing required env var " + el);
});
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
var mongoStore = new MongoStore({mongooseConnection: mongoose.connection});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET,
  store: mongoStore
}));
var models = require('./models/models');
var User = models.User;
var Profile = models.Profile;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(passport.initialize());
app.use(passport.session());
// YOUR CODE HERE
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// Tell passport how to read our user models
passport.use(new LocalStrategy(function(username, password, done) {
  // Find the user with the given username
    User.findOne({ username: username }, function (err, user) {
      // if there's an error, finish trying to authenticate (auth failed)
      if (err) {
        return done(err);
      }
      // if no user present, auth failed
      if (!user) {
        return done(null, false);
      }
      // if passwords do not match, auth failed
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false);
      }
      // auth has has succeeded
      console.log('LOGGED IN');
      return done(null, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: process.env.HOST + "/auth/facebook/cb", //fix when callback URL is updated
    passReqToCallback: true,
    profileFields: ['email', 'displayName']
  },
  // facebook will send back the token and profile
  function(req, token, refreshToken, profile, done) {
    console.log("Profile ", profile)
    // check if the user is already logged in
    // asynchronous
    process.nextTick(function() {
      if (!req.user) {
        throw new Error("Gotta be logged in maaaaaaan");
      } else {
        // user already exists and is logged in, we have to link accounts
        var user = req.user; // pull the user out of the session
        // update the current users facebook credentials
        user.facebook.id = profile.id;
        user.facebook.token = token;
        user.facebook.email = profile.email;
        // save the user
        user.save(function(err, p) {
          if (err) return console.log('big error...........', err);
          Profile.findOne({userId: user._id}, function(err, p){

            p.facebook.displayName = profile.displayName;

            p.save(function(err) {
              if (err) return next(err);
            })
          })
          return done(null, user);
        });
      }
    });
  }));

passport.use(new YoutubeStrategy({
    clientID: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    callbackURL: process.env.HOST + "/auth/youtube/callback",
    scope: 'https://www.googleapis.com/auth/youtube',
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    if (!req.user) {
      throw new Error("lmao gotta log in bro")
    }
    
    var user = req.user;
    // console.log('[PROFILE]', profile)
    // user.youtube.accessToken = accessToken;
    // user.youtube.refreshToken = refreshToken;
    user.youtube.profile = profile;
    user.url.youtube = "www.youtube.com/user/channel/"+user.youtube.profile.id;
    user.save(function(err, user) {
      if (err) {
        return done(null, false, err);
      }
      Profile.findOne({userId: user._id}, function(err, p) {
        p.youtube.displayName = profile.displayName;
        p.save(function(err) {
          if (err) return console.log(err);
        })
      })
      return done(null, user);
    });
  }
));

passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: process.env.HOST + "/auth/instagram/callback",
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // console.log("token", accessToken);
    // console.log("refreshToken", refreshToken);
    // console.log("profile", profile);
    if(!req.user){
      throw new Error ("Error please login")
    } 
    var user = req.user;
    user.instagram.AccessToken = accessToken;
    user.instagram.instagramProfile = profile;
    user.url.instagram = 'www.instagram.com/'+user.instagram.instagramProfile.username;
    user.save(function () {
      Profile.findOne({userId: user._id}, function(err, p) {
        p.instagram.displayName = profile.displayName;
        p.save(function(err) {
          if (err) return console.log(err);
        })
      })
      return done(null, req.user);
    });
  }
));
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.HOST + "/auth/twitter/callback", 
     passReqToCallback: true
  },
  function(req, token, tokenSecret, profile, cb) {
    if(!req.user){
      throw new Error("twitter failed to login")
    } else {
      req.user.twitter.twitterToken = token;
      req.user.twitter.twitterTokenSecret = tokenSecret;
      req.user.twitter.twitterProfile = profile;
      req.user.url.twitter = "www.twitter.com/"+req.user.twitter.twitterProfile.username;
      req.user.save(function (err, user) {
        Profile.findOne({userId: user._id}, function(err, p) {
        p.twitter.displayName = profile.displayName;
        p.save(function(err) {
              if (err) return console.log(err);
            })
          })
        return cb(err, req.user);
      });
    }
  }
));

var webhooks = require('./routes/webhook');
var auth = require('./routes/auth');
var routes = require('./routes/index');

app.use('/', webhooks);
app.use('/', auth(passport));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}); 
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
module.exports = app;