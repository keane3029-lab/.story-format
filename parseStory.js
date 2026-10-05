// parseStory.js
// Parser and Serializer for the .STORY plain text file format.
// Compatible with Node.js and Browser environments.

function parseStory(text) {
  const days = [];
  const warnings = [];

  // Guard against null, undefined, or non-string inputs
  if (typeof text !== "string") {
    warnings.push({ line: 1, message: "Input is not a string." });
    return { days, warnings };
  }

  // Handle empty input string
  if (text.trim() === "") {
    return { days, warnings };
  }

  // Normalize line endings (\r\n -> \n) while keeping original line numbers intact
  const rawLines = text.split(/\r?\n/);

  // Group raw lines into day blocks based on '===' boundaries
  const rawBlocks = [];
  let currentBlockLines = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const lineContent = rawLines[idx];
    const originalLineNum = idx + 1;

    if (lineContent.trim() === "===") {
      rawBlocks.push(currentBlockLines);
      currentBlockLines = [];
    } else {
      currentBlockLines.push({ content: lineContent, lineNum: originalLineNum });
    }
  }
  rawBlocks.push(currentBlockLines);

  const RESERVED_HEADER_KEYS = new Set(["day", "title", "scene", "mood"]);
  const seenDayNumbers = new Set();

  for (const blockLines of rawBlocks) {
    // Check if the block is empty or contains only whitespace lines
    const nonBlankLines = blockLines.filter(function(item) {
      return item.content.trim() !== "";
    });

    if (nonBlankLines.length === 0) {
      // Edge case: empty day block between '===' lines is silently skipped
      continue;
    }

    // Find the '---' separator line
    let separatorIndex = -1;
    for (let i = 0; i < blockLines.length; i++) {
      if (blockLines[i].content.trim() === "---") {
        separatorIndex = i;
        break;
      }
    }

    let headerItems = [];
    let bodyItems = [];

    if (separatorIndex === -1) {
      // Edge case: Block has no '---' line; treat every line as body and issue warning
      const firstLineNum = blockLines[0].lineNum;
      warnings.push({
        line: firstLineNum,
        message: "Day block missing '---' separator; all lines treated as body."
      });
      bodyItems = blockLines;
    } else {
      headerItems = blockLines.slice(0, separatorIndex);
      bodyItems = blockLines.slice(separatorIndex + 1);
    }

    // Initialize day record structure
    const dayRecord = {
      day: null,
      title: null,
      scene: null,
      mood: null,
      extra: {},
      lines: []
    };

    // --- PARSE HEADER LINES ---
    for (let h = 0; h < headerItems.length; h++) {
      const item = headerItems[h];
      const trimmed = item.content.trim();
      if (trimmed === "") continue; // Ignore blank lines in header

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) {
        // Edge case: Header line missing colon
        warnings.push({
          line: item.lineNum,
          message: "Header line missing colon: " + JSON.stringify(trimmed)
        });
        continue;
      }

      const key = trimmed.substring(0, colonIdx).trim().toLowerCase();
      const value = trimmed.substring(colonIdx + 1).trim();

      if (key === "day") {
        const parsedNum = Number(value);
        if (value !== "" && !isNaN(parsedNum)) {
          dayRecord.day = parsedNum;
          if (seenDayNumbers.has(parsedNum)) {
            // Edge case: Duplicate day number warning
            warnings.push({
              line: item.lineNum,
              message: "Duplicate day number encountered: " + parsedNum
            });
          } else {
            seenDayNumbers.add(parsedNum);
          }
        } else {
          dayRecord.day = null;
        }
      } else if (RESERVED_HEADER_KEYS.has(key)) {
        dayRecord[key] = value;
      } else {
        // Edge case: Unknown header key stored in 'extra' object
        dayRecord.extra[key] = value;
      }
    }

    // --- PARSE BODY LINES ---
    for (let b = 0; b < bodyItems.length; b++) {
      const item = bodyItems[b];
      const trimmed = item.content.trim();

      // Rule 7: Blank lines are ignored
      if (trimmed === "") continue;

      // Rule 6: Lines starting with # are comments and ignored
      if (trimmed.indexOf("#") === 0) continue;

      // Rule 5: Lines starting with * are narration
      if (trimmed.indexOf("*") === 0) {
        const narrationText = trimmed.substring(1).trim();
        dayRecord.lines.push({
          type: "narration",
          speaker: null,
          text: narrationText
        });
        continue;
      }

      // Rule 4: Dialogue line speaker: text
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) {
        // Edge case: Body line not narration/comment with no colon
        warnings.push({
          line: item.lineNum,
          message: "Invalid body line (missing colon or prefix): " + JSON.stringify(trimmed)
        });
        continue;
      }

      const speakerRaw = trimmed.substring(0, colonIdx).trim();
      const textRaw = trimmed.substring(colonIdx + 1).trim();

      if (speakerRaw === "") {
        // Edge case: Empty speaker name before colon
        warnings.push({
          line: item.lineNum,
          message: "Body dialogue line missing speaker name: " + JSON.stringify(trimmed)
        });
        continue;
      }

      // Speaker is trimmed and lowercased; text retains internal colons
      dayRecord.lines.push({
        type: "say",
        speaker: speakerRaw.toLowerCase(),
        text: textRaw
      });
    }

    days.push(dayRecord);
  }

  return { days, warnings };
}

function serializeStory(days) {
  if (!Array.isArray(days)) return "";

  const serializedBlocks = days.map(function(d) {
    const blockLines = [];

    // Header keys
    if (d.day !== null && d.day !== undefined) {
      blockLines.push("day: " + d.day);
    }
    if (d.title) blockLines.push("title: " + d.title);
    if (d.scene) blockLines.push("scene: " + d.scene);
    if (d.mood) blockLines.push("mood: " + d.mood);

    // Extra unknown header keys
    if (d.extra && typeof d.extra === "object") {
      for (const key in d.extra) {
        if (Object.prototype.hasOwnProperty.call(d.extra, key)) {
          blockLines.push(key + ": " + d.extra[key]);
        }
      }
    }

    // Header delimiter
    blockLines.push("---");

    // Body lines
    if (Array.isArray(d.lines)) {
      for (let i = 0; i < d.lines.length; i++) {
        const line = d.lines[i];
        if (line.type === "narration") {
          blockLines.push("* " + line.text);
        } else if (line.type === "say") {
          blockLines.push(line.speaker + ": " + line.text);
        }
      }
    }

    return blockLines.join("\n");
  });

  return serializedBlocks.join("\n===\n");
}

// Universal module export for Node.js and Browser global scope
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseStory, serializeStory };
}

// -----------------------------------------------------------------------------
// SELF-TEST (Runs automatically in Node environment)
// -----------------------------------------------------------------------------
if (typeof process !== "undefined" && process.versions && process.versions.node) {
  const sampleStory = [
    "day: 1\r\n",
    "title: The Awakening\r\n",
    "invalid_header_line_without_colon\r\n",  // Edge case: Header line missing colon
    "weather: Rain\r\n",                     // Edge case: Unknown header key (weather)
    "---\r\n",
    "# Comment line ignored\r\n",              // Rule 6: Comment ignored
    "ALICE: Hello world! Time is 10:30 AM\r\n",// Rule 4: Uppercase speaker + internal colon
    "* Thunder rumbles in the distance.\r\n", // Rule 5: Narration line
    ": Empty speaker before colon\r\n",       // Edge case: Empty speaker name
    "Plain body line without any colon\r\n",  // Edge case: Body line missing colon
    "\r\n",                                   // Rule 7: Blank line
    "===\r\n",                                // Rule 1: Day separator
    "\r\n",                                   // Edge case: Empty day block between ===
    "===\r\n",
    "day: 1\r\n",                             // Edge case: Duplicate day number (1)
    "title: Shadows\r\n",
    "mood: Tense\r\n",
    "bob: What was that noise?\r\n",          // Edge case: Day block missing '---' separator
    "* Steps echo down the hall."
  ].join("");

  console.log("=== RUNNING PARSER TEST ===");
  const parsedResult = parseStory(sampleStory);
  console.log(JSON.stringify(parsedResult, null, 2));

  console.log("\n=== RUNNING SERIALIZER TEST ===");
  const serializedText = serializeStory(parsedResult.days);
  console.log(serializedText);

  console.log("\n=== RE-PARSING SERIALIZED OUTPUT ===");
  const reParsedResult = parseStory(serializedText);
  console.log("Original parsed days: " + parsedResult.days.length);
  console.log("Re-parsed days count: " + reParsedResult.days.length);
  console.log("Re-parse completed without errors.");
}