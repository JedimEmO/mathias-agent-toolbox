---
name: write-in-my-voice
description: Use when writing, drafting, rewriting, editing, or reviewing any prose that a human will read - video scripts, video manuscripts, tutorial chapters, course lessons, blog posts, READMEs, documentation pages, release notes, changelogs, announcements, talk abstracts, or narration. Also use for "make this sound like me", "in my tone of voice", "rustcorner script", "rewrite this in my style", or when checking whether a draft matches the voice. Load it before drafting rather than after, so the piece is written in the voice instead of translated into it. Provides the measured voice specification, a full annotated example script, and a rewrite and self-check workflow.
---

# Write in my voice

Draft or rewrite prose in Mathias's teaching voice: the register of the Dominator course,
the dwind series and Mathias's Rust Corner.

Read `references/voice-guide.md` before writing anything longer than a paragraph. It carries
the measured specification - sentence lengths, pronoun ratios, exclamation rate, the
signature moves and the verbatim ritual openings and sign-offs.

`references/example-script.md` is a complete piece in the voice with every move annotated.
Read it when you need to see the rules working together rather than listed separately, and
use it as the shape to follow for any long-form piece.

If a Claude Code session is already running the **Rust Corner** output style, the register
is loaded and you only need the guide for long-form structure, rituals, and the self-check.

## Workflow

1. **Establish the piece and the reader.** Ask what it is (video script, chapter, README,
   blog post, release notes) and who reads it, if that is not already clear. The voice
   assumes a competent peer who knows Rust and needs the *why*, not a beginner who needs
   the basics restated.

2. **Decide whether rituals apply.** A published long-form piece - a video script, a lesson,
   a talk - opens with "Hello, and welcome to Mathias's rust corner!" plus a one-line topic
   promise, and closes with "Thanks for watching, GOODBYE!". A README, a PR body, a code
   comment or a chat reply gets the register only, never the furniture.

3. **Outline by the explanation arc, not by the API surface.** Problem, payoff, smallest
   concrete example, walk the example, why the constraint exists, the default and its
   reason, what is out of scope. Section 4 of the guide has the full order with examples.

4. **Draft it.** `we` as the default subject, `you` for the reader's outcomes and decisions,
   `I` only for intent. One idea per sentence, median 17 words. Two-line paragraphs. Break
   lines at clause boundaries in any Markdown you write to a file.

5. **Place the objections.** Wherever the design looks surprising, magical or wrong, name
   that reaction before explaining it away. This is the move that most distinguishes the
   voice; a draft with none of it will read as generic.

6. **Run the self-check below**, and fix what fails before handing the draft over.

## Self-check

Run these against the finished draft. Each one maps to a measured property of the corpus.

- **Sentence length.** Median around 17 words, almost nothing past 30. Split anything longer.
- **Pronouns.** `we` should outnumber `you` roughly 4:3, and `I` should be scarce and only
  ever about authorial intent. Zero instances of `I think` or `in my opinion`.
- **Exclamation marks.** About one sentence in five in long-form, and every one of them on a
  payoff. If one sits on a neutral fact, it is a period.
- **Objection named.** At least one "this may seem strange / magical / wrong, but..." per
  substantial section.
- **Reasons attached.** Every recommendation and every constraint has its *why* in the same
  sentence or the next one.
- **Scope marked.** Anything deliberately skipped is called out, not silently dropped.
- **Banned register.** No `powerful`, `seamless`, `robust`, `leverage`, `elegant`,
  `it's worth noting`, `that said`, `delve`, `moreover`, `in conclusion`, `Great question!`.
  No em dashes used for rhythm.
- **Identifiers.** Every crate, type, method, macro and attribute is exact and in backticks.
- **Prose first.** If a bulleted list could have been two lines of prose, make it prose.
- **Honesty.** Costs, difficulty and failures are stated plainly, never softened.

## Rewriting someone else's draft

Keep the technical content; replace the register. In order: strip the hype and the hedges,
convert passive and third-person constructions to `we` and `you`, move the problem statement
ahead of the solution, split the long sentences at their clause boundaries, add the missing
`why` behind each constraint, and insert the objection the original ignored.

Section 11 of the guide shows a short before-and-after of exactly this, and
`references/example-script.md` shows the finished shape at full length.

Report what you changed and why in one short paragraph, so the user can push back on
specific moves rather than on the whole rewrite.
