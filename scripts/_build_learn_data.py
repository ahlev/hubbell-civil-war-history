# -*- coding: utf-8 -*-
"""One-off generator for _learn-data.js (Their Own Words question bank).

Excerpts are NEVER retyped here: brother/mother quotes come by index from
03-data/learn-quote-candidates.json (already machine-verified verbatim), and
the one quote outside that bank (Act V Family, the "tea table" line) is sliced
directly from the corpus by substring anchors. Run from project root:

    python scripts/_build_learn_data.py && python scripts/validate_learn_quotes.py
"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAND = json.load(io.open(os.path.join(ROOT, '03-data', 'learn-quote-candidates.json'), encoding='utf-8'))
DATA = json.load(io.open(os.path.join(ROOT, '03-data', 'all-letters.json'), encoding='utf-8'))
LETTERS = DATA['letters'] if isinstance(DATA, dict) and 'letters' in DATA else DATA
BY_ID = {l['id']: l for l in LETTERS}

NAME = {'henry': 'Henry', 'alexander': 'Alexander', 'james': 'James',
        'charles': 'Charles', 'mother': 'Frances (their mother)'}


def slice_quote(letter_id, start_anchor, end_anchor):
    """Extract a verbatim excerpt from the corpus by anchors (inclusive)."""
    t = BY_ID[letter_id]['transcription']
    i = t.index(start_anchor)
    j = t.index(end_anchor, i) + len(end_anchor)
    return t[i:j]


def cand(idx):
    c = CAND[idx]
    return {'letterId': c['id'], 'author': c['author'], 'date': c['date'],
            'location': c.get('location', ''), 'excerpt': c['excerpt']}


def attribution(author, recipient_note, location, date_str):
    return f"{NAME[author]}, {recipient_note} — {location} · {date_str}"


def map_url(date, author, letter_id):
    if author == 'mother':
        return f"viz-map-fullwar?date={date}&home=1"
    return f"viz-map-fullwar?date={date}&brother={author}&letter={letter_id}"


def q(qid, act, theme, source, recipient_note, date_str, stem, choices,
      answer_idx, why_right, expansion, why_wrong=None, extra_spoke=None):
    bio = 'mother' if source['author'] == 'mother' else source['author']
    out = {
        'qid': qid, 'act': act, 'theme': theme,
        'letterId': source['letterId'], 'author': source['author'],
        'date': source['date'], 'location': source['location'],
        'excerpt': source['excerpt'],
        'attribution': attribution(source['author'], recipient_note,
                                   source['location'], date_str),
        'stem': stem, 'choices': choices, 'answerIdx': answer_idx,
        'whyRight': why_right,
        'whyWrong': why_wrong or {},
        'expansion': expansion,
        'spokes': {'letter': True,
                   'map': map_url(source['date'], source['author'], source['letterId']),
                   'bio': bio},
        'curriculum': ''
    }
    if extra_spoke:
        out['spokes']['extra'] = extra_spoke
    return out


QS = []

# ═══════════════ ACT I — "Leaving Home" ═══════════════

s = cand(0)  # Henry, Bull Run heard from Washington
x = q('a1-nation', 1, 'nation', s, 'to his mother', 'July 21, 1861',
      'Henry wrote this on July 21, 1861. What battle could he hear from Washington?',
      ['The bombardment of Fort Sumter',
       'The First Battle of Bull Run',
       'The Battle of Antietam',
       'The siege of Richmond'],
      1,
      "That's the truth of it. He was listening to First Bull Run — the war's first great battle, fought at Manassas Junction, close enough to Washington that picnicking spectators rode out to watch and a farm boy in camp could hear the guns.",
      "The Union defeat at Bull Run ended the summer's illusion of a ninety-day war. Congress authorized a million three-year volunteers within days. Henry's regiment, five hundred miles from home and barely a month into its service, was suddenly in a long war — and this letter catches the exact afternoon the country found out.",
      {'0': "Fort Sumter had fallen three months earlier, in April — and it's in Charleston harbor, far beyond earshot of Washington. The guns Henry heard were much closer.",
       '2': "Antietam comes fourteen months later, in Maryland — a battle this family will have terrible cause to remember. In July 1861 the war hadn't yet touched them.",
       '3': "Richmond was never besieged in 1861 — the war was four days old in earnest. The firing was at a creek called Bull Run, not thirty miles off."})
x['curriculum'] = 'First Bull Run & the end of the short-war illusion'
QS.append(x)

s = cand(15)  # Alexander, "all the poetry will be taken out of them"
x = q('a1-camp', 1, 'camp', s, 'to his mother', 'March 6, 1862',
      'Alexander wants a message passed to three hometown boys thinking of enlisting. What is he telling them?',
      ['Bring warm clothes — the army never issues enough',
       'Stay home — the war is already lost',
       'Soldiering is drudgery that will cure their romantic ideas fast',
       'Join the cavalry — it pays better than the infantry'],
      2,
      "That's the truth of it. “All the poetry will be taken out of them” — the gap between the parade-ground fantasy and the mud was the first lesson every recruit learned.",
      "Soldiers called their first combat “seeing the elephant,” but the disillusionment started long before any battle: drill by the hour, mud, lice, bad water, and boredom. An army of farm boys had to be manufactured into soldiers — in 1862 McClellan's drillmasters were doing exactly that, and veterans of six months like Alexander already talked like old men.",
      {'1': "Not at all — Alexander never doubted the cause; he reenlisted as a veteran and served to the very end. His warning is about romance, not defeat.",
       '3': "He mentions cavalry — but as the men he watched drilling through mud and water, not as an upgrade. No branch escaped the drudgery."})
x['curriculum'] = 'Camp life, drill & the hardening of recruits'
QS.append(x)

s = cand(4)  # Henry, sky for a covering
x = q('a1-body', 1, 'body', s, 'to his sister Fannie', 'February 5, 1862',
      'Henry describes his first night on campaign: no tent, February cold, a single blanket. What does this kind of exposure explain about Civil War deaths?',
      ['Why frostbite was the leading cause of discharge',
       'Why roughly two of every three soldier deaths came from disease, not battle',
       'Why armies refused to campaign in winter',
       'Why the Union issued fur uniforms after 1862'],
      1,
      "That's the truth of it. Battle killed spectacularly, but exposure, bad water, and crowded camps killed steadily — disease took about twice as many soldiers as combat did.",
      "Pneumonia, typhoid, dysentery, and measles swept armies of rural men who had never been exposed to crowd diseases. A night like Henry's — wet ground, one blanket, February air — was where it started. This family will live both sides of the statistic: the war killed three of the four brothers — one in battle, and two by what it did to their bodies.",
      {'2': "Armies did prefer winter quarters — but campaigns happened in every season (Henry is ON one, in February). The real cost of cold wasn't paused wars; it was filled hospitals.",
       '3': "No fur uniforms ever came. The soldier's issue stayed wool and canvas — which is exactly why nights like this one mattered."})
x['curriculum'] = 'Exposure & disease — the war’s deadliest killer (2:1)'
QS.append(x)

s = cand(3)  # Henry, sutler's / $26
x = q('a1-purse', 1, 'purse', s, 'to his mother', 'February 4, 1862',
      "Henry plans to “keep clear” of the sutler and save $26 over two months. What does that tell you a Union private earned?",
      ['About $13 a month',
       'About $26 a week',
       'A dollar a day, like a farmhand',
       'Nothing — privates served without pay'],
      0,
      "That's the truth of it. Thirteen dollars a month — and Henry's arithmetic (two months, $26) is the primary source doing the teaching.",
      "The sutler was a licensed private merchant who followed each regiment selling pies, tobacco, and notions at legendary markups — on credit against payday. A careless private could owe his whole month before the paymaster ever arrived. Watch how often the brothers write about money: pay was late, prices doubled, and every spare dollar went home to the farm.",
      {'1': "That would make a private rich — $26 was two full months of army pay, which is exactly why Henry frames saving it as an achievement.",
       '2': "A northern farmhand might earn that, which is the point — army pay was a wage CUT for most of these men, taken anyway."})
x['curriculum'] = 'Army pay, sutlers & the soldier economy'
QS.append(x)

s = cand(14)  # Alexander, write often, write often, often
x = q('a1-family', 1, 'family', s, 'to his mother', 'January 24, 1862',
      'Alexander repeats one word three times in a single sentence. Why did mail matter this much to soldiers?',
      ['Letters were the only proof to the army that a soldier had a family',
       'Letters from home were the emotional lifeline of the ranks — and officers knew it',
       'Soldiers were paid a bonus for every letter received',
       'Regulations required a weekly letter to remain in good standing'],
      1,
      "That's the truth of it. “Write often, write often, often” — no line in the collection says it plainer. Mail call decided the mood of a company.",
      "The armies moved unprecedented volumes of mail — millions of letters a year through the U.S. Sanitary and Christian Commissions' free stationery and the field post. Generals treated mail as a morale weapon. For this family, the letters were everything: five correspondents, four years, 272 letters — the archive you're inside right now exists because Frances Hubbell obeyed this sentence.",
      {'2': "No bonus existed — if anything, soldiers PAID to write: paper and stamps were scarce, and some letters went home marked postage-due.",
       '3': "No such regulation existed. The pressure ran the other way — homesick soldiers begging their families to write faster."})
x['curriculum'] = 'The mail as morale infrastructure'
QS.append(x)

# ═══════════════ ACT II — "The Hardening" ═══════════════

s = cand(37)  # Charles, troop train, guarded doors
x = q('a2-camp', 2, 'camp', s, 'to his mother', 'October 15, 1862',
      'Charles, three weeks a soldier, rides south in a rail car with guarded doors. Why were the doors guarded?',
      ['To keep Confederate spies from boarding',
       'To stop new recruits from slipping away en route',
       'To protect the payroll chest aboard the train',
       'Quarantine — measles was loose in the regiment'],
      1,
      "That's the truth of it. Bounty men and cold-footed recruits vanished at every water stop — so the 153rd New York rode south under guard, thirsty.",
      "The Civil War was the first war moved by rail: entire regiments — a thousand men, baggage, and beef — shifted hundreds of miles in days instead of weeks. But the same trains that moved armies leaked deserters, especially among men who had pocketed enlistment bounties. Charles's guarded doors are logistics and human nature in one sentence.",
      {'0': "Spies were a real fear, but not what door guards on a NORTHBOUND-loading recruit train were for — the threat these guards watched was on the inside.",
       '3': "Disease did stalk new regiments (measles especially) — but quarantine meant camps, not locked cars. The guards were for the men, not the microbes."})
x['curriculum'] = 'Railroads & mass mobilization'
QS.append(x)

s = cand(7)  # Henry, ground covered with the dead
x = q('a2-body', 2, 'body', s, 'to his brother Charles', 'June 13, 1862',
      'Henry is describing the ground after Fair Oaks, outside Richmond. Why were Civil War battles this lethal?',
      ['Rifled muskets met tactics designed for older, shorter-range weapons',
       'Neither army took prisoners in 1862',
       'Artillery had become accurate beyond a mile',
       'Most of the dead were victims of hand-to-hand fighting'],
      0,
      "That's the truth of it. The rifle-musket was deadly at three times the range of the old smoothbore — but men still advanced shoulder-to-shoulder, as the manuals said. The arithmetic landed on fields like this one.",
      "Fair Oaks (Seven Pines) cost both armies about eleven thousand men in two days — and it was only a preview. Note what Henry does: he tells his BROTHER the ground was covered with the dead, plainly. To his mother, the same weeks sound careful and reassuring. The brothers kept a second, harder war for each other — historians of this collection call it an asymmetry of register.",
      {'1': "Both sides took prisoners throughout 1862 — parole and exchange were routine. The dead Henry saw fell to firepower, not to a no-quarter war.",
       '3': "Bayonet wounds accounted for well under one percent of casualties. The killing happened at range — which is exactly what made the old close-order tactics so costly."})
x['curriculum'] = 'Rifled muskets vs. Napoleonic tactics — the scale of killing'
QS.append(x)

s = cand(20)  # Alexander, paying and hoarding substitutes  (EXEMPLAR 5.1)
x = q('a2-purse', 2, 'purse', s, 'to his mother and sister', 'November 25, 1862',
      'Alexander is scoffing at two men from his hometown. What had they done?',
      ['Bribed officials to lose their enlistment papers',
       'Hired other men to serve in the army in their place',
       'Bought exemptions from the local sheriff',
       'Enlisted, then paid to be assigned safe garrison duty'],
      1,
      "That's the truth of it. Under the militia drafts — and later the 1863 Enrollment Act — a drafted man could send a paid substitute instead. “Give them the slip” is Alexander wishing the substitutes would take the money and vanish.",
      "Alexander wrote this twelve days after leaving the Antietam campaign's hospitals, which sharpened his feelings about neighbors buying their way out. Substitution was legal, common, and legendarily resented by the men already in uniform — it fed the bitterest slogan of the war: “a rich man's war and a poor man's fight.”",
      {'2': "Exemption corruption existed, but it's not what he names — he says they're “paying and hoarding substitutes”: hiring replacement men and keeping them ready.",
       '0': "Nothing so furtive — what they did was perfectly legal, which is precisely why it stung the men in the ranks."})
x['curriculum'] = 'Substitutes & “rich man’s war, poor man’s fight”'
QS.append(x)

s = cand(10)  # Henry, Irish Brigade
x = q('a2-nation', 2, 'nation', s, 'to his mother', 'July 12, 1862',
      'Henry watched the Irish Brigade charge on the Peninsula. What does that unit tell you about the Union army?',
      ['It relied heavily on immigrant soldiers, some in famous ethnic regiments',
       'It hired foreign mercenaries under European officers',
       'Only U.S. citizens were allowed to fight',
       'Irish units served only as labor battalions'],
      0,
      "That's the truth of it. Roughly one Union soldier in four was foreign-born — Irish, German, Scandinavian — and units like Meagher's Irish Brigade carried their identity into battle, green flags and all.",
      "Immigration had remade the North in the 1840s and '50s, and the army showed it: entire regiments drilled in German; the Irish Brigade's charges at Antietam and Fredericksburg became legend. A farm boy from Champlain shared his war with men born an ocean away — and noticed them, 'shouting at the top of their voices,' with open admiration.",
      {'1': "No mercenaries — these were volunteers and citizens-in-the-making; many enlisted partly to prove their Americanness.",
       '2': "Citizenship was never required — declaring intent was enough, and the army became a fast road to naturalization."})
x['curriculum'] = 'Immigrant soldiers & ethnic regiments'
QS.append(x)

s = cand(58)  # Mother, the unknown buried
x = q('a2-family', 2, 'family', s, 'to Alexander', 'October 29, 1862',
      'Six weeks after Antietam, Frances still doesn’t know what happened to Henry. Why could a mother be left guessing this long?',
      ['The army kept casualty lists secret in wartime',
       'There was no official system to identify the dead or notify families',
       'Mail from Maryland was blockaded',
       'Families were only notified after a soldier’s enlistment expired'],
      1,
      "That's the truth of it. No dog tags, no graves registration, no notification service — identification depended on comrades, and after a battle like Antietam, comrades were often gone too.",
      "Nearly half the Union dead of the war lie under stones that say UNKNOWN. Families scanned newspaper casualty lists, wrote to colonels and chaplains, and waited. Frances did all three — this letter is her doing it. The interlude ahead carries what she eventually learned.",
      {'0': "Papers PRINTED casualty lists — that was often how families found out, badly and late. The problem wasn't secrecy; it was that no one was responsible for telling them at all.",
       '2': "Mail moved — her letters reached Alexander at Harpers Ferry. What didn't exist was anyone whose job it was to send the one letter she feared."})
x['curriculum'] = 'The unknown dead & death in the Civil War'
QS.append(x)

# ═══════════════ ACT III — "The Long Middle" ═══════════════

s = cand(27)  # Alexander, marched by the coffins
x = q('a3-camp', 3, 'camp', s, 'to his mother', 'September 18, 1863',
      'Alexander’s whole corps was marched past the coffins after an execution. Why did the army stage it that way?',
      ['Regulations required every soldier to witness burials',
       'As deliberate deterrence — desertion had become an epidemic',
       'To honor the executed men’s prior service',
       'To let surgeons certify the deaths publicly'],
      1,
      "That's the truth of it. “That we might see them and learn a lesson” — Alexander understood the choreography perfectly, and even approved of it.",
      "Roughly two hundred thousand Union soldiers deserted during the war; 1863, after Fredericksburg's misery and the first drafts, was the crisis year. Executions were rare next to desertions — which is exactly why the army made theater of them: formed squares, slow march past the coffins, the full weight of example. Notice a farm boy writing 'salutary effect' — two years of war had changed what Alexander could watch.",
      {'0': "No such regulation — ordinary burials happened constantly and drew no formations. This procession was designed, not required.",
       '2': "The opposite of honor — deserters were shot seated on their own coffins, an old and deliberate disgrace."})
x['curriculum'] = 'Desertion & military discipline'
QS.append(x)

s = cand(24)  # Alexander, burying our and the rebel's dead — July 4 1863
x = q('a3-body', 3, 'body', s, 'to his mother', 'July 4, 1863',
      'Alexander wrote this sentence on July 4, 1863, near a Pennsylvania town. What is he describing the morning after?',
      ['The Battle of Gettysburg',
       'The fall of Vicksburg',
       'The Battle of Chancellorsville',
       'The draft riots in New York City'],
      0,
      "That's the truth of it. His 60th New York had held Culp's Hill; on Independence Day the armies buried more than seven thousand dead where they lay.",
      "One sentence, nine words, and note the detail that swallows the rest: “our AND the rebel's dead.” The burial crisis at Gettysburg — shallow graves, summer heat, seven thousand bodies — is what led Pennsylvania to charter a National Cemetery on the field. At its dedication that November, Lincoln spoke for two minutes. Alexander was part of why the speech exists.",
      {'1': "Vicksburg surrendered that same day — the war's great double blow — but a thousand miles west on the Mississippi. Alexander is standing in Pennsylvania.",
       '3': "The riots come nine days later — set off in part by the casualty lists this very burial detail was creating."})
x['curriculum'] = 'Gettysburg’s aftermath & the National Cemetery'
QS.append(x)

s = cand(42)  # Charles, $300 doesn't grow on every bush
x = q('a3-purse', 3, 'purse', s, 'to his mother', 'July 20, 1863',
      'Charles says two hometown men were “lucky to escape” — for $300. Escape what?',
      ['A Confederate raid on their county',
       'The 1863 federal draft, by paying the commutation fee',
       'Arrest for smuggling goods to Canada',
       'A lawsuit over unpaid enlistment bounties'],
      1,
      "That's the truth of it. The Enrollment Act let a drafted man pay $300 — commutation — instead of serving. Roughly a year's wages for a laborer: Charles's “doesn't grow on every bush” is the whole class politics of the clause in one phrase.",
      "He wrote this days after the New York City draft riots, the bloodiest civil disorder in American history, in which that same $300 figure was chanted in the streets. From a private already serving for $13 a month, 'lucky to escape' carries an edge you can still feel a century and a half later.",
      {'0': "No raid touched Champlain in 1863 — the escape was from a government envelope, not from cavalry.",
       '3': "Bounty disputes were real, but $300 was the draft law's own printed number — the most famous price in America that July."})
x['curriculum'] = 'The $300 commutation clause & the draft riots'
QS.append(x)

s = cand(43)  # Charles, nothing has pleased the soldiers so
x = q('a3-nation', 3, 'nation', s, 'to his mother', 'July 20, 1863',
      'A week after deadly anti-draft riots in New York, Charles reports the army’s mood. Why did soldiers LIKE the draft?',
      ['It meant their own enlistments would end sooner',
       'It felt like justice — the men at home would finally share the burden',
       'Drafted men were paid more, raising everyone’s wages',
       'They expected the draft to end the war within weeks'],
      1,
      "That's the truth of it. To men in the ranks, conscription wasn't tyranny — it was the stay-at-homes' turn. Charles says it without a flicker of sympathy for the rioters.",
      "The same law provoked riots in New York and satisfaction at the front — primary sources disagreeing is the lesson itself. Soldiers' letters across the Union armies echo Charles almost word for word that month. History rarely hands you one clean 'public opinion'; it hands you positions, and every position had a return address.",
      {'0': "Enlistments ran their full term regardless — the draft added men beside them; it released no one.",
       '3': "Nobody at the front thought the war was weeks from over — Gettysburg's wagons of wounded were still moving north as he wrote."})
x['curriculum'] = 'Conscription — the view from the ranks vs. the home front'
QS.append(x)

s = cand(61)  # Mother, Libby prison / mangled / unknown dead
x = q('a3-family', 3, 'family', s, 'to Alexander', 'November 15, 1863',
      'Frances lists the fates her family imagined for Alexander during a silence in his letters. What does her list reveal about the home front?',
      ['Families followed the war closely enough to know its horrors by name',
       'Northern newspapers were censored into vagueness',
       'Families of soldiers were kept informed by the War Department',
       'Civilians knew little about conditions in the armies'],
      0,
      "That's the truth of it. Libby Prison, field hospitals, the “unknown” dead — she names the war's specific machinery of loss, because a year earlier it had taken Henry. Home fronts were not innocent; they were informed and helpless at once.",
      "Every silence between letters opened the same catalog of imagined fates. Libby Prison in Richmond was infamous enough by 1863 to reach a farm kitchen on the Canadian border. And notice “our blessed lamented Henry” — fourteen months on, grief has become part of the family's ordinary vocabulary. That, too, is what war does.",
      {'1': "The papers were graphic and often wrong — she complains elsewhere that there's 'not the least reliance to be placed upon' them. Too much information, not too little.",
       '2': "No such service existed — which is exactly why her imagination had to do the notifying."})
x['curriculum'] = 'The home front’s war — information, anxiety & grief'
QS.append(x)

# ═══════════════ ACT IV — "The Grind" ═══════════════

s = cand(51)  # James, sprawled on tent floor
x = q('a4-camp', 4, 'camp', s, 'to his sister Fannie', 'June 21, 1864',
      'James — the youngest brother, newly in the field in Louisiana — is proud of surviving a day’s march. What was the ordinary soldier’s main physical work of the war?',
      ['Digging fortifications',
       'Marching — armies moved on foot, twenty miles and more a day',
       'Loading supply wagons',
       'Standing guard at night'],
      1,
      "That's the truth of it. For every hour in battle a soldier spent weeks on the road — and hardening to the march WAS becoming a soldier, in 1861 or 1864 alike.",
      "James had spent two years at West Point as a cadet before the field caught up with him; his legs, as he admits, had 'been used so little.' Even in the war's fourth year every new man passed through the same forge his brothers had — there was no shortcut, not even a scholarly one. His brothers' letters from 1862 read almost identically; the war kept teaching the same first lesson.",
      {'0': "By 1864 spades mattered enormously — but entrenching was episodic. The march was daily, universal, and what letters complain about most.",
       '3': "Picket duty was constant but stationary misery. What broke new men in was the roads."})
x['curriculum'] = 'The march — the soldier’s daily war'
QS.append(x)

s = cand(29)  # Alexander, genuine scurvy  (EXEMPLAR 5.2)
x = q('a4-body', 4, 'body', s, 'to his mother', 'August 22, 1864',
      'Alexander’s diagnosis points at the Civil War’s deadliest enemy. What killed the most soldiers, North and South?',
      ['Artillery and rifle fire',
       'Disease',
       'Prison camps',
       'Cavalry raids'],
      1,
      "That's the truth of it. Roughly two of every three deaths were from disease, not combat — and scurvy in a veteran army outside Atlanta tells you the supply system could move bullets faster than vegetables.",
      "Scurvy is a vitamin-C deficiency — a diet disease, in an army living on hardtack and salt pork at the end of a single rail line from Chattanooga. Within days Alexander was evacuated through three hospitals; at one point that same month, all three surviving brothers were hospitalized at once, in three different states. He laughed about it in a letter. The Wellness Ledger on this site tracks all of it.",
      {'0': "That's the war we see in paintings — but the hospitals tell the real story. Battle wounds killed about one soldier for every two that disease took.",
       '2': "The prison camps were lethal — Andersonville above all — but their toll sits far below the armies' own camps and hospitals."},
      extra_spoke='viz-health-ledger')
x['curriculum'] = 'Disease > battle — Civil War medicine & supply'
QS.append(x)

s = cand(45)  # Charles, $1,000 bounty
x = q('a4-purse', 4, 'purse', s, 'to his mother', 'January 3, 1864',
      'Charles reports Alexander could collect $1,000 for reenlisting in 1864. Why was the government suddenly offering sums like that?',
      ['Inflation had made $1,000 worth little',
       'Veteran enlistments were expiring just as the war’s hardest campaigns loomed',
       'It was back pay owed from 1861',
       'Officers’ commissions were being sold openly'],
      1,
      "That's the truth of it. The three-year men of 1861 — the army's spine — could all go home in 1864. Federal, state, and town bounties stacked up to four figures to keep them.",
      "A thousand dollars was roughly six YEARS of a private's pay — for men who knew exactly what Georgia and Virginia would cost. About 136,000 veterans took some version of the deal (Alexander stayed with his regiment to the war's end regardless). The bounty system also bred its parasite: the bounty jumper, enlisting and deserting town after town for the money. Note Charles's brotherly advice: he thought Alex had given enough.",
      {'0': "Wartime inflation was real — maybe 25 cents on the dollar over the war — but $1,000 was still a small fortune; that's why it worked.",
       '2': "Back pay arrived chronically late, but never compounded into that — this was new money, for a new signature."})
x['curriculum'] = 'Bounties, veteran reenlistment & their abuses'
QS.append(x)

s = cand(49)  # Charles, two votes for Lincoln  (EXEMPLAR 5.3)
x = q('a4-nation', 4, 'nation', s, 'to his mother', 'November 4, 1864',
      'Charles mailed his ballot home from the field in 1864. What made this election historic?',
      ['It was the first U.S. election held during a war',
       'Soldiers were furloughed home en masse to vote',
       'It pioneered absentee voting for soldiers in the field',
       'Lincoln ran unopposed after McClellan withdrew'],
      2,
      "That's the truth of it. Nineteen states passed laws letting soldiers vote from the field — the first mass absentee voting in American history. Charles's ballot rode home to Champlain in an envelope.",
      "Lincoln won about 78% of the soldier vote against McClellan — the general the Army of the Potomac had once loved. And then there's Charles's company: two Lincoln votes. His regiment was raised in heavily Democratic Fulton and Montgomery counties, and it voted like home. Real history is lumpier than the averages — that lump is standing in a field at Cedar Creek, two weeks after the battle there, writing his mother.",
      {'0': "The election of 1812 (Madison, mid-war) already holds that title — and 1864's marvel wasn't that it happened, but HOW: ballots collected in army camps.",
       '1': "Some furloughs happened where field voting wasn't legal — but Charles tells you exactly how HIS ballot traveled: he mailed it to Silas."})
x['curriculum'] = 'The election of 1864 & the soldier vote'
QS.append(x)

s = cand(46)  # Charles, Sanitary Commission tableaux
x = q('a4-family', 4, 'family', s, 'to his mother', 'April 15, 1864',
      'Charles describes society ladies staging shows “for the benefit of the soldiers.” What organization were they funding?',
      ['The U.S. Sanitary Commission — civilian relief for the army’s sick and wounded',
       'The Freedmen’s Bureau',
       'The Grand Army of the Republic',
       'The American Red Cross'],
      0,
      "That's the truth of it. The Sanitary Commission was the war's great civilian relief machine — inspecting camps, supplying hospitals, running relief boats — and it ran overwhelmingly on money women raised.",
      "Sanitary Fairs in northern cities raised millions (Chicago's 1863 fair alone cleared ~$100,000; New York's 1864 fair over a million) — tableaux, raffles, donated relics. 'Mrs. Banks' is the wife of the occupying general, Nathaniel Banks — New Orleans society performing Union charity in a captured city, which is its own history lesson. The home front didn't just wait; it organized, and its organizers were mostly women.",
      {'3': "Clara Barton was at work in the war — but the American Red Cross wouldn't exist until 1881. The Sanitary Commission was its great predecessor.",
       '1': "The Freedmen's Bureau arrives in March 1865, a government agency for the formerly enslaved — different mission, different year."})
x['curriculum'] = 'The Sanitary Commission & women’s war work'
QS.append(x)

# ═══════════════ ACT V — "Coming Home" ═══════════════

s = cand(62)  # Mother, streets blue with soldiers
x = q('a5-camp', 5, 'camp', s, 'to Alexander', 'January 11, 1865',
      'Frances’s own village now wakes to reveille. Why were there soldiers garrisoning a New York border town in 1865?',
      ['Confederate raiders had struck across the Canadian border months earlier',
       'The town was a mustering-out camp',
       'Draft riots had spread to the countryside',
       'They were guarding against a British invasion'],
      0,
      "That's the truth of it. In October 1864 Confederate agents rode out of Canada, robbed the banks of St. Albans, Vermont — twenty-odd miles from Champlain — and fled back across the line. The border militarized overnight.",
      "The St. Albans Raid was the war's northernmost action, and it put army rhythms — reveille, tattoo — into Frances's kitchen window. After four years of sending sons TO the war, the war had come to her street. Her letters this winter carry a new tone: the home front and the front were never as separate as the maps pretended.",
      {'1': "Champlain's turn as a rendezvous comes later — Alexander actually musters out at Ogdensburgh. In January the blue uniforms were sentries, not returnees.",
       '3': "Anglo-American tension was real (the raiders sheltered in Canada), but the garrison watched for raiders, not redcoats."})
x['curriculum'] = 'The St. Albans Raid & the militarized border'
QS.append(x)

s = cand(63)  # Mother, among the living
x = q('a5-body', 5, 'body', s, 'to Alexander', 'January 11, 1865',
      'Frances had already counted Alexander among the dead — wrongly. What does her sentence capture about the war’s toll?',
      ['How often the army misreported casualties',
       'The psychological weight carried by families and soldiers — a toll no ledger counted',
       'That mail was faster than casualty lists',
       'That soldiers hid their wounds from home'],
      1,
      "That's the truth of it. Between a battle and a letter stood days or weeks in which families simply did not know — and lived every outcome at once. The era had no word for what that did to people; we do.",
      "Read her arithmetic: my fears had NUMBERED you with the dead — grief run in advance, on spec. She had already lost Henry to a six-week silence in 1862; every later silence replayed it. The war's medical ledgers counted wounds and fevers. Nobody counted this — except, accidentally, the letters.",
      {'0': "Misreporting happened — but Alexander hadn't been reported anything. SILENCE did this, not error.",
       '3': "The brothers did soften things for her — but her fear here needed no wound to feed on, only an empty mailbox."})
x['curriculum'] = 'The war’s psychological toll'
QS.append(x)

s = cand(36)  # Alexander, discharged and paid off
x = q('a5-purse', 5, 'purse', s, 'to his sister Fannie', 'June 27, 1865',
      'The war is won, but Alexander is still in camp doing paperwork. What did it take to send a million-man army home?',
      ['Each soldier simply left when his term expired',
       'Muster-out rolls, final pay settlements, and transportation — an administrative campaign of its own',
       'A year of compulsory occupation duty for all veterans',
       'Soldiers paid their own way home and were reimbursed later'],
      1,
      "That's the truth of it. “Make out our papers” — every man's account settled: pay owed, bounty due, clothing overdrawn, then rail and steamer home to a state rendezvous for discharge. The Union demobilized some 800,000 men in about six months.",
      "It was the largest, fastest demobilization in the country's history — run with ledgers and muster rolls. Alexander's regiment waited near Alexandria for weeks after the grand reviews; the army that had learned to move men by the hundred thousand now had to unmove them, one signature at a time. His destination — Ogdensburgh — is where his war began in 1861.",
      {'0': "Terms had expired for thousands who still waited — no man left without his discharge in hand unless he wanted 'deserter' on the rolls forever.",
       '3': "Transportation home was the government's bill — that's the 'get transportation' he's waiting on."})
x['curriculum'] = 'Demobilization — dissolving the citizen army'
QS.append(x)

s = cand(35)  # Alexander, free and united nation
x = q('a5-nation', 5, 'nation', s, 'to his sister Fannie', 'June 27, 1865',
      'A sergeant sums up what four years bought. In his words “free and united,” what two outcomes of the war is he naming?',
      ['Free trade and united markets',
       'Emancipation and the preservation of the Union',
       'Freedom of the press and a united party system',
       'Free land in the West and a united currency'],
      1,
      "That's the truth of it. “Free” — slavery destroyed, the Thirteenth Amendment through Congress and ratifying that very year. “United” — secession broken. A farm-boy sergeant fused the war's two great results into six words.",
      "Historians still debate when Union soldiers came to see emancipation as a war aim beside reunion — and here is one soldier's answer, unprompted, in a letter to his sister: by the end, HE counted both, and put freedom first. When you read a primary source this closely, you're doing exactly what historians do.",
      {'0': "The economy transformed — greenbacks, railroads, tariffs — but that's not the register he's writing in. 'In point of freedom, no equal' is about human beings.",
       '3': "Homesteads and greenbacks were real wartime creations — but read his sentence again: honor and freedom are its stakes, not acreage."})
x['curriculum'] = 'What victory meant — emancipation & Union'
QS.append(x)

# Act V family — the "tea table" line, sliced directly from the corpus
tea = {
    'letterId': 'LTR-1865-07-27-001', 'author': 'alexander', 'date': '1865-07-27',
    'location': 'Camp Wheeler, Ogdensburgh, N.Y.',
    'excerpt': slice_quote('LTR-1865-07-27-001', 'We had a grand reception.', 'at the tea table.')
}
x = q('a5-family', 5, 'family', tea, 'to his mother — his last letter of the war', 'July 27, 1865',
      'This is the final wartime letter in the whole collection. Why do letter archives like this one end here?',
      ['Paper shortages after the war made writing expensive',
       'Letters exist because of distance — when the family was reunited, the record fell silent',
       'The army censored veterans’ correspondence',
       'The family stopped keeping letters after the war'],
      1,
      "That's the truth of it. “I will tell you all about it at the tea table” — the collection's last wartime sentence promises a story that would never need to be written down. The archive ends because the distance did.",
      "This is a lesson about sources themselves: a letter collection is a map of separations. Four years, 272 letters — and the moment the family closes around one table, history goes quiet. What we know of them afterward comes from pensions, censuses, and gravestones. And one thing more: James, the youngest, never reached his tea table — he died that October, on the journey home. The finale will tell you the rest.",
      {'3': "They kept everything — that's why you're here. A later generation of the family transcribed the water-stained originals over two years, 1947–1949.",
       '0': "Paper was cheap again by 1865 — and he had stationery in hand (borrowed, he admits, from 'one of the boys'). What he no longer had was the need."})
x['curriculum'] = 'Reading the archive itself — why the letters exist'
QS.append(x)

# ─── Acts metadata ───
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
out.write('/* Their Own Words - question bank. GENERATED by scripts/_build_learn_data.py.\n')
out.write('   Excerpts are verbatim slices of 03-data/all-letters.json transcriptions -\n')
out.write('   validated by scripts/validate_learn_quotes.py. Do not hand-edit excerpts. */\n')
out.write('var TOW_ACTS = ' + json.dumps(ACTS, ensure_ascii=False, indent=1) + ';\n')
out.write('var TOW_BONDS = ' + json.dumps(BONDS, ensure_ascii=False) + ';\n')
out.write('var TOW_QUESTIONS = ' + json.dumps(QS, ensure_ascii=False, indent=1) + ';\n')
out.close()
print('wrote _learn-data.js with', len(QS), 'questions')
