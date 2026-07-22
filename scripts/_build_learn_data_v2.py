# -*- coding: utf-8 -*-
"""Their Own Words v2 generator: assembles _learn-data.js from the content
modules (_tow_content_a/b/c/d). Excerpts are NEVER typed in content — they are
resolved from 03-data/learn-quote-candidates.json, 03-data/learn-quote-gaps.json,
or sliced from the corpus by anchors. Run from project root:

    python scripts/_build_learn_data_v2.py && python scripts/validate_learn_quotes.py
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from _tow_content_a import ACTS_1_2
from _tow_content_b import ACTS_3_4
from _tow_content_c import ACT_5
from _tow_content_d import ACT_1_FILL

CAND = json.load(io.open(os.path.join(ROOT, '03-data', 'learn-quote-candidates.json'), encoding='utf-8'))
GAPS = json.load(io.open(os.path.join(ROOT, '03-data', 'learn-quote-gaps.json'), encoding='utf-8'))
DATA = json.load(io.open(os.path.join(ROOT, '03-data', 'all-letters.json'), encoding='utf-8'))
LETTERS = DATA['letters'] if isinstance(DATA, dict) and 'letters' in DATA else DATA
BY_ID = {l['id']: l for l in LETTERS}

NAME = {'henry': 'Henry', 'alexander': 'Alexander', 'james': 'James',
        'charles': 'Charles', 'mother': 'Frances (their mother)'}

CURRICULUM = {
  'a1-nation-1': 'First Bull Run & the end of the short-war illusion',
  'a1-camp-1': 'Camp life, drill & the hardening of recruits',
  'a1-body-1': 'Exposure & disease — the war’s deadliest killer (2:1)',
  'a1-purse-1': 'Army pay & the sutler economy',
  'a1-family-1': 'The mail as morale infrastructure',
  'a1-camp-2': 'Winter quarters — the self-built army',
  'a1-nation-2': 'Why they fought — volunteer motivation, 1861',
  'a1-body-2': 'Civil War medicine before the system (1861)',
  'a1-purse-2': 'Soldiers’ remittances — the family economy',
  'a1-family-2': 'Furloughs, distance & why the letters exist',
  'a2-camp-1': 'Railroads & mass mobilization',
  'a2-body-1': 'Rifled muskets vs. old tactics — the scale of killing',
  'a2-purse-1': 'Substitutes & “rich man’s war, poor man’s fight”',
  'a2-nation-1': 'Immigrant soldiers & ethnic regiments',
  'a2-family-1': 'The unknown dead & death notification',
  'a2-camp-2': 'Foraging & the war on property (early war)',
  'a2-body-2': 'Hardtack & the soldier’s diet',
  'a2-purse-2': 'The bounty system',
  'a2-nation-2': 'The home front vs. the ranks — “fireside patriots”',
  'a2-family-2': 'Waiting for word — news after battle',
  'a3-camp-1': 'Desertion & military discipline',
  'a3-body-1': 'Gettysburg’s aftermath & the National Cemetery',
  'a3-purse-1': 'The $300 commutation clause & the draft riots',
  'a3-nation-1': 'Conscription — the view from the ranks',
  'a3-family-1': 'The home front’s information war',
  'a3-camp-2': 'Orders, counter-orders & army life (“hurry up and wait”)',
  'a3-body-2': 'Faith, fatalism & how soldiers faced death',
  'a3-purse-2': 'Greenbacks — the invention of national money',
  'a3-nation-2': 'Draft evasion & the gray economy of avoidance',
  'a3-family-2': 'Back pay, bounties & the bureaucracy of grief',
  'a4-camp-1': 'The march — the soldier’s daily war',
  'a4-body-1': 'Disease > battle — Civil War medicine & supply',
  'a4-purse-1': 'Veteran reenlistment & the 1864 bounties',
  'a4-nation-1': 'The election of 1864 & the soldier vote',
  'a4-family-1': 'The Sanitary Commission & women’s war work',
  'a4-camp-2': 'Foraging & hard war — the policy dial',
  'a4-body-2': 'Wounds, capture & the prison system’s shadow',
  'a4-purse-2': 'Pay in arrears — the army’s broken payroll',
  'a4-nation-2': 'Copperheads & the politics of peace',
  'a4-family-2': 'Sherman’s march & the family early-warning system',
  'a5-camp-1': 'The St. Albans Raid & the militarized border',
  'a5-body-1': 'The war’s psychological toll',
  'a5-purse-1': 'Demobilization — dissolving the citizen army',
  'a5-nation-1': 'What victory meant — emancipation & Union',
  'a5-family-1': 'Reading the archive itself — why the letters exist',
  'a5-camp-2': 'The army dissolves — corps, farewells & veteranhood',
  'a5-body-2': 'Hunger on the last marches — logistics’ ragged edge',
  'a5-purse-2': 'The final settlement — the war’s last pay table',
  'a5-nation-2': 'False dawns & home-front morale',
  'a5-family-2': 'Going home — the correspondence winds down',
}


def resolve_source(source):
    kind = source[0]
    if kind == 'cand':
        c = CAND[source[1]]
        return c['id'], c['author'], c['excerpt'], c.get('location', '')
    if kind == 'gap':
        c = GAPS[source[1]][source[2]]
        return c['id'], c['author'], c['excerpt'], c.get('location', '')
    if kind == 'slice':
        _, letter_id, a, b = source
        t = BY_ID[letter_id]['transcription']
        i = t.index(a)
        j = t.index(b, i) + len(b)
        return letter_id, BY_ID[letter_id]['author'], t[i:j], BY_ID[letter_id].get('location', '')
    raise ValueError(kind)


def map_url(date, author, letter_id):
    if author == 'mother':
        return f"viz-map-fullwar.html?date={date}&home=1"
    return f"viz-map-fullwar.html?date={date}&brother={author}&letter={letter_id}"


def build(entry):
    letter_id, author, excerpt, location = resolve_source(entry['source'])
    letter = BY_ID[letter_id]
    date = letter['date']                       # canonical date, always
    if not location:
        location = letter.get('location', '')
    bio = 'mother' if author == 'mother' else author
    out = {
        'qid': entry['qid'], 'act': entry['act'], 'theme': entry['theme'],
        'letterId': letter_id, 'author': author, 'date': date,
        'location': location, 'excerpt': excerpt,
        'attribution': f"{NAME[author]}, {entry['recip']} — {location} · {entry['date_str']}",
        'stem': entry['stem'], 'choices': entry['choices'],
        'answerIdx': entry['answer'], 'whyRight': entry['whyRight'],
        'whyWrong': entry.get('whyWrong', {}), 'expansion': entry['expansion'],
        'context': entry['context'],
        'spokes': {'letter': True, 'map': map_url(date, author, letter_id), 'bio': bio},
        'curriculum': CURRICULUM[entry['qid']],
    }
    if entry['qid'] == 'a4-body-1':
        out['spokes']['extra'] = 'viz-health-ledger.html'
    return out


ALL = [build(e) for e in (ACTS_1_2 + ACT_1_FILL + ACTS_3_4 + ACT_5)]
# each act plays internally in chronological order
ALL.sort(key=lambda q: (q['act'], q['date'], q['theme']))

ACTS = [
    {"act": 1, "years": "1861 – Spring 1862", "title": "Leaving Home",
     "scene": "Three farm boys from a border town go to war. It still feels like an adventure.",
     "bridge": "Spring 1862 carries the army to the gates of Richmond — and the adventure ends there. The next letters come from harder country."},
    {"act": 2, "years": "1862", "title": "The Hardening",
     "scene": "McClellan is turned back at Richmond; the war stops being an adventure.",
     "bridge": "Henry Hubbell, 34th New York, fell at Antietam on September 17, 1862 — for six weeks his family searched the lists before they knew. Two more brothers are in uniform now. The war goes on without him.",
     "memorial": "henry"},
    {"act": 3, "years": "1863", "title": "The Long Middle",
     "scene": "Gettysburg, the draft, and a war with no visible end.",
     "bridge": "The Union survives its hardest year and learns to draft, to execute, to endure. In the spring, the western armies turn toward Atlanta — Alexander among them."},
    {"act": 4, "years": "1864", "title": "The Grind",
     "scene": "Atlanta and the Valley; the war industrializes suffering — and holds an election in the middle of it.",
     "bridge": "Atlanta falls. Lincoln is re-elected. In the Shenandoah, James is wounded at Cedar Creek and walks several miles after being hit rather than fall into enemy hands — his own words. The end is coming, but not fast enough for everyone."},
    {"act": 5, "years": "1865", "title": "Coming Home",
     "scene": "Victory, muster-out — and a war that doesn't quite end when it ends.",
     "bridge": "Alexander reached the tea table. James never did — he died that October on the journey home from Savannah. Charles carried his wounds eleven more years. Two came home. Their words became this archive.",
     "memorial": "james"}
]

BONDS = {"titles": ["Stranger", "Correspondent", "Confidant"], "thresholds": [4, 8, 12]}

out = io.open(os.path.join(ROOT, '_learn-data.js'), 'w', encoding='utf-8', newline='\n')
out.write('/* Their Own Words v2 - question bank (50). GENERATED by scripts/_build_learn_data_v2.py.\n')
out.write('   Excerpts are verbatim slices of 03-data/all-letters.json transcriptions -\n')
out.write('   validated by scripts/validate_learn_quotes.py. Do not hand-edit excerpts. */\n')
out.write('var TOW_ACTS = ' + json.dumps(ACTS, ensure_ascii=False, indent=1) + ';\n')
out.write('var TOW_BONDS = ' + json.dumps(BONDS, ensure_ascii=False) + ';\n')
out.write('var TOW_QUESTIONS = ' + json.dumps(ALL, ensure_ascii=False, indent=1) + ';\n')
out.close()
print('wrote _learn-data.js with', len(ALL), 'questions;',
      'acts:', {a: sum(1 for q in ALL if q['act'] == a) for a in (1, 2, 3, 4, 5)})
