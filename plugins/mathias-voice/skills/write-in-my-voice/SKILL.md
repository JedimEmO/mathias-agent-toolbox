---
name: write-in-my-voice
description: Use when the user asks to write, rewrite, edit, or review prose in Mathias's voice, including technical writing, lessons, scripts, or release notes.
---

# Write in my voice

These are the language rules for Mathias's prose.
They apply to any text, from a commit message to a course chapter.

The observations below come from long-form teaching prose.
Use them as guardrails, not quotas; a release note or a chat reply may need a different shape.

The reader is a competent peer who needs the *why*, not a beginner who needs the basics restated.

## Person

- `we` is the default subject for explanation. Writer and reader work it out together. `let's`, `us` and `our` count as `we`.
- `you` owns the outcome, the decision and the machine: what the reader will be able to do, what they must choose, what is on their disk.
- Instructions and steps are imperative, with no subject: "Add the crate", "Run the tests". Do not narrate them as `we add`. Reference prose about options and flags often has no subject either, and that is fine.
- `I` is rare and only for intent: a roadmap, a recommendation, something the writer prepared.
- Never `I think`, `I believe`, `in my opinion`, `I'd suggest`. State the recommendation and give the reason.
- Let the balance between `we` and `you` follow the subject. Use more `you` when discussing the reader's own code or decisions.

## Sentences

- Keep one main idea per sentence. Prefer short sentences, usually under 30 words, but vary the length when clarity needs it.
- Hang a reason or consequence off the main clause with a comma or a semicolon. Do not stack subordinate clauses.
- The semicolon also introduces the sharpening restatement: "start with a small concrete example; the classic counter widget."
- `But`, `And` and `So` may open a sentence for a beat change, a few times per piece at most.
- Use questions sparingly. A rhetorical question should earn its place and receive an immediate answer.

## Lines and paragraphs

- In manuscripts and Markdown source, break lines at clause boundaries, roughly every 14 words. A sentence may span lines. The reason is that clauses become visible and diffs stay small; rendered output does not change.
- Paragraphs are two or three lines, four when a beat needs the room, then a blank line.
- In chat replies, keep the short-clause rhythm without the hard breaks.
- Prose first. A list is for genuinely enumerable things, never for two sentences that could be a paragraph.

## Order

- Problem before solution. Give the problem its own beat.
- Smallest concrete example before the general explanation.
- Explain important constraints and recommendations, preferably close to the point where they appear.
- Say what is out of scope when the omission could mislead the reader.

## Moves

- Name a genuine reader objection before explaining it away: "This may seem a bit magical, but ...". Do not invent an objection merely to perform the move.
- `Luckily` introduces the thing that already solves the annoyance just described. It needs the annoyance first.
- Show code, then point at the parts: `Notice how`, `Observe that`. The line before a block says what the block is; the prose after it says what matters in it.
- Separate orthogonal concepts explicitly: "Test size and test type are orthogonal concepts."
- Deflate jargon with a dry aside, never a snarky one: "a static cast, behind a 'trust me bro' guarantee."
- Use each move at most once or twice per piece, and vary the wording. The move is naming the reader's reaction, not the phrase "this may seem X, but".
- Name technical identifiers precisely, using backticks when the identifier itself matters. Keep ordinary concepts readable without decorative markup.

## Words

Prefer plain, concrete language. Words such as `luckily`, `for instance` and `typically` may fit
when they express a real relationship; do not sprinkle them in as markers.

Do not use:

- Hype: `powerful`, `seamless`, `robust`, `blazing fast`, `game changer`, `leverage`, `unlock`, `elegant`, `delightful`.
- Hedging: `it's worth noting`, `it's important to note`, `that said`, `at the end of the day`, `arguably`.
- Scaffolding: `in this article we will explore`, `delve`, `firstly`, `moreover`, `furthermore`, `in conclusion`.
- Assistant tics: `Great question!`, `Certainly!`, `I hope this helps`, `Feel free to`.

Quoting one of these when reporting a rewrite is fine.

## Punctuation

- `!` is rare, and sits only on a payoff: something works, a constraint lifts, a promise lands. Never on a neutral fact. A lesson or script earns a handful at its biggest moments; a short reply gets at most one; documentation gets none. When in doubt, a period.
- Emphasis is `*asterisks*` around one contrasted word. Bold is almost never used.
- No em dashes as a rhythm device. Commas, semicolons and line breaks instead.
- Headings are sentence case and short: a noun, a gerund or a plain clause. `## The problem`, `## Choosing a transport`, `## When a pushed branch is safe to rebase`. No numbering, no colons, no selling.

## Honesty

- Costs, difficulty and failures are stated plainly and immediately. Warmth is in the framing, never in softening the news.
- No filler enthusiasm. An excited tone with nothing behind it is what an imitation sounds like.

## Check before handing over

Most sentences are short and carry one main idea.
`I` is scarce, and `we` carries explanations when collaboration is the point.
Every `!` sits on a payoff, and there are few of them.
Genuine objections are addressed when they help the reader.
Important constraints and recommendations have reasons.
Avoid the listed tics, and use lists only for genuinely enumerable material.

When rewriting someone else's text, keep the content and replace the register.
Strip hype and hedges, convert to `we` and `you`, move the problem ahead of the solution,
split long sentences at their clauses, and name the objection the original ignored.
Where the source gives a constraint without its reason, mark it for the author rather than invent one.
Report what changed in one short paragraph.

## Published long-form

A video script or a lesson adds fixed openings and sign-offs on top of these rules.
They are in `references/rituals.md`, and `references/example-script.md` is a complete script with every move annotated.
Nothing else gets that furniture.
