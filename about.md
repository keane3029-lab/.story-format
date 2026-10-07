# About .STORY

.STORY is a lightweight plain text format for writing narrative as a series of days. Each day has optional metadata at the top and a body of dialogue and narration underneath. It is meant to be easy to write by hand, easy to read, and easy to parse.

## Why it exists

Most story tools lock your writing into a heavy editor or a complicated markup language. A .STORY file is just text. You can write one on a phone, in a terminal, or in any editor, and a small parser turns it into structured data your code can use.

## What a file looks like

```
day: 1
title: The Awakening
weather: Rain
---
# First scene
ALICE: Hello world. Time is 10:30 AM
* Thunder rumbles in the distance.
===
day: 2
title: Shadows
mood: Tense
---
bob: What was that noise
* Steps echo down the hall.
```

## Syntax at a glance

| Syntax | Meaning |
| --- | --- |
| `===` | Separates one day from the next |
| `---` | Separates a day's headers from its body |
| `key: value` | A header. `day`, `title`, `scene`, and `mood` are reserved. Other keys are kept in `extra` |
| `speaker: text` | A line of dialogue. Speaker names are lower-cased by the parser |
| `* text` | A line of narration |
| `# text` | A comment, ignored by the parser |

## What is in this repo

- `parseStory.js` is the parser and serializer, with zero dependencies
- `sample.story` is an example file
- `open-storyfiles.py` is a helper script for opening .story files
- `package.json` holds the project and test config

## Design goals

- **Zero dependencies.** Plain vanilla JavaScript.
- **Works everywhere.** Runs in Node.js with `require` and in the browser with a script tag.
- **Forgiving.** The parser never throws on bad input. It returns `warnings` with line numbers instead.
- **Lossless.** Parsed stories can be serialized back into standard .STORY text.

## License

MIT. See the LICENSE file.
