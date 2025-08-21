const App = {}

App.bg_height = 2000
App.bg_width = 2000
App.left_arrow = false
App.right_arrow = false
App.up_arrow = false
App.down_arrow = false
App.lasers = []
App.enemy_lasers = []
App.last_fired = Date.now()
App.enemy_ships = []
App.sound = true
App.music = true
App.images = []
App.min_max_health = 100
App.min_max_speed = 2
App.min_laser_level = 1
App.max_max_health = 200
App.max_max_speed = 3
App.App.max_laser_level = 10
App.laser_hit = 20

App.init = () => {
	App.explosion_image = new Image()
	App.explosion_image.src = `/img/explosion.png`

	App.explosion_image.onload = () => {
		explosion_sheet = new createjs.SpriteSheet({
			images: [App.explosion_image],
			frames: {width: 96, height: 96, regX: 0, regY: 0},
			animations: {
				explode: [0, 71, false]
			},
		})
	}

	App.laser_img = new Image()
	App.laser_img.src = `img/laser.png`

	App.laser_img.onload = () => {
		App.laser_width = App.laser_img.width
		App.laser_height = App.laser_img.height
	}

	let keep_naming = true

	while(keep_naming) {
		App.username = clean_string(prompt(`pick your name`))
		if (App.username === null || App.username.length < 1 || App.username.length > 12 || App.username.indexOf(`<`) !== -1) {
			keep_naming = true
		}
		else {
			keep_naming = false
		}
	}

	start_chat()
	start_socket()
	activate_key_detection()
	start_game()
}

function start_socket() {
	App.socket = io() // Connects to same origin by default
	// Or if you need to specify the server:
	// socket = io(`http://armtrak.net:3000`)

	App.socket.on(`update`, (data) => {
		if (data.type === `chat_msg`) {
			update_chat(data.username, data.msg)
		}

		if (data.type === `username`) {
			App.username = data.username
			chat_announce(data.username + ` has joined`)
			chat_announce(`you move with the arrow keys and shoot with spacebar`)
			chat_announce(`you can place an image on the map (visible to everyone) by pasting an image url or with "img something"`)
			chat_announce(`you can play a youtube song (for everyone) by searching it with "yt name of song", or pasting a youtube url`)
			chat_announce(`you upgrade your ship by destroying other players`)
			label.text = space_word(App.username)
			start_heartbeat()
		}

		if (data.type === `youtube_result`) {
			play_yt(data.videoId)
			chat_announce(`Now playing: ` + data.title + ` (requested by ` + data.requestedBy + `)`)
		}

		if (data.type === `youtube_error`) {
			chat_announce(`YouTube search failed: ` + data.message)
		}

		if (data.type === `image_result`) {
			place_search_image(data.imageUrl, data.title)
			chat_announce(`Image found: ` + data.title + ` (requested by ` + data.requestedBy + `)`)
		}

		if (data.type === `image_error`) {
			chat_announce(`Image search failed: ` + data.message)
		}

		if (data.type === `chat_announcement`) {
			chat_announce(data.msg)
		}

		if (data.type === `ship_info`) {
			update_enemy_ship(data)
		}

		if (data.type === `laser`) {
			fire_enemy_laser(data)
		}

		if (data.type === `destroyed`) {
			if (data.username !== App.username) {
				enemy_destroyed(data)
			}

			let kills = ``

			if (data.kills > 1) {
				kills = `<br>(` + data.kills + ` kills in a row)`
			}

			chat_announce(data.destroyed_by + ` destroyed ` + data.username + kills)
		}

		if (data.type === `images`) {
			place_images(data.images)
		}

		if (data.type === `connection_lost`) {
			window.location = `/`
		}

		if (data.type === `disconnection`) {
			chat_announce(data.username + ` has left`)
			remove_enemy(data.username)
		}
	})

	App.socket.emit(`adduser`, {username:App.username})
}

function EnemyShip() {
    this.username
    this.container
}

function update_enemy_ship(data) {
	let enemy = get_enemy_ship_or_create(data)

	if (enemy) {
		enemy.container.x = data.x
		enemy.container.y = data.y
		enemy.container.visible = data.visible

		if (enemy.container.model !== data.model) {
			let image = new Image()
			image.src = `img/nave` + data.model + `.png`
			enemy.container.children[0].image = image
		}

		enemy.container.model = data.model
		enemy.container.model = data.model
		enemy.container.children[0].rotation = data.rotation
	}
}

function get_enemy_ship_or_create(data) {
	let enemy = get_enemy_ship(data.username)

	if (!enemy) {
		enemy = new EnemyShip()
		enemy.username = data.username
		App.enemy_ships.push(enemy)
		create_enemy_ship(enemy, data.x, data.y, data.model)
	}

	return enemy
}

function get_enemy_ship(uname) {
	for(let i = 0; i < App.enemy_ships.length; i++) {
		if (App.enemy_ships[i].username === uname) {
			return App.enemy_ships[i]
		}
	}

	return false
}

function remove_enemy(uname) {
	for(let i = 0; i < App.enemy_ships.length; i++) {
		if (App.enemy_ships[i].username === uname) {
			App.background.removeChild(App.enemy_ships[i].container)
			App.enemy_ships.splice(i, 1)
		}
	}
}

function activate_key_detection() {
	$(`#canvas`).click(function() {
		$(`#chat_input`).blur()
	})

	$(document).keydown(function(e) {
		code = (e.keyCode ? e.keyCode : e.which)
		$(`#chat_input`).focus()

		if (code == 13) {
			send_to_chat()
			e.preventDefault()
			return false
		}

		if (code === 37) {
			App.left_arrow = true
		}

		if (code === 38) {
			App.up_arrow = true
		}

		if (code === 39) {
			App.right_arrow = true
		}

		if (code === 40) {
			App.down_arrow = true
		}

		if (code === 32) {
			if ($(`#chat_input`).val() === ``) {
				fire_laser()
				e.preventDefault()
			}
		}

	})

	$(document).keyup(function(e) {
		code = (e.keyCode ? e.keyCode : e.which)

		if (code === 37) {
			App.left_arrow = false
		}

		if (code === 38) {
			App.up_arrow = false
		}

		if (code === 39) {
			App.right_arrow = false
		}

		if (code === 40) {
			App.down_arrow = false
		}
	})
}

function clear_arrows() {
	App.left_arrow, App.right_arrow, App.up_arrow, App.down_arrow = false
}

function update_chat(uname, msg) {
	let fmt = format_msg(uname, msg)
	$(`#chat_area`).append(fmt)
	goto_bottom()
}

function chat_announce(msg) {
	let fmt = format_announcement_msg(msg)
	$(`#chat_area`).append(fmt)
	goto_bottom()
}

function clean_string(s) {
	return s.replace(/</g, ``).trim().replace(/\s+/g, ` `)
}

function format_msg(uname, msg) {
	let s = chat_urlize(clean_string(msg))
	return `<div class="chat_message"><b>${uname}:</b>&nbsp;&nbsp;${s}</div><div>&nbsp;</div>`
}

function format_announcement_msg(msg) {
	return `<div class="chat_announcement">${msg}</div> <div>&nbsp;</div>`
}

function chat_urlize(msg) {
	return msg.replace(/[^\s"\\]+\.\w{2,}[^\s"\\]*/g, `<a class="chat" target="_blank" href="$&"> $& </a>`)
}

function msg_is_ok(msg) {
	if (msg.length > 0 && msg.length < 444) {
		return true
	}
	else {
		return false
	}
}

function send_to_chat() {
	msg = clean_string($(`#chat_input`).val())

	if (check_yt(msg)) {
		return
	}

	if (check_img(msg)) {
		return
	}

	if (msg_is_ok(msg)) {
		update_chat(App.username, msg)
		check_image(msg)
		App.socket.emit(`sendchat`, {msg:msg})
	}

	$(`#chat_input`).val(``)
}

function goto_bottom() {
	$(`#chat_area`).scrollTop($(`#chat_area`)[0].scrollHeight)
}

function start_chat() {
	$(`#chat_area`).append(`<div class="clear">&nbsp;</div>`)
	$(`#chat_input`).focus()
	goto_bottom()
}

function start_game() {
    create_background()
    show_safe_zone()
    create_ship()
    App.clock = Date.now()
    loop()
}

function space_word(word) {
	let s = ``

	for(let i = 0; i < word.length; i++) {
		s += word[i] + ` `
	}

	return s
}

function create_label(username) {
	let label = new createjs.Text(space_word(username), `8px Arial`, `#ffffff`)
	label.textAlign = `center`
	label.shadow = new createjs.Shadow(`#000000`, 0, 0, 5)
	return label
}

function create_ship() {
	let image = new Image()
	let num = get_random_int(1, 15)
	image.src = `img/nave` + num + `.png`
	ship_image = new createjs.Bitmap(image)
	ship = new createjs.Container()
	let coords = get_random_coords()
	ship.x = coords[0]
	ship.y = coords[1]
	ship.speed = 0
	ship.max_health = App.min_max_health
	ship.health = ship.max_health
	ship.max_speed = App.min_max_speed
	ship.laser_level = App.min_laser_level
	ship.model = num

	ship.addChild(ship_image)

	let label = create_label(App.username)
	ship.addChild(label)

	App.background.addChild(ship)
	z_order()

	image.onload = function() {
		App.ship_width = image.width
		App.ship_height = image.height

		move_background(coords[0] - (App.background.canvas.width / 2) + (App.ship_width / 2), coords[1] - (App.background.canvas.height / 2) + (App.ship_height / 2))

		ship_image.regX = App.ship_width / 2
		ship_image.regY = App.ship_height / 2
		ship_image.x = App.ship_width / 2
		ship_image.y = App.ship_height / 2

		label.x = App.ship_width / 2
		label.y = App.ship_height

		App.socket.emit(`get_images`, {})
	}
}

function create_enemy_ship(enemy, x, y, model) {
	let image = new Image()
	image.src = `img/nave` + model + `.png`
	let enemy_image = new createjs.Bitmap(image)
	let enemy_ship = new createjs.Container()
	enemy_ship.x = x
	enemy_ship.y = y
	enemy_ship.model = model

	enemy_ship.addChild(enemy_image)

	let label = create_label(enemy.username)
	enemy_ship.addChild(label)

	App.background.addChild(enemy_ship)
	enemy.container = enemy_ship
	z_order()

	image.onload = function() {
		enemy_image.regX = App.ship_width / 2
		enemy_image.regY = App.ship_height / 2
		enemy_image.x = App.ship_width / 2
		enemy_image.y = App.ship_height / 2
		label.x = App.ship_width / 2
		label.y = App.ship_height
	}
}

function emit_ship_info() {
	App.socket.emit(`ship_info`, {x:ship.x, y:ship.y, rotation:ship_image.rotation, visible:ship.visible, model:ship.model})
}

function get_random_int(min, max) {
    return Math.floor(Math.random() * (max-min+1) + min)
}

function get_random_coords() {
	let x = get_random_int(10, App.bg_width - 10)
	let y = get_random_int(10, App.bg_height - 10)
	return [x, y]
}

function create_background() {
	App.background = new createjs.Stage(`canvas`)

	let stars = 3000
	let starField = new createjs.Shape()

	let starSmallRadiusMin = 1
	let starSmallRadiusVarience = 2

	for (let i = 0; i < stars; i++) {
	    let radius
	    radius = starSmallRadiusMin + (Math.random() * starSmallRadiusVarience)
	    let colour, colourType = Math.round(Math.random() * 2)

	    switch (colourType) {
	        case 0:
						colour = `white`
						break
	        case 1:
						colour = `grey`
						break
	    }

	    starField.graphics.beginFill(colour)

	    .drawPolyStar(
	        Math.random() * App.bg_width,
	        Math.random() * App.bg_height,
	        radius,
	        5 + Math.round(Math.random() * 2), // number of sides
	        0.9, // pointyness
	        Math.random() * 360 // rotation of the star
	    )
	}

	App.background.canvas.width = 400
	App.background.canvas.height = 300

	App.x_offset = App.background.canvas.width * 0.2
	App.y_offset = App.background.canvas.height * 0.2

	App.background.regX = 0
	App.background.regY = 0

	App.background.addChild(starField)
}

function show_safe_zone() {
	let image = new Image()
	image.src = `img/safe_zone.png`
	safe_zone = new createjs.Bitmap(image)
	App.background.addChild(safe_zone)

	image.onload = function() {
		safe_zone.x = (App.bg_width / 2) - (image.width / 2)
		safe_zone.y = (App.bg_height / 2) - (image.height / 2)
		App.safe_zone_radius = image.height / 2
	}
}

function move() {
	if (ship.visible) {
		move_ship()
	}

	move_lasers()

	if (App.left_arrow) {
		turn_left()
		return true
	}

	if (App.right_arrow) {
		turn_right()
		return true
	}

	clear_arrows()
}

function move_background(x, y) {
	App.background.regX = x
	App.background.regY = y
}

function get_direction(container) {
	let direction = ((container.children[0].rotation / 360) % 1) * 360

	if (direction < 0) {
		direction = 360 - Math.abs(direction)
	}

	if (direction >= 360) {
		direction = 0
	}

	return direction
}

function to_radians(degrees) {
	return degrees * (Math.PI / 180)
}

function get_vector_velocities(container, speed) {
	let direction = get_direction(container)
	let angle
	let x, y

	if (direction === 0) {
		x = 0
		y = -speed
		return [x, y]
	}

	if (direction === 90) {
		x = speed
		y = 0
		return [x, y]
	}

	if (direction === 180) {
		x = 0
		y = speed
		return [x, y]
	}

	if (direction === 270) {
		x = -speed
		y = 0
		return [x, y]
	}

	if (direction > 0 && direction < 90) {
		angle = to_radians(90 - direction)
		x = Math.cos(angle) * speed
		y = - Math.sin(angle) * speed
		return [x, y]
	}

	if (direction > 90 && direction < 180) {
		angle = to_radians(direction - 90)
		x = Math.cos(angle) * speed
		y = Math.sin(angle) * speed
		return [x, y]
	}

	if (direction >= 181 && direction <= 269) {
		angle = to_radians(270 - direction)
		x = - Math.cos(angle) * speed
		y = Math.sin(angle) * speed
		return [x, y]
	}

	if (direction > 270 && direction < 360) {
		angle = to_radians(direction - 270)
		x = - Math.cos(angle) * speed
		y = - Math.sin(angle) * speed
		return [x, y]
	}
}

function move_ship() {
	let velocities = get_vector_velocities(ship, ship.speed)
	let vx = velocities[0]
	let vy = velocities[1]

	ship.x += vx
	ship.y += vy

	if (ship.x <= 0) {
		ship.x = App.bg_width
		move_background(ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
	}
	else if (ship.x >= App.bg_width) {
		ship.x = 0
		move_background(ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
	}
	else if (ship.y <= 0) {
		ship.y = App.bg_height
		move_background(App.background.regX, ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
	}
	else if (ship.y >= App.bg_height) {
		ship.y = 0
		move_background(App.background.regX, ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
	}
	else {
		move_background(App.background.regX + vx, App.background.regY + vy)
	}

	check_safe_zone()
}

function check_safe_zone() {
	if ((Math.pow(((ship.x + (App.ship_width / 2)) - App.bg_width / 2), 2) + Math.pow(((ship.y + (App.ship_height / 2)) - App.bg_height / 2), 2)) < Math.pow(App.safe_zone_radius, 2)) {
		App.in_safe_zone = true
	}
	else {
		App.in_safe_zone = false
	}
}

function turn_left() {
	ship_image.rotation -= 3
}

function turn_right() {
	ship_image.rotation += 3
}

function loop() {
	move()
	clockwork()
	emit_ship_info()
	App.background.update()
	setTimeout(loop, 1000 / 60)
}

function clockwork() {
	if (Date.now() - App.clock >= 200) {
		if (App.up_arrow) {
			increase_ship_speed()
		}
		else
		{
			reduce_ship_speed()
		}
		update_minimap()
		App.clock = Date.now()
	}
}

function reduce_ship_speed() {
	ship.speed -= 0.2

	if (ship.speed < 0) {
		ship.speed = 0
	}
}

function increase_ship_speed() {
	if (ship.speed < ship.max_speed) {
		ship.speed += ship.max_speed * 0.10
	}
}

function create_laser(x, y, rotation, speed, max_distance) {
	let laser_image = new createjs.Bitmap(App.laser_img)

	let laser = new createjs.Container()
	laser.x = x
	laser.y = y
	laser.distance = 0

	let laser_width = App.laser_img.width
	let laser_height = App.laser_img.height

	laser_image.regX = laser_width / 2
	laser_image.regY = laser_height / 2
	laser_image.x = laser_width / 2
	laser_image.y = laser_height / 2
	laser_image.rotation = rotation

	laser.addChild(laser_image)
	App.background.addChild(laser)

	let velocities = get_vector_velocities(laser, speed)
	laser.vx = velocities[0]
	laser.vy = velocities[1]

	laser.max_distance = max_distance

	App.lasers.push(laser)
	return laser
}

function fire_laser() {
	if (!ship.visible || App.in_safe_zone) {
		return false
	}

	if (Date.now() - App.last_fired < 300) {
		return false
	}

	let lasers_to_fire = []

	if (ship.laser_level === 1) {
		lasers_to_fire.push(create_laser(ship.x, ship.y, ship_image.rotation, 4, 100))
	}

	if (ship.laser_level === 2) {
		lasers_to_fire.push(create_laser(ship.x, ship.y, ship_image.rotation, 4.1, 105))
	}

	if (ship.laser_level === 3) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110))
	}

	if (ship.laser_level === 4) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110))
	}

	if (ship.laser_level === 5) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115))
	}

	if (ship.laser_level === 6) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.4, 115))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.4, 115))
	}

	if (ship.laser_level === 7) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.5, 120))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.5, 120))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.5, 120))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.5, 120))
	}

	if (ship.laser_level === 8) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.7, 125))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.7, 125))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.7, 125))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.7, 125))
	}

	if (ship.laser_level === 9) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.8, 130))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.8, 130))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.8, 130))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.8, 130))
	}

	if (ship.laser_level === 10) {
		let d = get_direction(ship)
		d = to_radians(d)
		let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
		let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation, 5, 140))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation, 5, 140))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 5, 140))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 5, 140))
		lasers_to_fire.push(create_laser(ship.x + x, ship.y + y, ship_image.rotation + 30, 5, 140))
		lasers_to_fire.push(create_laser(ship.x - x, ship.y - y, ship_image.rotation - 30, 5, 140))
	}

	if (App.sound) {
		new Audio(`/audio/laser.ogg`).play()
	}

	App.last_fired = Date.now()

	emit_laser(lasers_to_fire)
}

function emit_laser(lasers) {
	let laser = []

	for(let i = 0; i < lasers.length; i++) {
		laser.push({
			username:App.username,
			x:lasers[i].x,
			y:lasers[i].y,
			rotation:lasers[i].children[0].rotation,
			vx:lasers[i].vx,
			vy:lasers[i].vy,
			max_distance:lasers[i].max_distance,
		})
	}

	App.socket.emit(`laser`, {laser:laser})
}

function create_enemy_laser(enemy_laser) {
	let laser_image = new createjs.Bitmap(App.laser_img)

	let laser = new createjs.Container()
	laser.x = enemy_laser.x
	laser.y = enemy_laser.y
	laser.distance = 0
	laser.max_distance = enemy_laser.max_distance
	laser.username = enemy_laser.username

	let laser_width = App.laser_img.width
	let laser_height = App.laser_img.height

	laser_image.regX = laser_width / 2
	laser_image.regY = laser_height / 2
	laser_image.x = laser_width / 2
	laser_image.y = laser_height / 2
	laser_image.rotation = enemy_laser.rotation

	laser.addChild(laser_image)
	App.background.addChild(laser)

	laser.vx = enemy_laser.vx
	laser.vy = enemy_laser.vy

	App.enemy_lasers.push(laser)
}

function fire_enemy_laser(data) {
	for(let i = 0; i < data.laser.laser.length; i++) {
		create_enemy_laser(data.laser.laser[i])
	}

	if (App.sound) {
		new Audio(`/audio/laser.ogg`).play()
	}

}

function move_lasers() {
	for(let i = 0; i < App.lasers.length; i++) {
		let laser
		laser = App.lasers[i]

		if (laser.distance < laser.max_distance) {
			laser.x += laser.vx
			laser.y += laser.vy
			laser.distance += 1

			if (laser.x <= 0) {
				laser.x = App.bg_width
			}
			else if (laser.x >= App.bg_width) {
				laser.x = 0
			}
			else if (laser.y <= 0) {
				laser.y = App.bg_height
			}
			else if (laser.y >= App.bg_height) {
				laser.y = 0
			}

			let enemy = check_enemy_collision(laser)
			if (enemy) {
				App.lasers.splice(i, 1)
				i -= 1
				App.background.removeChild(laser)
			}
			else if ((Math.pow(((laser.x + (App.laser_width / 2)) - App.bg_width / 2), 2) + Math.pow(((laser.y + (App.laser_height / 2)) - App.bg_height / 2), 2)) < Math.pow(App.safe_zone_radius, 2)) {
				App.lasers.splice(i, 1)
				i -= 1
				App.background.removeChild(laser)
			}
		}
		else
		{
			App.lasers.splice(i, 1)
			i -= 1
			App.background.removeChild(laser)
		}
	}

	for(let i = 0; i < App.enemy_lasers.length; i++) {
		let enemy_laser = App.enemy_lasers[i]

		if (enemy_laser.distance < enemy_laser.max_distance) {
			enemy_laser.x += enemy_laser.vx
			enemy_laser.y += enemy_laser.vy
			enemy_laser.distance += 1

			if (enemy_laser.x <= 0) {
				enemy_laser.x = App.bg_width
			}
			else if (enemy_laser.x >= App.bg_width) {
				enemy_laser.x = 0
			}
			else if (enemy_laser.y <= 0) {
				enemy_laser.y = App.bg_height
			}
			else if (enemy_laser.y >= App.bg_height) {
				enemy_laser.y = 0
			}

			if ((Math.pow(((enemy_laser.x + (App.laser_width / 2)) - App.bg_width / 2), 2) + Math.pow(((enemy_laser.y + (App.laser_height / 2)) - App.bg_height / 2), 2)) < Math.pow(App.safe_zone_radius, 2)) {
				App.enemy_lasers.splice(i, 1)
				i -= 1
				App.background.removeChild(enemy_laser)
			}
			else if (check_ship_collision(enemy_laser)) {
				ship_hit(enemy_laser)
				App.enemy_lasers.splice(i, 1)
				i -= 1
				App.background.removeChild(enemy_laser)
			}
		}
		else
		{
			App.enemy_lasers.splice(i, 1)
			i -= 1
			App.background.removeChild(enemy_laser)
		}
	}
}

function check_enemy_collision(laser) {
	for(let i = 0; i < App.enemy_ships.length; i++) {
		let enemy = App.enemy_ships[i]

		if (enemy.container.visible) {
			let x1 = enemy.container.x - App.ship_width / 4
			let x2 = enemy.container.x + App.ship_width / 4
			let y1 = enemy.container.y - App.ship_height / 4
			let y2 = enemy.container.y + App.ship_height / 4

			if (((laser.x >= x1) && (laser.x <= x2)) && ((laser.y >= y1) && (laser.y <= y2))) {
				return enemy
			}
		}
	}

	return false
}

function check_ship_collision(laser) {
	if (ship.visible) {
		let x1 = ship.x - App.ship_width / 4
		let x2 = ship.x + App.ship_width / 4
		let y1 = ship.y - App.ship_height / 4
		let y2 = ship.y + App.ship_height / 4
		if ( (laser.x >= x1 && laser.x <= x2) && (laser.y >= y1 && laser.y <= y2) ) {
			return true
		}
	}
	return false
}

function ship_hit(laser) {
	if (ship.visible) {
		ship.health -= App.laser_hit
		update_hud()
		if (ship.health <= 0) {
			destroyed(laser)
		}
	}
}

function destroyed(laser) {
	ship.visible = false
	show_explosion(ship.x, ship.y)
	App.socket.emit(`destroyed`, {destroyed_by:laser.username})
	let image = new Image()
	let num = get_random_int(1, 15)
	image.src = `img/nave` + num + `.png`
	ship_image.image = image
	ship.model = num
	respawn()
}

function enemy_destroyed(data) {
	if (data.destroyed_by === App.username) {
		upgrade()
		ship.health += App.laser_hit

		if (ship.health > ship.max_health) {
			ship.health = ship.max_health
		}

		update_hud()
	}

	let enemy = get_enemy_ship(data.username)
	show_explosion(enemy.container.x, enemy.container.y)
}

function respawn() {
	window.setTimeout(function() {
		let coords = get_random_coords()
		ship.x = coords[0]
		ship.y = coords[1]
		ship.max_health = App.min_max_health
		ship.health = ship.max_health
		ship.max_speed = App.min_max_speed
		ship.laser_level = App.min_laser_level
		move_background(coords[0] - App.background.canvas.width / 2, coords[1] - App.background.canvas.height / 2)
		ship.visible = true
		update_hud()
	}, 5000)
}

function show_explosion(x, y) {
	let explosion_animation = new createjs.Sprite(explosion_sheet)
	explosion_animation.gotoAndPlay(`explode`)
	explosion_animation.name = `explosion`
	explosion_animation.x = x - 33
	explosion_animation.y = y - 30
	explosion_animation.currentFrame = 0
	App.background.addChild(explosion_animation)

	if (App.sound) {
		new Audio(`/audio/explosion.ogg`).play()
	}
}

function update_minimap() {
	let minimap = document.getElementById(`minimap`)
	let context = minimap.getContext(`2d`)
	minimap.setAttribute(`height`, App.bg_height)
	minimap.setAttribute(`width`, App.bg_width)
	if (ship !== undefined && ship.visible) {
		let x = ship.x
		let y = ship.y
		let radius = 50

		context.beginPath()
		context.arc(x, y, radius, 0, 2 * Math.PI, false)
		context.fillStyle = `blue`
		context.fill()
		context.lineWidth = 10
		context.strokeStyle = `#003300`
		context.stroke()
	}

	for(let i = 0; i < App.enemy_ships.length; i++) {
		let enemy = App.enemy_ships[i].container

		if (enemy.visible) {
			let x = enemy.x
			let y = enemy.y
			let radius = 50

			context.beginPath()
			context.arc(x, y, radius, 0, 2 * Math.PI, false)
			context.fillStyle = `red`
			context.fill()
			context.lineWidth = 10
			context.strokeStyle = `#003300`
			context.stroke()
		}
	}
}

function play_yt(id) {
	if (App.music) {
		$(`#yt_player`).attr(`src`, `https://www.youtube.com/embed/` + id + `?&autoplay=1&enablejsapi=1&version=3`)
	}
}

function check_yt(msg) {
	if (msg.lastIndexOf(`yt `, 0) === 0) {
		let q = msg.substring(3)

		if (q !== ``) {
			yt_search(q)
		}
	}
	else {
		let expr = /(youtu\.be\/|[?&]v=)([^&]+)/
		let result = msg.match(expr)

		if (result) {
			play_yt(result[2])
		}
	}
}

function check_img(msg) {
	if (msg.lastIndexOf(`img `, 0) === 0) {
		let q = msg.substring(4)

		if (q !== ``) {
			img_search(q)
		}
	}
}

function place_search_image(url, title) {
	// Check if image already exists
	for(let i = 0; i < App.images.length; i++) {
		if (App.images[i].image && App.images[i].image.src === url) {
			return false
		}
	}

	let img = new Image()
	img.src = url

	img.onload = function() {
		let image = new createjs.Bitmap(img)
		image.x = ship.x - ((img.width / 3) / 2) + (App.ship_width / 2)
		image.y = ship.y - ((img.height / 3) / 2) + (App.ship_height / 2)
		image.scaleX = 0.333
		image.scaleY = 0.333
		App.background.addChild(image)
		z_order()
		push_image(image)
		App.socket.emit(`image`, {url:url, x:image.x, y:image.y})
	}

	img.onerror = function() {
		chat_announce(`Failed to load image: ` + url)
	}
}

function toggle_sound() {
	if (App.sound) {
		$(`#sound_toggle`).html(`turn on sound`)
		App.sound = false
	}
	else {
		$(`#sound_toggle`).html(`turn off sound`)
		App.sound = true
	}
}

function toggle_music() {
	if (App.music) {
		$(`#music_toggle`).html(`turn on music`)
		$(`#yt_player`).attr(`src`, ``)
		App.music = false
	}
	else {
		$(`#music_toggle`).html(`turn off music`)
		App.music = true
	}
}

function yt_search(q) {
    // Send YouTube search request to server to keep API key private
    App.socket.emit(`youtube_search`, {query: q})
}

function img_search(q) {
    // Send image search request to server
    App.socket.emit(`image_search`, {query: q})
}

function check_image(msg) {
	if (msg.indexOf(` `) === -1) {
		if (msg.indexOf(`.jpg`) !== -1 || msg.indexOf(`.png`) !== -1 || msg.indexOf(`.jpeg`) !== -1 || msg.indexOf(`.JPG`) !== -1 || msg.indexOf(`.PNG`) !== -1 || msg.indexOf(`.JPEG`) !== -1) {
			for(let i = 0; i < App.images.length; i++) {
				if (App.images[i].image.src === msg)
				{
					return false
				}
			}
			let img = new Image()
			img.src = msg

			img.onload = function() {
				let image = new createjs.Bitmap(img)
				image.x = ship.x - ((img.width / 3) / 2) + (App.ship_width / 2)
				image.y = ship.y - ((img.height / 3) / 2) + (App.ship_height / 2)
				image.scaleX = 0.333
				image.scaleY = 0.333
				App.background.addChild(image)
				z_order()
				push_image(image)
				App.socket.emit(`image`, {url:msg, x:image.x, y:image.y})
			}
		}
	}
}

function place_images(imgs) {
	for(let i = 0; i < imgs.length; i++) {
		let img = new Image()
		img.src = imgs[i].url
		let image = new createjs.Bitmap(img)
		image.x = imgs[i].x
		image.y = imgs[i].y
		image.scaleX = 0.333
		image.scaleY = 0.333
		App.background.addChild(image)
		z_order()
		push_image(image)
	}
}

function push_image(image) {
	App.images.push(image)

	if (App.images.length > 20) {
		App.background.removeChild(App.images[0])
		App.images.splice(0, 1)
	}
}

function z_order() {
	App.background.setChildIndex(safe_zone, App.background.getNumChildren() - 1)

	for(let i = 0; i < App.enemy_ships.length; i++) {
		App.background.setChildIndex(App.enemy_ships[i].container, App.background.getNumChildren() - 1)
	}

	App.background.setChildIndex(ship, App.background.getNumChildren() - 1)
}

function start_heartbeat() {
	setInterval(function() {
		App.socket.emit(`heartbeat`, {})

	}, 10000)
}

function upgrade() {
	let nums = []

	if (ship.laser_level < App.max_laser_level) {
		nums.push(1)
	}

	if (ship.max_health < App.max_max_health) {
		nums.push(2)
	}

	if (ship.max_speed < App.max_max_speed) {
		nums.push(3)
	}

	if (nums.length === 0) {
		return false
	}

	let num = nums.sort(function(){return 0.5 - Math.random()})[0]

	if (num === 1) {
		increase_laser_level()
		return true
	}

	if (num === 2) {
		increase_max_health()
		return true
	}

	if (num === 3) {
		increase_max_speed()
		return true
	}
}

function increase_laser_level() {
	ship.laser_level += 1
}

function increase_max_health() {
	ship.max_health += 10
}

function increase_max_speed() {
	ship.max_speed += 0.10
}

function update_hud() {
	$(`#health`).html(`health: ` + ship.health + `/` + ship.max_health)
	$(`#max_speed`).html(`max speed: ` + (Math.round((ship.max_speed - 1) * 10) / 10))
	$(`#laser_level`).html(`laser level: ` + ship.laser_level)
}