"""
Build _og-data.json from all-letters.json for Vercel Edge Middleware OG previews.
Extracts: id, author, authorName, date, location, recipient, first ~120 chars of transcription.
"""
import json, os, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
INPUT = os.path.join(PROJECT_DIR, '03-data', 'all-letters.json')
OUTPUT = os.path.join(PROJECT_DIR, '_og-data.json')

AUTHOR_NAMES = {
    'henry': 'Henry Hubbell',
    'alexander': 'Alexander F. Hubbell',
    'james': 'James Hubbell',
    'charles': 'Charles F. Hubbell',
    'mother': 'Frances Hubbell (Mother)',
}

def first_sentence(text, max_len=120):
    """Extract first meaningful sentence from transcription."""
    if not text:
        return ''
    # Skip date/location header lines
    lines = text.split('\n')
    body_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Skip short header-like lines (date, location, salutation)
        if len(stripped) < 30 and any(w in stripped.lower() for w in ['dear ', '186', 'camp ', 'head quarters']):
            continue
        body_lines.append(stripped)

    body = ' '.join(body_lines)
    # Collapse whitespace
    body = re.sub(r'\s+', ' ', body).strip()

    if len(body) <= max_len:
        return body

    # Try to break at sentence boundary
    for i in range(max_len, 30, -1):
        if body[i] in '.!?':
            return body[:i+1]

    # Fall back to word boundary
    truncated = body[:max_len]
    last_space = truncated.rfind(' ')
    if last_space > 60:
        truncated = truncated[:last_space]
    return truncated + '...'

def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        letters = json.load(f)

    og_data = {}
    for letter in letters:
        lid = letter.get('id', '')
        if not lid:
            continue

        author_code = letter.get('author', '')
        og_data[lid] = {
            'a': author_code,
            'an': AUTHOR_NAMES.get(author_code, letter.get('authorName', author_code)),
            'd': letter.get('date', ''),
            'loc': letter.get('location', ''),
            'r': letter.get('recipient', ''),
            'ex': first_sentence(letter.get('transcription', '')),
        }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(og_data, f, ensure_ascii=False, separators=(',', ':'))

    print(f'Built {OUTPUT}: {len(og_data)} letters')

if __name__ == '__main__':
    main()
