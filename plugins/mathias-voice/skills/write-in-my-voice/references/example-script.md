# Example script: Cow

One complete piece in the voice, end to end, so the moves in `voice-guide.md` can be seen
working together rather than as isolated rules.

It is a Rust Corner video script, which means it carries the full ritual furniture. A README
or a PR body would use the same register with the openings and sign-offs removed.

The script is reproduced inside a code block so the semantic line breaks survive; that
line shape is part of what is being demonstrated.

## Contents

- [The script](#the-script) - a full manuscript, verbatim
- [What each move is doing](#what-each-move-is-doing) - annotated walkthrough of the choices
- [How it measures](#how-it-measures) - the self-check numbers, including where it misses

## The script

`````markdown
# Cow, or how to stop allocating strings you never change

Hello, and welcome to Mathias's rust corner!

Today we're talking about `Cow`, and how it lets us write functions that only allocate when they actually have to!

I will start with the allocation problem that `Cow` exists to solve.
I will then show what the type actually is, which is far less exotic than the name suggests.
Finally, I will show you where it belongs in an API, and where it will only make your life harder.

Let's dive in!

## The problem

Say we want to sanitise a string.
We take some text, and we replace every tab in it with a space.

The obvious signature takes a `&str` and gives us back a `String`:

```rust
fn sanitise(input: &str) -> String {
    input.replace('\t', " ")
}
```

This works, it is perfectly readable, and it is what most of us would write without thinking about it.
But it allocates a fresh `String` on every single call.

Most of the time that is a complete waste.
If the input contains no tabs at all, we have copied the entire string to produce a byte-for-byte identical value.

For a config file we parse once at startup, nobody cares.
For a hot loop over a few million log lines, this is most of what our program spends its time doing.

## What Cow actually is

The standard library calls `Cow` a clone-on-write smart pointer, which makes it sound like something clever is happening behind your back.

Really, it is an enum with two variants:

```rust
pub enum Cow<'a, B> where B: 'a + ToOwned + ?Sized {
    Borrowed(&'a B),
    Owned(<B as ToOwned>::Owned),
}
```

That is the whole idea, and we have seen the entire type.
A `Cow<str>` either holds a `&str` that belongs to somebody else, or a `String` that belongs to us.

Now our function can tell the caller which one it produced:

```rust
use std::borrow::Cow;

fn sanitise(input: &str) -> Cow<'_, str> {
    if input.contains('\t') {
        Cow::Owned(input.replace('\t', " "))
    } else {
        Cow::Borrowed(input)
    }
}
```

Notice how the allocation only happens on the branch that actually needs it.
The common case now costs us a `contains` scan, and nothing else.

## The part that looks like magic

Here is where people usually get suspicious.
We can call `len()` and `starts_with()` straight on a `Cow<str>`, and we can hand it to anything that expects a `&str`.

This may seem a bit magical, but it becomes less opaque once we look at the trait implementations.
`Cow<B>` implements `Deref<Target = B>`, and that implementation simply matches on the two variants and hands back a reference either way.

So the ergonomics are not a special case in the compiler.
It is the same `Deref` mechanism that lets us call `str` methods on a `String`!

The other half of the type is `to_mut()`.
This is the write in clone-on-write, and it is the only place a clone ever happens:

```rust
let mut text = sanitise(line);
text.to_mut().push_str(" [checked]");
```

If the `Cow` was already `Owned`, `to_mut()` hands us a `&mut String` and costs nothing.
If it was `Borrowed`, it clones into an owned value first, and then gives us the reference.

## Where it belongs, and where it does not

`Cow` is at its best in a return type, where the function knows something the caller does not.
Sanitising, normalising, unescaping, path canonicalisation; all of these usually leave the input untouched.

It is at its worst as a field in a long-lived struct.
The lifetime parameter spreads to our struct, then to everything that holds that struct,
and a small optimisation has now infected half the crate.

Note that reaching for `Cow` and reaching for a faster algorithm are orthogonal concerns.
`Cow` removes an allocation you were never going to use; it does not make the work itself cheaper.

Use it when a profile says the allocation is real, or when you are writing library code
and cannot know the caller's access pattern.
Everywhere else `String` is simpler, and the difference is noise!

There is also `Cow` in argument position, which has quite different tradeoffs.
That one needs a video by itself.

## Outro

So, to summarise.

`Cow` is a two-variant enum, and not a piece of compiler magic.
`Deref` is what makes it pleasant to read from, and `to_mut()` is the single place it ever clones.
And it earns its keep in return types, where we get to skip an allocation the caller was going to pay for anyway!

Make sure to like the video, and subscribe if you want more rust content.
The companion repository has the benchmark I used here, so you can measure it on your own machine.

Thanks for watching, GOODBYE!
`````

## What each move is doing

**The open.** Greeting, then a one-line promise of what the viewer walks away able to do.
The promise carries the first `!`, because it is a payoff rather than a fact.

**The roadmap.** Three `I will` lines, the only place `I` appears in quantity. This is lifted
directly from the cancel-safety intro. It is worth doing for a long piece and worth skipping
for a short one.

**`## The problem` before any solution.** The naive `-> String` signature is shown, praised
for being readable, and only then costed. Attacking the obvious code before writing it out
reads as a lecture; this order does not.

**Two scales for the cost.** A config file parsed once versus a hot loop over millions of
lines. The voice gives the reader the threshold rather than a blanket "this is slow".

**The deflation.** The standard library's own "clone-on-write smart pointer" is quoted, then
undercut: it is an enum with two variants. Dry, not snarky, and immediately backed by the
actual definition.

**`Notice how`.** Pointing at the specific line that matters after the example is on screen,
rather than explaining the example before showing it.

**The objection, named out loud.** "This may seem a bit magical, but it becomes less opaque
once we look at the trait implementations." The reader's suspicion is stated before it is
resolved, and the resolution is a real mechanism (`Deref`), not reassurance. This is the
single most characteristic move in the corpus.

**Orthogonal concepts separated.** `Cow` removes an allocation; it does not make the work
cheaper. The corpus does this explicitly for test size versus test type.

**The default with its reason.** Use it when a profile says the allocation is real.
Everywhere else `String` is simpler. A recommendation never ships without its why.

**Scope marked, not dropped.** `Cow` in argument position is named and deferred with
"That one needs a video by itself", the same construction used for zero copy.

**The close.** Three-line summary, the like-and-subscribe line, then `Thanks for watching,
GOODBYE!` with `GOODBYE` capitalised.

## How it measures

| Property | This script | Corpus |
| --- | --- | --- |
| Median sentence | 15 words | 17 |
| p90 sentence | 24 words | 29 |
| Sentences ending `!` | 16% | 21% |
| `we` per 1k words | 16 | 22 |
| `you` + `your` per 1k | 11.5 | 17 |
| `I` per 1k words | 5.8 | 2.4 |
| Banned register | none | none |

Two of these misses are instructive.

The `I` count is inflated because the three-line roadmap is a fixed cost that a 900-word
script pays as heavily as a 1700-word one. Over a full course manuscript it dilutes to
roughly the corpus figure. Do not delete roadmap lines to chase the number.

The sentence length and exclamation rate both run slightly low, for the same reason: a tight
single-topic script has less connective narration than a course lesson. Close enough is
correct here. The measurements are a check against drift, not a target to optimise, and a
draft that hits every number while losing the objections and the reasons has failed.

An earlier draft of this script measured `we` at 10.5 per 1k, which is genuine drift rather
than a length artifact, and it was reworked before being kept. That is the ratio worth
actually enforcing: `we` should lead `you` by roughly four to three.
