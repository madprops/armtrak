App.create_laser = (x, y, rotation, speed, max_distance) => {
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

  let velocities = App.get_vector_velocities(laser, speed)
  laser.vx = velocities[0]
  laser.vy = velocities[1]

  laser.max_distance = max_distance

  App.lasers.push(laser)
  return laser
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
      username:App.username,
      x:item.x,
      y:item.y,
      rotation:item.children[0].rotation,
      vx:item.vx,
      vy:item.vy,
      max_distance:item.max_distance,
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

App.move_lasers = () => {
  for (let [i, laser] of App.lasers.entries()) {
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

      let enemy = App.check_enemy_collision(laser)

      function check_col() {
        let x1 = Math.pow((laser.x + (App.laser_width / 2)) - (App.bg_width / 2), 2)
        let x2 = Math.pow((laser.y + (App.laser_height / 2)) - (App.bg_height / 2), 2)
        let x3 = Math.pow(App.safe_zone_radius, 2)
        return x1 + x2 < x3
      }

      if (enemy) {
        App.lasers.splice(i, 1)
        i -= 1
        App.background.removeChild(laser)
      }
      else if (check_col()) {
        App.lasers.splice(i, 1)
        i -= 1
        App.background.removeChild(laser)
      }
    }
    else {
      App.lasers.splice(i, 1)
      i -= 1
      App.background.removeChild(laser)
    }
  }

  for (let [i, enemy_laser] of App.enemy_lasers.entries()) {
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

      if ((Math.pow((enemy_laser.x + (App.laser_width / 2)) - App.bg_width / 2, 2) + Math.pow((enemy_laser.y + (App.laser_height / 2)) - App.bg_height / 2, 2)) < Math.pow(App.safe_zone_radius, 2)) {
        App.enemy_lasers.splice(i, 1)
        i -= 1
        App.background.removeChild(enemy_laser)
      }
      else if (App.check_ship_collision(enemy_laser)) {
        App.ship_hit(enemy_laser)
        App.enemy_lasers.splice(i, 1)
        i -= 1
        App.background.removeChild(enemy_laser)
      }
    }
    else {
      App.enemy_lasers.splice(i, 1)
      i -= 1
      App.background.removeChild(enemy_laser)
    }
  }
}