// Self-test for the .STORY parser. Run with: npm test
const assert = require("assert");
const { parseStory, serializeStory } = require("./parseStory.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok   - " + name);
  } catch (err) {
    console.error("FAIL - " + name + "\n       " + err.message);
    process.exitCode = 1;
  }
}

test("module loads and exports both functions", () => {
  assert.strictEqual(typeof parseStory, "function");
  assert.strictEqual(typeof serializeStory, "function");
});

test("parses the README example", () => {
  const text = [
    "day: 1", "title: The Awakening", "weather: Rain", "---",
    "# First scene",
    "ALICE: Hello world. Time is 10:30 AM",
    "* Thunder rumbles in the distance.",
    "===",
    "day: 2", "title: Shadows", "mood: Tense", "---",
    "bob: What was that noise",
    "* Steps echo down the hall."
  ].join("\n");
  const { days, warnings } = parseStory(text);
  assert.strictEqual(warnings.length, 0);
  assert.strictEqual(days.length, 2);
  assert.strictEqual(days[0].day, 1);
  assert.strictEqual(days[0].title, "The Awakening");
  assert.deepStrictEqual(days[0].extra, { weather: "Rain" });
  assert.deepStrictEqual(days[0].entries[0], {
    type: "dialogue", speaker: "alice", text: "Hello world. Time is 10:30 AM"
  });
  assert.deepStrictEqual(days[0].entries[1], {
    type: "narration", speaker: null, text: "Thunder rumbles in the distance."
  });
  assert.strictEqual(days[1].mood, "Tense");
});

test("day number is numeric only when fully numeric", () => {
  assert.strictEqual(parseStory("day: 7\n---\n* x").days[0].day, 7);
  assert.strictEqual(parseStory("day: 2b\n---\n* x").days[0].day, "2b");
  assert.strictEqual(parseStory("day: 1.5\n---\n* x").days[0].day, "1.5");
});

test("a day with only a title is kept", () => {
  const { days } = parseStory("title: Lonely Title\n---\n");
  assert.strictEqual(days.length, 1);
  assert.strictEqual(days[0].title, "Lonely Title");
});

test("bad lines warn instead of throwing", () => {
  const { days, warnings } = parseStory("day: 1\nnot a header\n---\nno colon here");
  assert.strictEqual(warnings.length, 2);
  assert.strictEqual(days[0].entries[0].type, "narration");
  assert.strictEqual(days[0].entries[0].text, "no colon here");
});

test("non-string input returns a warning", () => {
  const { days, warnings } = parseStory(null);
  assert.strictEqual(days.length, 0);
  assert.strictEqual(warnings.length, 1);
});

test("windows line endings parse the same", () => {
  const { days, warnings } = parseStory("day: 1\r\n---\r\nalice: hi\r\n* wave");
  assert.strictEqual(warnings.length, 0);
  assert.strictEqual(days[0].entries.length, 2);
});

test("parse then serialize then parse round-trips", () => {
  const text = "day: 1\ntitle: T\nweather: Rain\n---\nalice: hi\n* wave\n===\nday: 2\n---\nbob: yo";
  const first = parseStory(text).days;
  const second = parseStory(serializeStory(first)).days;
  assert.deepStrictEqual(second, first);
});

test("serialize rejects non-arrays", () => {
  assert.strictEqual(serializeStory("nope"), "");
});

console.log("\n" + passed + " passed" + (process.exitCode ? ", some failed" : ""));