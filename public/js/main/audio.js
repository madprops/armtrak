App.play_yt = (id) => {
  if (App.music) {
    if (App.loaded_youtube === id) {
      return
    }

    App.loaded_youtube = id
    $(`#yt_player`).attr(`src`, `https://www.youtube.com/embed/` + id + `?&autoplay=1&enablejsapi=1&version=3`)
  }
}

App.play_youtube = () => {
  let data = App.youtube

  if (!data) {
    return
  }

  App.play_yt(data.video_id)
  App.chat_announce(`${App.radio_icon} ${data.title} (${data.username})`)
}

App.check_yt = (msg) => {
  if (msg.startsWith(`yt `)) {
    let q = msg.split(`yt `)[1].trim()

    if (q !== ``) {
      App.yt_search(q)
      return true
    }
  }
  else {
    let expr = /(youtu\.be\/|[?&]v=)([^&]+)/
    let result = msg.match(expr)

    if (result) {
      App.play_yt(result[2])
      return true
    }
  }

  return false
}

App.toggle_sound = () => {
  App.sound = !App.sound

  if (App.sound) {
    $(`#sound_toggle`).html(`Turn Off Sound`)
  }
  else {
    $(`#sound_toggle`).html(`Turn On Sound`)
  }
}

App.toggle_music = () => {
  App.music = !App.music

  if (App.music) {
    $(`#music_toggle`).html(`Turn Off Music`)
    App.play_youtube()
  }
  else {
    $(`#music_toggle`).html(`Turn On Music`)
    $(`#yt_player`).attr(`src`, ``)
    App.loaded_youtube = null
  }
}