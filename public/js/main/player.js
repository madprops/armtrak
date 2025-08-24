App.update_hud = () => {
  if (!App.ship) {
    return
  }

  let health = App.padnum(App.ship.health, 3)
  $(`#health`).html(`Health: ` + health + `/` + App.ship.max_health)
  $(`#max_speed`).html(`Max Speed: ` + App.format_value(App.ship.max_speed))
  $(`#laser_level`).html(`Laser Level: ` + App.ship.laser_level)
}

App.on_respawn = (data) => {
  App.copy_obj(data.ship, App.ship)
  let coords_1 = App.ship.x - App.background.canvas.width / 2
  let coords_2 = App.ship.y - App.background.canvas.height / 2
  App.move_background(coords_1, coords_2)
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

App.on_join = (data) => {
  App.username = data.username
  App.youtube = data.youtube
  App.create_ship(data.ship)
  App.update_minimap()
  App.greet(data.username)
  App.show_intro()
}

App.move = () => {
  App.move_lasers()
}

App.on_upgrade = (data) => {
  App.chat_announce(`👽 Upgraded ${data.what}`)
  App.copy_ship(data.ship)
}