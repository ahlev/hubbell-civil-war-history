**To:** Elliot Williams, Editor-in-Chief, Hackaday
**Channel:** tips@hackaday.com (cc editor@hackaday.com)

**Subject:** Tip: turning a 160-year-old box of letters into a queryable dataset + nine interactive views

Hi Hackaday — submitting this as a software/data hack with a good backstory. I recovered a stack of my family's Civil War letters (273 of them, 1861–1870) and built an end-to-end pipeline from paper to pixels: AI-vision transcription with human review, then a structured data schema, then a single-file interactive dashboard that renders nine visualizations — a timeline, an animated map, a social network, a health ledger, and more.

The engineering discipline is the part I think your readers would respect: the data is a three-layer schema (fact / editorial judgment / computed analysis), identities are resolved with curated lookup tables instead of fuzzy matching, and the AI is kept strictly to a filter-over-real-records role so nothing gets fabricated. Provenance is preserved end to end.

Happy to write up the technical details, share the dashboard, or walk a writer through the build. Thanks for considering it.

[dashboard link]

Alexander Hubbell Levitt
theaihubops@gmail.com
