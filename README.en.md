# AI-Product-Skills

AI workflows for product managers: twelve skills covering the whole path from "we got a requirement" to "signed off and shipped."

[中文](README.md) · [Installation](docs/installation.md) · [The chain](docs/chain.md) · [All skills](docs/skills.md)

---

## Scenarios

### 1. Turning a requirement into a PRD

Someone handed you a Word document, or said a paragraph in a meeting — and you need it to become a PRD engineering can act on.

```
product-prd-extract   Word (.docx) PRD → structured prd.md   ┐
requirement-clarify   one-line spoken request → clarify.md    ├ pick one entry
context-to-prd        already discussed → straight to a PRD   ┘
        ↓
   prd-write          write a new prd.md or revise an existing one, reusing the product baseline
        ↓
  grill-with-prd      plays a demanding engineer; every answer written back into the file
```

**For a first version, when onboarding a legacy project, or once C-end / Admin page patterns start to
diverge**, run `product-experience-foundation` first to capture the product-level rules. After that,
`prd-write` and the prototype skills read them automatically, so feature PRDs never restate global rules.

### 2. Getting the page built before it reaches engineering

The PRD is done, but prose alone won't settle what the page actually looks like. There are two ways here —
**they differ only in where the design comes from**.

**Route A — you have a reference site.** Use a competitor or reference site as the design basis.

```
URL / screenshot ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper ─→ prototype.html
                    observed vs inferred      the spec    spec is the single source    clickable,
                                                                                       reviewable
```

**Route B — you only have the idea.** Have a design tool produce the mockup first, then join the same
flow with the mockup as input.

```
design tool ─→ mockup ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper
                                                                     ↓
                                                               prototype.html
```

Common tools — [full list, screenshots and a sample prompt here](docs/design-tools.md):

- **Interactive prototype output** —
  [prototype-html](https://github.com/vagerent/prototype-html) ·
  [Open Design](https://open-design.ai/zh/) ·
  [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) ·
  [Figma AI Make](https://www.figma.com/) ·
  [Axhub Make](https://axhub.im/make/)
- **UI images only** —
  [Google Stitch](https://stitch.withgoogle.com/) · OpenAI Image 2

Both routes produce **the same artifact format**, so what you bring to review looks the same. To build
the prototype inside **your own frontend project** instead — reusing real components and design tokens,
isolated from production routes — swap the last step for `pm-frontend-prototype`.

## What you get

Every skill writes into the **same directory**, and each step reads what the previous one left there.
Nothing to copy by hand.

| Artifact | Where it lands |
|---|---|
| Structured PRD (8 dimensions + open questions) | `docs/prd/<feature-name>/prd.md` |
| Clickable, reviewable high-fidelity prototype | `docs/prd/<feature-name>/prototype.html` |
| Engineering handoff (routes, states, dependencies, acceptance) | `docs/prd/<feature-name>/delivery.md` |
| Pre-launch walkthrough checklist | `docs/prd/<feature-name>/acceptance.md` |

Once the requirement is confirmed:

```
prototype-to-product   picks the delivery path, implements production code or produces a formal handoff
        ↓
acceptance-checklist   generates a pre-launch walkthrough checklist, every item citing its PRD requirement
```

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
/prototype-to-product                   → docs/prd/user-bulk-import/delivery.md
/acceptance-checklist                   → docs/prd/user-bulk-import/acceptance.md
```

`<feature-name>` is always **lowercase English kebab-case** (`user-bulk-import`) — it becomes a
directory name, so never use anything else.

What each of the twelve skills does, and when not to reach for it, is in [docs/skills.md](docs/skills.md).

---

## What this is not

- **Not a design tool** — it does not replace Figma or Axure. The output is **HTML for review**, not design source files.
- **Not automated testing** — `acceptance-checklist` produces a **product acceptance** checklist
  (user-observable outcomes), not test cases (implementation branch coverage).
- **`prototype-to-product` does write production code**, but only for local, low-risk changes that
  existing components and routes can absorb. When the change touches API contracts, data models,
  permissions, or spans modules, it hands off to OpenSpec, Superpowers, or whatever governance flow
  your project uses — it does not edit business code behind that flow's back.
- **It will not decide for you** — every skill marks unknowns as `[UNKNOWN]` with an owner rather than
  inventing an answer.

## License

MIT — see [LICENSE](LICENSE).

`skills/prototype-html/` is third-party work (Apache-2.0, included unmodified); see
[THIRD-PARTY.md](THIRD-PARTY.md).
