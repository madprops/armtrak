App.bg_height = 2000
App.bg_width = 2000
App.left_arrow = false
App.right_arrow = false
App.up_arrow = false
App.down_arrow = false
App.lasers = []
App.enemy_lasers = []
App.last_fired = Date.now()
App.enemy_ships = []
App.sound = true
App.music = true
App.images = []
App.min_max_health = 100
App.max_max_health = 200
App.min_max_speed = 2
App.min_laser_level = 1
App.max_max_speed = 3
App.max_laser_level = 10
App.laser_hit = 20
App.max_username_length = 28
App.dot_radius = 45
App.dot_radius_small = 28
App.label_size = 8
App.image_icon = `🖼️`
App.radio_icon = `🔊`
App.max_images = 18
App.big_image_width = 2560

App.init = () => {
  App.prepare_game()
}