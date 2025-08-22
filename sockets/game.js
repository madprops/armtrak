// Map
const BG_HEIGHT = 2000
const BG_WIDTH = 2000

// Network
const SIMULATION_RATE = 60; // How many times to run physics per second
const MS_PER_UPDATE = 1000 / SIMULATION_RATE; // ~16.67ms
const NETWORK_TICK_RATE = 20; // How many times to send updates per second
const MS_PER_TICK = 1000 / NETWORK_TICK_RATE; // 50ms

// Ship
const MIN_MAX_HEALTH = 10
const MAX_MAX_HEALTH = 200
const MIN_MAX_SPEED = 2
const MIN_LASER_LEVEL = 1
const NUM_MODELS = 15

class Ship {
  static id = 1

  constructor() {
    let coords = App.get_random_coords()
    let model = App.get_random_int(1, NUM_MODELS)

    this.id = Ship.id
    this.x = coords[0]
    this.y = coords[1]
    this.speed = 0
    this.rotation = 0
    this.model = model
    this.visible = true
    this.up_arrow = false
    this.down_arrow = false
    this.left_arrow = false
    this.right_arrow = false
    this.health = 100
    this.max_health = 100
    this.max_speed = MIN_MAX_SPEED
    this.laser_level = MIN_LASER_LEVEL

    Ship.id += 1
  }
}

App.ships = []
App.lasers = []

App.create_ship = (socket) => {
  socket.ak_ship = new Ship(
    socket.id,
    data.x,
    data.y,
    data.rotation,
    data.model,
  )

  App.ships.push(socket.ak_ship)
}

App.start_game = () => {
  let previous_time = Date.now()
  let lag = 0.0

  let game_loop = () => {
    let currentTime = Date.now()
    let elapsed = currentTime - previous_time
    previous_time = currentTime
    lag += elapsed

    while (lag >= MS_PER_UPDATE) {
      App.update_simulation()
      lag -= MS_PER_UPDATE
    }

    setImmediate(game_loop)
  }

  let network_loop = () => {
    App.emit_game_state()
    setTimeout(network_loop, MS_PER_TICK)
  }

  game_loop()
  network_loop()
}

App.update_simulation = () => {
  App.move()
  App.clockwork()
  App.background.update()
}

App.emit_game_state = () => {
  let game_state = {
    ships: {},
  }

  for (let ship_id in App.ships) {
    let ship = App.ships[ship_id]

    game_state.ships[ship_id] = {
      x: ship.x,
      y: ship.y,
      rotation: ship.rotation,
      visible: App.ship.visible,
      model: App.ship.model,
    }
  }

  io.sockets.emit(`ship_updates`, game_state)
}

App.move = () => {
  for (let ship of App.ships) {
    if (App.ship.visible) {
      App.move_ship()
    }

    if (ship.left_arrow) {
      App.turn_left(ship)
      return true
    }

    if (ship.right_arrow) {
      App.turn_right(ship)
      return true
    }
  }

  App.move_lasers()
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

App.clockwork = () => {
  if ((Date.now() - App.clock) >= 200) {
    if (App.up_arrow) {
      App.increase_ship_speed()
    }
    else {
      App.reduce_ship_speed()
    }

    App.update_minimap()
    App.clock = Date.now()
  }
}

App.get_random_coords = () => {
  let x = App.get_random_int(10, App.bg_width - 10)
  let y = App.get_random_int(10, App.bg_height - 10)
  return [x, y]
}

App.respawn = (socket) => {
  setTimeout(function() {
    let ship = socket.ak_ship
    let coords = App.get_random_coords()

    ship.x = coords[0]
    ship.y = coords[1]
    ship.max_health = MIN_MAX_HEALTH
    ship.health = ship.max_health
    ship.max_speed = MIN_MAX_SPEED
    ship.laser_level = MIN_LASER_LEVEL
    ship.visible = true

    socket.emit(`update`, {type: `respawn`, ship})
  }, 5000)
}