module.exports = function (io) 
{
	var usernames = [];
	var images = [];

	io.on("connection", function(socket)
	{
	    socket.on('adduser', function(data)
	    {
	    	socket.username = add_username(clean_string(data.username.toLowerCase()));
	    	socket.emit('update', {type:'username', username:socket.username})
	    	socket.broadcast.emit('update', {type:'chat_announcement', msg:socket.username + ' has joined'});
	    });

	    socket.on('sendchat', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
    			socket.broadcast.emit('update', {type:'chat_msg', username:socket.username, msg:clean_string(data.msg)});
	    	}
    	});

	    socket.on('ship_info', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
    			socket.broadcast.emit('update', {type:'ship_info', username:socket.username, x:data.x, y:data.y, rotation:data.rotation, visible:data.visible});
	    	}
    	});

	    socket.on('laser', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
    			socket.broadcast.emit('update', {type:'laser', laser:data});
	    	}
    	});

	    socket.on('destroyed', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
    			socket.broadcast.emit('update', {type:'destroyed', username:socket.username, destroyed_by:data.destroyed_by});
	    	}
    	});

	    socket.on('image', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
	    		add_image(data);
    			socket.broadcast.emit('update', {type:'images', images:[{url:data.url, x:data.x, y:data.y}]});
	    	}
    	});

	    socket.on('get_images', function (data) 
	    {
	    	if(socket.username !== undefined)
	    	{
    			socket.emit('update', {type:'images', images:images});
	    	}
    	});

    	socket.on('disconnect', function()
    	{
    		if(socket.username !== undefined)
    		{
	    		remove_username(socket.username);
		   		socket.broadcast.emit('update', {type:'disconnection', username:socket.username}); 
    		}
    	});
	});

	function clean_string(s)
	{
		return s.replace(/</g, '');
	}

	function get_random_int(min, max)
	{
	    return Math.floor(Math.random() * (max-min+1) + min);
	}

	function add_username(username)
	{
		var keep_going = true;
		var matched = false;
		while(keep_going)
		{
			for(var i = 0; i < usernames.length; i++)
			{
				if(usernames[i] === username)
				{
					matched = true;
					break;
				}
			}
			if(matched)
			{
				username = username + get_random_int(2, 9);
				keep_going = true;
				matched = false;
			}
			else
			{
				keep_going = false;
			}
		}
		usernames.push(username);
		return username;
	}

	function remove_username(username)
	{
		for(var i = 0; i < usernames.length; i++)
		{
			if(usernames[i] === username)
			{
				usernames.splice(i, 1);
			}
		}
	}

	function add_image(data)
	{
		images.push(data);
		if(images.length > 10)
		{
			images.splice(0, 1);
		}
	}

}