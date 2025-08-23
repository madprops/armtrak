App.update_hud = () => {
  let health = App.padnum(App.ship.health, 3)
  $(`#health`).html(`Health: ` + health + `/` + App.ship.max_health)
  $(`#max_speed`).html(`Max Speed: ` + (Math.round((App.ship.max_speed - 1) * 10) / 10))
}

App.on_respawn = (data) => {
  App.ship = data.ship
  let coords_1 = App.ship.x - App.background.canvas.width / 2
  let coords_2 = App.ship.y - App.background.canvas.height / 2
  App.move_background(coords_1, coords_2)
  App.update_hud()
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
  console.log(App.ship_image.rotation)
}

App.on_join = (data) => {
  App.username = data.username
  App.youtube = data.youtube
  App.create_ship(data.ship)
  App.greet(data.username)
  App.show_intro()
}

App.move = () => {
  App.move_lasers()
}