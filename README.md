<p align="center">
  <img src="story-logo.png" alt=".STORY Format Logo" width="100%">
</p>

# .STORY Format Parser & Serializer

A lightweight JavaScript parser and serializer for the custom `.STORY` plain text file format, plus a Python port. Zero dependencies, works in **Node.js** and the **browser**.

---

## Format Overview

A `.STORY` document is a list of days. Each day has optional headers, then a body of dialogue and narration.

```story
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


---

## Features

- **Zero Dependencies:** vanilla JavaScript.
- **Universal Export:** works with `require` in Node and a `<script>` tag in the browser.
- **Non-Throwing Parser:** bad lines produce `warnings` with line numbers instead of exceptions.
- **Full Serialization:** turns the parsed objects back into `.STORY` text.
- **Python Port:** `open-storyfiles.py` does the same parse and serialize in Python and can load files from disk.

---

## Syntax Rules

1. **Day Separator (`===`):** on its own line, splits the file into days.
2. **Header-Body Separator (`---`):** on its own line, ends the header and starts the body of a day.
3. **Headers (`key: value`):** keys are lowercased. The reserved keys `day`, `title`, `scene` and `mood` map onto the day object. Any other key (like `weather` in the example) is stored in `extra`.
4. **Day Number:** `day` becomes a number when it parses as one, otherwise it stays a string.
5. **Dialogue (`speaker: text`):** speaker names are lowercased, so `ALICE:` becomes `alice`.
6. **Narration (`* text`):** lines starting with `*` become narration entries.
7. **Comments (`# comment`):** lines starting with `#` are ignored, and so are blank lines.
8. **Bad Lines:** a header line with no colon is skipped with a warning. A body line with no colon is kept as narration and also gives a warning.

---

## Output Shape

`parseStory(text)` returns `{ days, warnings }`.

```js
{
  days: [
    {
      day: 1,                  // number, or string if not numeric, or null
      title: "The Awakening",  // string or null
      scene: null,             // string or null
      mood: null,              // string or null
      extra: { weather: "Rain" },
      entries: [
        { type: "dialogue",  speaker: "alice", text: "Hello world. Time is 10:30 AM" },
        { type: "narration", speaker: null,    text: "Thunder rumbles in the distance." }
      ]
    }
  ],
  warnings: [
    { line: 3, message: "Invalid header syntax: missing colon in line \"...\"" }
  ]
}
```

`warnings[].line` is the line number inside that day's block, counting from 1.

`serializeStory(days)` takes the `days` array and returns `.STORY` text. Parsing then serializing keeps the data, but comments and blank lines are dropped, and speakers come out lowercase.

---

## Installation & Setup

```bash
git clone https://github.com/keane3029-lab/.story-format.git
cd .story-format
```

---

## Usage

### Node.js

```javascript
const { parseStory, serializeStory } = require('./parseStory.js');

const storyText = `
day: 1
title: Prologue
---
* The adventure begins.
ALICE: Are you ready
`;

const { days, warnings } = parseStory(storyText);
console.log(days);

const rawText = serializeStory(days);
console.log(rawText);
```

### Browser

```html
<script src="parseStory.js"></script>
<script>
  const input = "day: 1\n---\nalice: Ready when you are.";
  const { days, warnings } = parseStory(input);
  console.log(days);
</script>
```

### Python

`open-storyfiles.py` has `parse_story`, `load_story_file` and `serialize_story`, with the same output shape as the JS version.

```python
from importlib.machinery import SourceFileLoader

story = SourceFileLoader("story", "open-storyfiles.py").load_module()

result = story.load_story_file("sample.story")   # raises FileNotFoundError if missing
print(result["days"])
print(result["warnings"])

print(story.serialize_story(result["days"]))
```

Run it directly to parse `sample.story` and print the JSON:

```bash
python open-storyfiles.py
```

If `sample.story` is missing, it runs a built-in inline test instead.

---

## Running Tests

Run the built-in self-test in Node.js:

```bash
npm test
```

---

## License

[MIT](LICENSE)

---

---

## About

- [About .STORY](about.md)
- [Creator's Note](creators-note.md)
