var twilio = require('twilio');
var client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sendMessage(triggerMessage, user){
	return new Promise(function(resolve, reject){
		client.sms.messages.create({
		    to: '+1' + user.phoneNumber,
		    from: process.env.TWILIO_NUMBER,
		    body: triggerMessage
		}, function(error, message) {
		    if (!error) {
		        console.log('Success!');
		        console.log('Message sent on:' + message.dateCreated);
		        resolve()
		    } else {
		        console.log('Oops! There was an error sending the message.', error);
		        reject(error);
		    }
		});
	});
}

module.exports = {
	sendMessage: sendMessage
}