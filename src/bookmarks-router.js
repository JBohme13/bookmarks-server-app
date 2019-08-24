const express = require('express')
const uuidv4 = require('uuid/v4')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bookmarksService = require('./bookmarksService')
const bodyParser = express.json()

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    bookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res
            .send(200)
            .json(bookmarks)
        })
        .catch(err => {
            console.log(err)
            next()
        })
  })

  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;

    if (!title) {
        logger.error('title is required')
        return res.status(400).send('invalid data')
    }

    if (!url) {
        logger.error('url is required')
        return res.status(400).send('invalid data')
    }

    if (!description) {
        logger.error('description is required')
        return res.status(400).send('invalid data')
    }

    if (!rating) {
        logger.error('rating is required')
        return res.status(400).send('invalid data')
    }

    if (title.length < 3) {
        logger.error('title must be at least three characters')
        return res.status(400).send('invalid data')
    }

    const ratingNum = parseFloat(rating)

    if (Number.isNaN(ratingNum)) {
        logger.error('rating must be a number')
        return res.status(400).send('invalid data')
    }

    if(ratingNum < 1 || ratingNum > 5) {
        logger.error('rating must be a number between 1 and 5')
        return res.status(400).send('invalid data')
    }

    const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i

    if(!urlRegex.test(url)) {
        logger.error('valid url required')
        return res.status(400).send('invalid data')
    }

    const id = uuidv4();

    const bookmark = {
        id,
        title,
        url,
        description,
        rating
    }

    bookmarks.push(bookmark)

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark)
})

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
      const { id } = req.params
      const knexInstance = req.app.get('db')
      bookmarksService.getById(knexInstance, id)
        .then(bookmark => {
            if (!bookmark) {
                return res
                    .status(404)
                    .json({
                        error: { message: `Bookmark doesn't exist`}
                    })
            }
            res.json(bookmark)
        })
        .catch(next)
  })

  .delete((req, res) => {
      const { id } = req.params

      const bookmark = bookmarks.findIndex(mark => mark.id == id)

      if(!bookmark) {
          logger.error(`Bookmark with id ${id} not found`)
          res.status(404).send('Not found')
      }

      bookmarks.splice(bookmark, 1)

      res.status(204).end()
  })

  module.exports = bookmarksRouter