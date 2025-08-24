App.start_socket = () => {
  App.socket = io()

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
    else if (data.type === `update_ships`) {
      App.on_update_ships(data)
    }
    else if (data.type === `laser`) {
      App.create_lasers(data)
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

  App.socket.emit(`adduser`, {username: App.username})
}