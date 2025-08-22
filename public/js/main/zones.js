App.show_safe_zone = () => {
  let image = new Image()
  image.src = `img/safe_zone.png`
  App.safe_zone = new createjs.Bitmap(image)
  App.background.addChild(App.safe_zone)

  image.onload = function() {
    App.safe_zone.x = (App.bg_width / 2) - (image.width / 2)
    App.safe_zone.y = (App.bg_height / 2) - (image.height / 2)
    App.safe_zone_radius = image.height / 2
  }
}

App.check_safe_zone = () => {
  if ((Math.pow((App.ship.x + (App.ship_width / 2)) - App.bg_width / 2, 2) + Math.pow((App.ship.y + (App.ship_height / 2)) - App.bg_height / 2, 2)) < Math.pow(App.safe_zone_radius, 2)) {
    App.in_safe_zone = true
  }
  else {
    App.in_safe_zone = false
  }
}