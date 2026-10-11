# Code Quality

A quality audit of a Rust codebase that starts from measurements.

An agent asked to review a repository reads the files it happens to open, and reports what is
in them. This plugin ranks the code first: what is complex, untested, changed often and
copied. The agent reads that code, and each finding cites a number and a line.

## Skills

- **rust-quality-audit** — Runs the collector, reads the code it ranks, and reports findings against a saved baseline

## Tools

The collector, `skills/rust-quality-audit/scripts/collect.py`, needs Python 3 and `cargo`.
These add signals, and each is optional:

```bash
cargo install cargo-crap cargo-llvm-cov cargo-audit cargo-mutants
```
