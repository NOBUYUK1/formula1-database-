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
// 1F469 200D 1F469 200D 1F467 200D 1F467     ; fully-qualified     # 👩‍👩‍👧‍👧 E2.0 family: woman, woman, girl, girl
//                                              |1------------|      |2-| |3| |4-----------------------------|
//
const EMOJI_REGEX = /^[^#]+;\s(?<type>[\w-]+)\s+#\s(?<emoji>\S+)\sE(?<emojiversion>\d+\.\d)\s(?<desc>.+)/
let currentGroup = null

groupedEmojiData.split('\n').forEach(line => {
  const groupMatch = line.match(GROUP_REGEX)
  if (groupMatch) {
    currentGroup = groupMatch.groups.name
  } else {
    const emojiMatch = line.match(EMOJI_REGEX)
    if (emojiMatch) {
      const {groups: {type, emoji, desc, emojiversion}} = emojiMatch
      if (type === 'fully-qualified') {
        if (line.match(SKIN_TONE_VARIATION_DESC)) return
        dataByEmoji[emoji] = {
          name: null,
          slug: null,
          group: currentGroup,
          emoji_version: emojiversion,
          unicode_version: null,
          skin_tone_support: null
        }
      } else if (type === 'component') {
        emojiComponents[slugify(desc)] = emoji
      }
    }
  }
})


// 'flag: St. Kitts & Nevis' -> 'flag_st_kitts_nevis'
// 'family: woman, woman, boy, boy' -> 'family_woman_woman_boy_boy'
// 'A button (blood type)' -> 'a_button'
// 'Cocos (Keeling) Islands' -> 'cocos_islands'
// 'keycap *' -> 'keycap_asterisk'
//
// Returns machine readable emoji short code
function slugify(str) {
  const SLUGIFY_REPLACEMENT = {
    "*": "asterisk",
    "#": "number sign"
  }

  for (key in SLUGIFY_REPLACEMENT) {
    str = str.replace(key, SLUGIFY_REPLACEMENT[key])
  }

  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.+\)/g, '')
    .trim()
    .replace(/[\W|_]+/g, '_').toLowerCase()
}

// U+1F44B ; 6.0 # 👋 waving hand
//          |1--| |2-|3----------|
//
// U+1F442 U+1F3FB ; 8.0 # 👂🏻 ear: light skin tone
//                  |1--| |2-|3--||4--------------|
//
// U+1F469 U+200D U+1F467 U+200D U+1F467 ; 6.0 # 👩‍👧‍👧 family: woman, girl, girl
//                                        |1--| |2-|3-----||4----------------|
//
const ORDERED_EMOJI_REGEX = /.+\s;\s(?<version>[0-9.]+)\s#\s(?<emoji>\S+)\s(?<name>[^:]+)(?::\s)?(?<desc>.+)?/

let curren