const express = require('express')
const {
    db
  } = require('./db/index.js')

const PORT = 3535
const app = express()
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

require('./db/models/userModel')
app.use(require('./routes'))

// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
//   });

  
app.use(function(err, req, res, next) {
    console.log(err.stack)

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });

db.sync({/*
  force: true */
/*
  truncate: true */
}).then(() => {
    console.log('Database synced')
    app.listen(PORT, () => {
      console.log('Server started http://localhost:'+PORT)
    })
  })
  .catch(console.error)