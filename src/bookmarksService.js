const bookmarksSevice = {
    
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks_table')
    },

    insertBookmark(knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks_table')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    getById(knex, id) {
        return knex
            .from('bookmarks_table')
            .select('*')
            .where('id', id)
            .first()
    },

    deleteBookmark(knex, id) {
        return knex('bookmarks_table')
            .where({id})
            .delete()
    },

    updateBookmark(knex, id, newBookmarkField) {
        return knex('bookmarks_tables')
            .where({id})
            .update(newBookmarkField)
    }
}

module.exports = bookmarksSevice