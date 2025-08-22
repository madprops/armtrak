App.setup_lasers = () => {
  App.laser_img = new Image()
  App.laser_img.src = `img/laser.png`

  App.laser_img.onload = () => {
    App.laser_width = App.laser_img.width
    App.laser_height = App.laser_img.height
  }
}

App.fire_laser = () => {
  App.socket.emit(`fire_laser`)
}

App.emit_laser = (lasers) => {
  let laser = []

  for (let item of lasers) {
    laser.push({
      username: App.username,
      x: item.x,
      y: item.y,
      rotation: item.children[0].rotation,
      vx: item.vx,
      vy: item.vy,
      max_distance: item.max_distance,
    })
  }

  App.socket.emit(`laser`, {laser})
}

App.create_enemy_laser = (enemy_laser) => {
  let laser_image = new createjs.Bitmap(App.laser_img)

  let laser = new createjs.Container()
  laser.x = enemy_laser.x
  laser.y = enemy_laser.y
  laser.distance = 0
  laser.max_distance = enemy_laser.max_distance
  laser.username = enemy_laser.username

  let laser_width = App.laser_img.width
  let laser_height = App.laser_img.height

  laser_image.regX = laser_width / 2
  laser_image.regY = laser_height / 2
  laser_image.x = laser_width / 2
  laser_image.y = laser_height / 2
  laser_image.rotation = enemy_laser.rotation

  laser.addChild(laser_image)
  App.background.addChild(laser)

  laser.vx = enemy_laser.vx
  laser.vy = enemy_laser.vy

  App.enemy_lasers.push(laser)
}

App.fire_enemy_laser = (data) => {
  for (let laser of data.laser.laser) {
    App.create_enemy_laser(laser)
  }

  if (App.sound) {
    new Audio(`/audio/laser.ogg`).play()
  }
}