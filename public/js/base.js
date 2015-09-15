var username;
var socket;
var userlist;
var canvas;
var context;
var background;
var nave;
var bg_height = 2000;
var bg_width = 2000;
var left_arrow = false;
var right_arrow = false;
var up_arrow = false;
var down_arrow = false;
var x_offset;
var y_offset;
var ship_width;
var ship_height;
var clock;
var lasers = [];
var enemy_lasers = [];
var last_fired = Date.now();
var enemy_ships = [];
var explosion_image;
var laser_img;
var laser_width;
var laser_height;
var label;
var yt_player;
var sound = true;
var music = true;
var images = [];
var in_safe_zone;
var safe_zone_radius;
var min_max_health = 100;
var min_max_speed = 2;
var min_laser_level = 1;
var max_max_health = 200;
var max_max_speed = 3;
var max_laser_level = 10;
var laser_hit = 20;

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
	laser_img.onload = function()
	{
		laser_width = laser_img.width;
		laser_height = laser_img.height;
	}

	var keep_naming = true;
	while(keep_naming)
	{
		username = clean_string(prompt('pick your name'));
		if(username === null || username.length < 1 || username.length > 12 || username.indexOf('<') !== -1)
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
	socket = io('http://armtrak.net:3000');

	socket.on('update', function(data) 
	{
		if(data.type === 'chat_msg')
		{
			update_chat(data.username, data.msg)
		}
		if(data.type === 'username')
		{
			username = data.username;
			chat_announce(data.username + ' has joined');	
			chat_announce('you move with the arrow keys and shoot with spacebar');	
			chat_announce('you can place an image on the map (visible to everyone) by pasting an image url');	
			chat_announce('you can play a youtube song (for everyone) by searching it with "yt name of song"');	
			chat_announce('you upgrade your ship by destroying other players');	
			label.text = space_word(username);
			start_heartbeat();
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
			if(data.username !== username)
			{
				enemy_destroyed(data);
			}

			var kills = '';
			if(data.kills > 1)
			{
				kills = '<br>(' + data.kills + ' kills in a row)';
			}

			chat_announce(data.destroyed_by + ' destroyed ' + data.username + kills);
		}
		if(data.type === 'images')
		{
			place_images(data.images);
		}
		if(data.type === 'connection_lost')
		{
			window.location = '/';
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
    this.container;
}

function update_enemy_ship(data)
{
	var enemy = get_enemy_ship_or_create(data);
	if(enemy)
	{
		enemy.container.x = data.x;
		enemy.container.y = data.y;
		enemy.container.visible = data.visible;
		if(enemy.container.model !== data.model)
		{
			var image = new Image();
			image.src = 'img/nave' + data.model + '.png';
			enemy.container.children[0].image = image;
		}
		enemy.container.model = data.model;
		enemy.container.model = data.model;
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
		create_enemy_ship(enemy, data.x, data.y, data.model);
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

		$('#chat_input').focus();

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

		if(code === 32)
		{
			if($('#chat_input').val() === '')
			{
				fire_laser();
				e.preventDefault();
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
	check_yt(msg);
}

function chat_announce(msg)
{
	var fmt = format_announcement_msg(msg)
	$('#chat_area').append(fmt);
	goto_bottom();
}

function clean_string(s)
{
	return s.replace(/</g, '').trim().replace(/\s+/g, ' ');
}

function format_msg(uname, msg)
{
	return "<div class='chat_message'><b>" + uname + ':</b>&nbsp;&nbsp;'
			+ chat_urlize(clean_string(msg)) + "</div><div>&nbsp;</div>";
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

function msg_is_ok(msg)
{
	if(msg.length > 0 && msg.length < 444)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function send_to_chat()
{
	msg = clean_string($('#chat_input').val());
	if(msg_is_ok(msg))
	{
		update_chat(username, msg);
		check_image(msg);
		socket.emit('sendchat', {msg:msg});
	}
	$('#chat_input').val('');
}

function goto_bottom()
{
	$("#chat_area").scrollTop($("#chat_area")[0].scrollHeight);
}

function start_chat()
{
	$('#chat_area').append('<div class="clear">&nbsp;</div>');
	$('#chat_input').focus();
	goto_bottom();
}

function start_game()
{
    create_background();
    show_safe_zone();
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
	var label = new createjs.Text(space_word(username), '8px Arial', '#ffffff');
	label.textAlign = 'center';
	label.shadow = new createjs.Shadow("#000000", 0, 0, 5);
	return label;
}

function create_ship()
{
	var image = new Image();
	var num = get_random_int(1, 15);
	image.src = 'img/nave' + num + '.png';
	ship_image = new createjs.Bitmap(image);
	ship = new createjs.Container();
	var coords = get_random_coords();
	ship.x = coords[0];
	ship.y = coords[1];
	ship.speed = 0;
	ship.max_health = min_max_health;
	ship.health = ship.max_health;
	ship.max_speed = min_max_speed;
	ship.laser_level = min_laser_level;
	ship.model = num;

	ship.addChild(ship_image);

	label = create_label(username);
	ship.addChild(label);

	background.addChild(ship);
	z_order();

	image.onload = function() 
	{
		ship_width = image.width;
		ship_height = image.height;

		move_background(coords[0] - (background.canvas.width / 2) + (ship_width / 2), coords[1] - (background.canvas.height / 2) + (ship_height / 2));

		ship_image.regX = ship_width / 2;
		ship_image.regY = ship_height / 2;
		ship_image.x = ship_width / 2;
		ship_image.y = ship_height / 2;

		label.x = ship_width / 2;
		label.y = ship_height;

		socket.emit('get_images', {});
	}
}

function create_enemy_ship(enemy, x, y, model)
{
	var image = new Image();
	image.src = 'img/nave' + model + '.png';
	var enemy_image = new createjs.Bitmap(image);
	var enemy_ship = new createjs.Container();
	enemy_ship.x = x;
	enemy_ship.y = y;
	enemy_ship.model = model;

	enemy_ship.addChild(enemy_image);

	var label = create_label(enemy.username)
	enemy_ship.addChild(label);

	background.addChild(enemy_ship);
	enemy.container = enemy_ship;
	z_order();

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
	socket.emit('ship_info', {x:ship.x, y:ship.y, rotation:ship_image.rotation, visible:ship.visible, model:ship.model});
}

function get_random_int(min, max)
{
    return Math.floor(Math.random() * (max-min+1) + min);
}

function get_random_coords()
{
	var x = get_random_int(10, bg_width - 10);
	var y = get_random_int(10, bg_height - 10);
	return [x, y];
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

	background.canvas.width = 400;
	background.canvas.height = 300;

	x_offset = background.canvas.width * 0.2;
	y_offset = background.canvas.height * 0.2;

	background.regX = 0;
	background.regY = 0;

	background.addChild(starField);
}

function show_safe_zone()
{
	var image = new Image();
	image.src = "img/safe_zone.png";
	safe_zone = new createjs.Bitmap(image);
	background.addChild(safe_zone);
	image.onload = function() 
	{
		safe_zone.x = (bg_width / 2) - (image.width / 2);
		safe_zone.y = (bg_height / 2) - (image.height / 2);
		safe_zone_radius = image.height / 2;
	}
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
		move_background(ship.x - (background.canvas.width / 2) + (ship_width / 2), background.regY);
	}
	else if(ship.x >= bg_width)
	{
		ship.x = 0;
		move_background(ship.x - (background.canvas.width / 2) + (ship_width / 2), background.regY);
	}
	else if(ship.y <= 0)
	{
		ship.y = bg_height;
		move_background(background.regX, ship.y - (background.canvas.height / 2) + (ship_height / 2));
	}
	else if(ship.y >= bg_height)
	{
		ship.y = 0;
		move_background(background.regX, ship.y - (background.canvas.height / 2) + (ship_height / 2));
	}
	else
	{
		move_background(background.regX + vx, background.regY + vy);
	}

	check_safe_zone();
}

function check_safe_zone()
{
	if((Math.pow(((ship.x + (ship_width / 2)) - bg_width / 2), 2) + Math.pow(((ship.y + (ship_height / 2)) - bg_height / 2), 2)) < Math.pow(safe_zone_radius, 2))
	{
		in_safe_zone = true;
	}
	else
	{
		in_safe_zone = false;
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
	ship.speed -= 0.2;

	if(ship.speed < 0)
	{
		ship.speed = 0;
	}
}

function increase_ship_speed()
{
	if(ship.speed < ship.max_speed)
	{
		ship.speed += ship.max_speed * 0.10;
	}
}

function create_laser(x, y, rotation, speed, max_distance)
{
	var laser_image = new createjs.Bitmap(laser_img);

	var laser = new createjs.Container();
	laser.x = x;
	laser.y = y;
	laser.distance = 0;

	var laser_width = laser_img.width;
	var laser_height = laser_img.height;

	laser_image.regX = laser_width / 2;
	laser_image.regY = laser_height / 2;
	laser_image.x = laser_width / 2;
	laser_image.y = laser_height / 2;
	laser_image.rotation = rotation;

	laser.addChild(laser_image);
	background.addChild(laser);


	var velocities = get_vector_velocities(laser, speed);
	laser.vx = velocities[0];
	laser.vy = velocities[1];

	laser.max_distance = max_distance;

	lasers.push(laser);
	return laser;
}

function fire_laser()
{
	if(!ship.visible || in_safe_zone)
	{
		return false;
	}

	if(Date.now() - last_fired < 300)
	{
		return false;
	}

	var lasers_to_fire = [];

	if(ship.laser_level === 1)
	{
		lasers_to_fire.push(create_laser(ship.x, ship.y, ship_image.rotation, 4, 100));
	}

	if(ship.laser_level === 2)
	{
		lasers_to_fire.push(create_laser(ship.x, ship.y, ship_image.rotation, 4.1, 105));
	}

	if(ship.laser_level === 3)	
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110));
	}

	if(ship.laser_level === 4)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110));
	}

	if(ship.laser_level === 5)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115));
	}

	if(ship.laser_level === 6)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.4, 115));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.4, 115));
	}

	if(ship.laser_level === 7)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.5, 120));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.5, 120));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.5, 120));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.5, 120));
	}

	if(ship.laser_level === 8)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.7, 125));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.7, 125));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.7, 125));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.7, 125));
	}

	if(ship.laser_level === 9)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.8, 130));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.8, 130));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.8, 130));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.8, 130));
	}

	if(ship.laser_level === 10)
	{
		var d = get_direction(ship);
		d = to_radians(d);
		var x = (ship_width / 2 * 0.6) * Math.cos(d);
		var y = (ship_width / 2 * 0.6) * Math.sin(d);

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 5, 140));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 5, 140));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 5, 140));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 5, 140));
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 30, 5, 140));
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 30, 5, 140));
	}

	if(sound)
	{
		new Audio('/audio/laser.ogg').play();	
	}

	last_fired = Date.now();

	emit_laser(lasers_to_fire);
}

function emit_laser(lasers)
{
	var laser = [];
	for(var i = 0; i < lasers.length; i++)
	{
		laser.push({username:username, x:lasers[i].x, y:lasers[i].y, rotation:lasers[i].children[0].rotation, vx:lasers[i].vx, vy:lasers[i].vy, max_distance:lasers[i].max_distance})
	}
	socket.emit('laser', {laser:laser});
}

function create_enemy_laser(enemy_laser)
{
	var laser_image = new createjs.Bitmap(laser_img);

	var laser = new createjs.Container();
	laser.x = enemy_laser.x;
	laser.y = enemy_laser.y;
	laser.distance = 0;
	laser.max_distance = enemy_laser.max_distance;
	laser.username = enemy_laser.username;

	var laser_width = laser_img.width;
	var laser_height = laser_img.height;

	laser_image.regX = laser_width / 2;
	laser_image.regY = laser_height / 2;
	laser_image.x = laser_width / 2;
	laser_image.y = laser_height / 2;
	laser_image.rotation = enemy_laser.rotation;

	laser.addChild(laser_image);
	background.addChild(laser);

	laser.vx = enemy_laser.vx;
	laser.vy = enemy_laser.vy;

	enemy_lasers.push(laser);
}

function fire_enemy_laser(data)
{
	for(var i = 0; i < data.laser.laser.length; i++)
	{
		create_enemy_laser(data.laser.laser[i]);
	}

	if(sound)
	{
		new Audio('/audio/laser.ogg').play();
	}

}

function move_lasers()
{
	for(var i = 0; i < lasers.length; i++)
	{
		var laser;
		laser = lasers[i];

		if(laser.distance < laser.max_distance)
		{
			laser.x += laser.vx;
			laser.y += laser.vy;
			laser.distance += 1;

			if(laser.x <= 0)
			{
				laser.x = bg_width;
			}
			else if(laser.x >= bg_width)
			{
				laser.x = 0;
			}
			else if(laser.y <= 0)
			{
				laser.y = bg_height;
			}
			else if(laser.y >= bg_height)
			{
				laser.y = 0;
			}

			var enemy = check_enemy_collision(laser);
			if(enemy)
			{
				lasers.splice(i, 1);
				i -= 1;
				background.removeChild(laser);
			}
			else if((Math.pow(((laser.x + (laser_width / 2)) - bg_width / 2), 2) + Math.pow(((laser.y + (laser_height / 2)) - bg_height / 2), 2)) < Math.pow(safe_zone_radius, 2))
			{
				lasers.splice(i, 1);
				i -= 1;
				background.removeChild(laser);
			}
		}
		else
		{
			lasers.splice(i, 1);
			i -= 1;
			background.removeChild(laser);
		}
	}

	for(var i = 0; i < enemy_lasers.length; i++)
	{
		var enemy_laser = enemy_lasers[i];

		if(enemy_laser.distance < enemy_laser.max_distance)
		{
			enemy_laser.x += enemy_laser.vx;
			enemy_laser.y += enemy_laser.vy;
			enemy_laser.distance += 1;

			if(enemy_laser.x <= 0)
			{
				enemy_laser.x = bg_width;
			}
			else if(enemy_laser.x >= bg_width)
			{
				enemy_laser.x = 0;
			}
			else if(enemy_laser.y <= 0)
			{
				enemy_laser.y = bg_height;
			}
			else if(enemy_laser.y >= bg_height)
			{
				enemy_laser.y = 0;
			}

			if((Math.pow(((enemy_laser.x + (laser_width / 2)) - bg_width / 2), 2) + Math.pow(((enemy_laser.y + (laser_height / 2)) - bg_height / 2), 2)) < Math.pow(safe_zone_radius, 2))
			{
				enemy_lasers.splice(i, 1);
				i -= 1;
				background.removeChild(enemy_laser);
			}
			else if(check_ship_collision(enemy_laser))
			{
				ship_hit(enemy_laser);
				enemy_lasers.splice(i, 1);
				i -= 1;
				background.removeChild(enemy_laser);
			}
		}
		else
		{
			enemy_lasers.splice(i, 1);
			i -= 1;
			background.removeChild(enemy_laser);
		}
	}
}

function check_enemy_collision(laser)
{
	for(var i = 0; i < enemy_ships.length; i++)
	{
		var enemy = enemy_ships[i];
		if(enemy.container.visible)
		{
			var x1 = enemy.container.x - ship_width / 4;
			var x2 = enemy.container.x + ship_width / 4;
			var y1 = enemy.container.y - ship_height / 4;
			var y2 = enemy.container.y + ship_height / 4;
			if( (laser.x >= x1 && laser.x <= x2) && (laser.y >= y1 && laser.y <= y2) )
			{
				return enemy;
			}
		}
	}
	return false;
}

function check_ship_collision(laser)
{
	if(ship.visible)
	{
		var x1 = ship.x - ship_width / 4;
		var x2 = ship.x + ship_width / 4;
		var y1 = ship.y - ship_height / 4;
		var y2 = ship.y + ship_height / 4;
		if( (laser.x >= x1 && laser.x <= x2) && (laser.y >= y1 && laser.y <= y2) )
		{
			return true;
		}
	}
	return false;
}

function ship_hit(laser)
{
	if(ship.visible)
	{
		ship.health -= laser_hit;
		update_hud();
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
	var image = new Image();
	var num = get_random_int(1, 15);
	image.src = 'img/nave' + num + '.png';
	ship_image.image = image;
	ship.model = num;
	respawn();
}

function enemy_destroyed(data)
{
	if(data.destroyed_by === username)
	{
		upgrade();
		ship.health += laser_hit;
		if(ship.health > ship.max_health)
		{
			ship.health = ship.max_health;
		}
		update_hud();
	}
	var enemy = get_enemy_ship(data.username);
	show_explosion(enemy.container.x, enemy.container.y);
}

function respawn()
{
	window.setTimeout(function()
	{
		
		var coords = get_random_coords();
		ship.x = coords[0];
		ship.y = coords[1];
		ship.max_health = min_max_health;
		ship.health = ship.max_health;
		ship.max_speed = min_max_speed;
		ship.laser_level = min_laser_level;
		move_background(coords[0] - background.canvas.width / 2, coords[1] - background.canvas.height / 2);
		ship.visible = true;
		update_hud();

	}, 5000)
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

function play_yt(id)
{
	if(music)
	{
		$('#yt_player').attr('src', 'https://www.youtube.com/embed/' + id + '?&autoplay=1&enablejsapi=1&version=3')
	}
}

function check_yt(msg)
{
	if(msg.lastIndexOf('yt ', 0) === 0)
	{
		var q = msg.substring(3);
		if(q !== '')
		{
			yt_search(q);
		}
	}
	else
	{
		var expr = /(youtu\.be\/|[?&]v=)([^&]+)/;
		var result = msg.match(expr);
		if(result)
		{
			play_yt(result[2]);
		}
	}
}

function toggle_sound()
{
	if(sound)
	{
		$('#sound_toggle').html('turn on sound');
		sound = false;
	}
	else
	{
		$('#sound_toggle').html('turn off sound');
		sound = true;
	}
}

function toggle_music()
{
	if(music)
	{
		$('#music_toggle').html('turn on music');
		$('#yt_player').attr('src', '');
		music = false;
	}
	else
	{
		$('#music_toggle').html('turn off music');
		music = true;
	}
}

function yt_search(q)
{
    var request = gapi.client.youtube.search.list(
    {
        part: 'snippet',
        type: 'video',
        q: q
    });

    request.execute(function(response) 
    {
    	var id = response.items[0].id.videoId;
	    if(id)
	    {
	    	play_yt(id);
	    }
    }); 
}

googleApiClientReady = function() 
{
	gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}

function onYouTubeApiLoad() 
{
    gapi.client.setApiKey('AIzaSyA-a83G6NwZS_ZXpQoLeo8viScd_TfOcFk');
}

function check_image(msg)
{
	if(msg.indexOf(' ') === -1)
	{
		if(msg.indexOf('.jpg') !== -1 || msg.indexOf('.png') !== -1 || msg.indexOf('.jpeg') !== -1 || msg.indexOf('.JPG') !== -1 || msg.indexOf('.PNG') !== -1 || msg.indexOf('.JPEG') !== -1)
		{
			for(var i = 0; i < images.length; i++)
			{
				if(images[i].image.src === msg)
				{
					return false;
				}
			}
			var img = new Image();
			img.src = msg;

			img.onload = function() 
			{
				var image = new createjs.Bitmap(img);
				image.x = ship.x - ((img.width / 3) / 2) + (ship_width / 2);
				image.y = ship.y - ((img.height / 3) / 2) + (ship_height / 2);
				image.scaleX = 0.333;
				image.scaleY = 0.333;
				background.addChild(image);
				z_order();
				push_image(image);
				socket.emit('image', {url:msg, x:image.x, y:image.y});
			}
		}
	}
}

function place_images(imgs)
{
	for(var i = 0; i < imgs.length; i++)
	{
		var img = new Image();
		img.src = imgs[i].url;
		var image = new createjs.Bitmap(img);
		image.x = imgs[i].x;
		image.y = imgs[i].y;
		image.scaleX = 0.333;
		image.scaleY = 0.333;
		background.addChild(image);
		z_order();
		push_image(image);
	}
}

function push_image(image)
{
	images.push(image);
	if(images.length > 20)
	{
		background.removeChild(images[0]);
		images.splice(0, 1);
	}
}

function z_order()
{
	background.setChildIndex(safe_zone, background.getNumChildren() - 1);
	
	for(var i = 0; i < enemy_ships.length; i++)
	{
		background.setChildIndex(enemy_ships[i].container, background.getNumChildren() - 1);
	}

	background.setChildIndex(ship, background.getNumChildren() - 1);
}

function start_heartbeat()
{
	setInterval(function()
	{
		socket.emit('heartbeat', {});

	}, 10000);
}

function upgrade()
{
	var nums = [];

	if(ship.laser_level < max_laser_level)
	{
		nums.push(1);
	}

	if(ship.max_health < max_max_health)
	{
		nums.push(2);
	}

	if(ship.max_speed < max_max_speed)
	{
		nums.push(3);
	}

	if(nums.length === 0)
	{
		return false;
	}

	var num = nums.sort(function(){return 0.5 - Math.random()})[0];

	if(num === 1)
	{
		increase_laser_level();
		return true;
	}

	if(num === 2)
	{
		increase_max_health();
		return true;
	}

	if(num === 3)
	{
		increase_max_speed();
		return true;
	}
}

function increase_laser_level()
{
	ship.laser_level += 1;
}

function increase_max_health()
{
	ship.max_health += 10;
}

function increase_max_speed()
{
	ship.max_speed += 0.10;
}

function update_hud()
{
	$('#health').html('health: ' + ship.health + '/' + ship.max_health);
	$('#max_speed').html('max speed: ' + (Math.round((ship.max_speed - 1) * 10) / 10));
	$('#laser_level').html('laser level: ' + ship.laser_level);
}