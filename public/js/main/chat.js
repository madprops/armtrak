App.yt_search = (q) => {
  App.socket.emit(`youtube_search`, {query: q})
}

App.send_to_chat = () => {
  let send = true
  let msg = App.clean_string($(`#chat_input`).val())
  $(`#chat_input`).val(``)

  if (App.check_yt(msg)) {
    send = false
  }

  if (App.check_img(msg)) {
    send = false
  }

  if (App.check_image(msg)) {
    send = false
  }

  if (App.msg_is_ok(msg)) {
    App.update_chat(App.username, msg)

    if (send) {
      App.socket.emit(`sendchat`, {msg})
    }
  }
}

App.goto_bottom = () => {
  $(`#chat_area`).scrollTop($(`#chat_area`)[0].scrollHeight)
}

App.start_chat = () => {
  $(`#chat_area`).append(`<div class="clear">&nbsp;</div>`)
  $(`#chat_input`).focus()
  App.goto_bottom()
}

App.chat_urlize = (msg) => {
  return msg.replace(/[^\s"\\]+\.\w{2,}[^\s"\\]*/g, `<a class="chat" target="_blank" href="$&"> $& </a>`)
}

App.chat_announce = (msg) => {
  let fmt = App.format_announcement_msg(msg)
  $(`#chat_area`).append(fmt)
  App.goto_bottom()
}

App.update_chat = (uname, msg) => {
  let fmt = App.format_msg(uname, msg)
  $(`#chat_area`).append(fmt)
  App.goto_bottom()
}

App.msg_is_ok = (msg) => {
  if ((msg.length > 0) && (msg.length < 444)) {
    return true
  }

  return false
}

App.greet = (username) => {
  App.chat_announce(`🚀 ${username} has joined`)
}

App.format_msg = (uname, msg) => {
  let s = App.chat_urlize(App.clean_string(msg))
  return `<div class="chat_message"><b>${uname}:</b>&nbsp;&nbsp;${s}</div><div>&nbsp;</div>`
}

App.format_announcement_msg = (msg) => {
  return `<div class="chat_announcement">${msg}</div> <div>&nbsp;</div>`
}

App.on_kicked = () => {
  App.chat_announce(`😭 You were disconnected`)
  DOM.el(`#canvas_container`).classList.add(`kicked`)
}

App.already_playing = (data) => {
  App.chat_announce(`${data.username} is already playing. Refresh and try again`)
}

App.on_join = (data) => {
  App.username = data.username
  App.youtube = data.youtube

  App.greet(data.username)
  App.chat_announce(`Move with the arrow keys and shoot with spacebar`)
  App.chat_announce(`Place an image on the map (visible to everyone) with "img something" or by pasting an image url`)
  App.chat_announce(`Play a youtube song (for everyone) by searching it with "yt name of song", or pasting a youtube url`)
  App.chat_announce(`Upgrade your ship by destroying other players`)
}

App.on_disconnection = (data) => {
  App.chat_announce(`➡️ ${data.username} has left`)
  App.remove_enemy(data.username)
}