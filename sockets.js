module.exports = function (io) 
{
	var usernames = [];

	io.on("connection", function(socket)
	{
	    socket.on('adduser', function(data)
	    {
	    	socket.username = add_username(data.username.toLowerCase());
	    	socket.emit('update', {type:'username', username:socket.username})
	    	socket.broadcast.emit('update', {type:'chat_announcement', msg:socket.username + ' has joined'});
	    });

	    socket.on('sendchat', function (data) 
	    {
    		socket.broadcast.emit('update', {type:'chat_msg', username:socket.username, msg:data.msg});
    	});

	    socket.on('ship_info', function (data) 
	    {
    		socket.broadcast.emit('update', {type:'ship_info', username:socket.username, x:data.x, y:data.y, rotation:data.rotation, visible:data.visible});
    	});

	    socket.on('laser', function (data) 
	    {
    		socket.broadcast.emit('update', {type:'laser', username:socket.username, x:data.x, y:data.y, rotation:data.rotation, vx:data.vx, vy:data.vy});
    	});

	    socket.on('destroyed', function (data) 
	    {
    		socket.broadcast.emit('update', {type:'destroyed', username:socket.username, destroyed_by:data.destroyed_by});
    	});

    	socket.on('disconnect', function()
    	{
    		remove_username(socket.username);
	   		socket.broadcast.emit('update', {type:'disconnection', username:socket.username}); 
    	});
	});

	function get_random_int(min, max)
	{
	    return Math.floor(Math.random() * (max-min+1) + min);
	}

	function add_username(username)
	{
		var keep_going = true;
		while(keep_going)
		{
			for(var i = 0; i < usernames.length; i++)
			{
				if(usernames[i] === username)
				{
					username = username + get_random_int(2, 1000);
					keep_going = true;
					break;
				}
			}
			keep_going = false;
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

}