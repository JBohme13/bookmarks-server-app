const knex = require('knex')
const app = require('../src/app.js')
const { makeBookmarksArray } = require('./bookmarks.fixtures')


describe.only('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from database', () => db.destroy())

    before('clean up table', () => db('bookmarks_table').truncate())

    afterEach('cleanup', () => db('bookmarks_table').truncate())

    describe('GET /bookmarks', () => {
        context('Given bookmarks has data', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert test data', () => {
                return db
                    .into('bookmarks_table')
                    .insert(testBookmarks)
            })

            it('GET /bookmarks returns 200 and all bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })

        context('Given bookmarks has no data', () => {
            it('GET /bookmarks returns 200 and an empty array', () => {
                return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
            })
        })
    })

    describe('GET /bookmarks/:id', () => {
        context('Given bookmarks has data', () => {
            context('Given an xss attack article', () => {
                const maliciousArticle = {
                  id: 911,
                  title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                  url: 'http://www.thisIsATest.com',
                  description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                  rating: 3
                }
        
                beforeEach('insert malicious article', () => {
                  return db
                      .insert([maliciousArticle])
                      .into('blogful_articles')
                })
        
                it('removes xss content', () => {
                  return supertest(app)
                      .get(`/api/articles/${maliciousArticle.id}`)
                      .expect(200)
                      .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                      })
                })
              })

            const testBookmarks = makeBookmarksArray()

            beforeEach('insert test data', () => {
                return db
                    .into('bookmarks_table')
                    .insert(testBookmarks)
            })

            it('GET /bookmarks/:id returns 200 and specified bookmark', () => {
                const bookmarkId = 3
                const selectedBookmark = testBookmarks[bookmarkId -1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, selectedBookmark)
            })
        })

        context('Given bookmarks has no data', () => {
            it('Get /bookmarks/:id returns 404', () => {
                const bookmarkId = 333
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist`}})
            })
        })
    })

    describe('POST /api/bookmarks/:id', () => {
      it(`creates a new bookmark, responding with 201 and the new article`, () => {
          this.retries(3)
          const newBookmark = {
              title: 'Test new title',
              url: 'http://testNewArticle.com',
              description: 'test new description',
              rating: 3
          }
          return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(201)
          .expect(res => {
              expect(res.body.title).to.eql(newBookmark.title)
              expect(res.body.url).to.eql(newBoomkark.url)
              expect(res.body.description).to.eql(newBookmark.description)
              expect(res.body.rating).to.eql(newBookmark.rating)
              expect(res.body).to.have.property('id')
              expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
          })
          .then(postRes => 
            supertest(app)
                .get(`/api/bookmarks/${postres.body.id}`)
                .expect(postres.body)
          )
      })

      const requiredFields = ['title', 'url', 'description', 'rating']

      requiredFields.forEach(field => {
          const newBookmark = {
            title: 'Test new title',
            url: 'http://testNewArticle.com',
            description: 'test new description',
            rating: 3
          }

          it(`responds with a 400 and an error when the '${field}' is missing`, () => {
              delete newBookmark[field]

              return supertest(app)
                 .post('/api/bookmarks')
                 .send(newBookmark)
                 .expect(400, {
                     error: { message: `Missing '${field}' in request body`}
                 })
          })
      })
    })

    describe(`Delete /api/bookmarks/:id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .insert(testBookmarks)
                    .into('bookmarks_table')
            })

            it(`responds with 204 and removes the bookmark`, () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete('/api/bookmarks')
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/spi/bookmarks')
                            .expect(expectedBookmarks)
                    )
            })
        })

        context('Given no bookmarks in database', () => {
            it('responds with a 401', () => {
                const bookmarkId = 12345
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .expect(401, {
                        error: { message: `Bookmark doesn't exist`}
                    })
            })
        })
    })

    describe(`PATCH /api/articles/:id`, () => {
        context(`Given no Bookmarks`, () => {
            it('responds with a 404', () => {
                const bookmarkId = 7777
                return supertest(app)
                    .patch(`/api/articles/${bookmarkId}`)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist`}
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_table')
                    .insert(testBookmarks)
            })

            it('responds with a 204 and updates the article', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated test title',
                    url: 'http://updatedUrl.com',
                    description: 'updated test descrption',
                    rating: 3
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate -1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${id}`)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .expect(expectedBookmark)
                    )
            })

            it('responds with 400 when no required field supplied', () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookarks/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: { message: `Request body must contain one of 'title', 'url', 'description', or 'rating'`}
                    })
            })

            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated test title'
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate -1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/articles/${idToUpdate}`)
                            .expect(expectedBookmark)
                    )
            })
        })
    })
})