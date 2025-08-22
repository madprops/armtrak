App.create_background = () => {
  App.background = new createjs.Stage(`canvas`)
  let stars = 3000
  let star_field = new createjs.Shape()
  let star_small_radius_min = 1
  let star_small_radius_var = 2

  for (let i = 0; i < stars; i++) {
    let radius
    radius = star_small_radius_min + (Math.random() * star_small_radius_var)
    let color, color_type = Math.round(Math.random() * 2)

    switch (color_type) {
    case 0:
      color = `white`
      break
    case 1:
      color = `grey`
      break
    }

    star_field.graphics.beginFill(color)

      .drawPolyStar(
        Math.random() * App.bg_width,
        Math.random() * App.bg_height,
        radius,
        5 + Math.round(Math.random() * 2), // number of sides
        0.9, // pointyness
        Math.random() * 360, // rotation of the star
      )
  }

  App.background.canvas.width = 400
  App.background.canvas.height = 300

  App.x_offset = App.background.canvas.width * 0.2
  App.y_offset = App.background.canvas.height * 0.2

  App.background.regX = 0
  App.background.regY = 0

  App.background.addChild(star_field)
}

App.move_background = (x, y) => {
  App.background.regX = x
  App.background.regY = y
}

App.z_order = () => {
  App.background.setChildIndex(App.safe_zone, App.background.getNumChildren() - 1)

  for (let ship of App.enemy_ships) {
    App.background.setChildIndex(ship.container, App.background.getNumChildren() - 1)
  }

  App.background.setChildIndex(App.ship, App.background.getNumChildren() - 1)
}

App.get_random_coords = () => {
  let x = App.get_random_int(10, App.bg_width - 10)
  let y = App.get_random_int(10, App.bg_height - 10)
  return [x, y]
}