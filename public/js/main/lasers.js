App.setup_lasers = () => {
  App.laser_img = new Image()
  App.laser_img.src = `img/laser.png`

  App.laser_img.onload = () => {
    App.laser_width = App.laser_img.width
    App.laser_height = App.laser_img.height
  }
}

App.create_lasers = (data) => {
  for (let item of data.lasers) {
    let laser = {}
    let laser_image = new createjs.Bitmap(App.laser_img)
    let container = new createjs.Container()
    laser.container = container
    container.x = data.x
    container.y = data.y
    laser.distance = 0
    let laser_width = App.laser_img.width
    let laser_height = App.laser_img.height
    laser_image.regX = laser_width / 2
    laser_image.regY = laser_height / 2
    laser_image.x = laser_width / 2
    laser_image.y = laser_height / 2
    laser_image.rotation = item.rotation
    container.addChild(laser_image)
    App.background.addChild(container)

    let velocities = App.get_vector_velocities(container, item.speed)
    laser.vx = velocities[0]
    laser.vy = velocities[1]
    laser.id = item.id
    laser.username = data.username

    laser.max_distance = item.max_distance
    App.lasers.push(laser)
  }

  App.laser_sound()
}

App.fire_laser = () => {
  App.socket.emit(`fire_laser`)
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

  App.laser_sound()
}

App.laser_sound = () => {
  if (App.sound) {
    App.play_audio(`laser`)
  }
}

App.move_lasers = () => {
  for (let [i, laser] of App.lasers.entries()) {
    if (laser.distance < laser.max_distance) {
      laser.container.x += laser.vx
      laser.container.y += laser.vy
      laser.distance += 1

      if (laser.container.x <= 0) {
        laser.container.x = App.bg_width
      }
      else if (laser.container.x >= App.bg_width) {
        laser.container.x = 0
      }
      else if (laser.container.y <= 0) {
        laser.container.y = App.bg_height
      }
      else if (laser.container.y >= App.bg_height) {
        laser.container.y = 0
      }
    }
    else {
      App.lasers.splice(i, 1)
      i -= 1
      App.background.removeChild(laser.container)
    }
  }

  for (let [i, enemy_laser] of App.enemy_lasers.entries()) {
    if (enemy_laser.distance < enemy_laser.max_distance) {
      enemy_laser.container.x += enemy_laser.vx
      enemy_laser.container.y += enemy_laser.vy
      enemy_laser.distance += 1

      if (enemy_laser.container.x <= 0) {
        enemy_laser.container.x = App.bg_width
      }
      else if (enemy_laser.container.x >= App.bg_width) {
        enemy_laser.container.x = 0
      }
      else if (enemy_laser.container.y <= 0) {
        enemy_laser.container.y = App.bg_height
      }
      else if (enemy_laser.container.y >= App.bg_height) {
        enemy_laser.container.y = 0
      }

      if ((Math.pow((enemy_laser.container.x + (App.laser_width / 2)) - App.bg_width / 2, 2) + Math.pow((enemy_laser.y + (App.laser_height / 2)) - App.bg_height / 2, 2)) < Math.pow(App.safe_zone_radius, 2)) {
        App.enemy_lasers.splice(i, 1)
        i -= 1
        App.background.removeChild(enemy_laser)
      }
      else if (App.check_ship_collision(enemy_laser)) {
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

App.remove_laser = (id) => {
  for (let [i, laser] of App.lasers.entries()) {
    if (laser.id === id) {
      App.background.removeChild(laser.container)
      App.lasers.splice(i, 1)
      break
    }
  }
}

App.on_laser_hit = (data) => {
  App.remove_laser(data.laser.id)
  App.play_audio(`hit`)
}

App.on_laser_hit_safe_zone = (data) => {
  App.remove_laser(data.laser.id)
}