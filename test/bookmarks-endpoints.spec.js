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
})