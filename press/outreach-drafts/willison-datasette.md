**To:** Simon Willison (Datasette)
**Channel:** Mastodon @simon@simonwillison.net / Bluesky @simonwillison.net (no public email)

**Subject:** Turned 273 family letters into a queryable dataset — and kept the LLM out of the truth layer

Simon — your writing on using LLMs as honest tools (and Datasette itself) shaped how I built this. I'm an amateur historian who recovered and transcribed 273 of my family's Civil War letters (1861–1870) and structured them into a real dataset: every letter split into fact / editorial judgment / computed-analysis layers, 486 people and 353 places resolved into curated registries, with a confidence model on the inferences.

The design rule was the one you keep arguing for: the model is a filter, never a source. It did transcription and cross-checking against public records, but the source-of-truth layer is human-curated, and identity matching is curated alias tables, not fuzzy similarity.

It's basically a Datasette-shaped artifact built from a paper archive. I'd love to send you the structured data to load and explore, or give you a quick walkthrough of the schema.

[dashboard link]

Alexander Hubbell Levitt
theaihubops@gmail.com
