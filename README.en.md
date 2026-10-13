# AI-Product-Skills

AI workflows for product managers: eleven skills that turn a requirement into a complete PRD, and then into a high-fidelity, clickable prototype.

[中文](README.md) · [Installation](docs/installation.md) · [The chain](docs/chain.md) · [Design tools](docs/design-tools.md) · [**A real run, start to finish**](docs/walkthrough.md) (中文)

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
                      (same structure as context-to-prd — pick one, don't run both)
        ↓
  grill-with-prd      plays a demanding engineer; every answer written back into the file
```

<details>
<summary><strong>Already have a product?</strong> Run <code>product-experience-foundation</code> once to settle the existing rules into a baseline</summary>

If you already have a product in flight, it is worth running it once — capturing the existing
navigation, terminology and page patterns into a product-level baseline, maintained separately for
C-end and Admin.

Once it has run you don't have to think about it again: `prd-write` stops restating global rules in
every feature PRD, and the prototype skills follow it when reusing components and patterns.

**When to run it**: a first version that needs rules set, onboarding a legacy project, or when you
notice the same modal looks different in three different features.

</details>

### 2. Generating a high-fidelity prototype

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
screenshots and a sample prompt here](docs/design-tools.md).

What you get back falls into two cases:

| What the tool gave you | What to do |
|---|---|
| **Clickable HTML**<br>[prototype-html](https://github.com/vagerent/prototype-html) · [Open Design](https://open-design.ai/zh/) · [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Figma AI Make](https://www.figma.com/) · [Axhub Make](https://axhub.im/make/) | **Use it as-is** — it is already a clickable prototype |
| **UI images only**<br>[Google Stitch](https://stitch.withgoogle.com/) · [OpenAI Image 2](https://developers.openai.com/api/docs/models/gpt-image-2) | **Run the pipeline**: image → `web-design-extractor` → `design.md` → `design-spec-prototyper` |

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

## Generated artifacts

Every skill writes into the **same directory**, and each step reads what the previous one left there.
Nothing to copy by hand.

| When | Artifact | Where it lands |
|---|---|---|
| The requirement is settled | Structured PRD (8 dimensions + open questions) | `docs/prd/<feature-name>/prd.md` |
| The page is built | Clickable, reviewable high-fidelity prototype | `docs/prd/<feature-name>/prototype.html` |
| Engineering has a test build and you need to walk it | Acceptance checklist, every item citing its PRD requirement | `docs/prd/<feature-name>/acceptance.md` |

## All eleven skills

| Skill | When to use it |
|---|---|
| `product-prd-extract` | The requirement arrived as a Word (`.docx`) file. Converts it to structured markdown, marking gaps as `[UNKNOWN]`. **The only skill needing Node ≥ 20** |
| `requirement-clarify` | You have one spoken sentence and no boundaries. Asks one question at a time, always digging at "what we're explicitly not doing" |
| `context-to-prd` | You've already talked the requirement through with AI and only need it written up. Turns that context into a PRD without re-asking. **Same structure as `prd-write` — pick one** |
| `prd-write` | Writes a new PRD or revises an existing one, reusing the baseline under `docs/product/` and recording only what changed |
| `grill-with-prd` | Once the PRD exists, plays a demanding engineer and writes every answer straight back into the file |
| `design-spec-prototyper` | You have a `design.md` (ideally plus a design mockup image) and need a standalone clickable `prototype.html` |
| `acceptance-checklist` | Engineering has a test build and you need to walk it before launch. Every item cites its PRD requirement |
| `product-experience-foundation` | A first version, onboarding a legacy project, or page patterns starting to diverge. Settle the product rules once, reuse them after |
| `web-design-extractor` | You have a competitor URL or screenshot to turn into `design.md`, separating `[OBSERVED]` / `[INFERRED]` / `[UNKNOWN]` |
| `pm-frontend-prototype` | You already have a frontend project and want the prototype to live inside it, reusing real components and design tokens. Replaces `design-spec-prototyper` |
| `prototype-html` | You want a single-file prototype with UI on the left and annotations on the right, linked by highlighted connectors |

Each skill's boundaries and details are in its own `skills/<name>/README.md`; how the chain connects is in [docs/chain.md](docs/chain.md).

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

---

## What this is not

- **Not a design tool** — it does not replace Figma or Axure. The output is **HTML for review**, not design source files.
- **Not automated testing** — `acceptance-checklist` produces a **product acceptance** checklist
  (user-observable outcomes), not test cases (implementation branch coverage).

## License

MIT — see [LICENSE](LICENSE).

`skills/prototype-html/` is third-party work (Apache-2.0, included unmodified); see
[THIRD-PARTY.md](THIRD-PARTY.md).
