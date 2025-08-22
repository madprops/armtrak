const fs = require(`fs`)
const path = require(`path`)

class Score {
  constructor(username, kills) {
    this.username = username
    this.kills = kills
  }
}

module.exports = (io, App) => {
  App.usernames = []
  App.images = []
  App.youtube_key = ``
  App.image_instance = ``
  App.image_scraper = ``
  App.scores = []
  App.max_username_length = 28

  App.read_file = (what) => {
    try {
      App[what] = fs.readFileSync(path.join(__dirname, `${what}.txt`), `utf8`).trim()
      console.log(`💾 ${what} loaded.`)
    }
    catch (error) {
      console.error(`Failed to load ${what}`, error.message)
    }
  }

  App.read_file(`youtube_key`)
  App.read_file(`image_instance`)
  App.read_file(`image_scraper`)

  io.on(`connection`, (socket) => {
    socket.on(`adduser`, (data) => {
      let username = App.clean_username(data.username)

      if (!username || (username.length > App.max_username_length)) {
        socket.disconnect()
        return
      }

      if (App.get_socket_by_username(username)) {
        socket.disconnect()
        return
      }

      socket.ak_username = App.add_username(username)

      socket.emit(`update`, {
        type: `username`,
        username: socket.ak_username,
        current_youtube: App.current_youtube,
      })

      socket.broadcast.emit(`update`, {
        type: `chat_announcement`,
        msg: socket.ak_username + ` has joined`,
      })
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

    socket.on(`ship_info`, (data) => {
      if (socket.ak_username !== undefined) {
        socket.broadcast.emit(`update`, {
          type: `ship_info`,
          username: socket.ak_username,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          visible: data.visible,
          model: data.model,
        })
      }
    })

    socket.on(`laser`, (data) => {
      if (socket.ak_username !== undefined) {
        socket.broadcast.emit(`update`, {type: `laser`, laser: data})
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

    socket.on(`image`, (data) => {
      if (socket.ak_username !== undefined) {
        App.add_image(data)

        socket.broadcast.emit(`update`, {
          type: `images`,
          images: [{url: data.url, x: data.x, y: data.y}],
        })
      }
    })

    socket.on(`get_images`, (data) => {
      if (socket.ak_username !== undefined) {
        socket.emit(`update`, {type: `images`, images: App.images})
      }
    })

    socket.on(`heartbeat`, (data) => {
      if (socket.ak_username === undefined) {
        socket.emit(`update`, {type: `connection_lost`})
      }
    })

    socket.on(`youtube_search`, (data) => {
      if ((socket.ak_username !== undefined) && data.query) {
        App.perform_youtube_search(data.query, socket.ak_username, (result) => {
          if (result.success) {
            App.current_youtube = {
              type: `youtube_result`,
              videoId: result.videoId,
              title: result.title,
              requestedBy: socket.ak_username,
            }

            io.sockets.emit(`update`, App.current_youtube)
          }
          else {
            socket.emit(`update`, {
              type: `youtube_error`,
              message: result.message,
            })
          }
        })
      }
    })

    socket.on(`image_search`, (data) => {
      if ((socket.ak_username !== undefined) && data.query) {
        App.perform_image_search(data.query, socket.ak_username, (result) => {
          if (result.success) {
            socket.emit(`update`, {
              type: `image_result`,
              imageUrl: result.imageUrl,
              title: result.title,
              requestedBy: socket.ak_username,
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
        let file_path = path.join(__dirname, `image_instance.txt`)
        let url = App.add_https(data.query)

        fs.writeFile(file_path, url, (err) => {
          if (err) {
            console.error(`Failed to update image_instance.txt:`, err.message)
            socket.emit(`update`, {type: `error`, message: `Failed to update image instance.`})
          }
          else {
            console.log(`image_instance.txt updated successfully`)
            socket.emit(`update`, {type: `success`, message: `Image instance updated.`})
            App.image_instance = url
          }
        })
      }
    })

    socket.on(`get_instance`, (data) => {
      let v = App.image_instance || `Empty`
      socket.emit(`update`, {type: `success`, message: `Instance: ${v}`})
    })

    socket.on(`change_scraper`, (data) => {
      if (data.query) {
        let file_path = path.join(__dirname, `image_scraper.txt`)

        fs.writeFile(file_path, data.query, (err) => {
          if (err) {
            console.error(`Failed to update image_scraper.txt:`, err.message)
            socket.emit(`update`, {type: `error`, message: `Failed to update image scraper.`})
          }
          else {
            console.log(`image_scraper.txt updated successfully`)
            socket.emit(`update`, {type: `success`, message: `Image scraper updated.`})
            App.image_scraper = data.query
          }
        })
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

  App.clean_string = (s) => {
    return s.replace(/</g, ``).trim().replace(/\s+/g, ` `)
  }

  App.clean_username = (s) => {
    s = s.replace(/[^a-zA-Z0-9 ]/g, ``).trim()
    return s.replace(/\s+/g, ` `)
  }

  App.get_random_int = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  App.add_username = (username) => {
    let keep_going = true
    let matched = false

    while (keep_going) {
      for (let uname of App.usernames) {
        if (uname === username) {
          matched = true
          break
        }
      }

      if (matched) {
        username = username + App.get_random_int(2, 9)
        keep_going = true
        matched = false
      }
      else {
        keep_going = false
      }
    }

    App.usernames.push(username)
    return username
  }

  App.remove_username = (username) => {
    for (let [i, uname] of App.usernames.entries()) {
      if (uname === username) {
        App.usernames.splice(i, 1)
      }
    }
  }

  App.add_image = (data) => {
    App.images.push(data)

    if (App.images.length > 20) {
      App.images.splice(0, 1)
    }
  }

  App.create_score = (username) => {
    let score = new Score(username, 0)
    App.scores.push(score)
    return score
  }

  App.remove_score = (username) => {
    for (let [i, score] of App.scores.entries()) {
      if (username === score.username) {
        App.scores.splice(i, 1)
        return true
      }
    }
  }

  App.get_score = (username) => {
    for (let score of App.scores) {
      if (username === score.username) {
        return score
      }
    }

    return App.create_score(username)
  }

  App.add_kill = (username) => {
    let score = App.get_score(username)
    score.kills += 1
    return score.kills
  }

  App.reset_kills = (username) => {
    let score = App.get_score(username)
    score.kills = 0
  }

  App.perform_youtube_search = (query, username, callback) => {
    if (!App.youtube_key) {
      callback({
        success: false,
        message: `YouTube API key not configured`,
      })

      return
    }

    let https = require(`https`)
    let query_string = require(`querystring`)

    let params = query_string.stringify({
      part: `snippet`,
      type: `video`,
      q: query,
      key: App.youtube_key,
      maxResults: 1,
    })

    let url = `https://www.googleapis.com/youtube/v3/search?${params}`

    https.get(url, (res) => {
      let data = ``

      res.on(`data`, (chunk) => {
        data += chunk
      })

      res.on(`end`, () => {
        try {
          let response = JSON.parse(data)

          if (response && response.items && (response.items.length > 0)) {
            let video = response.items[0]

            if (video.id && video.id.videoId) {
              callback({
                success: true,
                videoId: video.id.videoId,
                title: video.snippet.title,
              })
            }
            else {
              callback({
                success: false,
                message: `No valid video found`,
              })
            }
          }
          else {
            callback({
              success: false,
              message: `No search results found`,
            })
          }
        }
        catch (error) {
          console.error(`YouTube API response parsing error:`, error)
          callback({
            success: false,
            message: `Failed to parse YouTube response`,
          })
        }
      })
    })
      .on(`error`, (error) => {
        console.error(`YouTube API request error:`, error)
        callback({
          success: false,
          message: `YouTube search request failed`,
        })
      })
  }

  App.perform_image_search = (query, username, callback) => {
    if (!App.image_instance || !App.image_scraper) {
      callback({
        success: false,
        message: `Image search configuration not properly set`,
      })

      return
    }

    let https = require(`https`)
    let encoded_query = encodeURIComponent(query)
    let url = `${App.image_instance}/api/v1/images?s=${encoded_query}&scraper=${App.image_scraper}`
    console.log(url)

    https.get(url, (res) => {
      let data = ``

      res.on(`data`, (chunk) => {
        data += chunk
      })

      res.on(`end`, () => {
        try {
          let response = JSON.parse(data)

          if (response && response.image && (response.image.length > 0)) {
            let first_image = response.image[0]

            if (first_image.source && (first_image.source.length > 0) && first_image.source[0].url) {
              callback({
                success: true,
                imageUrl: first_image.source[0].url,
                title: first_image.title || `Image`,
              })
            }
            else {
              callback({
                success: false,
                message: `No valid image URL found`,
              })
            }
          }
          else {
            callback({
              success: false,
              message: `No image results found`,
            })
          }
        }
        catch (error) {
          callback({
            success: false,
            message: `Failed to parse image search response`,
          })
        }
      })
    })
      .on(`error`, (error) => {
        callback({
          success: false,
          message: `Image search request failed`,
        })
      })
  }

  App.add_https = (url) => {
    if (!url.startsWith(`https://`)) {
      return `https://${url}`
    }

    return url
  }

  App.run_command = (cmd) => {
    let split = cmd.split(` `)

    if (cmd.startsWith(`kick `)) {
      let username = split[1].trim()
      let socket = App.get_socket_by_username(username)

      if (socket) {
        App.kick_socket(socket)
      }
    }
  }

  App.get_socket_by_username = (username) => {
    if (!username) {
      return null
    }

    username = username.toLowerCase()

    for (let socket of io.sockets.sockets.values()) {
      if (!socket.ak_username) {
        continue
      }

      if (socket.ak_username.toLowerCase() === username) {
        return socket
      }
    }

    return null
  }

  App.kick_socket = (socket) => {
    socket.emit(`update`, {
      type: `kicked`,
    })

    socket.disconnect()
  }
}