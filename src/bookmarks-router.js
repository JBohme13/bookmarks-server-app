const express = require('express')
const uuidv4 = require('uuid/v4')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bookmarksService = require('./bookmarksService')
const bodyParser = express.json()
const xss = require('xss')
const path = require('path')

const sanatizeBookmarks = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
})

bookmarksRouter
  .route('/')
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
    const newBookmark = { title, url, description, rating }

    for (const [key, value] of Object.entries(newBookmark)) {
        if(value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })
        }
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

    bookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
    )
    .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${id}`))
          .json(sanatizeBookmarks(bookmark))
    })
    .catch(next)
})

bookmarksRouter
  .route('/:id')
  .all((req, res, next) => {
      bookmarksService.getById(
          req.app.get('db'),
          req.params.id
      )
      .then(bookmark => {
          if(!bookmark) {
              return res
                  .status(404).json({
                      error: { message: `Bookmark doesn't exist` }
                  })
          }
              res.bookmark = bookmark
              next()
      })
      .catch(next)
  })
  
  .get((req, res, next) => {
      const { id } = req.params
      const knexInstance = req.app.get('db')
      bookmarksService.getById(knexInstance, id)
        .then(bookmark => {
            res.json(sanatizeBookmarks(bookmark))
        })
        .catch(next)
  })

  .delete((req, res) => {
      bookmarksService.deleteBookmark(
          req.app.get('db'),
          req.params.id
      )
      .then(() => {
          res.status(204).end()
      })
      .catch(next)
  })

  .patch(bodyParser, (req, res, next) => {
      const { title, url, description, rating } = req.body
      const bookmarkToUpdate = { title, url, description, rating }

      const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
          return res.status(400).json({
              error: {message: `Request body must contain one of 'title', 'url', 'description', or 'rating'`}
          })
      }

      bookmarksService.updateBookmark(
          req.app.get('db'),
          req.params.id,
          bookmarkToUpdate
      )
      .then(() => {
          res.status(204).end()
      })
      .catch(next)
  })

  module.exports = bookmarksRouter