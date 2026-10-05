# .STORY Format Parser & Serializer

A lightweight JavaScript parser and serializer for the custom `.STORY` plain text file format. Built with zero dependencies and cross-environment compatibility for **Node.js** and **Browser** environments.

---

## Format Overview

A `.STORY` document structures narrative data into days containing optional headers and body interactions.

```story
day: 1
title: The Awakening
weather: Rain
---
# First scene
ALICE: Hello world! Time is 10:30 AM
* Thunder rumbles in the distance.
===
day: 2
title: Shadows
mood: Tense
---
bob: What was that noise?
* Steps echo down the hall.
```

---

## Features

- **Zero Dependencies:** Standard, vanilla JavaScript.
- **Universal Export:** Works seamlessly across Node.js (`require`) and Browser (`<script>` tag) runtimes.
- **Non-Throwing Parser:** Returns detailed `warnings` with line numbers for malformed lines instead of throwing syntax runtime errors.
- **Full Serialization:** Losslessly converts structured story objects back into standard `.STORY` formatted text.

---

## Syntax Rules

1. **Day Separator (`===`):** Separates days within a story file.
2. **Header-Body Separator (`---`):** Divides header metadata from dialogue/narration lines within each day block.
3. **Headers (`key: value`):** Reserved keys (`day`, `title`, `scene`, `mood`) map directly onto the day object. Custom/unknown keys are captured in `extra`.
4. **Dialogue (`speaker: text`):** Dialogue lines are converted to lower-cased speaker identifiers (`speaker`) with body text (`text`).
5. **Narration (`* text`):** Lines beginning with an asterisk are parsed as `type: "narration"`.
6. **Comments (`# comment`):** Lines starting with `#` are ignored during parsing.

---

## Installation & Setup

Clone the repository to your local machine:

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
ALICE: Are you ready?
`;

// Parse text to object structure
const { days, warnings } = parseStory(storyText);
console.log(days);

// Serialize object structure back to .STORY format
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

---

## Running Tests

Run the built-in self-test script in Node.js:

```bash
npm test
```

---

## License

[MIT](LICENSE)