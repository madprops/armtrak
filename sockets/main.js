const fs = require(`fs`)
const path = require(`path`)

module.exports = (io, App) => {
  App.usernames = []
  App.images = []
  App.youtube_key = ``
  App.image_instance = ``
  App.image_scraper = ``
  App.scores = []
  App.max_username_length = 28

  let sockets_dir = path.join(__dirname, `../sockets`)

  fs.readdirSync(sockets_dir).forEach(file => {
    if (file !== `main.js` && file.endsWith(`.js`)) {
      require(path.join(sockets_dir, file))(io, App)
    }
  })

  App.init = () => {
    App.read_file(`images`, `json`, [])
    App.start_game()
  }

  App.init()
}