class Score {
  constructor(username, kills) {
    this.username = username
    this.kills = kills
  }
}

module.exports = (io, App) => {
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