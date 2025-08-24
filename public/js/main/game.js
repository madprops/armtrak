const UPDATE_FPS = 30

App.prepare_game = () => {
  App.setup_explosions()
  App.setup_lasers()
  App.start_chat()
  App.activate_key_detection()
  App.setup_clicks()
  App.setup_focus()
  App.create_background()
  App.show_safe_zone()
  App.start_socket()
  App.do_game_update()
  App.game_loop()
}

App.do_game_update = () => {
  if (App.activity) {
    App.socket.emit(`ship_update`, {
      up_arrow: App.up_arrow,
      down_arrow: App.down_arrow,
      left_arrow: App.left_arrow,
      right_arrow: App.right_arrow,
    })

    App.activity = false
  }

  setTimeout(() => {
    App.do_game_update()
  }, 1000 / UPDATE_FPS)
}

App.setup_explosions = () => {
  App.explosion_image = new Image()
  App.explosion_image.src = `/img/explosion.png`

  App.explosion_image.onload = () => {
    App.explosion_sheet = new createjs.SpriteSheet({
      images: [App.explosion_image],
      frames: {width: 96, height: 96, regX: 0, regY: 0},
      animations: {
        explode: [0, 71, false],
      },
    })
  }
}

App.get_username = () => {
  let keep_naming = true

  while (keep_naming) {
    App.username = App.clean_username(prompt(`Pick Your Name`))

    if ((App.username === null) || (App.username.length < 1) ||
      (App.username.length > App.max_username_length) ||
      (App.username.indexOf(`<`) !== -1)) {
      keep_naming = true
    }
    else {
      keep_naming = false
    }
  }
}

App.game_loop = () => {
  if (App.ship) {
    App.move()
    App.background.update()
  }

  setTimeout(App.game_loop, 1000 / 60)
}