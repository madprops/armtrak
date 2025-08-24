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
const MIN_MAX_SPEED = 1.5
const MAX_MAX_SPEED = 2.5
const MAX_LASER_LEVEL = 10
const MIN_LASER_LEVEL = 1
const NUM_MODELS = 15
const SPEED_STEP = 0.2
const HEALTH_UPGRADE_STEP = 10
const SPEED_UPGRADE_STEP = 0.1
const LASER_UPGRADE_STEP = 1
const SHIP_WIDTH = 24
const SHIP_HEIGHT = 24
const LASER_WIDTH = 24
const LASER_HEIGHT = 24
const SAFE_ZONE_WIDTH = 150
const SAFE_ZONE_HEIGHT = 150
const ROTATION_STEP = 3

// Lasers
LASER_STEP = 1
LAST_FIRED_MIN = 300

module.exports = (io, App) => {
  class Ship {
    static id = 1

    constructor(username) {
      let coords = App.get_random_coords()
      let model = App.get_random_int(1, NUM_MODELS)
      let now = Date.now()

      this.username = username
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
      this.in_safe_zone = false
      this.last_fired = now
      this.kills = 0
      this.vx = 0
      this.vy = 0

      Ship.id += 1
    }
  }

  class Laser {
    constructor(ship, speed, max_distance, rotation, x, y) {
      this.ship = ship
      this.speed = speed
      this.max_distance = max_distance
      this.rotation = rotation
      this.x = x
      this.y = y
      this.distance = 0

      let velocities = App.get_vector_velocities(this)
      this.vx = velocities[0]
      this.vy = velocities[1]
    }
  }

  App.ships = []
  App.lasers = []

  App.create_ship = (socket) => {
    socket.ak_ship = new Ship(socket.ak_username)
    App.ships.push(socket.ak_ship)
  }

  App.start_game = () => {
    App.setup_safe_zone()
    App.start_game_loop()
  }

  App.start_game_loop = () => {
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
  }

  App.emit_game_state = () => {
    let ships = []

    for (let ship_id in App.ships) {
      let ship = App.ships[ship_id]

      ships.push({
        id: ship.id,
        x: ship.x,
        y: ship.y,
        rotation: ship.rotation,
        visible: ship.visible,
        model: ship.model,
        vx: ship.vx,
        vy: ship.vy,
      })
    }

    io.sockets.emit(`update`, {
      type: `update_ships`,
      ships,
    })
  }

  App.move = () => {
    App.move_ships()
    App.move_lasers()
    App.check_lasers()
  }

  App.move_ships = () => {
    for (let ship of App.ships) {
      if (ship.visible) {
        App.move_ship(ship)
      }

      if (ship.up_arrow) {
        App.increase_speed(ship)
      }
      else {
        App.reduce_speed(ship)
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
  }

  App.check_lasers = () => {
    for (let ship of App.ships) {
      for (let laser of App.lasers) {
        if (laser.ship === ship) {
          continue
        }

        let enemy = App.check_enemy_collision(ship, laser)

        function check_col() {
          let x1 = Math.pow((laser.x + (LASER_WIDTH / 2)) - (BG_WIDTH / 2), 2)
          let x2 = Math.pow((laser.y + (LASER_HEIGHT / 2)) - (BG_HEIGHT / 2), 2)
          let x3 = Math.pow(App.safe_zone_radius, 2)
          return x1 + x2 < x3
        }

        if (enemy || check_col()) {
          App.ship_hit(ship, enemy_laser)
          App.lasers.splice(i, 1)
          i -= 1
        }
      }
    }
  }

  App.move_lasers = () => {
    for (let laser_group of App.lasers) {
      for ([i, laser] of laser_group.entries()) {
        if (laser.distance < laser.max_distance) {
          laser.x += laser.vx
          laser.y += laser.vy
          laser.distance += LASER_STEP

          if (laser.x <= 0) {
            laser.x = BG_WIDTH
          }
          else if (laser.x >= BG_WIDTH) {
            laser.x = 0
          }
          else if (laser.y <= 0) {
            laser.y = BG_HEIGHT
          }
          else if (laser.y >= BG_HEIGHT) {
            laser.y = 0
          }
        }
        else {
          App.lasers.splice(i, 1)
          i -= 1
        }
      }
    }
  }

  App.ship_hit = (ship, laser) => {
    if (ship.visible) {
      ship.health -= App.laser_hit

      if (ship.health <= 0) {
        App.destroyed(ship, laser)
      }
    }
  }

  App.destroyed = (ship, laser) => {
    ship.visible = false
    ship.kills = 0
    laser.ship.kills += 1
    ship.model = App.get_random_int(1, 15)

    io.sockets.emit(`update`, {
      type: `destroyed`,
      destroyer_ship: laser.ship.username,
      destroyed_ship: ship.username,
      kills: laser.ship.kills,
    })

    App.respawn()
  }

  App.get_random_coords = () => {
    let x = App.get_random_int(10, BG_WIDTH - 10)
    let y = App.get_random_int(10, BG_HEIGHT - 10)
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

  App.ship_update = (socket, data) => {
    let ship = socket.ak_ship

    ship.up_arrow = data.up_arrow
    ship.down_arrow = data.down_arrow
    ship.left_arrow = data.left_arrow
    ship.right_arrow = data.right_arrow
  }

  App.reduce_speed = (ship) => {
    ship.speed -= SPEED_STEP

    if (ship.speed < 0) {
      ship.speed = 0
    }
  }

  App.increase_speed = (ship) => {
    if (ship.speed < ship.max_speed) {
      ship.speed += ship.max_speed * 0.10
    }
  }

  App.upgrade = (ship) => {
    let nums = []

    if (ship.laser_level < MAX_LASER_LEVEL) {
      nums.push(1)
    }

    if (ship.max_health < MAX_MAX_HEALTH) {
      nums.push(2)
    }

    if (ship.max_speed < MAX_MAX_SPEED) {
      nums.push(3)
    }

    if (nums.length === 0) {
      return false
    }

    let num = nums.sort(function(){return 0.5 - Math.random()})[0]

    if (num === 1) {
      App.increase_laser_level(ship)
      return true
    }

    if (num === 2) {
      App.increase_max_health(ship)
      return true
    }

    if (num === 3) {
      App.increase_max_speed(ship)
      return true
    }
  }

  App.increase_max_health = (ship) => {
    ship.max_health += HEALTH_UPGRADE_STEP
  }

  App.increase_max_speed = (ship) => {
    ship.max_speed += SPEED_UPGRADE_STEP
  }

  App.increase_laser_level = (ship) => {
    ship.laser_level += LASER_UPGRADE_STEP
  }

  App.check_safe_zone = (ship) => {
    let num_1 = (ship.x + (SHIP_WIDTH / 2)) - (BG_WIDTH / 2)
    let num_2 = (ship.y + (SHIP_HEIGHT / 2)) - (BG_HEIGHT / 2)
    let radius = App.safe_zone_radius

    if ((Math.pow(num_1, 2) + Math.pow(num_2, 2)) < Math.pow(radius, 2)) {
      ship.in_safe_zone = true
    }
    else {
      ship.in_safe_zone = false
    }
  }

  App.move_ship = (ship) => {
    let velocities = App.get_vector_velocities(ship)
    let vx = velocities[0]
    let vy = velocities[1]

    ship.x += vx
    ship.y += vy

    if (ship.x <= 0) {
      ship.x = BG_WIDTH
    }
    else if (ship.x >= BG_WIDTH) {
      ship.x = 0
    }
    else if (ship.y <= 0) {
      ship.y = BG_HEIGHT
    }
    else if (ship.y >= BG_HEIGHT) {
      ship.y = 0
    }

    ship.vx = vx
    ship.vy = vy

    App.check_safe_zone(ship)
  }

  App.setup_safe_zone = () => {
    App.safe_zone = {}
    App.safe_zone.x = (BG_WIDTH / 2) - (SAFE_ZONE_WIDTH / 2)
    App.safe_zone.y = (BG_HEIGHT / 2) - (SAFE_ZONE_HEIGHT / 2)
    App.safe_zone.radius = SAFE_ZONE_HEIGHT / 2
  }

  App.check_enemy_collision = (oship, laser) => {
    for (let ship of App.ships) {
      if (ship === oship) {
        continue
      }

      if (ship.visible) {
        let x1 = ship.x - SHIP_WIDTH / 4
        let x2 = ship.x + SHIP_WIDTH / 4
        let y1 = ship.y - SHIP_HEIGHT / 4
        let y2 = ship.y + SHIP_HEIGHT / 4

        if (((laser.x >= x1) && (laser.x <= x2)) && ((laser.y >= y1) && (laser.y <= y2))) {
          return ship
        }
      }
    }

    return false
  }

  App.fire_laser = (socket) => {
    let ship = socket.ak_ship

    if (!ship.visible || ship.in_safe_zone) {
      return false
    }

    if ((Date.now() - ship.last_fired) < LAST_FIRED_MIN) {
      return false
    }

    let lasers = []

    let d = App.get_direction(ship)
    d = App.to_radians(d)

    let x = (SHIP_WIDTH / 2 * 0.6) * Math.cos(d)
    let y = (SHIP_WIDTH / 2 * 0.6) * Math.sin(d)

    let x_1 = ship.x
    let y_1 = ship.y
    let x_2 = ship.x + x
    let y_2 = ship.y + y
    let x_3 = ship.x - x
    let y_3 = ship.y - y

    if (ship.laser_level === 1) {
      let speed = 4
      let max_distance = 100

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_1,
        y_1,
      ))
    }

    if (ship.laser_level === 2) {
      let speed = 4
      let max_distance = 105

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_1,
        y_1,
      ))
    }

    if (ship.laser_level === 3) {
      let speed = 4.2
      let max_distance = 110

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 4) {
      let speed = 4.2
      let max_distance = 110

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 5) {
      let speed = 4.4
      let max_distance = 115

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 6) {
      let speed = 4.4
      let max_distance = 115

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 15,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 15,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 7) {
      let speed = 4.5
      let max_distance = 120

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 15,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 15,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 8) {
      let speed = 4.7
      let max_distance = 125

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 15,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 15,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 9) {
      let speed = 4.8
      let max_distance = 130

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 15,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 15,
        x_3,
        y_3,
      ))
    }

    if (ship.laser_level === 10) {
      let speed = 5
      let max_distance = 120

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 15,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 15,
        x_3,
        y_3,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation + 30,
        x_2,
        y_2,
      ))

      lasers.push(new Laser(
        ship,
        speed,
        max_distance,
        ship.rotation - 30,
        x_3,
        y_3,
      ))
    }

    ship.last_fired = Date.now()
    App.lasers.push(lasers)

    io.sockets.emit(`update`, {
      type: `laser`,
      x: ship.x,
      y: ship.y,
      lasers,
    })
  }

  App.get_vector_velocities = (ship) => {
    let direction = App.get_direction(ship)
    let speed = ship.speed
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

    if ((direction > 0) && (direction < 90)) {
      angle = App.to_radians(90 - direction)
      x = Math.cos(angle) * speed
      y = - Math.sin(angle) * speed
      return [x, y]
    }

    if ((direction > 90) && (direction < 180)) {
      angle = App.to_radians(direction - 90)
      x = Math.cos(angle) * speed
      y = Math.sin(angle) * speed
      return [x, y]
    }

    if ((direction >= 181) && (direction <= 269)) {
      angle = App.to_radians(270 - direction)
      x = - Math.cos(angle) * speed
      y = Math.sin(angle) * speed
      return [x, y]
    }

    if ((direction > 270) && (direction < 360)) {
      angle = App.to_radians(direction - 270)
      x = - Math.cos(angle) * speed
      y = - Math.sin(angle) * speed
      return [x, y]
    }
  }

  App.get_direction = (ship) => {
    let direction = ((ship.rotation / 360) % 1) * 360

    if (direction < 0) {
      direction = 360 - Math.abs(direction)
    }

    if (direction >= 360) {
      direction = 0
    }

    return direction
  }

  App.turn_left = (ship) => {
    ship.rotation -= ROTATION_STEP
  }

  App.turn_right = (ship) => {
    ship.rotation += ROTATION_STEP
  }
}