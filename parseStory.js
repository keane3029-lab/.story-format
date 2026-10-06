/**
 * .STORY Format Parser, Serializer, and File Reader
 * Zero-dependency universal library (Node.js & Browser)
 */

function parseStory(text) {
  const days = [];
  const warnings = [];

  if (typeof text !== "string") {
    warnings.push({ line: 0, message: "Input must be a string." });
    return { days, warnings };
  }

  const rawDays = text.split(/^===\s*$/m);

  rawDays.forEach((dayText, dayIdx) => {
    const lines = dayText.split(/\r?\n/);
    const dayObj = {
      day: null,
      title: null,
      scene: null,
      mood: null,
      extra: {},
      entries: []
    };

    let inHeader = true;

    lines.forEach((line, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = line.trim();

      // Ignore empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      // Check header/body separator
      if (inHeader && /^---\s*$/.test(trimmed)) {
        inHeader = false;
        return;
      }

      if (inHeader) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
          warnings.push({
            line: lineNum,
            message: `Invalid header syntax: missing colon in line "${trimmed}"`
          });
          return;
        }

        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();

        if (["day", "title", "scene", "mood"].includes(key)) {
          if (key === "day") {
            const parsedDay = parseInt(value, 10);
            dayObj.day = isNaN(parsedDay) ? value : parsedDay;
          } else {
            dayObj[key] = value;
          }
        } else {
          dayObj.extra[key] = value;
        }
      } else {
        // Parsing body (dialogue and narration)
        if (trimmed.startsWith("*")) {
          // Narration
          const narrationText = trimmed.slice(1).trim();
          dayObj.entries.push({
            type: "narration",
            speaker: null,
            text: narrationText
          });
        } else {
          // Dialogue
          const colonIndex = line.indexOf(":");
          if (colonIndex === -1) {
            warnings.push({
              line: lineNum,
              message: `Invalid dialogue syntax: missing speaker colon in line "${trimmed}"`
            });
            // Fallback as unformatted narration
            dayObj.entries.push({
              type: "narration",
              speaker: null,
              text: trimmed
            });
            return;
          }

          const speaker = line.slice(0, colonIndex).trim().toLowerCase();
          const text = line.slice(colonIndex + 1).trim();

          dayObj.entries.push({
            type: "dialogue",
            speaker,
            text
          });
        }
      }
    });

    if (dayObj.day !== null || dayObj.entries.length > 0 || Object.keys(dayObj.extra).length > 0) {
      days.push(dayObj);
    }
  });

  return { days, warnings };
}

function serializeStory(days) {
  if (!Array.isArray(days)) return "";

  return days.map(dayObj => {
    const headerLines = [];

    if (dayObj.day !== null && dayObj.day !== undefined) headerLines.push(`day: ${dayObj.day}`);
    if (dayObj.title) headerLines.push(`title: ${dayObj.title}`);
    if (dayObj.scene) headerLines.push(`scene: ${dayObj.scene}`);
    if (dayObj.mood) headerLines.push(`mood: ${dayObj.mood}`);

    if (dayObj.extra && typeof dayObj.extra === "object") {
      Object.entries(dayObj.extra).forEach(([k, v]) => {
        headerLines.push(`${k}: ${v}`);
      });
    }

    const bodyLines = (dayObj.entries || []).map(entry => {
      if (entry.type === "narration" || !entry.speaker) {
        return `* ${entry.text}`;
      }
      return `${entry.speaker}: ${entry.text}`;
    });

    return [...headerLines, "---", ...bodyLines].join("\n");
  }).join("\n===\n");
}

if if (typeof module === "object" && module.exports) {
  module.exports = { parseStory, serializeStory };
}
