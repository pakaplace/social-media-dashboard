var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var bizUser = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	phoneNumber: {
		type: String,
		required: true
	},
	budget:{
		type: String,
		required: true
	},
	location:{
	    country: String,
	    state: String,
	    city: String
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
	 },
	categories: {
		type: Array,
		enum: ['music', 'design', 'gaming', 'fashion', 'beauty', 'travel', 'sports', 'entertainment', 'food', 'fitness']
	},
	companyName:{
		type: String,
		required: true
	}
})

bizUser.plugin(findOrCreate);

module.exports = {
  BizUser: mongoose.model('BizUser', bizUser)
}