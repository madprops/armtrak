class EnemyShip {
  constructor(username) {
    this.username = username
    this.container = null
  }
}

App.on_update_ships = (data) => {
  if (App.update_ships(data)) {
    App.update_minimap()
  }

  App.update_hud()
}

App.update_ships = (data) => {
  let changed = false

  for (let item of data.ships) {
    if (App.ship && (App.ship.id === item.id)) {
      let diff_x = item.x - App.ship.x
      let diff_y = item.y - App.ship.y

      App.copy_ship(item)

      if (!item.visible) {
        App.ship.visible = false
        continue
      }

      if ((diff_x === 0) && (diff_y === 0) &&
      (App.ship_image.rotation === item.rotation)) {
        if (App.ship.visible) {
          continue
        }
      }

      changed = true
      App.ship_image.rotation = item.rotation

      if (App.ship.x <= 0) {
        App.move_background(App.ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
      }
      else if (App.ship.x >= App.bg_width) {
        App.move_background(App.ship.x - (App.background.canvas.width / 2) + (App.ship_width / 2), App.background.regY)
      }
      else if (App.ship.y <= 0) {
        App.move_background(App.background.regX, App.ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
      }
      else if (App.ship.y >= App.bg_height) {
        App.move_background(App.background.regX, App.ship.y - (App.background.canvas.height / 2) + (App.ship_height / 2))
      }
      else {
        App.move_background(App.background.regX + diff_x, App.background.regY + diff_y)
      }
    }
    else {
      let enemy = App.get_enemy_ship_or_create(item)

      if (enemy) {
        if (!item.visible) {
          enemy.container.visible = false
          continue
        }

        if ((enemy.container.x === item.x) &&
        (enemy.container.y === item.y) &&
        (enemy.image.rotation === item.rotation)) {
          if (enemy.container.visible) {
            continue
          }
        }

        changed = true
        enemy.container.x = item.x
        enemy.container.y = item.y
        enemy.container.visible = true

        if (enemy.container.model !== item.model) {
          let image = new Image()
          image.src = `img/nave` + item.model + `.png`
          enemy.container.children[0].image = image
        }

        enemy.container.model = item.model
        enemy.image.rotation = item.rotation
      }
    }
  }

  return changed
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

App.create_ship = (data) => {
  App.ship = new createjs.Container()

  let image = new Image()
  image.src = `/img/nave${data.model}.png`
  App.ship_image = new createjs.Bitmap(image)
  App.ship.addChild(App.ship_image)

  App.ship.id = data.id
  App.ship.x = data.x
  App.ship.y = data.y
  App.ship.speed = data.speed
  App.ship.max_health = data.max_health
  App.ship.health = data.health
  App.ship.max_speed = data.max_speed
  App.ship.laser_level = data.laser_level
  App.ship.model = data.model
  App.ship.visible = true

  let label = App.create_label(App.username)
  App.ship.addChild(label)
  App.add_to_background(App.ship)

  image.onload = function() {
    App.ship_width = image.width
    App.ship_height = image.height

    let bg_coords_1 = data.x - (App.background.canvas.width / 2) + (App.ship_width / 2)
    let bg_coords_2 = data.y - (App.background.canvas.height / 2) + (App.ship_height / 2)
    App.move_background(bg_coords_1, bg_coords_2)

    App.ship_image.regX = App.ship_width / 2
    App.ship_image.regY = App.ship_height / 2
    App.ship_image.x = App.ship_width / 2
    App.ship_image.y = App.ship_height / 2

    label.x = App.ship_width / 2
    label.y = App.ship_height
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
  enemy.image = enemy_image
  enemy_ship.addChild(enemy_image)

  let label = App.create_label(enemy.username)
  enemy_ship.addChild(label)

  enemy.container = enemy_ship
  App.add_to_background(enemy_ship)

  image.onload = function() {
    enemy_image.regX = image.width / 2
    enemy_image.regY = image.height / 2
    enemy_image.x = image.width / 2
    enemy_image.y = image.height / 2
    label.x = image.width / 2
    label.y = image.height
  }
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
  if (data.destroyed_ship === App.username) {
    App.ship.health += App.laser_hit

    if (App.ship.health > App.ship.max_health) {
      App.ship.health = App.ship.max_health
    }
  }

  let kills = ``

  if (data.kills > 1) {
    kills = `<br>(` + data.kills + ` kills in a row)`
  }

  let u1 = data.destroyer_ship.username
  let u2 = data.destroyed_ship.username
  App.show_explosion(data.destroyed_ship.x, data.destroyed_ship.y)
  App.chat_announce(`💥 ${u1} destroyed ${u2}${kills}`)
}

App.create_label = (username) => {
  let label = new createjs.Text(App.space_word(username), `${App.label_size}px Arial`, `#ffffff`)
  label.textAlign = `center`
  label.shadow = new createjs.Shadow(`#000000`, 0, 0, 5)
  return label
}

App.copy_ship = (src) => {
  App.copy_obj(src, App.ship, [`rotation`])
}