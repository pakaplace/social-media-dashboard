var Vineapple = require('vineapple');

var vine = new Vineapple({
  key: '1372419367505195008-4944b374-b1cf-4cd3-a390-312eb80950c2',
  userId: '1372419367505195008',
  username: 'team10dev'
});

vine.me((err, me) => {
	if (err) console.log('err', err)
	console.log("me", me);
});