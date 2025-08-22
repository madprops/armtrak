App.setup_lasers = () => {
  App.laser_img = new Image()
  App.laser_img.src = `img/laser.png`

  App.laser_img.onload = () => {
    App.laser_width = App.laser_img.width
    App.laser_height = App.laser_img.height
  }
}

App.create_laser = (data) => {
  let laser_image = new createjs.Bitmap(App.laser_img)
  let laser = new createjs.Container()
  laser.x = data.x
  laser.y = data.y
  laser.distance = 0
  let laser_width = App.laser_img.width
  let laser_height = App.laser_img.height
  laser_image.regX = laser_width / 2
  laser_image.regY = laser_height / 2
  laser_image.x = laser_width / 2
  laser_image.y = laser_height / 2
  laser_image.rotation = data.rotation
  laser.addChild(laser_image)
  App.background.addChild(laser)
  laser.vx = data.velocities[0]
  laser.vy = data.velocities[1]
  laser.max_distance = data.max_distance
  App.lasers.push(laser)
  return laser
}

App.fire_laser = () => {
  App.socket.emit(`fire_laser`)
}

App.fire_laser = () => {
  if (!App.ship.visible || App.in_safe_zone) {
    return false
  }

  if (Date.now() - App.last_fired < 300) {
    return false
  }

  let lasers_to_fire = []

  if (App.ship.laser_level === 1) {
    lasers_to_fire.push(App.create_laser(App.ship.x, App.ship.y, App.ship_image.rotation, 4, 100))
  }

  if (App.ship.laser_level === 2) {
    lasers_to_fire.push(App.create_laser(App.ship.x, App.ship.y, App.ship_image.rotation, 4.1, 105))
  }

  if (App.ship.laser_level === 3) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.2, 110))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.2, 110))
  }

  if (App.ship.laser_level === 4) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.2, 110))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.2, 110))
  }

  if (App.ship.laser_level === 5) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.4, 115))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.4, 115))
  }

  if (App.ship.laser_level === 6) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.4, 115))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.4, 115))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 15, 4.4, 115))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 15, 4.4, 115))
  }

  if (App.ship.laser_level === 7) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.5, 120))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.5, 120))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 15, 4.5, 120))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 15, 4.5, 120))
  }

  if (App.ship.laser_level === 8) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.7, 125))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.7, 125))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 15, 4.7, 125))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 15, 4.7, 125))
  }

  if (App.ship.laser_level === 9) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 4.8, 130))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 4.8, 130))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 15, 4.8, 130))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 15, 4.8, 130))
  }

  if (App.ship.laser_level === 10) {
    let d = App.get_direction(App.ship)
    d = App.to_radians(d)
    let x = (App.ship_width / 2 * 0.6) * Math.cos(d)
    let y = (App.ship_width / 2 * 0.6) * Math.sin(d)

    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation, 5, 140))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation, 5, 140))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 15, 5, 140))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 15, 5, 140))
    lasers_to_fire.push(App.create_laser(App.ship.x + x, App.ship.y + y, App.ship_image.rotation + 30, 5, 140))
    lasers_to_fire.push(App.create_laser(App.ship.x - x, App.ship.y - y, App.ship_image.rotation - 30, 5, 140))
  }

  if (App.sound) {
    new Audio(`/audio/laser.ogg`).play()
  }

  App.last_fired = Date.now()
  App.emit_laser(lasers_to_fire)
}

App.emit_laser = (lasers) => {
  let laser = []

  for (let item of lasers) {
    laser.push({
      username: App.username,
      x: item.x,
      y: item.y,
      rotation: item.children[0].rotation,
      vx: item.vx,
      vy: item.vy,
      max_distance: item.max_distance,
    })
  }

  App.socket.emit(`laser`, {laser})
}

App.create_enemy_laser = (enemy_laser) => {
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

App.fire_enemy_laser = (data) => {
  for (let laser of data.laser.laser) {
    App.create_enemy_laser(laser)
  }

  if (App.sound) {
    new Audio(`/audio/laser.ogg`).play()
  }
}