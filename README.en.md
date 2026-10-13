# AI-Product-Skills

AI workflows for product managers: eleven skills covering the whole path from "we got a requirement" to "signed off and shipped."

[中文](README.md) · [Installation](docs/installation.md) · [The chain](docs/chain.md) · [All skills](docs/skills.md)

---

## Use cases

### 1. Turning a requirement into a complete PRD

Someone handed you a Word document, or said a paragraph in a meeting — and you need it to become a PRD engineering can act on.

```
Pick one entry point:

product-prd-extract   Word (.docx) PRD → structured prd.md
requirement-clarify   one-line spoken request → clarify.md
context-to-prd        context you already worked out with AI → a PRD

        ↓
   prd-write          write a new prd.md or revise an existing one, reusing the product baseline
        ↓
  grill-with-prd      plays a demanding engineer; every answer written back into the file
```

If you already have a product in flight and its patterns are starting to drift, run
`product-experience-foundation` first — see the collapsed section below.

### 2. Generating a high-fidelity prototype

The PRD is done, but prose alone won't settle what the page actually looks like. Two **independent**
choices here: **where the design comes from**, and **where the prototype lives**.

#### Where the design comes from

**Route 1 — you have a reference site.** Use a competitor or reference site as the design basis.

```
URL / screenshot ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper ─→ prototype.html
                    observed vs inferred      the spec    spec + image together        clickable,
                                                                                       reviewable
```

No reference site yet? [Here are a few design reference sites](docs/design-references.md) — they hand
you a **style direction and a prompt**, not a finished design. Pick one and go.

**Route 2 — you only have the idea.** Have a design tool produce something first — [full list,
screenshots and a sample prompt here](docs/design-tools.md). What you get back falls into two cases:

| What the tool gave you | What to do |
|---|---|
| **Clickable HTML**<br>prototype-html / Open Design / ui-ux-pro-max / Figma Make / Axhub Make | **Use it as-is** — it is already a clickable prototype |
| **UI images only**<br>Google Stitch / OpenAI Image 2 | **Run the pipeline**: image → `web-design-extractor` → `design.md` → `design-spec-prototyper` |

```
image ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper ─→ prototype.html
                                  ↑
                     durable record: later iterations don't have to re-guess the design rules
```

**`design.md` is a durable record, not a step you must pass through every time.** It pins down brand
tokens and component rules so the next iteration — and the next AI session — still knows what your
design system is. So **even when you use the tool's HTML directly, it is worth writing a `design.md`** —
otherwise the rules you settled on are lost the moment the conversation ends.

#### Where the prototype lives

Independent of where the design came from. Two options:

| Where | What to use | Best for |
|---|---|---|
| **A standalone HTML file** | `design-spec-prototyper` (default) | Sending it to someone, demoing at a review, no backend needed |
| **Inside your own frontend project** | `pm-frontend-prototype` | **Prefer this when you have a frontend project** — you already have a React / Vue / HTML project, so reuse the real components and design tokens, producing prototype routes isolated from production |

<details>
<summary><strong>Already have a product?</strong> Run <code>product-experience-foundation</code> once to settle the existing rules into a baseline</summary>

**Whichever route you took above**, if you already have a product in flight it is worth running it
first — capturing the existing navigation, terminology and page patterns into a product-level
baseline, maintained separately for C-end and Admin.

It pairs with "where the prototype lives": **settle the rules first**, and only then does the prototype
know which components to reuse and which patterns to follow. Once it has run you don't have to think
about it again — `prd-write` and the prototype skills read it automatically, so feature PRDs never
restate global rules.

**When to run it**: a first version that needs rules set, onboarding a legacy project, or when you
notice the same modal looks different in three different features.

</details>

## Generated artifacts

Every skill writes into the **same directory**, and each step reads what the previous one left there.
Nothing to copy by hand.

| When | Artifact | Where it lands |
|---|---|---|
| The requirement is settled | Structured PRD (8 dimensions + open questions) | `docs/prd/<feature-name>/prd.md` |
| The page is built | Clickable, reviewable high-fidelity prototype | `docs/prd/<feature-name>/prototype.html` |
| Engineering has a test build and you need to walk it | Acceptance checklist, every item citing its PRD requirement | `docs/prd/<feature-name>/acceptance.md` |


## Install

Any one of three ways — see [docs/installation.md](docs/installation.md).

**Claude Code plugin marketplace**

```bash
/plugin marketplace add mingdui/AI-Product-Skills
/plugin install ai-product-skills
```

**npx skills**

```bash
npx skills add mingdui/AI-Product-Skills
```

**Copy by hand** — drop the directories under `skills/` into your project or your agent's skills
directory. Nothing to install. The one skill needing anything extra is `product-prd-extract`
(parsing `.docx` needs Node ≥ 20), and the agent installs that for you on first use — you don't have
to do anything.

## Usage

Invoke any step directly — **you can enter at any point**:

```
/requirement-clarify user-bulk-import   → docs/prd/user-bulk-import/clarify.md
/prd-write                              → docs/prd/user-bulk-import/prd.md
/grill-with-prd                         → item-by-item review, written back into prd.md
/design-spec-prototyper                 → docs/prd/user-bulk-import/prototype.html
/acceptance-checklist                   → docs/prd/user-bulk-import/acceptance.md
```

`<feature-name>` is always **lowercase English kebab-case** (`user-bulk-import`) — it becomes a
directory name, so never use anything else.

What each of the eleven skills does, and when not to reach for it, is in [docs/skills.md](docs/skills.md).

---

## What this is not

- **Not a design tool** — it does not replace Figma or Axure. The output is **HTML for review**, not design source files.
- **Not automated testing** — `acceptance-checklist` produces a **product acceptance** checklist
  (user-observable outcomes), not test cases (implementation branch coverage).

## License

MIT — see [LICENSE](LICENSE).

`skills/prototype-html/` is third-party work (Apache-2.0, included unmodified); see
[THIRD-PARTY.md](THIRD-PARTY.md).
