const fs = require('fs')
const orderedEmojiData = fs.readFileSync('./emoji-order.txt', 'utf-8')
const groupedEmojiData = fs.readFileSync('./emoji-group.txt', 'utf-8')
const VARIATION_16 = String.fromCodePoint(0xfe0f)
const SKIN_TONE_VARIATION_DESC = /\sskin\stone(?:,|$)/

// Final data holder
const orderedEmoji = []
const dataByEmoji = {}
const dataByGroup = []
const emojiComponents = {}

// The group data tells if the emoji is one of the following:
//   component
//   fully-qualified
//   minimally-qualified
//   unqualified
//
// We only want fully-qualified emoji in the output data

// # group: Smileys & Emotion
//          |1--------------|
//
const GROUP_REGEX = /^#\sgroup:\s(?<name>.+)/

// 1F646 200D 2640 FE0F                       ; fully-qualified     # 🙆‍♀️ E4.0 woman gesturing OK
//                                              |1------------|      |2--||3-| |4---------------|
// 1F469 200D 1F469 200D 1F467