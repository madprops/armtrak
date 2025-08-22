const fs = require(`fs`)
const express = require(`express`)
const path = require(`path`)
const bodyParser = require(`body-parser`)
const routes = require(`./routes/index`)

let app = express()

// view engine setup
app.set(`views`, path.join(__dirname, `views`))
app.set(`view engine`, `ejs`)

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, `public`)))

app.use(`/`, routes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error(`Not Found`)
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get(`env`) === `development`) {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.render(`error`, {
      message: err.message,
      error: err,
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  res.render(`error`, {
    message: err.message,
    error: {},
  })
})

function bundle_main() {
  let main_dir = path.join(__dirname, `public`, `js`, `main`)
  let files = fs.readdirSync(main_dir)

  let contents = [
    `const App = {}`,
  ]

  for (let file of files) {
    if (file.endsWith(`.js`)) {
      let file_path = path.join(main_dir, file)
      let content = fs.readFileSync(file_path, `utf8`)
      contents.push(content)
    }
  }

  let bundle = contents.join(`\n\n`)
  let bundle_path = path.join(__dirname, `public`, `js`, `bundle.main.js`)
  fs.writeFileSync(bundle_path, bundle)
}

bundle_main()
module.exports = app
