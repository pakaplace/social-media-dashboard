function facebookPageInsights(pageId){
	new Promise(function(resolve, reject){
				FB.api(`/${pageId}/insights/page_views_total`, function (res) {
				  if(!res || res.error) {
				   console.log(!res ? 'error occurred' : res.error);
				   reject(res.error);
				  }
				  
				  console.log("RESPONSE   ", res); //get's 28 day values 
				  resolve(res);
				});
			})
			.then(function(result){
				
			})
			.catch(console.log)
}