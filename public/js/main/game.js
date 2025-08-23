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
      frames: { width: 96, height: 96, regX: 0, regY: 0 },
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

App.start_socket = () => {
  App.socket = io() // Connects to same origin by default
  // Or if you need to specify the server:
  // socket = io(`http://armtrak.net:3000`)

  App.get_username()

  App.socket.on(`update`, (data) => {
    if (data.type === `chat_msg`) {
      App.update_chat(data.username, data.msg)
    }
    else if (data.type === `joined`) {
      App.greet(data.username)
    }
    else if (data.type === `already`) {
      App.already_playing(data)
    }
    else if (data.type === `on_join`) {
      App.on_join(data)
    }
    else if (data.type === `youtube_result`) {
      App.youtube = data
      App.play_youtube()
    }
    else if (data.type === `youtube_error`) {
      App.chat_announce(`YouTube search failed: ` + data.message)
    }
    else if (data.type === `image_result`) {
      App.on_image_result(data)
    }
    else if (data.type === `image_error`) {
      App.chat_announce(`Image search failed: ` + data.message)
    }
    else if (data.type === `chat_announcement`) {
      App.chat_announce(data.msg)
    }
    else if (data.type === `ship_updates`) {
      App.update_enemy_ships(data)
    }
    else if (data.type === `laser`) {
      App.fire_enemy_laser(data)
    }
    else if (data.type === `success`) {
      App.chat_announce(data.message)
    }
    else if (data.type === `error`) {
      App.chat_announce(data.message)
    }
    else if (data.type === `destroyed`) {
      App.on_destroyed(data)
    }
    else if (data.type === `respawn`) {
      App.on_respawn(data)
    }
    else if (data.type === `image_placed`) {
      App.image_placed(data)
    }
    else if (data.type === `connection_lost`) {
      window.location = `/`
    }
    else if (data.type === `disconnection`) {
      App.on_disconnection(data)
    }
    else if (data.type === `kicked`) {
      App.on_kicked()
    }
  })

  App.socket.emit(`adduser`, { username: App.username })
}