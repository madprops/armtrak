const fs = require(`fs`)
const path = require(`path`)

module.exports = (io, App) => {
  App.create_file = (file_path) => {
    fs.writeFileSync(file_path, ``, `utf8`)
  }

  App.read_file = (what, mode = `normal`, def_value = ``) => {
    try {
      let file_path = path.join(__dirname, `../data/${what}.txt`)

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
      console.error(`Failed to load ${what}:`, error.message)
    }
  }

  App.write_file = (what, value, set = true) => {
    value = value.trim()

    if (!value) {
      return
    }

    let file_path = path.join(__dirname, `../data/${what}.txt`)

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

  App.add_https = (url) => {
    if (!url.startsWith(`https://`)) {
      return `https://${url}`
    }

    return url
  }

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

  App.to_radians = (degrees) => {
    return degrees * (Math.PI / 180)
  }

  App.get_socket_by_username = (username) => {
    for (let [id, socket] of io.sockets.sockets) {
      if (socket.ak_username === username) {
        return socket
      }
    }

    return null
  }
}