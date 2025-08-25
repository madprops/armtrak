module.exports = (io, App) => {
  App.run_command = (cmd) => {
    let split = cmd.split(` `)

    if (split.length === 1) {
      if (cmd === `instance`) {
        App.read_file(`image_instance`)
        console.log(App.image_instance || `No instance set`)
      }
      else if (cmd === `scraper`) {
        App.read_file(`image_scraper`)
        console.log(App.image_scraper || `No scraper set`)
      }
      else if (cmd === `clear_images`) {
        App.images = []
        App.write_file(`images`, JSON.stringify(App.images))

        io.sockets.emit(`update`, {
          type: `clear_images`,
        })
      }
      else if (cmd === `stop_youtube`) {
        App.youtube = undefined
        App.write_file(`youtube`, ``)

        io.sockets.emit(`update`, {
          type: `stop_youtube`,
        })
      }
    }
    else if (cmd.startsWith(`kick `)) {
      let username = split[1].trim()
      let socket = App.get_socket_by_username(username)

      if (socket) {
        App.kick_socket(socket)
      }
    }
    else if (split[0] === `instance`) {
      let value = split.slice(1).join(` `).trim()
      App.write_file(`image_instance`, value)
      console.log(`Instance set to: ${value}`)
    }
    else if (split[0] === `scraper`) {
      let value = split.slice(1).join(` `).trim()
      App.write_file(`image_scraper`, value)
      console.log(`Scraper set to: ${value}`)
    }
    else if (split[0] === `youtube`) {
      let data = {}
      data.query = split.slice(1).join(` `).trim()
      data.username = `👾`
      App.do_youtube_search(data)
    }
    else if (split[0] === `youtube_key`) {
      let value = split.slice(1).join(` `).trim()
      App.write_file(`youtube_key`, value)
      console.log(`YouTube key updated`)
    }
  }
}