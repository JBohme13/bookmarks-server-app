function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'thinkful',
            url: 'http://thinkful.com',
            description: 'home page for my bootcamp',
            rating: "3.0"
        },
        {
            id: 2,
            title: 'google',
            url: 'http://google.com',
            description: 'search my bugs here',
            rating: "4.0"
        },
        {
            id: 3,
            title: 'my github',
            url: 'https://github.com/JBohme13',
            description: 'where you can find my projects',
            rating: "4.4"
        },
        {
            id: 4,
            title: 'React native docs',
            url: 'https://facebook.github.io/react-native',
            description: 'documentation for React native framework',
            rating: "3.3"
        },
    ];
}
module.exports = {
    makeBookmarksArray,
}