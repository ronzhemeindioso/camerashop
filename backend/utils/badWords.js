const Filter = require('bad-words')

const filter = new Filter()   // replaces each bad word with ****

// Masks bad words in a review comment, e.g. "this is shit" -> "this is ****".
// bad-words throws on empty / punctuation-only strings, so those are returned untouched.
const maskBadWords = (text) => {
    if (typeof text !== 'string' || !text.trim()) return text
    try {
        return filter.clean(text)
    } catch (err) {
        return text
    }
}

module.exports = { maskBadWords }