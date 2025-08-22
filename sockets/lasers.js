module.exports = (io, App) => {
  class Laser {
    constructor(data) {
      this.x = data.x
      this.y = data.y
      this.rotation = data.rotation
      this.speed = data.speed
      this.max_distance = data.max_distance
      this.distance = 0
    }
  }

  App.fire_laser = (socket) => {
    let ship = socket.ak_ship

    if (!ship.visible || App.in_safe_zone) {
      return false
    }

    if (Date.now() - App.last_fired < 300) {
      return false
    }

    let lasers_to_fire = []

    if (ship.laser_level === 1) {
      lasers_to_fire.push(App.create_laser(ship.x, ship.y, ship_image.rotation, 4, 100))
    }

    if (ship.laser_level === 2) {
      lasers_to_fire.push(App.create_laser(ship.x, ship.y, ship_image.rotation, 4.1, 105))
    }

    if (ship.laser_level === 3) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110))
    }

    if (ship.laser_level === 4) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.2, 110))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.2, 110))
    }

    if (ship.laser_level === 5) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115))
    }

    if (ship.laser_level === 6) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.4, 115))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.4, 115))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.4, 115))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.4, 115))
    }

    if (ship.laser_level === 7) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.5, 120))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.5, 120))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.5, 120))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.5, 120))
    }

    if (ship.laser_level === 8) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.7, 125))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.7, 125))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.7, 125))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.7, 125))
    }

    if (ship.laser_level === 9) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 4.8, 130))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 4.8, 130))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 4.8, 130))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 4.8, 130))
    }

    if (ship.laser_level === 10) {
      let d = App.get_direction(ship)
      d = App.to_radians(d)
      let x = (ship_width / 2 * 0.6) * Math.cos(d)
      let y = (ship_width / 2 * 0.6) * Math.sin(d)

      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation, 5, 140))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation, 5, 140))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 15, 5, 140))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 15, 5, 140))
      lasers_to_fire.push(App.create_laser(ship.x + x, ship.y + y, ship_image.rotation + 30, 5, 140))
      lasers_to_fire.push(App.create_laser(ship.x - x, ship.y - y, ship_image.rotation - 30, 5, 140))
    }

    if (App.sound) {
      new Audio(`/audio/laser.ogg`).play()
    }

    App.last_fired = Date.now()
    App.emit_laser(lasers_to_fire)
  }
}