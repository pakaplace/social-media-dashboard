var ig = require('instagram-node').instagram()
console.log("AT:", process.env.AT);
console.log("ID:", process.env.ID);
console.log("INSTAGRAM_CLIENT_ID:", process.env.INSTAGRAM_CLIENT_ID);
console.log("INSTAGRAM_CLIENT_SECRET:", process.env.INSTAGRAM_CLIENT_SECRET);
var parkaplace = process.env.AT;
ig.use({ access_token: process.env.AT});
var bigArr = [];

function instagramInformation(req){
	ig.user_media_recent(process.env.ID, {cursor: 30}, function(err, medias, pagination, remaining, limit) {
		// console.log("medias", medias)
		// console.log("pagination", pagination);
	 	// console.log("medias number", medias.length);
	 	bigArr = bigArr.concat(medias);
		if(pagination.next) {
		    pagination.next(instagramInformation); // Will get second page results 
		 } else {
		 	// console.log(bigArr.length);
		 }
		 
	});

}
instagramInformation();

module.exports={
	instagramInformation: instagramInformation
}

