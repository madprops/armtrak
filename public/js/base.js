var username;
var socket;
var userlist;
var canvas;
var context;
var canvas_height;
var canvas_width;
var background;
var nave;
var bg_height = 2000;
var bg_width = 2000;
var left_arrow = false;
var right_arrow = false;
var up_arrow = false;
var down_arrow = false;
var offset;
var ship_width;
var ship_height;
var clock;
var lasers = [];
var enemy_lasers = [];
var last_fired = Date.now();
var enemy_ships = [];
var explosion_image;
var laser_img;
var label;
var yt_player;
var sound = true;

window.onYouTubeIframeAPIReady = function()
{
	create_yt_player();
}

function init(uname)
{
	explosion_image = new Image();
	explosion_image.src = '/img/explosion.png';
	explosion_image.onload = function()
	{
		explosion_sheet = new createjs.SpriteSheet(
		{
		    images: [explosion_image], 
		    frames: {width: 96, height: 96, regX: 0, regY: 0}, 
		    animations: 
		    {    
		        explode: [0, 71, false]
		    }
		});
	}

	laser_img = new Image();
	laser_img.src = "img/laser.png";

	var keep_naming = true;
	while(keep_naming)
	{
		username = prompt('pick your name');
		if(username === null || username.length < 1 || username.length > 12)
		{
			keep_naming = true;
		}
		else
		{
			keep_naming = false;
		}
	}
	
	start_chat();
	start_socket();
	activate_key_detection();
	start_game();
}

function start_socket()
{
	socket = io('http://localhost:3000');

	socket.on('update', function(data) 
	{
		if(data.type === 'chat_msg')
		{
			update_chat(data.username, data.msg)
			check_yt(data.msg);
		}
		if(data.type === 'username')
		{
			username = data.username;
			chat_announce(data.username + ' has joined');	
			label.text = space_word(username);
		}
		if(data.type === 'chat_announcement')
		{
			chat_announce(data.msg);
		}
		if(data.type === 'ship_info')
		{
			update_enemy_ship(data);
		}
		if(data.type === 'laser')
		{
			fire_enemy_laser(data);
		}
		if(data.type === 'destroyed')
		{
			enemy_destroyed(data);
			chat_announce(data.username + ' was destroyed by ' + data.destroyed_by);
		}
		if(data.type === 'disconnection')
		{
			chat_announce(data.username + ' has left');
			remove_enemy(data.username);
		}
	});

	socket.emit('adduser', {username:username});
}

function EnemyShip()
{
    this.username;
    this.x;
    this.y;
    this.rotation;
    this.container;
    this.visible;
}

function update_enemy_ship(data)
{
	var enemy = get_enemy_ship_or_create(data);
	if(enemy)
	{
		enemy.container.x = data.x;
		enemy.container.y = data.y;
		enemy.container.visible = data.visible;
		enemy.container.children[0].rotation = data.rotation;
	}
}

function get_enemy_ship_or_create(data)
{
	var enemy = get_enemy_ship(data.username);

	if(!enemy)
	{
		enemy = new EnemyShip();
		enemy.username = data.username;
		enemy_ships.push(enemy);
		create_enemy_ship(enemy, data.x, data.y);
	}

	return enemy;
}

function get_enemy_ship(uname)
{
	for(var i = 0; i < enemy_ships.length; i++)
	{
		if(enemy_ships[i].username === uname)
		{
			return enemy_ships[i];
		}
	}

	return false;
}

function remove_enemy(uname)
{
	for(var i = 0; i < enemy_ships.length; i++)
	{
		if(enemy_ships[i].username === uname)
		{
			background.removeChild(enemy_ships[i].container);
			enemy_ships.splice(i, 1);
		}
	}
}

function activate_key_detection()
{
	$('#canvas').click(function()
	{
		$('#chat_input').blur();
	})

	$(document).keydown(function(e)
	{
		code = (e.keyCode ? e.keyCode : e.which);

		if(code == 13)
		{
			send_to_chat();
			e.preventDefault();
			return false;
		}

		if(code === 37)
		{
			left_arrow = true;
		}

		if(code === 38)
		{
			up_arrow = true;
		}

		if(code === 39)
		{
			right_arrow = true;
		}

		if(code === 40)
		{
			down_arrow = true;
		}

		if(code === 32 || code === 17)
		{
			if(!$('#chat_input').is(':focus'))
			{
				fire_laser();
			}
		}

	});

	$(document).keyup(function(e)
	{
		code = (e.keyCode ? e.keyCode : e.which);

		if(code === 37)
		{
			left_arrow = false;
		}

		if(code === 38)
		{
			up_arrow = false;
		}

		if(code === 39)
		{
			right_arrow = false;
		}

		if(code === 40)
		{
			down_arrow = false;
		}
	});
}

function clear_arrows()
{
	left_arrow, right_arrow, up_arrow, down_arrow = false;
}

function update_chat(uname, msg)
{
	var fmt = format_msg(uname, msg)
	$('#chat_area').append(fmt);
	goto_bottom();
}

function chat_announce(msg)
{
	var fmt = format_announcement_msg(msg)
	$('#chat_area').append(fmt);
	goto_bottom();
}

function format_msg(uname, msg)
{
	return "<div class='chat_message'><b>" + uname + ':</b>&nbsp;&nbsp;'
			+ chat_urlize(msg) + "</div><div>&nbsp;</div>";
}

function format_announcement_msg(msg)
{
	return "<div class='chat_announcement'>" + msg 
	       + "</div> <div>&nbsp;</div>";
}

function chat_urlize(msg)
{
	return msg.replace(/[^\s"\\]+\.\w{2,}[^\s"\\]*/g, '<a class="chat" target="_blank" href="$&"> $& </a>');
}

function send_to_chat()
{
	msg = $('#chat_input').val();
	fmt = format_msg(username, msg);
	$('#chat_area').append(fmt);
	$('#chat_input').val('');
	goto_bottom();
	socket.emit('sendchat', {msg:msg});
	check_yt(msg);
}

function goto_bottom()
{
	$("#chat_area").scrollTop($("#chat_area")[0].scrollHeight);
}

function start_chat()
{
	$('#chat_area').append('<div class="clear">&nbsp;</div>');
	goto_bottom();
}

function start_game()
{
	start_canvas();
    create_background();
    create_ship();
    clock = Date.now();
    loop();
}

function space_word(word)
{
	var s = '';
	for(var i = 0; i < word.length; i++)
	{
		s += word[i] + ' ';
	}
	return s;
}

function create_label(username)
{
	var label = new createjs.Text(space_word(username), "8px Arial", "#ffffff");
	label.textAlign = 'center';
	return label;
}

function create_ship()
{
	var image = new Image();
	image.src = "img/nave1.png";
	ship_image = new createjs.Bitmap(image);
	ship = new createjs.Container();
	var coords = get_random_coords();
	ship.x = coords[0];
	ship.y = coords[1];
	move_background(coords[0] - background.canvas.width / 2, coords[1] - background.canvas.height / 2);
	ship.speed = 0;
	ship.health = 100;

	ship.addChild(ship_image);

	label = create_label(username);
	ship.addChild(label);

	background.addChild(ship);

	image.onload = function() 
	{
		ship_width = image.width;
		ship_height = image.height;

		ship_image.regX = ship_width / 2;
		ship_image.regY = ship_height / 2;
		ship_image.x = ship_width / 2;
		ship_image.y = ship_height / 2;
		label.x = ship_width / 2;
		label.y = ship_height;
	}
}

function create_enemy_ship(enemy, x, y)
{
	var image = new Image();
	image.src = "img/nave1.png";
	var enemy_image = new createjs.Bitmap(image);
	var enemy_ship = new createjs.Container();
	enemy_ship.x = x;
	enemy_ship.y = y;

	enemy_ship.addChild(enemy_image);

	var label = create_label(enemy.username)
	enemy_ship.addChild(label);

	background.addChild(enemy_ship);
	enemy.container = enemy_ship;

	image.onload = function() 
	{
		enemy_image.regX = ship_width / 2;
		enemy_image.regY = ship_height / 2;
		enemy_image.x = ship_width / 2;
		enemy_image.y = ship_height / 2;
		label.x = ship_width / 2;
		label.y = ship_height;
	}
}

function emit_ship_info()
{
	socket.emit('ship_info', {x:ship.x, y:ship.y, rotation:ship_image.rotation, visible:ship.visible});
}

function get_center_coords()
{
	var x = bg_height / 2;
	var y = bg_width / 2;
	return [x, y];
}

function get_random_int(min, max)
{
    return Math.floor(Math.random() * (max-min+1) + min);
}

function get_random_coords()
{
	var x = get_random_int(10, bg_width);
	var y = get_random_int(10, bg_height);
	return [x, y];
}

function start_canvas()
{
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	canvas_width = $('#canvas').width();
	canvas_height = $('#canvas').height();
}

function create_background()
{
	background = new createjs.Stage('canvas');

	var stars = 3000;
	var starField = new createjs.Shape();

	var starSmallRadiusMin = 1;
	var starSmallRadiusVarience = 2;

	for (var i = 0; i < stars; i++) {
	    var mX = Math.floor(Math.random() * bg_width);
	    var mY = Math.floor(Math.random() * bg_height);
	    
	    var radius;
	    
	    radius = starSmallRadiusMin + (Math.random() * starSmallRadiusVarience);
	    
	    var colour, colourType = Math.round(Math.random() * 2);
	    switch (colourType) {
	        case 0: colour = "white"; break;
	        case 1: colour = "grey"; break;
	    }
	    
	    starField.graphics.beginFill(colour)
	    .drawPolyStar(
	        Math.random() * bg_width,
	        Math.random() * bg_height,
	        radius,
	        5 + Math.round(Math.random() * 2), // number of sides
	        0.9, // pointyness
	        Math.random() * 360 // rotation of the star
	    );
	}

	x_offset = background.canvas.width * 0.2;
	y_offset = background.canvas.height * 0.2;

	background.regX = 0;
	background.regY = 0;

	background.addChild(starField);
}

function move()
{
	if(ship.visible)
	{
		move_ship();
	}

	move_lasers();

	if(left_arrow)
	{
		turn_left();
		return true;
	}

	if(right_arrow)
	{
		turn_right();
		return true;
	}

	clear_arrows();
}

function move_background(x, y)
{
	if(x < 0)
	{
		x = 0;
	}
	if(x > bg_width - background.canvas.width)
	{
		x = bg_width - background.canvas.width;
	}
	if(y < 0)
	{
		y = 0;
	}
	if(y > bg_height - background.canvas.height)
	{
		y = bg_height - background.canvas.height;
	}
	background.regX = x;
	background.regY = y;
}

function get_direction(container)
{
	var direction = ((container.children[0].rotation / 360) % 1) * 360;
	if(direction < 0)
	{
		direction = 360 - Math.abs(direction);
	}
	if(direction >= 360)
	{
		direction = 0;
	}
	return direction;
}

function to_radians(degrees)
{
	return degrees * (Math.PI / 180);
}

function get_vector_velocities(container, speed)
{
	var direction = get_direction(container);
	var angle;
	var x, y;

	if(direction === 0)
	{
		x = 0;
		y = -speed;
		return [x, y];
	}

	if(direction === 90)
	{
		x = speed;
		y = 0;
		return [x, y];
	}

	if(direction === 180)
	{
		x = 0;
		y = speed;
		return [x, y];
	}

	if(direction === 270)
	{
		x = -speed;
		y = 0;
		return [x, y];
	}

	if(direction > 0 && direction < 90)
	{
		angle = to_radians(90 - direction);
		x = Math.cos(angle) * speed;
		y = - Math.sin(angle) * speed;
		return [x, y];
	}

	if(direction > 90 && direction < 180)
	{
		angle = to_radians(direction - 90);
		x = Math.cos(angle) * speed;
		y = Math.sin(angle) * speed;
		return [x, y];
	}

	if(direction >= 181 && direction <= 269)
	{
		angle = to_radians(270 - direction);
		x = - Math.cos(angle) * speed;
		y = Math.sin(angle) * speed;
		return [x, y];
	}

	if(direction > 270 && direction < 360)
	{
		angle = to_radians(direction - 270);
		x = - Math.cos(angle) * speed;
		y = - Math.sin(angle) * speed;
		return [x, y];
	}
}

function move_ship()
{
	var velocities = get_vector_velocities(ship, ship.speed);
	var vx = velocities[0];
	var vy = velocities[1];
	ship.x += vx;
	ship.y += vy;
	if(ship.x <= 0)
	{
		ship.x = bg_width;
		move_background(bg_width, background.regY);
	}
	else if(ship.x >= bg_width)
	{
		ship.x = 0;
		move_background(0, background.regY);
	}
	else if(ship.y <= 0)
	{
		ship.y = bg_height;
		move_background(background.regX, bg_height)
	}
	else if(ship.y >= bg_height)
	{
		ship.y = 0;
		move_background(background.regX, 0)
	}
	check_boundaries();
}

function check_boundaries()
{
	if(ship.y > (background.regY + background.canvas.height) - (y_offset))
	{
		move_background(background.regX, background.regY + ship.speed);
	}
	if(ship.y < (background.regY) + (y_offset - ship_height))
	{
		move_background(background.regX, background.regY - ship.speed);
	}
	if(ship.x > (background.regX + background.canvas.width) - (x_offset))
	{
		move_background(background.regX + ship.speed, background.regY);
	}
	if(ship.x < (background.regX + (x_offset - ship_width)))
	{
		move_background(background.regX - ship.speed, background.regY);
	}
}

function turn_left()
{
	ship_image.rotation -= 3;
}

function turn_right()
{
	ship_image.rotation += 3;
}
	
function loop()
{
	move();
	clockwork();
	emit_ship_info();
	background.update();
	setTimeout(loop, 1000 / 60);
}

function clockwork()
{
	if(Date.now() - clock >= 200)
	{
		if(up_arrow)
		{
			increase_ship_speed();
		}
		else
		{
			reduce_ship_speed();
		}
		update_minimap();
		clock = Date.now();
	}
}

function reduce_ship_speed()
{
	ship.speed -= 0.1;

	if(ship.speed < 0)
	{
		ship.speed = 0;
	}
}

function increase_ship_speed()
{
	if(ship.speed < 2)
	{
		ship.speed += 0.1;
	}
}

function fire_laser()
{
	if(!ship.visible)
	{
		return false;
	}

	if(Date.now() - last_fired < 300)
	{
		return false;
	}

	var laser_image = new createjs.Bitmap(laser_img);

	var laser = new createjs.Container();
	laser.x = ship.x;
	laser.y = ship.y;
	laser.distance = 0;

	var laser_width = laser_img.width;
	var laser_height = laser_img.height;

	laser_image.regX = laser_width / 2;
	laser_image.regY = laser_height / 2;
	laser_image.x = laser_width / 2;
	laser_image.y = laser_height / 2;
	laser_image.rotation = ship_image.rotation;

	laser.addChild(laser_image);
	background.addChild(laser);

	if(sound)
	{
		new Audio('/audio/laser.ogg').play();	
	}

	var velocities = get_vector_velocities(laser, 4);
	laser.vx = velocities[0];
	laser.vy = velocities[1];

	lasers.push(laser);

	last_fired = Date.now();

	emit_laser(laser);

}

function emit_laser(laser)
{
	socket.emit('laser', {x:laser.x, y:laser.y, rotation:laser.children[0].rotation, vx:laser.vx, vy:laser.vy});
}

function move_lasers()
{
	for(var i = 0; i < lasers.length; i++)
	{
		var laser;
		laser = lasers[i];

		if(laser.distance < 80)
		{
			laser.x += laser.vx;
			laser.y += laser.vy;
			laser.distance += 1;

			var enemy = check_enemy_collision(laser);
			if(enemy)
			{
				lasers.splice(i, 1);
				background.removeChild(laser);
			}
		}
		else
		{
			background.removeChild(laser);
		}
	}

	for(var i = 0; i < enemy_lasers.length; i++)
	{
		var enemy_laser = enemy_lasers[i];

		if(enemy_laser.distance < 80)
		{
			enemy_laser.x += enemy_laser.vx;
			enemy_laser.y += enemy_laser.vy;
			enemy_laser.distance += 1;

			if(check_ship_collision(enemy_laser))
			{
				ship_hit(enemy_laser);
				enemy_lasers.splice(i, 1);
				background.removeChild(enemy_laser);
			}
		}
		else
		{
			background.removeChild(enemy_laser);
		}
	}
}

function check_enemy_collision(laser)
{
	for(var i = 0; i < enemy_ships.length; i++)
	{
		var enemy = enemy_ships[i];
		var x1 = enemy.container.x - ship_width / 4;
		var x2 = enemy.container.x + ship_width / 4;
		var y1 = enemy.container.y - ship_height / 4;
		var y2 = enemy.container.y + ship_height / 4;
		if( (laser.x >= x1 && laser.x <= x2) && (laser.y >= y1 && laser.y <= y2) )
		{
			return enemy;
		}
	}
	return false;
}

function check_ship_collision(laser)
{
	var x1 = ship.x - ship_width / 4;
	var x2 = ship.x + ship_width / 4;
	var y1 = ship.y - ship_height / 4;
	var y2 = ship.y + ship_height / 4;
	if( (laser.x >= x1 && laser.x <= x2) && (laser.y >= y1 && laser.y <= y2) )
	{
		return true;
	}
	return false;
}

function ship_hit(laser)
{
	if(ship.visible)
	{
		ship.health -= 10;
		if(ship.health <= 0)
		{
			destroyed(laser);
		}
	}
}

function destroyed(laser)
{
	ship.visible = false;
	show_explosion(ship.x, ship.y);
	socket.emit('destroyed', {destroyed_by:laser.username});
	chat_announce(username + ' was destroyed by ' + laser.username);
	respawn();
}

function respawn()
{
	window.setTimeout(function()
	{
		
		var coords = get_random_coords();
		ship.x = coords[0];
		ship.y = coords[1];
		ship.health = 100;
		move_background(coords[0] - background.canvas.width / 2, coords[1] - background.canvas.height / 2);
		ship.visible = true;

	}, 5000)
}

function enemy_destroyed(data)
{
	var enemy = get_enemy_ship(data.username);
	show_explosion(enemy.container.x, enemy.container.y);
}

function show_explosion(x, y)
{
	var explosion_animation = new createjs.Sprite(explosion_sheet);
	explosion_animation.gotoAndPlay('explode');
	explosion_animation.name = 'explosion';
	explosion_animation.x = x - 33;
	explosion_animation.y = y - 30;
	explosion_animation.currentFrame = 0;
	background.addChild(explosion_animation);
	if(sound)
	{
		new Audio('/audio/explosion.ogg').play();
	}
}

function fire_enemy_laser(data)
{
	var laser_image = new createjs.Bitmap(laser_img);

	var laser = new createjs.Container();
	laser.x = data.x;
	laser.y = data.y;
	laser.distance = 0;
	laser.username = data.username;

	var laser_width = laser_img.width;
	var laser_height = laser_img.height;

	laser_image.regX = laser_width / 2;
	laser_image.regY = laser_height / 2;
	laser_image.x = laser_width / 2;
	laser_image.y = laser_height / 2;
	laser_image.rotation = data.rotation;

	laser.addChild(laser_image);
	background.addChild(laser);

	if(sound)
	{
		new Audio('/audio/laser.ogg').play();
	}

	laser.vx = data.vx;
	laser.vy = data.vy;

	enemy_lasers.push(laser);
}

function update_minimap()
{
	var minimap = document.getElementById('minimap');
	var context = minimap.getContext('2d');
	minimap.setAttribute('height', bg_height);
	minimap.setAttribute('width', bg_width);
	if(ship !== undefined && ship.visible)
	{
		var x = ship.x;
		var y = ship.y;
		var radius = 50;

		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.fillStyle = 'blue';
		context.fill();
		context.lineWidth = 10;
		context.strokeStyle = '#003300';
		context.stroke();
	}

	for(var i = 0; i < enemy_ships.length; i++)
	{
		var enemy = enemy_ships[i].container
		if(enemy.visible)
		{
			var x = enemy.x;
			var y = enemy.y;
			var radius = 50;

			context.beginPath();
			context.arc(x, y, radius, 0, 2 * Math.PI, false);
			context.fillStyle = 'red';
			context.fill();
			context.lineWidth = 10;
			context.strokeStyle = '#003300';
			context.stroke();
		}
	}
}

function check_yt(msg)
{
	var expr = /(youtu\.be\/|[?&]v=)([^&]+)/;
	var result = msg.match(expr);
	if(result)
	{
		$('#yt_player').attr('src', 'https://www.youtube.com/embed/' + result[2] + '?&autoplay=1&enablejsapi=1&version=3')
	}
}

function create_yt_player()
{
	yt_player = new YT.Player('yt_player');
}

function mute_yt()
{
	yt_player.mute();
}

function unmute_yt()
{
	yt_player.unMute();
}

function toggle_sound()
{
	if(sound)
	{
		$('#sound_toggle').html('turn on sound');
		try 
		{
			yt_player.mute();
		}
		catch(err){}
		sound = false;
	}
	else
	{
		$('#sound_toggle').html('turn off sound');
		try
		{
			yt_player.unMute();
		}
		catch(err){}
		sound = true;
	}
}