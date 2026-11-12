#!/usr/bin/env python3
"""Export a normalized JSONL dataset for TextData proposals.

Usage:
    python3 scripts/export_proposals.py
    python3 scripts/export_proposals.py --input data/cs410_snapshot.json --output data/processed/proposals.jsonl
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse


URL_RE = re.compile(r"https?://[^\s)\]>\}\"']+|www\.[^\s)\]>\}\"']+")
HASHTAG_RE = re.compile(r"#([A-Za-z0-9_]+)")


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace in text.

    Input: a string containing arbitrary whitespace.
    Output: the same text with all whitespace collapsed to single spaces and trimmed.
    """
    return re.sub(r"\s+", " ", text or "").strip()


def strip_markdown_links(text: str) -> str:
    """Remove Markdown links while preserving the visible link text.

    Input: a string that may contain markdown-style links such as [label](url).
    Output: the same text with link syntax removed and visible text retained.
    """
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text or "")
    text = re.sub(r"\[([^\]]+)\]\[[^\]]*\]", r"\1", text)
    return text


def clean_description(raw_description: str | None) -> str:
    """Clean a raw proposal description for indexing and downstream text processing.

    Input: a raw description string from the TextData snapshot.
    Output: a lower-noise string with markdown, URLs, and extra whitespace removed.
    """
    if raw_description is None:
        return ""
    text = str(raw_description)
    text = strip_markdown_links(text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"www\.\S+", " ", text)
    text = text.replace("\r", "\n")
    text = re.sub(r"[#*_`>\-]", " ", text)
    text = re.sub(r"\n+", " ", text)
    text = normalize_whitespace(text)
    return text


def extract_urls(text: str | None) -> list[str]:
    """Extract all URL-like strings from a text field.

    Input: a string containing text that may include URLs.
    Output: a sorted list of unique URLs with trailing punctuation removed.
    """
    if not text:
        return []
    matches = URL_RE.findall(str(text))
    urls = []
    for match in matches:
        cleaned = match.rstrip(".,;:!?)]}\"'")
        if cleaned:
            urls.append(cleaned)
    return sorted(set(urls))


def extract_hashtags(text: str | None) -> list[str]:
    """Extract hashtags from a text field.

    Input: a string that may contain hashtags such as #bm25 or #information-retrieval.
    Output: a sorted list of unique lowercase hashtag values without the # symbol.
    """
    if not text:
        return []
    tags = HASHTAG_RE.findall(str(text))
    return sorted(set(tag.lower() for tag in tags))


def classify_url(url: str) -> str:
    """Classify a URL as internal or external to TextData.

    Input: a URL string.
    Output: either "internal" if it belongs to textdata.org, otherwise "external".
    """
    host = urlparse(url).netloc.lower()
    if "textdata.org" in host:
        return "internal"
    return "external"


def build_clean_text(title: str, description_text: str, hashtags: list[str]) -> str:
    """Construct the final cleaned proposal text for downstream processing.

    Input: a title, a cleaned description, and a list of hashtags.
    Output: a single normalized text string that includes the title, description, and hashtags.
    """
    parts = [title, description_text]
    if hashtags:
        parts.append(" ".join(f"#{tag}" for tag in hashtags))
    return normalize_whitespace(" ".join(p for p in parts if p))


def normalize_submission(raw: dict) -> dict:
    """Normalize one raw TextData submission into the export schema.

    Input: one raw submission dictionary from the snapshot JSON.
    Output: a cleaned dictionary with standardized fields for indexing and modeling.
    """
    submission_id = raw.get("submission_id") or raw.get("id") or ""
    title = (raw.get("title") or "").strip()
    description_raw = raw.get("description") or ""
    description_clean = clean_description(description_raw)
    title_clean = normalize_whitespace(strip_markdown_links(title))

    all_urls = extract_urls(f"{title} {description_raw}")
    internal_urls = [u for u in all_urls if classify_url(u) == "internal"]
    external_urls = [u for u in all_urls if classify_url(u) == "external"]

    combined_text = " ".join([
        title_clean,
        description_clean,
        " ".join(internal_urls),
        " ".join(external_urls),
    ])
    hashtags = extract_hashtags(f"{title} {description_raw}")

    return {
        "submission_id": str(submission_id),
        "title": title_clean,
        "description_raw": str(description_raw).strip(),
        "description_clean": description_clean,
        "clean_text": build_clean_text(title_clean, description_clean, hashtags),
        "submission_url": (raw.get("submission_url") or "").strip(),
        "source_url": (raw.get("source_url") or "").strip(),
        "internal_urls": sorted(set(internal_urls)),
        "external_urls": sorted(set(external_urls)),
        "external_domains": sorted({urlparse(u).netloc.lower() for u in external_urls if urlparse(u).netloc}),
        "hashtags": hashtags,
        "time": raw.get("time") or "",
        "type": raw.get("type") or "submission",
        "community_id": raw.get("community_id") or "",
        "source": raw.get("source") or "textdata",
        "raw_text_for_indexing": normalize_whitespace(combined_text),
    }


def export_jsonl(input_path: Path, output_path: Path) -> dict:
    """Export the raw snapshot into a normalized JSONL dataset.

    Input: a path to the JSON snapshot file.
    Output: a dictionary containing export counts and a written JSONL file at output_path.
    """
    with input_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)

    rows = payload.get("data", []) if isinstance(payload, dict) else payload
    normalized = [normalize_submission(row) for row in rows]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        for row in normalized:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    stats = {
        "total_rows": len(rows),
        "exported_rows": len(normalized),
        "rows_with_description": sum(1 for row in normalized if (row["description_raw"] or row["description_clean"])),
        "rows_with_external_urls": sum(1 for row in normalized if row["external_urls"]),
        "rows_with_hashtags": sum(1 for row in normalized if row["hashtags"]),
        "rows_with_source_url": sum(1 for row in normalized if row["source_url"]),
    }
    return stats


def main() -> None:
    """Run the proposal export pipeline from the command line.

    Input: command-line arguments for the snapshot input and output JSONL file.
    Output: writes the normalized dataset to disk and prints a summary of export counts.
    """
    parser = argparse.ArgumentParser(description="Export normalized TextData proposal data as JSONL.")
    parser.add_argument("--input", default="data/cs410_snapshot.json", help="Input snapshot JSON")
    parser.add_argument("--output", default="data/processed/proposals.jsonl", help="Output JSONL path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    stats = export_jsonl(input_path, output_path)
    print(f"Exported {stats['exported_rows']} records to {output_path}")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
