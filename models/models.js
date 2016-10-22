var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var user = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  categories:{
    type: Array,
    enum: ['music', 'design', 'gaming', 'fashion', 'beauty', 'travel', 'sports', 'entertainment', 'food', 'fitness']
  },
  location:{
    country: String,
    state: String,
    city: String
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String
  },
  isAdmin:{
    type: Boolean,
    default: false
  },
  facebook: {
    id: String,
    token: String,
    name: String,
    manage_pages: String,
    pages: [{
      pageId: String,
      pageName: String
    }]
  },
  instagram: {
    AccessToken: String, 
    instagramProfile: Object
  },
  twitter: {
    twitterToken: String,    
    twitterTokenSecret: String, 
    twitterProfile: Object
  },
  youtube: {
    profile: Object
  },
  vine: {
    username: String,
    password: String,
    authToken: String,
    userId: String,
    profile: Object
  },
  url:{ //only used for copy all
    twitter: String,
    instagram: String,
    facebook: String,
    youtube: String,
    vine: String,
    snapchat: String,
    music: String
  },
  triggerFrequency: {
    youtube: {
      lastPost: Number,
      turnedOn: Boolean,
      upToDate: Boolean,   
      frequency: Number
    },
    instagram: {
      turnedOn: Boolean,
      lastPost: Number,
      upToDate: Boolean,
      frequency: Number
    },
    vine: {
      turnedOn: Boolean,
      lastPost: Number,
      upToDate: Boolean,
      frequency: Number
    },
    twitter: {
      turnedOn: Boolean,
      upToDate: Boolean,
      lastPost: Number,
      frequency: Number
    },
    facebook: {
      turnedOn: Boolean,
      upToDate: Boolean,
      lastPost: Number,        
      frequency: Number
    }
  }
});
var profile = new mongoose.Schema({
  // all 1 time info for a profile 
  // reference User
  // array of posts
  youtube: {
    displayName: String,
    followers: Number,
    last: Number
  },
  instagram: {
    displayName: String,
    followers: Number,
    last: Number
  },
  vine: {
    displayName: String,
    followers: Number,
    last: Number
  },
  twitter: {
    displayName: String,
    followers: Number,
    last: Number
  },
  facebook: {
    displayName: String,
    followers: Number,
    last: Number
  },
  snapchat: {
    displayName: String,
    followers: Number
  },
  music: {
    displayName: String,
    followers: Number
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})
var profileSnapshot = new mongoose.Schema({
  platformID: {
    type: String
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram', 'vine', 'twitter', 'facebook']
  },
  followers: {
    type: Number
  },
  posts: {
    type: Number
  },
  views: {
    type: Number
  },
  date: {
    type: Date,
    index: true
  }, 
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  }
})
var post = new mongoose.Schema({
  // one time post info ie description or media assets, links, refer to profile
  title: {
    type: String
  },
  description: {
    type: String
  },
  postId: {
    type: String
  },
  type: {
    type: String,
    enum: ['youtube', 'instagram', 'vine', 'twitter', 'facebook']
  },
  comments: {
    type: Number
  }, 
  likes: {
    type: Number 
  }, 
  favorites: {
    type: String
  }, 
  views: {
    type: Number
  }, 
  shares: {
    type:Number
  },
  dislikes: {
    type: Number
  }, 
  date: {
    type: Date,
    index: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  snapshots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostSnapshot'
  }]
})
var postSnapshot = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProfileSnapshot',
    required: true
  },
  postId: {
    type: String
  },
  comments: {
    type: Number
  }, 
  likes: {
    type: Number 
  }, 
  favorites: {
    type: String
  }, 
  views: {
    type: Number
  }, 
  shares: {
    type:Number
  },
  dislikes: {
    type: Number
  }, 
  date: {
    type: Date,
    index: true
  } 
})

user.plugin(findOrCreate);
post.plugin(findOrCreate);
profile.plugin(findOrCreate);

module.exports = {
  User: mongoose.model('User', user), 
  Profile: mongoose.model('Profile', profile),
  ProfileSnapshot: mongoose.model('ProfileSnapshot', profileSnapshot),
  Post: mongoose.model('Post', post),
  PostSnapshot: mongoose.model('PostSnapshot', postSnapshot)

}
