App.activate_key_detection = () => {
  $(`#canvas`).click(function() {
    $(`#chat_input`).blur()
  })

  $(document).keydown(function(e) {
    $(`#chat_input`).focus()

    if (e.key === `Enter`) {
      App.send_to_chat()
      e.preventDefault()
      return false
    }
    else if (e.key === `ArrowLeft`) {
      App.left_arrow = true
    }
    else if (e.key === `ArrowUp`) {
      App.up_arrow = true
    }
    else if (e.key === `ArrowRight`) {
      App.right_arrow = true
    }
    else if (e.key === `ArrowDown`) {
      App.down_arrow = true
    }
    else if (e.key === ` `) {
      if ($(`#chat_input`).val().trim() === ``) {
        $(`#chat_input`).val(``)
        App.fire_laser()
        e.preventDefault()
      }
    }

    App.activity = true
  })

  $(document).keyup(function(e) {
    if (e.key === `ArrowLeft`) {
      App.left_arrow = false
    }
    else if (e.key === `ArrowUp`) {
      App.up_arrow = false
    }
    else if (e.key === `ArrowRight`) {
      App.right_arrow = false
    }
    else if (e.key === `ArrowDown`) {
      App.down_arrow = false
    }

    App.activity = true
  })
}

App.setup_clicks = () => {
  document.addEventListener(`click`, () => {
    setTimeout(() => {
      App.play_youtube()
    }, 500)
  }, {once: true})

  DOM.el(`#sound_toggle`).addEventListener(`click`, () => {
    App.toggle_sound()
  })

  DOM.el(`#music_toggle`).addEventListener(`click`, () => {
    App.toggle_music()
  })
}

App.setup_focus = () => {
  document.addEventListener(`blur`, () => {
    App.reset_arrows()
  })
}

App.reset_arrows = () => {
  App.left_arrow = false
  App.right_arrow = false
  App.up_arrow = false
  App.down_arrow = false
  App.activity = true
}