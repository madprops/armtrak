module.exports = (io, App) => {
  App.on_image_placed = (socket, data) => {
    if (socket.ak_username !== undefined) {
      let obj = {
        type: `image_placed`,
        url: data.url,
        x: data.x,
        y: data.y,
        title: data.title,
        username: socket.ak_username,
      }

      App.add_image(obj)
      io.sockets.emit(`update`, obj)
    }
  }

  App.do_youtube_search = (data, socket) => {
    let username

    if (socket) {
      username = socket.ak_username
    }
    else {
      username = data.username
    }

    if (!username) {
      return
    }

    App.perform_youtube_search(data.query, username, (result) => {
      if (result.success) {
        let obj = {
          type: `youtube_result`,
          video_id: result.video_id,
          title: result.title,
          username,
        }

        io.sockets.emit(`update`, obj)
        App.write_file(`youtube`, JSON.stringify(obj))
      }
      else {
        socket.emit(`update`, {
          type: `youtube_error`,
          message: result.message,
        })
      }
    })
  }

  App.perform_image_search = (query, username, callback) => {
    App.read_file(`image_instance`)
    App.read_file(`image_scraper`)

    if (!App.image_instance || !App.image_scraper) {
      callback({
        success: false,
        message: `Image search configuration not properly set`,
      })

      return
    }

    let https = require(`https`)
    let encoded_query = encodeURIComponent(query)
    let url = `${App.image_instance}/api/v1/images?s=${encoded_query}&scraper=${App.image_scraper}`

    https.get(url, (res) => {
      let data = ``

      res.on(`data`, (chunk) => {
        data += chunk
      })

      res.on(`end`, () => {
        try {
          let response = JSON.parse(data)

          if (response && response.image && (response.image.length > 0)) {
            let first_image = response.image[0]

            if (first_image.source && (first_image.source.length > 0) && first_image.source[0].url) {
              callback({
                success: true,
                imageUrl: first_image.source[0].url,
                title: first_image.title || `Image`,
              })
            }
            else {
              callback({
                success: false,
                message: `No valid image URL found`,
              })
            }
          }
          else {
            callback({
              success: false,
              message: `No image results found`,
            })
          }
        }
        catch (error) {
          callback({
            success: false,
            message: `Failed to parse image search response`,
          })
        }
      })
    })
      .on(`error`, (error) => {
        callback({
          success: false,
          message: `Image search request failed`,
        })
      })
  }

  App.perform_youtube_search = (query, username, callback) => {
    App.read_file(`youtube_key`)

    if (!App.youtube_key) {
      callback({
        success: false,
        message: `YouTube API key not configured`,
      })

      return
    }

    let https = require(`https`)
    let query_string = require(`querystring`)

    let params = query_string.stringify({
      part: `snippet`,
      type: `video`,
      q: query,
      key: App.youtube_key,
      maxResults: 1,
    })

    let url = `https://www.googleapis.com/youtube/v3/search?${params}`

    https.get(url, (res) => {
      let data = ``

      res.on(`data`, (chunk) => {
        data += chunk
      })

      res.on(`end`, () => {
        try {
          let response = JSON.parse(data)

          if (response && response.items && (response.items.length > 0)) {
            let video = response.items[0]

            if (video.id && video.id.videoId) {
              callback({
                success: true,
                video_id: video.id.videoId,
                title: video.snippet.title,
              })
            }
            else {
              callback({
                success: false,
                message: `No valid video found`,
              })
            }
          }
          else {
            callback({
              success: false,
              message: `No search results found`,
            })
          }
        }
        catch (error) {
          console.error(`YouTube API response parsing error:`, error)
          callback({
            success: false,
            message: `Failed to parse YouTube response`,
          })
        }
      })
    })
      .on(`error`, (error) => {
        console.error(`YouTube API request error:`, error)
        callback({
          success: false,
          message: `YouTube search request failed`,
        })
      })
  }

  App.add_image = (data) => {
    App.images.push(data)

    if (App.images.length > 20) {
      App.images.splice(0, 1)
    }

    App.write_file(`images`, JSON.stringify(App.images), false)
  }
}