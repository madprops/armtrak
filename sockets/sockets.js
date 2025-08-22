module.exports = (io, App) => {
  io.on(`connection`, (socket) => {
    socket.on(`adduser`, (data) => {
      let username = App.clean_username(data.username)

      if (!username || (username.length > App.max_username_length)) {
        socket.disconnect()
        return
      }

      if (App.get_socket_by_username(username)) {
        socket.emit(`update`, {
          type: `already`,
          username,
        })

        socket.disconnect()
        return
      }

      socket.ak_username = App.add_username(username)
      App.create_ship(socket)

      socket.emit(`update`, {
        type: `on_join`,
        username: socket.ak_username,
        youtube: App.read_file(`youtube`),
      })

      socket.broadcast.emit(`update`, {
        type: `joined`,
        username: socket.ak_username,
        ship: socket.ak_ship,
      })

      if (App.images.length) {
        for (let image of App.images) {
          image.silent = true
          io.sockets.emit(`update`, image)
        }
      }
    })

    socket.on(`sendchat`, (data) => {
      if (socket.ak_username !== undefined) {
        socket.broadcast.emit(`update`, {
          type: `chat_msg`,
          username: socket.ak_username,
          msg: App.clean_string(data.msg),
        })
      }
    })

    socket.on(`ship_update`, (data) => {
      if (socket.ak_username !== undefined) {
        App.update_ship(data)
      }
    })

    socket.on(`fire_laser`, (data) => {
      if (socket.ak_username !== undefined) {
        App.fire_laser(data)
      }
    })

    socket.on(`destroyed`, (data) => {
      if (socket.ak_username !== undefined) {
        let kills = App.add_kill(data.destroyed_by)
        App.reset_kills(socket.ak_username)

        io.sockets.emit(`update`, {
          type: `destroyed`,
          username: socket.ak_username,
          destroyed_by: data.destroyed_by,
          kills,
        })
      }
    })

    socket.on(`image_placed`, (data) => {
      App.on_image_placed(socket, data)
    })

    socket.on(`get_images`, (data) => {
      if (socket.ak_username !== undefined) {
        socket.emit(`update`, {type: `images`, images: App.images})
      }
    })

    socket.on(`youtube_search`, (data) => {
      if ((socket.ak_username !== undefined) && data.query) {
        App.do_youtube_search(data, socket)
      }
    })

    socket.on(`image_search`, (data) => {
      if ((socket.ak_username !== undefined) && data.query) {
        App.perform_image_search(data.query, socket.ak_username, (result) => {
          if (result.success) {
            socket.emit(`update`, {
              type: `image_result`,
              image_url: result.imageUrl,
              title: result.title,
              username: socket.ak_username,
            })
          }
          else {
            socket.emit(`update`, {
              type: `image_error`,
              message: result.message,
            })
          }
        })
      }
    })

    socket.on(`change_instance`, (data) => {
      if (data.query) {
        App.write_file(`image_instance`, data.query)
      }
    })

    socket.on(`get_instance`, (data) => {
      let v = App.image_instance || `Empty`
      socket.emit(`update`, {type: `success`, message: `Instance: ${v}`})
    })

    socket.on(`change_scraper`, (data) => {
      if (data.query) {
        App.write_file(`image_scraper`, data.query)
      }
    })

    socket.on(`get_scraper`, (data) => {
      let v = App.image_scraper || `Empty`
      socket.emit(`update`, {type: `success`, message: `Scraper: ${v}`})
    })

    socket.on(`disconnect`, () => {
      if (socket.ak_username !== undefined) {
        App.remove_username(socket.ak_username)
        App.remove_score(socket.ak_username)

        socket.broadcast.emit(`update`, {
          type: `disconnection`,
          username: socket.ak_username,
        })
      }
    })
  })
}