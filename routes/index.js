let express = require(`express`)
let router = express.Router()

router.get(`/`, function(req, res, next) {
  let c = {}
  c.title = `trak`
  res.render(`main`, c)
})

module.exports = router
