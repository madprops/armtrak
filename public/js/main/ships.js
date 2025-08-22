class EnemyShip {
  constructor(username) {
    this.username = username
    this.container = null
  }
}

App.update_enemy_ship = (data) => {
  let enemy = App.get_enemy_ship_or_create(data)

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

App.get_enemy_ship_or_create = (data) => {
  let enemy = App.get_enemy_ship(data.username)

  if (!enemy) {
    enemy = new EnemyShip(data.username)
    App.enemy_ships.push(enemy)
    App.create_enemy_ship(enemy, data.x, data.y, data.model)
  }

  return enemy
}

App.get_enemy_ship = (uname) => {
  for (let ship of App.enemy_ships) {
    if (ship.username === uname) {
      return ship
    }
  }

  return false
}

App.remove_enemy = (uname) => {
  for (let [i, ship] of App.enemy_ships.entries()) {
    if (ship.username === uname) {
      App.background.removeChild(ship.container)
      App.enemy_ships.splice(i, 1)
    }
  }
}

App.create_ship = () => {
  let image = new Image()
  let num = App.get_random_int(1, 15)
  image.src = `img/nave` + num + `.png`
  App.ship_image = new createjs.Bitmap(image)
  App.ship = new createjs.Container()
  let coords = App.get_random_coords()
  App.ship.x = coords[0]
  App.ship.y = coords[1]
  App.ship.speed = 0
  App.ship.max_health = App.min_max_health
  App.ship.health = App.ship.max_health
  App.ship.max_speed = App.min_max_speed
  App.ship.laser_level = App.min_laser_level
  App.ship.model = num

  App.ship.addChild(App.ship_image)

  let label = App.create_label(App.username)
  App.ship.addChild(label)

  App.background.addChild(App.ship)
  App.z_order()

  image.onload = function() {
    App.ship_width = image.width
    App.ship_height = image.height

    App.move_background(coords[0] - (App.background.canvas.width / 2) + (App.ship_width / 2), coords[1] - (App.background.canvas.height / 2) + (App.ship_height / 2))

    App.ship_image.regX = App.ship_width / 2
    App.ship_image.regY = App.ship_height / 2
    App.ship_image.x = App.ship_width / 2
    App.ship_image.y = App.ship_height / 2

    label.x = App.ship_width / 2
    label.y = App.ship_height

    App.socket.emit(`get_images`, {})
  }
}

App.create_enemy_ship = (enemy, x, y, model) => {
  let image = new Image()
  image.src = `img/nave` + model + `.png`
  let enemy_image = new createjs.Bitmap(image)
  let enemy_ship = new createjs.Container()
  enemy_ship.x = x
  enemy_ship.y = y
  enemy_ship.model = model

  enemy_ship.addChild(enemy_image)

  let label = App.create_label(enemy.username)
  enemy_ship.addChild(label)

  App.background.addChild(enemy_ship)
  enemy.container = enemy_ship
  App.z_order()

  image.onload = function() {
    enemy_image.regX = App.ship_width / 2
    enemy_image.regY = App.ship_height / 2
    enemy_image.x = App.ship_width / 2
    enemy_image.y = App.ship_height / 2
    label.x = App.ship_width / 2
    label.y = App.ship_height
  }
}

App.emit_ship_info = () => {
  App.socket.emit(`ship_info`, {x:App.ship.x, y:App.ship.y, rotation:App.ship_image.rotation, visible:App.ship.visible, model:App.ship.model})
}

App.move_ship = () => {
  let velocities = App.get_vector_velocities(App.ship, App.ship.speed)
  let vx = velocities[0]
  let vy = velocities[1]

  App.ship.x += vx
  App.ship.y += vy

  if (App.ship.x <= 0) {
    App.ship.x = App.bg_width
    App.move_background(App.ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
  }
  else if (App.ship.x >= App.bg_width) {
    App.ship.x = 0
    App.move_background(App.ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
  }
  else if (App.ship.y <= 0) {
    App.ship.y = App.bg_height
    App.move_background(App.background.regX, App.ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
  }
  else if (App.ship.y >= App.bg_height) {
    App.ship.y = 0
    App.move_background(App.background.regX, App.ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
  }
  else {
    App.move_background(App.background.regX + vx, App.background.regY + vy)
  }

  App.check_safe_zone()
}

App.check_enemy_collision = (laser) => {
  for (let ship of App.enemy_ships) {
    if (ship.container.visible) {
      let x1 = ship.container.x - App.ship_width / 4
      let x2 = ship.container.x + App.ship_width / 4
      let y1 = ship.container.y - App.ship_height / 4
      let y2 = ship.container.y + App.ship_height / 4

      if (((laser.x >= x1) && (laser.x <= x2)) && ((laser.y >= y1) && (laser.y <= y2))) {
        return ship
      }
    }
  }

  return false
}

App.check_ship_collision = (laser) => {
  if (App.ship.visible) {
    let x1 = App.ship.x - (App.ship_width / 4)
    let x2 = App.ship.x + (App.ship_width / 4)
    let y1 = App.ship.y - (App.ship_height / 4)
    let y2 = App.ship.y + (App.ship_height / 4)

    if (((laser.x >= x1) && (laser.x <= x2)) && ((laser.y >= y1) && (laser.y <= y2))) {
      return true
    }
  }

  return false
}

App.ship_hit = (laser) => {
  if (App.ship.visible) {
    App.ship.health -= App.laser_hit
    App.update_hud()

    if (App.ship.health <= 0) {
      App.destroyed(laser)
    }
  }
}

App.destroyed = (laser) => {
  App.ship.visible = false
  App.show_explosion(App.ship.x, App.ship.y)
  App.socket.emit(`destroyed`, {destroyed_by:laser.username})
  let image = new Image()
  let num = App.get_random_int(1, 15)
  image.src = `img/nave` + num + `.png`
  App.ship_image.image = image
  App.ship.model = num
  App.respawn()
}

App.enemy_destroyed = (data) => {
  if (data.destroyed_by === App.username) {
    App.upgrade()
    App.ship.health += App.laser_hit

    if (App.ship.health > App.ship.max_health) {
      App.ship.health = App.ship.max_health
    }

    App.update_hud()
  }

  let enemy = App.get_enemy_ship(data.username)
  App.show_explosion(enemy.container.x, enemy.container.y)
}

App.show_explosion = (x, y) => {
  let explosion_animation = new createjs.Sprite(App.explosion_sheet)
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

App.on_destroyed = (data) => {
  if (data.username !== App.username) {
    App.enemy_destroyed(data)
  }

  let kills = ``

  if (data.kills > 1) {
    kills = `<br>(` + data.kills + ` kills in a row)`
  }

  App.chat_announce(`💥 ${data.destroyed_by} destroyed ${data.username}${kills}`)
}

App.create_label = (username) => {
  let label = new createjs.Text(App.space_word(username), `${App.label_size}px Arial`, `#ffffff`)
  label.textAlign = `center`
  label.shadow = new createjs.Shadow(`#000000`, 0, 0, 5)
  return label
}