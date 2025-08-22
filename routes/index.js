const express = require(`express`)
const router = express.Router()

router.get(`/`, function(req, res, next) {
  let c = {}
  c.title = `trak`
  res.render(`main`, c)
})

module.exports = router
