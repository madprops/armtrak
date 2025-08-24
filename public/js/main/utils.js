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