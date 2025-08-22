module.exports = (io, App) => {
  App.usernames = []
  App.images = []
  App.youtube_key = ``
  App.image_instance = ``
  App.image_scraper = ``
  App.scores = []
  App.max_username_length = 28

  require(`../sockets/utils.js`)(io, App)
  require(`../sockets/media.js`)(io, App)
  require(`../sockets/players.js`)(io, App)
  require(`../sockets/commands.js`)(io, App)
  require(`../sockets/sockets.js`)(io, App)

  App.init = () => {
    App.read_file(`images`, `json`, [])
    App.start_game()
  }

  App.init()
}