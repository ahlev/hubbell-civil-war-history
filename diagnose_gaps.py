#!/usr/bin/env python
"""
Phase 1: Diagnostic scanner for metadata gaps.

Reads all 274 letter transcription bodies and compares against existing
People Mentioned, Places Mentioned, and Event Flags sections.
Outputs candidate gaps as JSON for subagent verification.
"""
import os, re, json, glob
from collections import defaultdict

LETTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "02-transcribed-markdown", "letters")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "04-analysis", "gap-candidates.json")

# --- Event flag keyword patterns ---
# Each maps to (flag_name, keyword_patterns)
# These are conservative — designed to catch obvious mentions
EVENT_FLAG_PATTERNS = {
    "Request for supplies/money": [
        r'\bsend\s+(?:me|us)\b',
        r'\bplease\s+send\b',
        r'\bwant(?:ed|ing)?\s+(?:you|someone)\s+to\s+send\b',
        r'\bneed\s+(?:some|a|the)\b.*?\b(?:shirt|sock|boot|shoe|money|dollar|stamp|paper|envelope|food|butter|cheese|dried)\b',
        r'\bif\s+you\s+(?:can|could|will|would)\s+send\b',
        r'\bI\s+wish\s+you\s+(?:would|could)\s+send\b',
        r'\bwant\b.*\b(?:shirt|sock|boot|shoe|glove|blanket|quilt|stamp|paper|envelope)\b',
    ],
    "Receipt of package/letter": [
        r'\breceived\s+(?:your|a|the)\s+(?:letter|package|box|parcel|bundle)\b',
        r'\bgot\s+(?:your|a|the)\s+(?:letter|package|box|parcel)\b',
        r'\byour\s+(?:letter|package|box)\s+(?:came|arrived|reached)\b',
        r'\bletter\s+(?:of|dated|from)\s+(?:the\s+)?\d',
        r'\bhad\s+a\s+letter\s+from\b',
        r'\bhear(?:d)?\s+from\b',
    ],
    "Camp movement/march": [
        r'\bmarched\b',
        r'\bon\s+the\s+march\b',
        r'\bmoved\s+(?:our|the)\s+camp\b',
        r'\broke\s+camp\b',
        r'\bleft\s+(?:camp|our\s+camp)\b',
        r'\bwe\s+(?:have\s+)?moved\b',
        r'\bordered\s+to\s+march\b',
        r'\btook\s+up\s+(?:the\s+)?(?:line\s+of\s+)?march\b',
        r'\bwe\s+(?:are|were)\s+(?:now\s+)?(?:encamped|stationed|camped)\b',
    ],
    "Battle/combat described": [
        r'\bfight(?:ing)?\b',
        r'\bbattle\b',
        r'\bengagement\b',
        r'\bskirmish\b',
        r'\bunder\s+fire\b',
        r'\bshelling\b',
        r'\bbombardment\b',
        r'\bcharged?\b.*\b(?:enemy|rebel|position)\b',
    ],
    "Political commentary": [
        r'\b(?:Lincoln|McClellan|Grant|Davis|Congress|government|president|election|democrat|republican|abolition|emancipation|copperhead)\b',
        r'\bwar\s+(?:will|must|should|ought)\b',
        r'\bpeace\s+(?:will|must|should)\b',
    ],
    "Illness reported": [
        r'\bsick\b',
        r'\bill\b',
        r'\bfever\b',
        r'\bdiarr[ho]+ea\b',
        r'\bdysentery\b',
        r'\bdisease\b',
        r'\bhospital\b',
        r'\bsurgeon\b',
        r'\bmeasles\b',
        r'\bmalaria\b',
        r'\bague\b',
    ],
    "Death reported": [
        r'\bdied\b',
        r'\bkilled\b',
        r'\bdead\b',
        r'\bfuneral\b',
        r'\bdeath\b',
    ],
    "Wound/injury reported": [
        r'\bwound(?:ed)?\b',
        r'\binjur(?:ed|y)\b',
        r'\bshot\b',
        r'\bhit\s+(?:by|in|with)\b',
    ],
    "Morale crisis": [
        r'\bdiscouraged\b',
        r'\bdespondent\b',
        r'\bhomesick\b',
        r'\btired\s+of\s+(?:the\s+)?(?:war|army|service)\b',
        r'\bwish(?:ed)?\s+(?:I\s+)?(?:was|were)\s+home\b',
        r'\bgive\s+up\b',
    ],
    "Major news from home": [
        r'\bmarried\b',
        r'\bwedding\b',
        r'\bbaby\b',
        r'\bborn\b',
        r'\bpregnant\b',
        r'\bdivorce\b',
        r'\bcrop\b',
        r'\bharvest\b',
    ],
    "Discharge/muster-out": [
        r'\bdischarged?\b',
        r'\bmustered?\s+out\b',
        r'\bfurlough\b',
        r'\bleave\s+of\s+absence\b',
    ],
    "Promotion/demotion": [
        r'\bpromoted\b',
        r'\bpromotion\b',
        r'\breduced\s+to\s+(?:the\s+)?ranks\b',
        r'\bmade\s+(?:corporal|sergeant|lieutenant|captain)\b',
    ],
}

# Known Hubbell family names (don't flag these as "missing people" — they're usually the author/recipient)
FAMILY_CORE = {
    'henry', 'alexander', 'charles', 'james', 'mother', 'father',
    'hubbell', 'frances', 'fannie', 'fanny',
}


def extract_section(text, header_pattern, next_pattern=r'\n---|\n##[^#]'):
    """Extract text between a header and the next section boundary."""
    m = re.search(header_pattern, text)
    if not m:
        return ""
    start = m.end()
    end_m = re.search(next_pattern, text[start:])
    if end_m:
        return text[start:start + end_m.start()]
    return text[start:]


def extract_transcription(text):
    """Extract the Full Transcription section body text."""
    return extract_section(text, r'## Full Transcription\s*\n')


def extract_existing_people(text):
    """Extract names already in People Mentioned table."""
    section = extract_section(text, r'### People Mentioned\s*\n')
    names = set()
    for line in section.split('\n'):
        if line.strip().startswith('|') and '---' not in line and 'Name' not in line:
            cells = [c.strip() for c in line.split('|')]
            if len(cells) >= 2 and cells[1]:
                names.add(cells[1].lower().strip())
    return names


def extract_existing_places(text):
    """Extract places already in Places Mentioned table."""
    section = extract_section(text, r'### Places Mentioned\s*\n')
    places = set()
    for line in section.split('\n'):
        if line.strip().startswith('|') and '---' not in line and 'Place' not in line:
            cells = [c.strip() for c in line.split('|')]
            if len(cells) >= 2 and cells[1]:
                places.add(cells[1].lower().strip())
    return places


def extract_existing_flags(text):
    """Extract event flags currently set to 'yes'."""
    section = extract_section(text, r'### Event Flags\s*\n')
    flags = {}
    for line in section.split('\n'):
        m = re.search(r'\*\*(.+?)\*\*\s*\|\s*(yes|no)', line)
        if m:
            flags[m.group(1).strip()] = m.group(2).strip()
    return flags


def find_candidate_people(transcription, existing_people):
    """Find names in transcription not in existing People Mentioned."""
    # Pattern: Capitalized words that look like names
    # Mr./Mrs./Miss/Capt./Col./Gen./Lt./Sgt./Dr. + Name
    title_pattern = r'(?:Mr\.?|Mrs\.?|Miss|Capt\.?|Captain|Col\.?|Colonel|Gen\.?|General|Lt\.?|Lieutenant|Sgt\.?|Sergeant|Dr\.?|Major|Corporal|Pvt\.?|Private)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'

    # Standalone proper names (2+ capitalized words in sequence, not at sentence start)
    # This is intentionally conservative
    name_pattern = r'(?<=[a-z,;]\s)([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)'

    # Single capitalized names after relational words
    relation_pattern = r'(?:brother|sister|cousin|aunt|uncle|friend|wife|husband|neighbor)\s+([A-Z][a-z]{2,})'

    candidates = set()

    for pattern in [title_pattern, name_pattern, relation_pattern]:
        for m in re.finditer(pattern, transcription):
            name = m.group(1).strip()
            name_lower = name.lower()
            # Skip if already in people table or is a core family member being author/recipient
            if name_lower not in existing_people and name_lower not in FAMILY_CORE:
                # Skip common false positives
                if name_lower not in {'dear', 'camp', 'fort', 'mount', 'lake', 'river',
                                       'monday', 'tuesday', 'wednesday', 'thursday',
                                       'friday', 'saturday', 'sunday', 'january',
                                       'february', 'march', 'april', 'may', 'june',
                                       'july', 'august', 'september', 'october',
                                       'november', 'december', 'god', 'lord', 'christ',
                                       'union', 'rebel', 'confederate', 'yankee',
                                       'volunteers', 'infantry', 'artillery', 'cavalry',
                                       'regiment', 'company', 'brigade', 'division',
                                       'the', 'this', 'that', 'these', 'those',
                                       'your', 'very', 'well', 'just', 'last',
                                       'new york', 'united states', 'america'}:
                    candidates.add(name)

    return sorted(candidates)


def find_candidate_places(transcription, existing_places):
    """Find place names in transcription not in existing Places Mentioned."""
    # Common Civil War place patterns
    place_patterns = [
        # Named locations with context
        r'(?:at|in|near|from|to|towards?|through|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        # Camp + Name
        r'Camp\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        # Fort + Name
        r'Fort\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        # River/Creek/Mountain
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:River|Creek|Mountain|Valley|Gap|Ford|Landing|Junction|Station|Bridge|Ferry|Springs?|Court\s+House)',
    ]

    candidates = set()
    existing_lower = {p.lower() for p in existing_places}

    for pattern in place_patterns:
        for m in re.finditer(pattern, transcription):
            place = m.group(1).strip() if '(' in pattern else m.group(1).strip()
            place_lower = place.lower()

            # Skip if already in places table
            if place_lower in existing_lower:
                continue
            # Skip common false positives
            if place_lower in {'the', 'this', 'that', 'our', 'my', 'your', 'his',
                                'her', 'their', 'one', 'two', 'three', 'some',
                                'all', 'any', 'each', 'every', 'god', 'lord',
                                'dear', 'good', 'great', 'old', 'new', 'last',
                                'first', 'next', 'home', 'here', 'there',
                                'present', 'once', 'again', 'still', 'soon',
                                'now', 'then', 'just', 'very', 'well',
                                'much', 'more', 'most', 'less', 'least'}:
                continue
            # Skip single-word matches that are likely people names
            if ' ' not in place and len(place) < 5:
                continue

            candidates.add(place)

    return sorted(candidates)


def find_candidate_flags(transcription, existing_flags):
    """Find event flags suggested by transcription but currently set to 'no' or missing."""
    candidates = {}
    transcription_lower = transcription.lower()

    for flag_name, patterns in EVENT_FLAG_PATTERNS.items():
        # Skip if already flagged as 'yes'
        if existing_flags.get(flag_name) == 'yes':
            continue

        matches = []
        for pattern in patterns:
            for m in re.finditer(pattern, transcription_lower):
                # Get surrounding context (30 chars each side)
                start = max(0, m.start() - 40)
                end = min(len(transcription_lower), m.end() + 40)
                context = transcription[start:end].replace('\n', ' ').strip()
                matches.append({
                    'match': m.group(0),
                    'context': '...' + context + '...',
                })

        if matches:
            # Deduplicate by match text
            seen = set()
            unique_matches = []
            for match in matches:
                if match['match'] not in seen:
                    seen.add(match['match'])
                    unique_matches.append(match)
            candidates[flag_name] = unique_matches[:3]  # Top 3 matches per flag

    return candidates


def analyze_letter(filepath):
    """Analyze a single letter for metadata gaps."""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    doc_id = os.path.basename(filepath).replace('.md', '')
    transcription = extract_transcription(text)

    if not transcription or len(transcription.strip()) < 50:
        return None  # Skip letters with no/minimal transcription

    existing_people = extract_existing_people(text)
    existing_places = extract_existing_places(text)
    existing_flags = extract_existing_flags(text)

    candidate_people = find_candidate_people(transcription, existing_people)
    candidate_places = find_candidate_places(transcription, existing_places)
    candidate_flags = find_candidate_flags(transcription, existing_flags)

    # Only return if there are gaps
    if not candidate_people and not candidate_places and not candidate_flags:
        return None

    return {
        'doc_id': doc_id,
        'file': os.path.basename(filepath),
        'existing_people_count': len(existing_people),
        'existing_places_count': len(existing_places),
        'existing_flags_yes_count': sum(1 for v in existing_flags.values() if v == 'yes'),
        'candidate_people': candidate_people,
        'candidate_places': candidate_places,
        'candidate_flags': candidate_flags,
    }


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Scanning {len(files)} letters for metadata gaps...")

    results = []
    stats = defaultdict(int)

    for filepath in files:
        result = analyze_letter(filepath)
        if result:
            results.append(result)
            if result['candidate_people']:
                stats['letters_with_people_gaps'] += 1
                stats['total_people_candidates'] += len(result['candidate_people'])
            if result['candidate_places']:
                stats['letters_with_places_gaps'] += 1
                stats['total_places_candidates'] += len(result['candidate_places'])
            if result['candidate_flags']:
                stats['letters_with_flag_gaps'] += 1
                stats['total_flag_candidates'] += sum(len(v) for v in result['candidate_flags'].values())

    print(f"\n-- Results --")
    print(f"Letters with gaps: {len(results)} / {len(files)}")
    print(f"People gaps:  {stats['letters_with_people_gaps']} letters, {stats['total_people_candidates']} candidates")
    print(f"Places gaps:  {stats['letters_with_places_gaps']} letters, {stats['total_places_candidates']} candidates")
    print(f"Flag gaps:    {stats['letters_with_flag_gaps']} letters, {stats['total_flag_candidates']} candidate matches")

    output = {
        'scan_date': '2026-03-31',
        'total_letters': len(files),
        'letters_with_gaps': len(results),
        'stats': dict(stats),
        'results': results,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nFull results written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
