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

  App.init = () => {
    App.read_file(`images`, `json`, [])
  }

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

      socket.emit(`update`, {
        type: `username`,
        username: socket.ak_username,
        youtube: App.read_file(`youtube`),
      })

      socket.broadcast.emit(`update`, {
        type: `joined`,
        username: socket.ak_username,
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

    socket.on(`image_placed`, (data) => {
      if (socket.ak_username !== undefined) {
        let obj = {
          type: `image_placed`,
          url: data.url,
          x: data.x,
          y: data.y,
          title: data.title,
          username: socket.ak_username,
        }

        App.add_image(obj)
        io.sockets.emit(`update`, obj)
      }
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

    App.write_file(`images`, JSON.stringify(App.images), false)
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
    App.read_file(`youtube_key`)

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
                video_id: video.id.videoId,
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
    App.read_file(`image_instance`)
    App.read_file(`image_scraper`)

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

    if (split.length === 1) {
      if (cmd === `instance`) {
        App.read_file(`image_instance`)
        console.log(App.image_instance || `No instance set`)
      }
      else if (cmd === `scraper`) {
        App.read_file(`image_scraper`)
        console.log(App.image_scraper || `No scraper set`)
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

  App.create_file = (file_path) => {
    fs.writeFileSync(file_path, (mode === `json` ? JSON.stringify(def_value) : def_value), 'utf8')
  }

  App.read_file = (what, mode = `normal`, def_value = ``) => {
    try {
      let file_path = path.join(__dirname, `data/${what}.txt`)

      if (!fs.existsSync(file_path)) {
        App.create_file(file_path)
      }

      let s = fs.readFileSync(file_path, `utf8`).trim()

      if (mode === `json`) {
        if (s) {
          App[what] = JSON.parse(s)
        }
        else {
          App[what] = def_value
        }
      }
      else {
        App[what] = s
      }
    }
    catch (error) {
      console.error(`Failed to load ${what}`, error.message)
    }
  }

  App.write_file = (what, value, set = true) => {
    value = value.trim()

    if (!value) {
      return
    }

    let file_path = path.join(__dirname, `data/${what}.txt`)

    if (!fs.existsSync(file_path)) {
      App.create_file(file_path)
    }

    if ([`image_instance`].includes(what)) {
      value = App.add_https(value)
    }

    fs.writeFile(file_path, value, (err) => {
      if (err) {
        console.error(`Failed to update ${what}.txt:`, err.message)
      }
      else if (set) {
        App[what] = value
      }
    })
  }

  App.do_youtube_search = (data, socket) => {
    let username

    if (socket) {
      username = socket.ak_username
    }
    else {
      username = data.username
    }

    if (!username) {
      return
    }

    App.perform_youtube_search(data.query, username, (result) => {
      if (result.success) {
        let obj = {
          type: `youtube_result`,
          video_id: result.video_id,
          title: result.title,
          username,
        }

        io.sockets.emit(`update`, obj)
        App.write_file(`youtube`, JSON.stringify(obj))
      }
      else {
        socket.emit(`update`, {
          type: `youtube_error`,
          message: result.message,
        })
      }
    })
  }

  App.init()
}