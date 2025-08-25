App.setup_image = (image) => {
  let width = image.image.width
  let height = image.image.height

  if (width >= App.big_image_width) {
    let scale = App.big_image_width / width
    image.scaleX = scale
    image.scaleY = scale
  }
  else if (height >= App.big_image_height) {
    let scale = App.big_image_height / height
    image.scaleX = scale
    image.scaleY = scale
  }
}

App.place_image = (url, title) => {
  for (let image of App.images) {
    if (image.image && (image.image.src === url)) {
      return false
    }
  }

  let img = new Image()
  img.src = url

  img.onload = function() {
    let image = new createjs.Bitmap(img)

    if ((img.width > 1000) || (img.height > 1000)) {
      image.x = App.ship.x - ((img.width / 3) / 2) + (App.ship_width / 2)
      image.y = App.ship.y - ((img.height / 3) / 2) + (App.ship_height / 2)
    }
    else {
      image.x = App.ship.x - (img.width / 2) + (App.ship_width / 2)
      image.y = App.ship.y - (img.height / 2) + (App.ship_height / 2)
    }

    App.socket.emit(`image_placed`, {url, x: image.x, y: image.y, title})
  }

  img.onerror = function() {
    App.chat_announce(`Failed to load image: ` + url)
  }
}

App.image_placed = (data) => {
  let img_obj = new Image()
  img_obj.src = data.url
  let image = new createjs.Bitmap(img_obj)
  image.x = data.x
  image.y = data.y
  App.setup_image(image)
  App.push_image(image)
  App.add_to_background(image)

  if (!data.silent) {
    App.chat_announce(`${App.image_icon} ${data.title} (${data.username})`)
  }
}

App.push_image = (image) => {
  App.images.push(image)

  if (App.images.length > App.max_images) {
    App.background.removeChild(App.images[0])
    App.images.splice(0, 1)
  }
}

App.on_image_result = (data) => {
  App.place_image(data.image_url, data.title)
}

App.check_img = (msg) => {
  if (msg.startsWith(`img `)) {
    let q = msg.split(`img `)[1].trim()

    if (q !== ``) {
      App.img_search(q)
      return true
    }
  }

  return false
}

App.check_image = (msg) => {
  if (msg.indexOf(` `) === -1) {
    if (/\.(jpe?g|png)$/i.test(msg)) {
      for (let image of App.images) {
        if (image.image.src === msg) {
          return false
        }
      }

      App.place_image(msg)
      return true
    }
  }

  return false
}

App.img_search = (q) => {
  App.socket.emit(`image_search`, {query: q})
}

App.clear_images = () => {
  App.images = []

  for (let image of App.images) {
    App.background.removeChild(image)
  }

  App.images = []
}