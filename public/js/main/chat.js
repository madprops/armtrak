App.yt_search = (q) => {
  App.socket.emit(`youtube_search`, {query: q})
}

App.send_to_chat = () => {
  let send = true
  let input = DOM.el(`#chat_input`)
  let msg = App.clean_string(input.value)
  input.value = ``
  input.focus()

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
  DOM.el(`#chat_area`).scrollTop = DOM.el(`#chat_area`).scrollHeight
}

App.start_chat = () => {
  let clear = DOM.create(`div`, `clear`)
  clear.innerHTML = `&nbsp;`
  DOM.el(`#chat_area`).append(clear)
  DOM.el(`#chat_input`).focus()
  App.goto_bottom()
}

App.chat_urlize = (msg) => {
  return msg.replace(/[^\s"\\]+\.\w{2,}[^\s"\\]*/g, `<a class="chat" target="_blank" href="$&"> $& </a>`)
}

App.chat_announce = (msg) => {
  let fmt = App.format_announcement_msg(msg)
  DOM.el(`#chat_area`).append(fmt)
  App.goto_bottom()
}

App.update_chat = (uname, msg) => {
  let fmt = App.format_msg(uname, msg)
  DOM.el(`#chat_area`).append(fmt)
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
  let el = DOM.create(`div`)
  el.innerHTML = `<div class="chat_message"><b>${uname}:</b>&nbsp;&nbsp;${s}</div><div>&nbsp;</div>`
  return el
}

App.format_announcement_msg = (msg) => {
  let el = DOM.create(`div`)
  el.innerHTML = `<div class="chat_announcement">${msg}</div><div>&nbsp;</div>`
  return el
}

App.on_kicked = () => {
  App.chat_announce(`😭 You were disconnected`)
  DOM.el(`#canvas_container`).classList.add(`kicked`)
}

App.already_playing = (data) => {
  App.chat_announce(`${data.username} is already playing. Refresh and try again`)
}

App.on_disconnection = (data) => {
  App.chat_announce(`➡️ ${data.username} has left`)
  App.remove_enemy(data.username)
}

App.show_intro = () => {
  App.chat_announce(`Move with the arrow keys and shoot with spacebar`)
  App.chat_announce(`Place an image on the map (visible to everyone) with "img something" or by pasting an image url`)
  App.chat_announce(`Play a youtube song (for everyone) by searching it with "yt name of song", or pasting a youtube url`)
  App.chat_announce(`Upgrade your ship by destroying other players`)
}

App.clear_chat_input = () => {
  DOM.el(`#chat_input`).value = ``
}