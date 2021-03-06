const express = require('express')
require('express-async-errors')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const config = require('./utils/config')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

mongoose
  .connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => logger.info('Connected to DB'))
  .catch((err) => logger.error(err))

app.use(middleware.getJwtToken)

app.use('/api/login', loginRouter)
app.use('/api/users', usersRouter)
app.use('/api/blogs', blogsRouter)

if (process.env.NODE_ENV === 'test') {
  const testRouter = require('./controllers/test')
  app.use('/api/testing', testRouter)
}

app.use(middleware.errorHandler)
app.use(middleware.unknownEndpoint)

module.exports = app
