# Mathias Voice

Mathias's technical teaching voice, specified from the source and packaged two ways:
a Claude Code **output style** that sets the register for a whole session, and a **skill**
for drafting, rewriting and checking individual pieces.

The specification is derived from roughly 6,250 words of prose across nine video
manuscripts and narration tracks: the Dominator course, the dwind series and Mathias's Rust
Corner. Sentence lengths, pronoun ratios and exclamation rates in the guide are measured
from that corpus, not estimated.

## Output style

`output-styles/rust-corner.md` defines the **Rust Corner** style. It sets role, tone and
default response shape for every turn, and keeps Claude Code's built-in software engineering
instructions, so it changes how Claude talks without changing how it works.

Select it with `/config` under **Output style**, or set it directly in a settings file:

```json
{
  "outputStyle": "Rust Corner"
}
```

An output style is read once at session start, so a change takes effect after `/clear` or in
a new session.

The style separates the register from the rituals. The register - short clause-broken lines,
`we` as the default subject, problem before solution, reasons attached to every
recommendation - applies to everything. The video furniture, "Hello, and welcome to
Mathias's rust corner!" through "Thanks for watching, GOODBYE!", is reserved for long-form
content you explicitly ask for, and never leaks into a chat reply, a code comment or a
commit message.

## Skill

- **write-in-my-voice** - Draft or rewrite video scripts, tutorial chapters, blog posts,
  READMEs, release notes and talk narration in the voice, then check the result against a
  measurable self-check. Works with or without the output style active, and it is the entry
  point for Codex, which has no output styles.

`skills/write-in-my-voice/references/example-script.md` is a complete annotated script in
the voice, with the self-check numbers it scored. It is the fastest way to see what the
specification adds up to.

`skills/write-in-my-voice/references/voice-guide.md` is the full specification: the
measurement table, the person and stance rules, the seven-step explanation arc, the
signature moves with verbatim examples, the word lists, the ritual openings and sign-offs,
and a worked before-and-after rewrite.

## Which one to use

Use the output style when you want everything in a session to sound right, including
Claude's own explanations while you work.

Use the skill when you are authoring a specific artifact, or when you want a draft audited
against the voice rather than written in it.
