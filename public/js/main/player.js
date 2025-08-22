App.upgrade = () => {
  let nums = []

  if (App.ship.laser_level < App.max_laser_level) {
    nums.push(1)
  }

  if (App.ship.max_health < App.max_max_health) {
    nums.push(2)
  }

  if (App.ship.max_speed < App.max_max_speed) {
    nums.push(3)
  }

  if (nums.length === 0) {
    return false
  }

  let num = nums.sort(function(){return 0.5 - Math.random()})[0]

  if (num === 1) {
    App.increase_laser_level()
    return true
  }

  if (num === 2) {
    App.increase_max_health()
    return true
  }

  if (num === 3) {
    App.increase_max_speed()
    return true
  }
}

App.increase_laser_level = () => {
  App.ship.laser_level += 1
}

App.increase_max_health = () => {
  App.ship.max_health += 10
}

App.increase_max_speed = () => {
  App.ship.max_speed += 0.10
}

App.update_hud = () => {
  let health = App.padnum(App.ship.health, 3)
  $(`#health`).html(`Health: ` + health + `/` + App.ship.max_health)
  $(`#max_speed`).html(`Max Speed: ` + (Math.round((App.ship.max_speed - 1) * 10) / 10))
}

App.respawn = () => {
  window.setTimeout(function() {
    let coords = App.get_random_coords()
    App.ship.x = coords[0]
    App.ship.y = coords[1]
    App.ship.max_health = App.min_max_health
    App.ship.health = App.ship.max_health
    App.ship.max_speed = App.min_max_speed
    App.ship.laser_level = App.min_laser_level
    App.move_background(coords[0] - App.background.canvas.width / 2, coords[1] - App.background.canvas.height / 2)
    App.ship.visible = true
    App.update_hud()
  }, 5000)
}

App.reduce_ship_speed = () => {
  App.ship.speed -= 0.2

  if (App.ship.speed < 0) {
    App.ship.speed = 0
  }
}

App.increase_ship_speed = () => {
  if (App.ship.speed < App.ship.max_speed) {
    App.ship.speed += App.ship.max_speed * 0.10
  }
}

App.turn_left = () => {
  App.ship_image.rotation -= 3
}

App.turn_right = () => {
  App.ship_image.rotation += 3
}

App.move = () => {
  if (App.ship.visible) {
    App.move_ship()
  }

  App.move_lasers()

  if (App.left_arrow) {
    App.turn_left()
    return true
  }

  if (App.right_arrow) {
    App.turn_right()
    return true
  }
}

App.reset_arrows = () => {
  App.left_arrow = false
  App.right_arrow = false
  App.up_arrow = false
  App.down_arrow = false
}