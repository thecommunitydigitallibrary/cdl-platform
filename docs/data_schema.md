# TextData Proposal Export Schema

This project exports a normalized proposal dataset from the raw TextData snapshot so the team can use it for BM25, topic modeling, query expansion, and resource linking.

## Core output file

- `data/processed/proposals.jsonl`
- One JSON object per line
- Each line is a single proposal record

## Required fields

Each exported proposal includes the following fields. The field types below are the actual Python/JSON types used in the export:

- `submission_id`: string. Stable unique identifier for the proposal.
- `title`: string. Cleaned proposal title.
- `description_raw`: string. Original `description` text from the snapshot.
- `description_clean`: string. Description text after cleaning and whitespace normalization.
- `clean_text`: string. Final concatenated text used for indexing and topic modeling.
- `submission_url`: string. TextData submission URL.
- `source_url`: string. Source URL from the author, if present.
- `internal_urls`: array of strings. TextData/internal links extracted from the proposal.
- `external_urls`: array of strings. External links extracted from the proposal.
- `external_domains`: array of strings. Distinct external hostnames.
- `hashtags`: array of strings. Hashtags extracted from title and description.
- `time`: string. Raw submission timestamp from the snapshot.
- `type`: string. Submission category, typically `"submission"`.
- `community_id`: string. Community ID when present in the source.
- `source`: string. Source label, always `"textdata"` in this export.
- `raw_text_for_indexing`: string. Combined text used for a fallback index.

## Edge cases handled

The exporter explicitly handles the following issues so the dataset is consistent for downstream IR and mining tasks:

- Null or missing `description`: converted to an empty string instead of crashing the export.
- Markdown links like `[text](url)`: the visible text is kept; the URL itself is stripped out of `description_clean` and `clean_text`.
- Plain URLs embedded in the description: removed from the cleaned text but preserved in `internal_urls` or `external_urls` arrays.
- Duplicate URLs: deduplicated via a set before saving to the final JSON object.
- Duplicate hashtags: deduplicated and lowercased before saving.
- Mixed casing / whitespace differences: whitespace is normalized, hashtags are lowercased, and domain names are lowercased.
- Records with no URLs or hashtags: still exported normally; those lists simply remain empty arrays.
- Records with no `source_url`: saved as an empty string instead of `null`.
- Records where the title or description is blank: exported with empty strings, but the record stays in the dataset so the team can still inspect missing metadata.
- Internal vs external URL classification: any URL whose host contains `textdata.org` is assigned to `internal_urls`; all other URLs are assigned to `external_urls`.

## Example

This is a real record from `data/processed/proposals.jsonl` and includes both a non-empty internal URL list and a compressed external URL list:

```json
{
  "submission_id": "6adbb65da8567d79c2f75a5e",
  "title": "Tech Review: Agent Memory and Context",
  "description_raw": "Community: https://textdata.org/community/6abc1276a8567d79c2f6c5f2\n\nPresentation Video: https://mediaspace.illinois.edu/media/t/1_ip2oww7j\n\naidanjs7\n\n#techreview #fa2026",
  "description_clean": "Community: Presentation Video: aidanjs7 techreview fa2026",
  "clean_text": "Tech Review: Agent Memory and Context Community: Presentation Video: aidanjs7 techreview fa2026 #fa2026 #techreview",
  "submission_url": "https://textdata.org/submissions/6adbb65da8567d79c2f75a5e",
  "source_url": "",
  "internal_urls": [
    "https://textdata.org/community/6abc1276a8567d79c2f6c5f2"
  ],
  "external_urls": [
    "https://mediaspace.illinois.edu/media/t/1_ip2oww7j"
  ],
  "external_domains": [
    "mediaspace.illinois.edu"
  ],
  "hashtags": [
    "fa2026",
    "techreview"
  ],
  "time": "1792783965000",
  "type": "submission",
  "community_id": "",
  "source": "textdata",
  "raw_text_for_indexing": "Tech Review: Agent Memory and Context Community: Presentation Video: aidanjs7 techreview fa2026 https://textdata.org/community/6abc1276a8567d79c2f6c5f2 https://mediaspace.illinois.edu/media/t/1_ip2oww7j"
}
```
