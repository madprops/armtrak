App.update_minimap = () => {
  let minimap = document.getElementById(`minimap`)
  let context = minimap.getContext(`2d`)
  let minimap_width = 400

  // Use the main canvas dimensions to calculate the minimap's internal height
  let main_canvas_width = 1200
  let main_canvas_height = 800
  let minimap_height = Math.round(minimap_width * (main_canvas_height / main_canvas_width))

  // Set the minimap's drawing surface to match the calculated dimensions
  minimap.width = minimap_width
  minimap.height = minimap_height

  // Now, calculate the scale based on the background, but use the
  // minimap's and background's dimensions for the ratios.
  let bg_width = App.bg_width // 2000
  let bg_height = App.bg_height // 2000
  let scaleX = minimap_width / bg_width
  let scaleY = minimap_height / bg_height

  context.clearRect(0, 0, minimap.width, minimap.height)

  // Draw the main canvas's visible area on the minimap
  // This rectangle will show what part of the world is currently visible
  let visibleX = App.background.canvas.x * scaleX
  let visibleY = App.background.canvas.y * scaleY
  let visibleWidth = main_canvas_width * scaleX
  let visibleHeight = main_canvas_height * scaleY

  context.beginPath()
  context.rect(visibleX, visibleY, visibleWidth, visibleHeight)
  context.strokeStyle = `#FFFFFF`
  context.lineWidth = 2
  context.stroke()

  // Ship dot
  if ((App.ship !== undefined) && App.ship.visible) {
    let x = App.ship.x * scaleX
    let y = App.ship.y * scaleY
    let radius = App.dot_radius * scaleX
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI, false)
    context.fillStyle = `#3399FF`
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = `#003300`
    context.stroke()
  }

  // Enemy dots
  for (let ship of App.enemy_ships) {
    let enemy = ship.container

    if (enemy.visible) {
      let x = enemy.x * scaleX
      let y = enemy.y * scaleY
      let radius = App.dot_radius * scaleX

      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI, false)
      context.fillStyle = `#FF6666`
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = `#003300`
      context.stroke()
    }
  }

  // Placed images
  for (let image of App.images) {
    let imgWidth = image.image?.width || 0
    let imgHeight = image.image?.height || 0
    let scaleX_img = image.scaleX || 1
    let scaleY_img = image.scaleY || 1
    let x = (image.x + (imgWidth * scaleX_img / 2)) * scaleX
    let y = (image.y + (imgHeight * scaleY_img / 2)) * scaleY
    let radius = App.dot_radius_small * scaleX

    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI, false)
    context.fillStyle = `#66FF66`
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = `#003300`
    context.stroke()
  }
}