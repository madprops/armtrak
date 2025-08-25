App.get_direction = (container) => {
  let direction = ((container.children[0].rotation / 360) % 1) * 360

  if (direction < 0) {
    direction = 360 - Math.abs(direction)
  }

  if (direction >= 360) {
    direction = 0
  }

  return direction
}

App.to_radians = (degrees) => {
  return degrees * (Math.PI / 180)
}

App.get_vector_velocities = (container, speed) => {
  let direction = App.get_direction(container)
  let angle
  let x, y

  if (direction === 0) {
    x = 0
    y = -speed
    return [x, y]
  }

  if (direction === 90) {
    x = speed
    y = 0
    return [x, y]
  }

  if (direction === 180) {
    x = 0
    y = speed
    return [x, y]
  }

  if (direction === 270) {
    x = -speed
    y = 0
    return [x, y]
  }

  if ((direction > 0) && (direction < 90)) {
    angle = App.to_radians(90 - direction)
    x = Math.cos(angle) * speed
    y = - Math.sin(angle) * speed
    return [x, y]
  }

  if ((direction > 90) && (direction < 180)) {
    angle = App.to_radians(direction - 90)
    x = Math.cos(angle) * speed
    y = Math.sin(angle) * speed
    return [x, y]
  }

  if ((direction >= 181) && (direction <= 269)) {
    angle = App.to_radians(270 - direction)
    x = - Math.cos(angle) * speed
    y = Math.sin(angle) * speed
    return [x, y]
  }

  if ((direction > 270) && (direction < 360)) {
    angle = App.to_radians(direction - 270)
    x = - Math.cos(angle) * speed
    y = - Math.sin(angle) * speed
    return [x, y]
  }
}

App.get_random_int = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

App.space_word = (word) => {
  if (!word) {
    return ``
  }

  return Array.from(word).join(` `)
}

App.clean_username = (s) => {
  s = s.replace(/[^a-zA-Z0-9 ]/g, ``).trim()
  return s.replace(/\s+/g, ` `)
}

App.clean_string = (s) => {
  if (!s) {
    return ``
  }

  return s.replace(/</g, ``).trim().replace(/\s+/g, ` `)
}

App.padnum = (num, amount = 3) => {
  return String(num).padStart(amount, `0`)
}

App.copy_obj = (from, to, exclude = []) => {
  Object.keys(to).forEach(key => {
    if (exclude.includes(key)) {
      return
    }

    if (Object.prototype.hasOwnProperty.call(from, key)) {
      to[key] = from[key]
    }
  })
}

App.format_value = (value, adjustment = 1, precision = 1) => {
  return Math.round((value - adjustment) * Math.pow(10, precision)) / Math.pow(10, precision)
}

App.audio_context = new (window.AudioContext || window.webkitAudioContext)()
App.audio_buffers = {}
App.max_audios = 5

App.load_audio = async (what) => {
  if (App.audio_buffers[what]) {
    return App.audio_buffers[what]
  }

  let ext = `mp3`
  let response = await fetch(`/audio/${what}.${ext}`)
  let array_buffer = await response.arrayBuffer()
  let audio_buffer = await App.audio_context.decodeAudioData(array_buffer)

  App.audio_buffers[what] = audio_buffer
  return audio_buffer
}

App.play_audio = async (what) => {
  if (what === `explosion`) {
    for (let source of App.audios) {
      source.stop()
    }

    App.audios = []
  }
  else if (App.audios.length >= App.max_audios) {
    return
  }

  let audio_buffer = await App.load_audio(what)
  let source = App.audio_context.createBufferSource()
  source.buffer = audio_buffer

  let gain_node = App.audio_context.createGain()
  source.connect(gain_node)
  gain_node.connect(App.audio_context.destination)

  source.onended = () => {
    for (let [i, item] of App.audios.entries()) {
      if (item === source) {
        App.audios.splice(i, 1)
        break
      }
    }
  }

  App.audios.push(source)
  source.start(0)
}