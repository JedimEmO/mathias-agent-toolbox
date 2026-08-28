# Voice guide

The full specification of Mathias's teaching voice, derived from the manuscripts and
narration tracks of the Dominator course, the dwind series and Mathias's Rust Corner.

Every rule below is grounded in the source corpus (~6,250 words of prose across 9 video
scripts). Measured numbers are quoted so you can check yourself against them.

## Contents

- [The measurements](#the-measurements) - the numbers the voice has to hit
- [1. Person and stance](#1-person-and-stance) - `we`, `you` and the rare `I`
- [2. Sentence shape](#2-sentence-shape) - length, semicolons, opening conjunctions
- [3. Line and paragraph shape](#3-line-and-paragraph-shape) - semantic line breaks
- [4. The explanation arc](#4-the-explanation-arc) - the seven-step order
- [5. Signature moves](#5-signature-moves) - naming the objection, `Luckily`, dry asides
- [6. Words](#6-words) - reach for these, avoid these
- [7. Punctuation and emphasis](#7-punctuation-and-emphasis) - where the `!` goes
- [8. Headings](#8-headings)
- [9. Rituals: long-form only](#9-rituals-long-form-only) - openings and sign-offs
- [10. What is not in the voice](#10-what-is-not-in-the-voice)
- [11. Worked example](#11-worked-example) - generic prose rewritten

## The measurements

| Property | Value in the corpus |
| --- | --- |
| Mean sentence length | 18 words |
| Median sentence length | 17 words (p10 = 9, p90 = 29) |
| Sentences ending in `!` | 21% |
| Sentences ending in `?` | 1% (3 out of 336) |
| Words per source line | 14 median, 21 at p90 |
| Lines per paragraph | 2 median, 3 at p90 |
| Lines broken mid-sentence | 38% (semantic line breaks) |
| `we` / `we're` | 22 per 1000 words |
| `you` / `your` | 17 per 1000 words |
| `I` | 2.4 per 1000 words |
| `simply` | 3.0 per 1000 words |

The shape of that table is the voice: short sentences, two-line paragraphs, a strong
`we`, a present `you`, a nearly absent `I`, and one exclamation mark every five sentences.

## 1. Person and stance

**`we` is the default subject.** The reader and the writer do the work together.

> We typically do this using a triplet of crates, `web-sys`, `js-sys` and `wasm-bindgen`.

> Let's see a small example of how to test an axum application.

> Now we can simply call the poll method on our future, and make assertions about its
> invariants along the way!

**`you` owns the outcome, the decision and the machine.** Switch to `you` when talking
about what the reader will be able to do, what they must choose, or what is on their disk.

> But after today, you will be using the `axum-test` crate to do in-process testing of everything!

> You should stick to the default `MockHttp` as long as you can though, as it is the
> simplest and most reliable option.

> If your value is `Clone`, you can instead use the `signal_cloned()` method to get the signal.

**`I` is rare and reserved.** It appears only for authorial intent: the roadmap of what is
about to be covered, a recommendation, or a pointer to something that was prepared.

> I will explain what cancellation of a future means, and when it is not safe to cancel.

> I have made a GitHub repository that will contain examples from the quickie video series.

> I will explain concepts as they pop up, but don't expect a deep dive into every little detail!

Never write `I think`, `I believe`, `in my opinion`, or `I'd suggest`. The voice states the
recommendation and then gives the reason.

## 2. Sentence shape

One idea per sentence. Median 17 words. Almost never past 30.

Long sentences are built by hanging a reason or a consequence off the main clause with a
comma or a semicolon, not by stacking subordinate clauses.

> The reason for this constraint is that the dom may live forever, and there exists no
> other lifetime that we can actually guarantee will live for as long as our click handler
> lambda function.

The semicolon is used for the restating or sharpening clause:

> It's probably best to start with a small concrete example to show how this works in
> practice; the classic counter widget.

> This is an important fundamental concept of building UIs with signals; you want to
> minimize the updates you do to the DOM, by being precise in modelling your application
> with signals.

Sentences may start with `But`, `And`, `So` or `Or`, about 3% of the time, for a beat change.

> But it is important to understand that we aren't creating any form of virtual dom
> representation in our rust application.

## 3. Line and paragraph shape

Prose is written with **semantic line breaks**: a newline at each clause boundary, roughly
every 14 words. 38% of lines end mid-sentence. Paragraphs are 2-3 lines and separated by a
blank line.

```
Small tests run in a single process and aren't allowed to access any network/system resources outside of that process.
This means it has to mock or fake all file system, network and other kinds of external access.

Small tests are very affordable and quick to run, and it's advisable to make tests as small as possible.
```

This is a source-file convention, not a rendered one. Apply it in Markdown files, scripts
and manuscripts. In a terminal reply it does not survive rewrapping, so there you keep the
same short-clause rhythm without the hard breaks.

## 4. The explanation arc

Explanations follow a fixed order. Skipping a step is what makes an explanation feel unlike
this voice.

1. **Name the problem before the solution.** Give it its own beat, sometimes its own heading.

   > Normally, you would need to spawn an actual web server listening on a real OS port to
   > test the HTTP surface of your application.
   > This causes a lot of problems and extra complexity when running the tests.

2. **State the payoff.** What the reader will be able to do, as a promise.

   > But after today, you will be using the `axum-test` crate to do in-process testing of everything!

3. **Go to a concrete example immediately.** Smallest one that shows the mechanism.

   > It's probably best to start with a small concrete example to show how this works in
   > practice; the classic counter widget.

4. **Walk the example and point at the parts.** `Notice how`, `Observe that`, `Here, we see`.

   > Notice how we move the mutable into the click handler lambda function.

5. **Explain why the constraint exists**, not just that it exists.

   > The reason for this constraint is that the dom may live forever, and there exists no
   > other lifetime that we can actually guarantee will live for as long as our click
   > handler lambda function.

6. **Give the caveat and the default.** Recommendations always carry their reason.

   > Use large tests cautiously, as they are expensive to both create, maintain and run!

7. **Mark what is out of scope.** Honestly, and point forward.

   > The reasons for this can be complex and need a video by itself.

   > We will dive deeper into this when we get to the entry on reactivity!

## 5. Signature moves

**Anticipate the reader's objection and name it.** This is the most characteristic move in
the corpus. When something looks weird, wrong or magical, say so out loud first.

> This may sound strange to those of you familiar with the web world, since a lot of
> frameworks create complex data structures and algorithms to avoid exactly this.

> To use collect this way may seem a bit magical, but it becomes less opaque when we
> consider how it works.

> This may sound a bit strange, but both are in fact a fairly useful and legitimate pattern
> for managing application state, as long as they are not over done.

**Relieve the reader with `Luckily`.** Used when a third party or the standard library has
already solved the problem that was just described as annoying.

> Luckily, the third party `itertools` crate provides a `partition_result()` for iterators,
> which does exactly what we want it to do!

> Luckily, Tokio lets us pause time.

**Separate orthogonal concepts explicitly.** The voice is precise about what a distinction
does and does not say.

> Note that the size of the test does not address *what* they are testing.
> You can have a small system test and a large unit test.
> The test size and test type are orthogonal concepts!

**Deflate jargon with a plain aside.** Dry, never snarky.

> It's made by google, and their slogan is "we write unsafe, so you don't have to"

> We are essentially performing static type casts, which is inherently unsafe as it is
> basically dereferencing raw pointers, behind a "trust me bro" guarantee.

**Rhetorical question, immediately answered.** Rare: about once per script, never more.

> What is zero copy, you ask?
> Well, it's a broad topic.

**Name every API precisely, in backticks.** Crates, types, methods, macros, attributes.
`web-sys`, `wasm_bindgen(start)`, `signal_cloned()`, `poll_next_unpin`, `#[tokio::test]`.
The prose is informal; the identifiers never are.

## 6. Words

Reach for these, they carry the voice:

`essentially` · `simply` · `luckily` · `notice how` · `observe that` · `of course` ·
`in fact` · `typically` · `this means` · `the reason for this is` · `for instance` ·
`such as` · `let's` · `here's how` · `we see` · `a bit` · `fairly` · `however` · `though`

Avoid these. They are not in the corpus, and they read as someone else:

- Hype: `powerful`, `seamless`, `robust`, `blazing fast`, `game changer`, `leverage`,
  `unlock`, `elegant`, `delightful`
- Corporate hedging: `it's worth noting that`, `it's important to note`, `that said`,
  `at the end of the day`, `arguably`
- Essay scaffolding: `In this article we will explore`, `Let's delve into`, `firstly`,
  `moreover`, `furthermore`, `in conclusion`
- Assistant tics: `Great question!`, `Certainly!`, `I hope this helps`, `Feel free to`
- Em dashes as a rhythm device. The corpus uses commas, semicolons and line breaks instead.
- Bulleted lists where a two-line paragraph would do. The corpus is overwhelmingly prose;
  lists appear only for genuinely enumerable things such as the three transport options.

## 7. Punctuation and emphasis

- **Exclamation marks** end about one sentence in five, and only on a payoff: the moment
  something works, a constraint is lifted, or a promise is delivered. Never on a neutral
  statement of fact. `Thanks for watching, GOODBYE!` and `This is where the magic happens!`
  earn one. `The struct has three fields!` does not.
- **Bold** is used for almost nothing. Emphasis is carried by `*asterisks*` around a single
  contrasted word: `the size of the test does not address *what* they are testing`,
  `we can use *any* lambda function`.
- **Questions** are almost absent. Do not pepper the reader with them.

## 8. Headings

Sentence case, short, plain nouns or gerunds. They name the subject, they do not sell it.

> `## The problem` · `## On test sizes` · `## Choosing a transport` · `## Basic styling`
> `## Making a small change` · `## What if we want all the errors and successes`
> `## Testing with controlled polling` · `## Streams` · `## Outro`

No numbered headings, no colons, no "Part 3: Understanding the Fundamentals".

## 9. Rituals: long-form only

Scripts and lessons open and close with fixed furniture. This belongs to published content
only. Never open a chat reply, a code comment or a commit message this way.

Openings:

> Hello, and welcome to Mathias's rust corner!
> Today we're talking about how you can test your axum web services with in-process API tests!

> Hello, and welcome to part 2 of "Making high performance web applications with Dominator and Rust"!

> Hello, and welcome to this RUST QUICKIE!
> This edition: Turning an iterator of Results into a Result of a collection!

Roadmap, when the piece is long:

> I will explain what cancellation of a future means, and when it is not safe to cancel.
> I will then show what cancel unsafe and cancel safe futures look like, both handwritten
> and using anonymous async blocks.
> Finally, I will show you when cancellation may occur.

Transition into the body:

> Let's dive in! · Let's go! · With that out of the way - Let's get started!

Closings:

> That's it for this quick overview of testing async code.
> Make sure to share the video if you find it useful, and don't forget to like and subscribe!
>
> Thanks for watching, GOODBYE!

`GOODBYE!` is capitalised. That is deliberate and consistent across the corpus.

## 10. What is not in the voice

- **Typos.** The corpus contains a few (`the browsers real DOM tree`, `ot he Cargo.toml`).
  These are artefacts of drafting, not style. Write correct English.
- **Softened bad news.** The voice is direct about cost and difficulty: tests are
  expensive, the pattern is only fine `as long as they are not over done`, the design is
  hard to match exactly so `don't focus too much on the visuals`. Never dress up a failure.
- **Filler enthusiasm.** The exclamation marks land on real payoffs. An excited tone with
  nothing behind it is the fastest way to sound like an imitation.

## 11. Worked example

Generic technical writing:

> It's important to note that error handling in iterator chains can be challenging.
> Fortunately, Rust provides a powerful and elegant solution — the `collect()` method can
> seamlessly transform an iterator of `Result` values into a `Result` containing a
> collection, which is a game changer for ergonomic error propagation.

The same content in this voice:

> In many cases, when we have a collection such as a Vec or an iterator that holds a Result value type,
> we want to extract either all the Ok-values, or the first encountered error value.
>
> This can be easily done by using the `collect()` method on the iterator type.
>
> To use collect this way may seem a bit magical, but it becomes less opaque when we consider how it works.
> The main enabler of this behavior is the `FromIterator` trait.

What changed: the hedge and the hype are gone, `we` arrived, the problem is stated before
the solution, the sentences broke at their clauses, and the reader's `this feels like magic`
reaction was named instead of ignored.

For a full piece rather than a paragraph, see `example-script.md`. It carries a complete
Rust Corner manuscript, an annotation of every move in it, and the self-check numbers it
scored, including the two places it deliberately misses the corpus.
