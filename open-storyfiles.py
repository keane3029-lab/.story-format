import os
import re
import json

def parse_story(text: str) -> dict:
    """
    Parses raw .STORY format string into a structured dictionary.
    Returns a dict containing 'days' list and 'warnings' list.
    """
    days = []
    warnings = []

    if not isinstance(text, str):
        warnings.append({"line": 0, "message": "Input must be a string."})
        return {"days": days, "warnings": warnings}

    # Split by day delimiter '===' on its own line
    raw_days = re.split(r'^===\s*$', text, flags=re.MULTILINE)

    for day_text in raw_days:
        lines = day_text.splitlines()
        day_obj = {
            "day": None,
            "title": None,
            "scene": None,
            "mood": None,
            "extra": {},
            "entries": []
        }

        in_header = True

        for line_idx, line in enumerate(lines):
            line_num = line_idx + 1
            trimmed = line.strip()

            # Ignore empty lines and comments
            if not trimmed or trimmed.startswith("#"):
                continue

            # Check for header/body separator '---'
            if in_header and re.match(r'^---\s*$', trimmed):
                in_header = False
                continue

            if in_header:
                if ":" not in line:
                    warnings.append({
                        "line": line_num,
                        "message": f'Invalid header syntax: missing colon in line "{trimmed}"'
                    })
                    continue

                key, value = line.split(":", 1)
                key = key.strip().lower()
                value = value.strip()

                if key in ["day", "title", "scene", "mood"]:
                    if key == "day":
                        try:
                            day_obj["day"] = int(value)
                        except ValueError:
                            day_obj["day"] = value
                    else:
                        day_obj[key] = value
                else:
                    day_obj["extra"][key] = value
            else:
                # Body parsing (dialogue vs narration)
                if trimmed.startswith("*"):
                    narration_text = trimmed[1:].strip()
                    day_obj["entries"].append({
                        "type": "narration",
                        "speaker": None,
                        "text": narration_text
                    })
                else:
                    if ":" not in line:
                        warnings.append({
                            "line": line_num,
                            "message": f'Invalid dialogue syntax: missing speaker colon in line "{trimmed}"'
                        })
                        # Fallback as narration
                        day_obj["entries"].append({
                            "type": "narration",
                            "speaker": None,
                            "text": trimmed
                        })
                        continue

                    speaker, entry_text = line.split(":", 1)
                    speaker = speaker.strip().lower()
                    entry_text = entry_text.strip()

                    day_obj["entries"].append({
                        "type": "dialogue",
                        "speaker": speaker,
                        "text": entry_text
                    })

        if day_obj["day"] is not None or len(day_obj["entries"]) > 0 or len(day_obj["extra"]) > 0:
            days.append(day_obj)

    return {"days": days, "warnings": warnings}


def load_story_file(file_path: str) -> dict:
    """
    Opens and parses a .STORY file from disk.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Story file not found at path: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return parse_story(content)


def serialize_story(days: list) -> str:
    """
    Serializes a list of day dictionaries back into .STORY formatted plain text.
    """
    if not isinstance(days, list):
        return ""

    day_blocks = []
    for day_obj in days:
        header_lines = []

        if day_obj.get("day") is not None:
            header_lines.append(f"day: {day_obj['day']}")
        if day_obj.get("title"):
            header_lines.append(f"title: {day_obj['title']}")
        if day_obj.get("scene"):
            header_lines.append(f"scene: {day_obj['scene']}")
        if day_obj.get("mood"):
            header_lines.append(f"mood: {day_obj['mood']}")

        extra = day_obj.get("extra", {})
        if isinstance(extra, dict):
            for k, v in extra.items():
                header_lines.append(f"{k}: {v}")

        body_lines = []
        for entry in day_obj.get("entries", []):
            if entry.get("type") == "narration" or not entry.get("speaker"):
                body_lines.append(f"* {entry.get('text', '')}")
            else:
                body_lines.append(f"{entry.get('speaker', '')}: {entry.get('text', '')}")

        full_block = "\n".join(header_lines) + "\n---\n" + "\n".join(body_lines)
        day_blocks.append(full_block)

    return "\n===\n".join(day_blocks)


# Quick runner test when executed directly
if __name__ == "__main__":
    sample_file = "sample.story"
    
    if os.path.exists(sample_file):
        print(f"=== READING {sample_file} ===")
        result = load_story_file(sample_file)
        print("Parsed JSON Output:")
        print(json.dumps(result["days"], indent=2))
        print("\nWarnings:", result["warnings"])
    else:
        print(f"File {sample_file} not found. Running inline test.")
        sample_data = """day: 1
title: The Python Awakening
scene: Code Room
---
# Python parser test
python_bot: Hello from Python land!
* The script executes flawlessly.
"""
        result = parse_story(sample_data)
        print(json.dumps(result["days"], indent=2))
