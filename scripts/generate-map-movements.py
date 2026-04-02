#!/usr/bin/env python3
"""
Generate map-movements.json from all-letters.json.
Maps 136 fuzzy Civil War location strings to canonical lat/lon coordinates.
"""
import json
import re
import sys
import os

# ============================================================
# GEOCODING TABLE — Canonical Civil War locations with lat/lon
# ============================================================
GEOCODE = {
    # New York
    'Champlain, NY':        {'lat': 44.9862, 'lon': -73.4468},
    'Plattsburgh, NY':      {'lat': 44.6995, 'lon': -73.4529},
    'Ogdensburg, NY':       {'lat': 44.6940, 'lon': -75.4863},
    'Albany, NY':            {'lat': 42.6526, 'lon': -73.7562},
    'Fonda, NY':            {'lat': 42.9545, 'lon': -74.3735},
    'West Point, NY':       {'lat': 41.3915, 'lon': -73.9565},
    'New York City':        {'lat': 40.7128, 'lon': -74.0060},
    'Atlas, MI':            {'lat': 42.9014, 'lon': -83.5385},

    # Maryland
    'Baltimore, MD':        {'lat': 39.2904, 'lon': -76.6122},
    'Relay, MD':            {'lat': 39.2237, 'lon': -76.7125},
    'Frederick, MD':        {'lat': 39.4143, 'lon': -77.4105},
    'Antietam, MD':         {'lat': 39.4747, 'lon': -77.7447},
    "Crampton's Gap, MD":   {'lat': 39.4073, 'lon': -77.6367},
    'Poolesville, MD':      {'lat': 39.1457, 'lon': -77.4172},
    'Point Lookout, MD':    {'lat': 38.0505, 'lon': -76.3227},

    # Washington, D.C.
    'Washington, D.C.':     {'lat': 38.9072, 'lon': -77.0369},

    # Virginia — Northern
    'Alexandria, VA':       {'lat': 38.8048, 'lon': -77.0469},
    'Fairfax Station, VA':  {'lat': 38.7934, 'lon': -77.3268},
    'Manassas, VA':         {'lat': 38.7509, 'lon': -77.4753},
    'Warrenton, VA':        {'lat': 38.7135, 'lon': -77.7953},
    'Warrenton Junction, VA': {'lat': 38.6432, 'lon': -77.7262},
    'Ellis Ford, VA':       {'lat': 38.5400, 'lon': -77.7800},
    'Raccoon Ford, VA':     {'lat': 38.4100, 'lon': -77.9500},
    'Stafford, VA':         {'lat': 38.4220, 'lon': -77.4083},
    'Aquia Landing, VA':    {'lat': 38.4523, 'lon': -77.3892},
    'Falmouth, VA':         {'lat': 38.3218, 'lon': -77.4689},

    # Virginia — Shenandoah Valley
    'Harpers Ferry, WV':    {'lat': 39.3251, 'lon': -77.7286},
    'Winchester, VA':       {'lat': 39.1857, 'lon': -78.1633},
    'Strasburg, VA':        {'lat': 38.9885, 'lon': -78.3586},
    'Front Royal, VA':      {'lat': 38.9182, 'lon': -78.1944},
    'Newtown, VA':          {'lat': 39.0876, 'lon': -78.2022},  # Stephens City
    'Cedar Creek, VA':      {'lat': 39.0286, 'lon': -78.3147},
    'Harrisonburg, VA':     {'lat': 38.4496, 'lon': -78.8689},

    # Virginia — Central / Chancellorsville area
    'Centreville, VA':      {'lat': 38.8414, 'lon': -77.4281},
    'Chancellorsville, VA': {'lat': 38.3048, 'lon': -77.6387},
    'Fredericksburg, VA':   {'lat': 38.3032, 'lon': -77.4605},
    "Eltham's Landing, VA": {'lat': 37.3565, 'lon': -76.7661},
    'Williamsburg, VA':     {'lat': 37.2705, 'lon': -76.7075},
    "Gaines' Mill, VA":     {'lat': 37.5800, 'lon': -77.3000},
    "Savage's Station, VA": {'lat': 37.5100, 'lon': -77.3300},
    'Glendale, VA':         {'lat': 37.4600, 'lon': -77.3000},
    "Fisher's Hill, VA":    {'lat': 38.9950, 'lon': -78.3700},

    # Virginia — Peninsula / Richmond
    'Fort Monroe, VA':      {'lat': 37.0049, 'lon': -76.3062},
    'Hampton, VA':          {'lat': 37.0299, 'lon': -76.3452},
    'Yorktown, VA':         {'lat': 37.2387, 'lon': -76.5098},
    'West Point, VA':       {'lat': 37.5313, 'lon': -76.7958},
    'Richmond, VA':         {'lat': 37.5407, 'lon': -77.4360},
    'Fair Oaks, VA':        {'lat': 37.5501, 'lon': -77.3117},
    "Harrison's Landing, VA": {'lat': 37.3339, 'lon': -77.2198},
    'Malvern Hill, VA':     {'lat': 37.3867, 'lon': -77.2472},

    # Pennsylvania
    'Gettysburg, PA':       {'lat': 39.8309, 'lon': -77.2311},
    'Philadelphia, PA':     {'lat': 39.9526, 'lon': -75.1652},

    # Tennessee
    'Nashville, TN':        {'lat': 36.1627, 'lon': -86.7816},
    'Murfreesboro, TN':     {'lat': 35.8456, 'lon': -86.3903},
    'Tullahoma, TN':        {'lat': 35.3620, 'lon': -86.2094},
    'Chattanooga, TN':      {'lat': 35.0456, 'lon': -85.3097},
    'Wauhatchie, TN':       {'lat': 35.0200, 'lon': -85.3800},
    'Lookout Mountain, TN': {'lat': 35.0087, 'lon': -85.3444},
    'Missionary Ridge, TN': {'lat': 35.0139, 'lon': -85.2522},

    # Georgia — additional
    'Funkstown, MD':        {'lat': 39.5600, 'lon': -77.8200},
    'Peachtree Creek, GA':  {'lat': 33.8000, 'lon': -84.4000},
    'Kennesaw Mountain, GA': {'lat': 33.9833, 'lon': -84.5806},

    # Virginia — additional
    "Snicker's Gap, VA":    {'lat': 39.1100, 'lon': -77.8200},
    'Newport News, VA':     {'lat': 36.9868, 'lon': -76.4300},
    'Seneca Mills, MD':     {'lat': 39.0795, 'lon': -77.3402},

    # Louisiana — additional battles
    'Sabine Cross Roads, LA': {'lat': 31.9944, 'lon': -93.6960},
    'Pleasant Hill, LA':    {'lat': 31.9136, 'lon': -93.5619},
    "Monett's Ferry, LA":   {'lat': 31.5500, 'lon': -92.6500},
    'Mansura, LA':          {'lat': 31.1500, 'lon': -92.0500},

    # Alabama
    'Stevenson, AL':        {'lat': 34.8687, 'lon': -85.8394},

    # Georgia
    'Whiteside, GA':        {'lat': 34.8800, 'lon': -85.5000},  # near Lookout Mtn
    'Ringgold, GA':         {'lat': 34.9156, 'lon': -85.1096},
    'Dalton, GA':           {'lat': 34.7698, 'lon': -84.9702},
    'Resaca, GA':           {'lat': 34.5809, 'lon': -84.9388},
    'Altoona, GA':          {'lat': 34.4812, 'lon': -84.7224},  # Allatoona Creek
    "Buzzard's Roost, GA":  {'lat': 34.7400, 'lon': -84.9800},
    'Kingston, GA':         {'lat': 34.2362, 'lon': -84.9427},
    'Oostanaula, GA':       {'lat': 34.5200, 'lon': -84.9200},
    'Dallas, GA':           {'lat': 33.9243, 'lon': -84.8413},
    'Marietta, GA':         {'lat': 33.9526, 'lon': -84.5499},
    'Chattahoochee, GA':    {'lat': 33.8800, 'lon': -84.4400},
    'Atlanta, GA':          {'lat': 33.7490, 'lon': -84.3880},
    'Savannah, GA':         {'lat': 32.0809, 'lon': -81.0912},

    # Louisiana
    'New Orleans, LA':      {'lat': 29.9511, 'lon': -90.0715},
    'Algiers, LA':          {'lat': 29.9425, 'lon': -90.0318},
    'Morganza, LA':         {'lat': 30.7382, 'lon': -91.5903},
    'Alexandria, LA':       {'lat': 31.3113, 'lon': -92.4451},

    # South Carolina
    'Charleston, SC':       {'lat': 32.7765, 'lon': -79.9311},
}


# ============================================================
# FUZZY LOCATION MATCHER (ported from viz-map-moves.html logic)
# ============================================================
def normalize_location(loc_str):
    """Map a raw letter location string to a canonical GEOCODE key."""
    if not loc_str:
        return None
    loc = loc_str.lower().strip().strip('"')

    # Direct matches first
    for key in GEOCODE:
        if key.lower() == loc:
            return key

    # --- New York ---
    if 'champlain' in loc:
        return 'Champlain, NY'
    if 'plattsburgh' in loc or 'plattsburg' in loc:
        return 'Plattsburgh, NY'
    if 'ogdensburg' in loc or 'ogdensburgh' in loc or 'camp wheeler' in loc:
        return 'Ogdensburg, NY'
    if 'albany' in loc:
        return 'Albany, NY'
    if 'fonda' in loc or 'camp mohawk' in loc:
        return 'Fonda, NY'
    if 'atlas' in loc and 'michigan' in loc:
        return 'Atlas, MI'

    # West Point disambiguation
    if 'west point' in loc:
        if ', va' in loc or 'york river' in loc or 'camp windfield' in loc or 'camp winfield' in loc or 'camp alton' in loc:
            return 'West Point, VA'
        if 'academy' in loc or 'military' in loc or ', ny' in loc:
            return 'West Point, NY'
        return 'West Point, NY'  # default

    # --- Maryland ---
    if 'baltimore' in loc or 'camp jackson' in loc or 'camden station' in loc or 'camp preston king' in loc or 'patterson park' in loc:
        return 'Baltimore, MD'
    if 'camp niles' in loc or 'relay' in loc:
        return 'Relay, MD'
    if 'frederick' in loc and 'city' in loc:
        return 'Baltimore, MD'  # Frederick City hospital was Baltimore area letter
    if 'point lookout' in loc:
        return 'Point Lookout, MD'
    if 'antietam' in loc or 'sharpsburg' in loc or 'sharpsburgh' in loc:
        return 'Antietam, MD'
    if "crampton" in loc:
        return "Crampton's Gap, MD"
    if 'camp mcclellan' in loc or 'poolesville' in loc:
        return 'Poolesville, MD'

    # --- D.C. ---
    if 'washington' in loc:
        if ', va' in loc or 'rappahannock' in loc:
            # "Washington, Va." is a tiny town in Rappahannock County
            return 'Warrenton, VA'  # closest canonical
        return 'Washington, D.C.'
    if 'capitol hill' in loc or 'camp davis' in loc or 'eckington' in loc:
        return 'Washington, D.C.'

    # --- Virginia: Harpers Ferry / Shenandoah ---
    if 'harpers ferry' in loc or "harper's ferry" in loc or 'harper' in loc or 'bolivar' in loc or 'camp gorman' in loc or 'camp gormon' in loc or 'maryland heights' in loc:
        return 'Harpers Ferry, WV'
    if 'winchester' in loc:
        return 'Winchester, VA'
    if 'strausburgh' in loc or 'strasburg' in loc or 'strausburg' in loc or 'camp goodrich' in loc:
        return 'Strasburg, VA'
    if 'front royal' in loc or 'fort royal' in loc or 'onikers' in loc:
        return 'Front Royal, VA'
    if 'newtown' in loc or 'camp russell' in loc:
        return 'Newtown, VA'
    if 'cedar creek' in loc:
        return 'Cedar Creek, VA'
    if 'harrisonburg' in loc:
        return 'Harrisonburg, VA'

    # --- Virginia: Northern ---
    if 'alexandria' in loc:
        if 'louisiana' in loc:
            return 'Alexandria, LA'
        return 'Alexandria, VA'
    if 'fairfax' in loc:
        return 'Fairfax Station, VA'
    if 'manassas' in loc or 'bull run' in loc:
        return 'Manassas, VA'
    if 'warrenton junction' in loc:
        return 'Warrenton Junction, VA'
    if 'warrenton' in loc or 'pine mountain' in loc:
        return 'Warrenton, VA'
    if 'ellis ford' in loc:
        return 'Ellis Ford, VA'
    if 'raccoon ford' in loc or 'rapidan' in loc:
        return 'Raccoon Ford, VA'
    if 'stafford' in loc:
        return 'Stafford, VA'
    if 'aquia' in loc:
        return 'Aquia Landing, VA'
    if 'falmouth' in loc:
        return 'Falmouth, VA'

    # --- Virginia: Peninsula ---
    if 'fortress monroe' in loc or 'fort monroe' in loc:
        return 'Fort Monroe, VA'
    if 'hampton' in loc:
        return 'Hampton, VA'
    if 'york town' in loc or 'yorktown' in loc:
        return 'Yorktown, VA'
    if 'rebels camp' in loc:
        return 'Yorktown, VA'
    if 'fair oaks' in loc or 'seven pines' in loc:
        return 'Fair Oaks, VA'
    if 'harrison' in loc and ('landing' in loc or 'james river' in loc):
        return "Harrison's Landing, VA"
    if 'james river' in loc:
        return "Harrison's Landing, VA"
    if 'richmond' in loc or 'five miles of richmond' in loc:
        return 'Richmond, VA'

    # --- Pennsylvania ---
    if 'gettysburg' in loc:
        return 'Gettysburg, PA'
    if 'philadelphia' in loc or 'chestnut hill' in loc:
        return 'Philadelphia, PA'

    # --- Tennessee ---
    if 'nashville' in loc or 'lolliecoffer' in loc:
        return 'Nashville, TN'
    if 'murfreesboro' in loc:
        return 'Murfreesboro, TN'
    if 'tullahoma' in loc:
        return 'Tullahoma, TN'
    if 'chattanooga' in loc:
        return 'Chattanooga, TN'
    if 'wauhatchie' in loc:
        return 'Wauhatchie, TN'

    # --- Alabama ---
    if 'stephenson' in loc or 'stevenson' in loc:
        return 'Stevenson, AL'

    # --- Georgia ---
    if 'white side' in loc or 'whiteside' in loc:
        return 'Whiteside, GA'
    if 'altoona' in loc or 'allatoona' in loc:
        return 'Altoona, GA'
    if "buzzard" in loc:
        return "Buzzard's Roost, GA"
    if 'kingston' in loc:
        return 'Kingston, GA'
    if 'oostanaula' in loc:
        return 'Oostanaula, GA'
    if 'dallas' in loc:
        return 'Dallas, GA'
    if 'marietta' in loc:
        return 'Marietta, GA'
    if 'chattahoochee' in loc:
        return 'Chattahoochee, GA'
    if 'atlanta' in loc:
        return 'Atlanta, GA'
    if 'savannah' in loc:
        return 'Savannah, GA'
    if 'georgia' in loc and 'camp somewhere' in loc:
        # "Camp somewhere in the State of Georgia" [error — Virginia]
        # The editorial says this is actually Virginia, near Chancellorsville
        return 'Falmouth, VA'

    # --- Louisiana ---
    if 'new orleans' in loc:
        return 'New Orleans, LA'
    if 'algiers' in loc:
        return 'Algiers, LA'
    if 'morganza' in loc or 'mississippi river' in loc:
        return 'Morganza, LA'

    # --- South Carolina ---
    if 'charleston' in loc:
        return 'Charleston, SC'

    # --- Fallback: field / camp / unknown ---
    if '2d div' in loc or '20th a.c' in loc or '20th corps' in loc:
        return 'Atlanta, GA'  # 20th Army Corps was near Atlanta

    if 'camp in field' in loc:
        if 'hampton' in loc:
            return 'Hampton, VA'
        return 'Yorktown, VA'  # 34th NY default during Peninsula Campaign

    if 'camp of the 34th' in loc:
        return 'Yorktown, VA'  # 34th was on the Peninsula

    if 'across the potomac' in loc or 'potomac' in loc:
        return 'Poolesville, MD'

    return None


# ============================================================
# BUILD MOVEMENTS JSON
# ============================================================
def determine_status(letter):
    """Infer status from letter flags and location."""
    loc = (letter.get('location') or '').lower()
    if letter.get('hasWound') and ('hospital' in loc):
        return 'wounded'
    if letter.get('hasIllness') and ('hospital' in loc):
        return 'hospitalized'
    if 'hospital' in loc:
        return 'hospitalized'
    if letter.get('hasBattle'):
        return 'in_battle'
    if 'camp' in loc or 'barracks' in loc:
        return 'in_camp'
    if 'field' in loc or 'entrenchment' in loc:
        return 'in_field'
    return 'in_camp'


def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, '03-data')

    with open(os.path.join(data_dir, 'all-letters.json'), encoding='utf-8') as f:
        letters = json.load(f)

    # Import unit history data
    from unit_history_data import (
        HENRY_34TH_NY, ALEXANDER_60TH_NY,
        CHARLES_JAMES_153RD_NY, JAMES_ADDITIONAL
    )

    brothers = {
        "henry": {
            "name": "Henry Hubbell",
            "regiment": "34th NY Infantry",
            "color": "#2D5F8A",
            "serviceStart": "1861-06-15",
            "serviceEnd": "1862-09-17",
            "endReason": "KIA at Battle of Antietam"
        },
        "alexander": {
            "name": "Alexander Hubbell",
            "regiment": "60th NY Infantry",
            "color": "#B8860B",
            "serviceStart": "1861-09-13",
            "serviceEnd": "1865-07-27",
            "endReason": "Mustered out"
        },
        "charles": {
            "name": "Charles Hubbell",
            "regiment": "153rd NY Infantry",
            "color": "#8B3A3A",
            "serviceStart": "1862-09-01",
            "serviceEnd": "1865-10-02",
            "endReason": "Mustered out"
        },
        "james": {
            "name": "James Hubbell",
            "regiment": "West Point / 153rd NY",
            "color": "#4A7C59",
            "serviceStart": "1861-07-01",
            "serviceEnd": "1865-06-15",
            "endReason": "Mustered out"
        }
    }

    movements = []
    unmapped = set()
    mov_id = 0

    for letter in letters:
        author = letter.get('author', '')
        if author not in brothers:
            # Skip mother, unknown
            continue

        raw_loc = letter.get('location', '')
        canonical = normalize_location(raw_loc)

        if not canonical:
            if raw_loc and raw_loc not in ('Unknown', ''):
                unmapped.add(raw_loc)
            continue

        coords = GEOCODE[canonical]
        mov_id += 1

        # Extract first 200 chars of transcription as excerpt
        transcription = letter.get('transcription', '')
        # Get first meaningful paragraph (skip date/location header lines)
        lines = transcription.split('\n')
        content_lines = [l.strip() for l in lines if l.strip() and not re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d)', l.strip())]
        excerpt = ''
        for cl in content_lines:
            if len(cl) > 30:
                excerpt = cl[:200] + ('...' if len(cl) > 200 else '')
                break

        movements.append({
            "id": f"mov-{mov_id:03d}",
            "brother": author,
            "date": letter['date'],
            "endDate": None,
            "lat": coords['lat'],
            "lon": coords['lon'],
            "placeName": canonical,
            "source": "letter",
            "letterId": letter['id'],
            "letterExcerpt": excerpt,
            "recipient": letter.get('recipient', ''),
            "sigSummary": letter.get('sigSummary', ''),
            "transcription": letter.get('transcription', ''),
            "citation": None,
            "status": determine_status(letter),
            "notes": letter.get('notes', ''),
            "significance": letter.get('significance', 'routine'),
            "hasBattle": letter.get('hasBattle', False),
            "hasIllness": letter.get('hasIllness', False),
            "hasDeath": letter.get('hasDeath', False),
            "hasWound": letter.get('hasWound', False)
        })

    # ── Add unit history movements (fill gaps between letters) ──
    unit_history_sources = {
        "henry": HENRY_34TH_NY,
        "alexander": ALEXANDER_60TH_NY,
        "charles": CHARLES_JAMES_153RD_NY,
        "james": JAMES_ADDITIONAL,
    }

    for brother_id, entries in unit_history_sources.items():
        # Get letter dates for this brother to avoid duplicating
        letter_dates_locs = set()
        for m in movements:
            if m['brother'] == brother_id:
                letter_dates_locs.add((m['date'], m['placeName']))

        for entry in entries:
            # Skip if a letter already covers this exact date+location
            if (entry['date'], entry['placeName']) in letter_dates_locs:
                continue

            # For 153rd NY data shared between Charles and James,
            # use the brother field if present, otherwise default to charles
            actual_brother = entry.get('brother', brother_id)
            if brother_id == 'charles' and actual_brother != 'charles':
                continue  # James entries handled separately
            if brother_id == 'james' and 'brother' not in entry:
                # 153rd NY shared entries — add for james too if no letter covers it
                actual_brother = 'james'

            mov_id += 1
            movements.append({
                "id": f"mov-{mov_id:03d}",
                "brother": actual_brother,
                "date": entry['date'],
                "endDate": entry.get('endDate'),
                "lat": entry['lat'],
                "lon": entry['lon'],
                "placeName": entry['placeName'],
                "source": "unit_history",
                "letterId": None,
                "letterExcerpt": None,
                "citation": entry.get('citation', 'Dyer\'s Compendium'),
                "status": entry.get('status', 'in_camp'),
                "notes": entry.get('notes', ''),
                "significance": "routine",
                "hasBattle": entry.get('status') == 'in_battle',
                "hasIllness": entry.get('status') == 'hospitalized',
                "hasDeath": False,
                "hasWound": entry.get('status') == 'wounded'
            })

    # For 153rd NY: also add entries for James (shared regiment)
    for entry in CHARLES_JAMES_153RD_NY:
        if 'brother' in entry:
            continue  # Already has specific brother assignment
        # Check if James already has a letter or unit_history entry for this date
        james_dates = set(m['date'] for m in movements if m['brother'] == 'james')
        if entry['date'] not in james_dates:
            mov_id += 1
            movements.append({
                "id": f"mov-{mov_id:03d}",
                "brother": "james",
                "date": entry['date'],
                "endDate": entry.get('endDate'),
                "lat": entry['lat'],
                "lon": entry['lon'],
                "placeName": entry['placeName'],
                "source": "unit_history",
                "letterId": None,
                "letterExcerpt": None,
                "citation": entry.get('citation', 'Dyer\'s Compendium'),
                "status": entry.get('status', 'in_camp'),
                "notes": entry.get('notes', ''),
                "significance": "routine",
                "hasBattle": entry.get('status') == 'in_battle',
                "hasIllness": entry.get('status') == 'hospitalized',
                "hasDeath": False,
                "hasWound": False
            })

    # Sort all movements by date, then by brother
    movements.sort(key=lambda m: (m['date'], m['brother']))

    # Count sources
    letter_count = sum(1 for m in movements if m['source'] == 'letter')
    unit_count = sum(1 for m in movements if m['source'] == 'unit_history')

    # Key war events
    events = [
        {"date": "1861-07-21", "label": "First Battle of Bull Run", "type": "battle",
         "lat": 38.7509, "lon": -77.4753, "brothers": ["henry"]},
        {"date": "1862-04-05", "label": "Siege of Yorktown begins", "type": "battle",
         "lat": 37.2387, "lon": -76.5098, "brothers": ["henry"]},
        {"date": "1862-05-05", "label": "Battle of Williamsburg", "type": "battle",
         "lat": 37.2705, "lon": -76.7075, "brothers": ["henry"]},
        {"date": "1862-05-31", "label": "Battle of Fair Oaks / Seven Pines", "type": "battle",
         "lat": 37.5501, "lon": -77.3117, "brothers": ["henry"]},
        {"date": "1862-06-25", "label": "Seven Days Battles begin", "type": "battle",
         "lat": 37.5407, "lon": -77.4360, "brothers": ["henry"]},
        {"date": "1862-07-01", "label": "Battle of Malvern Hill", "type": "battle",
         "lat": 37.3867, "lon": -77.2472, "brothers": ["henry"]},
        {"date": "1862-08-28", "label": "Second Battle of Bull Run", "type": "battle",
         "lat": 38.7509, "lon": -77.4753, "brothers": ["alexander"]},
        {"date": "1862-09-17", "label": "Battle of Antietam", "type": "battle",
         "lat": 39.4747, "lon": -77.7447, "brothers": ["henry", "alexander"],
         "notes": "Henry Hubbell killed in action"},
        {"date": "1862-12-13", "label": "Battle of Fredericksburg", "type": "battle",
         "lat": 38.3032, "lon": -77.4605, "brothers": ["alexander"]},
        {"date": "1863-05-01", "label": "Battle of Chancellorsville", "type": "battle",
         "lat": 38.3048, "lon": -77.6387, "brothers": ["alexander"]},
        {"date": "1863-07-01", "label": "Battle of Gettysburg", "type": "battle",
         "lat": 39.8309, "lon": -77.2311, "brothers": ["alexander"]},
        {"date": "1863-09-19", "label": "Battle of Chickamauga", "type": "battle",
         "lat": 34.9281, "lon": -85.2613, "brothers": []},
        {"date": "1863-11-23", "label": "Battle of Lookout Mountain", "type": "battle",
         "lat": 35.0087, "lon": -85.3444, "brothers": ["alexander"]},
        {"date": "1863-11-25", "label": "Battle of Missionary Ridge", "type": "battle",
         "lat": 35.0139, "lon": -85.2522, "brothers": ["alexander"]},
        {"date": "1864-05-07", "label": "Battle of Rocky Face Ridge", "type": "battle",
         "lat": 34.7700, "lon": -84.9700, "brothers": ["alexander"]},
        {"date": "1864-05-14", "label": "Battle of Resaca", "type": "battle",
         "lat": 34.5809, "lon": -84.9388, "brothers": ["alexander"]},
        {"date": "1864-05-25", "label": "Battle of New Hope Church", "type": "battle",
         "lat": 33.9500, "lon": -84.7900, "brothers": ["alexander"]},
        {"date": "1864-06-27", "label": "Battle of Kennesaw Mountain", "type": "battle",
         "lat": 33.9833, "lon": -84.5806, "brothers": ["alexander"]},
        {"date": "1864-07-20", "label": "Battle of Peachtree Creek", "type": "battle",
         "lat": 33.8000, "lon": -84.4000, "brothers": ["alexander"]},
        {"date": "1864-07-22", "label": "Battle of Atlanta", "type": "battle",
         "lat": 33.7490, "lon": -84.3880, "brothers": ["alexander"]},
        # Red River Campaign (153rd NY)
        {"date": "1864-04-08", "label": "Battle of Sabine Cross Roads", "type": "battle",
         "lat": 31.9944, "lon": -93.6960, "brothers": ["charles", "james"]},
        {"date": "1864-04-09", "label": "Battle of Pleasant Hill", "type": "battle",
         "lat": 31.9136, "lon": -93.5619, "brothers": ["charles", "james"]},
        # Early's Raid on Washington
        {"date": "1864-07-12", "label": "Repulse of Early's Raid on Washington", "type": "battle",
         "lat": 38.9072, "lon": -77.0369, "brothers": ["charles", "james"]},
        # Shenandoah Valley Campaign
        {"date": "1864-09-19", "label": "Third Battle of Winchester", "type": "battle",
         "lat": 39.1857, "lon": -78.1633, "brothers": ["charles", "james"]},
        {"date": "1864-09-22", "label": "Battle of Fisher's Hill", "type": "battle",
         "lat": 38.9950, "lon": -78.3700, "brothers": ["charles", "james"]},
        {"date": "1864-10-19", "label": "Battle of Cedar Creek", "type": "battle",
         "lat": 39.0286, "lon": -78.3147, "brothers": ["charles", "james"]},
        {"date": "1864-12-15", "label": "Battle of Nashville", "type": "battle",
         "lat": 36.1627, "lon": -86.7816, "brothers": ["alexander"]},
        # End of war
        {"date": "1865-04-09", "label": "Lee surrenders at Appomattox", "type": "milestone",
         "lat": 37.3773, "lon": -78.7986, "brothers": []},
        {"date": "1865-05-24", "label": "Grand Review of the Armies", "type": "milestone",
         "lat": 38.9072, "lon": -77.0369, "brothers": ["alexander", "charles"]},
    ]

    result = {
        "brothers": brothers,
        "movements": movements,
        "events": events,
        "metadata": {
            "generated": "2026-03-30",
            "totalMovements": len(movements),
            "letterCount": letter_count,
            "unitHistoryCount": unit_count,
            "unmappedLocations": sorted(list(unmapped)),
            "dateRange": {"start": "1861-06-15", "end": "1865-10-02"}
        }
    }

    out_path = os.path.join(data_dir, 'map-movements.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # Also generate .js wrapper for file:// protocol (no CORS issues)
    js_path = os.path.join(data_dir, 'map-movements.js')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('// Auto-generated — do not edit. Run generate-map-movements.py to rebuild.\n')
        f.write('window.__MAP_MOVEMENTS__ = ')
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write(';\n')

    print(f"Generated {out_path}")
    print(f"Generated {js_path}")
    print(f"  {len(movements)} total movements")
    print(f"    {letter_count} letter-sourced (star icons)")
    print(f"    {unit_count} unit-history (plain dots)")
    print(f"  {len(events)} war events")
    print(f"  {len(unmapped)} unmapped locations: {sorted(list(unmapped))}")

    # Per-brother breakdown
    for b in ['henry', 'alexander', 'charles', 'james']:
        bl = sum(1 for m in movements if m['brother'] == b and m['source'] == 'letter')
        bu = sum(1 for m in movements if m['brother'] == b and m['source'] == 'unit_history')
        print(f"  {b}: {bl} letters + {bu} unit history = {bl+bu} total")


if __name__ == '__main__':
    build()
