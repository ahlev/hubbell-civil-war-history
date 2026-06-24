# How to Use an AI on Family History Without Letting It Lie to You

*A method for cross-referencing Civil War letters against the archival record — where the AI is a judge, never a witness.*

> Companion to the methodology paper [`PHASE-3-METHODOLOGY-PAPER.md`](./PHASE-3-METHODOLOGY-PAPER.md), which carries the full evidence base, citations, and the per-verdict log. This piece is the readable version: it explains *how the method works* and uses four soldier-brothers to show it working. Every fact here is drawn from that paper and the repository artifacts behind it.

## The temptation and the trap

If you have a box of old family letters, an AI language model looks like a miracle. It reads 1860s handwriting-as-text without complaint. It untangles phonetic spelling — the way a soldier wrote a captain's name "by ear." It can hold a regiment, a battle, and a burial record in mind at once and reason across them. For the slow, squinting work of family history, that is genuinely powerful.

It is also exactly where these tools are most dangerous. Their native behavior is *fluent generation* — producing text that reads as true. In most settings a confident, plausible sentence is a feature. In genealogy it is the one thing you cannot tolerate. A fabricated muster line — a regiment the soldier never served in, a death date that sounds right — is worse than a blank space, because it looks like an answer and it propagates. Someone copies it into a family tree, and the error outlives everyone who could have caught it.

So the question that organizes this whole method is narrow and unforgiving: **how do you get the upside of an AI reading the messy record without ever letting it invent a piece of that record?**

## The cardinal rule: filter, never a source

The answer is a single rule, enforced structurally rather than asked for politely: **the model may judge records, and may never produce them.**

It is allowed to look at something a real archive actually returned and rule on it — *is this the right Henry Hubbell, or a stranger with the same surname?* It is never allowed to supply the record itself. It has no authority to say "the roster shows…" unless a roster, fetched and quoted verbatim, is sitting in front of it.

Telling a model "don't make things up" is not enough; the whole field has learned that. The rule has to be built into the plumbing.

## Separation of powers: retrieval vs. judgment

The plumbing is a deliberate split, borrowed in spirit from separating the police from the courts.

**Retrieval** is done by parallel agents, each assigned one "lane" of the record. Their instructions are mechanical and strict: fetch only verbatim quotes, exact URLs, and counts — and when a source returns nothing, or throws up a login wall or a CAPTCHA, report *that*, exactly, instead of papering over it. A retrieval agent is forbidden to infer. Its entire output is treated as raw evidence.

**Judgment** is done by a single model instance — the judge — working only from what retrieval handed up. It applies a written rubric to each candidate, assigns a verdict, and writes that verdict, with the criteria it used, into an append-only log.

This separation is the most important design decision in the method, and it does three things at once. It keeps the log auditable — every ruling can be replayed and challenged later. It makes "filter, never a source" *mechanically* true, because the judge has no retrieval channel of its own to fabricate from; it can only rule on what exists. And it lets the slow part — fetching — run wide in parallel without contaminating the careful part.

Around this sits a rubric that names the criteria a verdict must cite (regiment-and-company match is dispositive; hometown, rank, date envelope, and co-mention with known associates corroborate; an OCR penalty discounts garbled text), a five-level verdict vocabulary (`confirmed` down to `rejected`), and one more discipline worth stating plainly: **identity is matched against curated tables, never by fuzzy string-guessing.** That last rule is what lets the method confidently say "this name is *not* in this regiment" — roughly twenty-five such honest nulls per soldier. Those nulls are not failures of recall. They are the evidence that the confirmations mean something.

## Four brothers, four different ways the method could have failed

The real test of a method is not whether it works on the easy case. It is whether one unchanged process survives genuinely different challenges. The Hubbell family offered four soldier-brothers, and they were worked in an order chosen so each would stress a different part of the machine.

**Henry — the faintest possible trail.** A private, killed at Antietam, body never recovered. That is the hardest identity in the system: the lowest rank and the fate that generates the least paperwork. Here the authoritative spine was enough — the Adjutant-General roster returned *exactly one* Hubbell, and an independent 1903 regimental history listed him among the Antietam dead. The method also did something quietly important with an *absence*: Henry's name is missing from the named-burial roll at Antietam National Cemetery, and that missing-ness, treated as evidence rather than as a dead end, corroborated the family's account that his body was never recovered. A garbled newspaper notice was salvaged not by guessing but by *cross-binding* — a comrade named beside him, "Peter Jolly," who checks out as a real man of the same company.

**Alexander — the survivor.** A color-bearer who lived, reenlisted, and spent thirty more years in Iowa. You cannot anchor a survivor on a death record, so the battle-and-burial lane was *rotated forward in time* — into reenlistment, veterans'-organization membership, and an Iowa grave. A contemporaneous 1864 regimental history independently named "Sergeant A. F. Hubbell" among the wounded at Lookout Mountain, corroborating the proudest story the family told about him. The same sweep also settled a contradiction *inside* the family's own papers — a death year given as both 1894 and 1899 — in favor of 1894.

**Charles — the disambiguation problem.** His regiment held four Hubbells, two of them named Charles. Uniqueness was off the table; identity had to be built from criteria working *jointly* — company, hometown, and rank lining up on one man and not the others. (Age, notably, was *not* a usable disambiguator here: the roster's age disagrees with the family's record, and that disagreement became one of the discrepancies the method flagged rather than something it leaned on.) This sweep also surfaced a thread no per-person search could ever see: Charles's company captain, Davis J. Rich, was the very same officer who had commanded Henry's company in a different regiment — a connection visible only because the brothers were modeled as one family at once.

**James — the claim that isn't in any roster.** The youngest brother's defining family story is that he was appointed to West Point — and a military muster roll has nothing to say about a military academy. So the claim was verified sideways, again by cross-binding: James's 1862 cadet letters name two contemporaries — a cadet officer and a chaplain-professor — who are independently confirmable figures at the Academy in exactly that period. The verdict the method returned is the honest one, and the interesting one: *present as a cadet, not a graduate, formal admission terms unverified.* It neither inflated the family's pride into a diploma nor dismissed a true story for lack of a perfect document.

One process, four shapes of difficulty — faintest-trail, survivor, namesake collision, non-military claim — and the only planned variation was rotating a single lane through time for the survivor. That is the case for the method generalizing.

## What honesty looks like when you build it in

Because the method is built to record what it *cannot* establish as carefully as what it can, its limits are part of its output, not an embarrassment hidden at the end.

The free, public record gets you roughly four-fifths of the way. The richest remaining material — pension files, compiled service records, academy application papers, later censuses — sits behind paywalls, logins, or the postal system, and the method names those as handoffs *from the start* rather than discovering them as failures mid-run. It also refuses to confuse two different kinds of silence: a digitized-but-gated newspaper (locked, but it exists) is not the same as a never-digitized county register (the record may simply not be online), and calling both "not found" would manufacture false significance. And no claim is ever upgraded by a source that merely copied another — an aggregator transcribing a roster is corroboration, not a second independent vote.

There is even a discipline about *quantity*. The verification log holds 33 ruled-on verdicts — not more — because three of the four regiments resolved cleanly on the first pass and didn't need extended adjudication. It would have been easy to pad that number by ruling on weaker and weaker candidates. The method's stance is the opposite: a higher count bought with thinner evidence would make the work *less* trustworthy, not more. The rigor is in the reasoning logged per verdict, not in the tally.

## The takeaway

An AI can genuinely help reconstruct individual lives from a family's letters and the public archive — at high confidence, and *honestly* — but only if you refuse to let it be the source of anything. Confine it to the role of a disciplined judge over real, retrieved records. Separate the fetching from the ruling. Log every verdict so anyone can replay it. Match identity against curated tables, never by fuzzy resemblance. Name your nulls and your gaps out loud.

Do that, and the four Hubbell brothers come back into focus — the private lost at Antietam, the color-bearer who lived, the disambiguated namesake, the cadet — each confirmed and set among his comrades by one unchanged method, and each finding traceable to a record a human can go check. The discipline is the whole point. It is what makes the confirmations worth trusting.

---

*For the full method, the rubric, the per-verdict log, and citations to every artifact behind these four cases, see the methodology paper: [`PHASE-3-METHODOLOGY-PAPER.md`](./PHASE-3-METHODOLOGY-PAPER.md).*
