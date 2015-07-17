var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) 
{
    var c = {};
    c.title = 'trak';
	res.render('main', c);
});

module.exports = router;
