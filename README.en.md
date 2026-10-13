# AI-Product-Skills

AI workflows for product managers: a chain that takes a "one-line request" all the way to "something you can sign off on."

[中文](README.md) · [Installation](docs/installation.md) · [The chain](docs/chain.md) · [Third-party notices](THIRD-PARTY.md)

---

## What this is

Twelve skills covering the whole path from "we got a requirement" to "signed off and shipped."

Each skill does one thing, and every artifact lands in `docs/prd/<feature-name>/` so the next step reads it directly — nothing to copy between tools.

Once installed, just say "help me work through this requirement" and your agent picks the right skill.

## Two pipelines

### 1. Full PRD generation

From "the requirement isn't even shaped yet" to "a PRD that survives being questioned":

```
product-prd-extract   Word (.docx) PRD → structured prd.md    ┐
requirement-clarify   one-line spoken request → clarify.md     ├ pick one entry
context-to-prd        already discussed → straight to a PRD    ┘
        ↓
   prd-write          write / revise prd.md, reusing the product baseline
        ↓
  grill-with-prd      plays a demanding engineer; every answer written back into the file
```

Insert `product-experience-foundation` when needed: first version of a product, onboarding a legacy
project, or when you notice "the same modal looks different in three features." It captures the
C-end / Admin rules once, and `prd-write` reads them automatically from then on.

### 2. High-fidelity prototype generation

Two routes — **they differ only in where the design comes from**. The back half is identical.

#### 2.1 From a reference site

```
URL / screenshot ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper ─→ prototype.html
                    observed vs inferred      the spec    spec is the single source   clickable,
                                                                                      reviewable
```

To build it inside **your own frontend project** instead — reusing real components and design tokens,
isolated from your production routes — swap the last step for `pm-frontend-prototype`.

#### 2.2 From AI design tools

Have an AI design tool produce the mockup first — Figma Make, Google Stitch, Open Design,
OpenAI Image2, or the companion `ui-ux-pro-max` — then **enter at the same `web-design-extractor`**:

```
AI design tool ─→ mockup ─→ web-design-extractor ─→ design.md ─→ design-spec-prototyper
                                                                       ↓
                                                                 prototype.html
```

Both routes produce **the same artifact format**, so what you bring to review looks the same.
The only difference is where the visual facts came from: a real site, or an AI-generated mockup.

> For a single-file prototype with the UI on the left and annotations on the right, linked by
> highlighted connectors — good for review decks — use the bundled third-party `prototype-html`.

### After the prototype is approved

```
prototype-to-product   picks the delivery path (direct / OpenSpec / Superpowers / project flow),
                       implements production code or produces a formal engineering handoff
        ↓
acceptance-checklist   generates a pre-launch walkthrough checklist, every item citing its PRD requirement
```

## All twelve skills

| Skill | What it does |
|---|---|
| `product-prd-extract` | Turns a Word (`.docx`) PRD into structured markdown, marking gaps as `[UNKNOWN]`. **The only skill here needing Node ≥ 20** — on first use the agent checks your environment and installs the dependencies itself, and if Node is unavailable it gives you install steps plus a fallback |
| `requirement-clarify` | Interviews you **before** the PRD exists — one question at a time, digging out scope boundaries |
| `context-to-prd` | Turns an already-clear conversation plus the codebase into a PRD, without re-asking |
| `prd-write` | Writes and revises PRDs, reusing confirmed experience rules; records only what changed |
| `grill-with-prd` | **After** the PRD exists, plays a demanding engineer and writes every answer back into the file |
| `design-spec-prototyper` | Turns `design.md` into a clickable, reviewable standalone `prototype.html` |
| `prototype-to-product` | Picks the delivery path (direct / OpenSpec / Superpowers / project flow); implements production code or produces a formal engineering handoff |
| `acceptance-checklist` | Produces a pre-launch walkthrough checklist; every item cites the PRD requirement it came from |
| `product-experience-foundation` | Builds the C-end / Admin experience baseline so features stop redefining it |
| `web-design-extractor` | Extracts `design.md` from a URL or screenshot, separating observed from inferred |
| `pm-frontend-prototype` | Builds an isolated, clickable prototype inside your existing frontend project |
| `prototype-html` | Single-file HTML: UI on the left, annotations on the right (third-party) |

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

**Copy by hand** — drop the directories under `skills/` into your project or your agent's skills directory.
**Eleven of the twelve are self-contained Markdown** — no dependencies, no scripts, no long-running process.

The one exception is `product-prd-extract`: parsing `.docx` needs a Node script (Node ≥ 20). **You don't have to manage that yourself** — on first use the agent checks your environment and installs the dependencies. If Node isn't available it hands you platform-specific install steps and a fallback: paste the document text, and the rest of the flow is identical.

## Recommended companion: ui-ux-pro-max

When a design spec is incomplete, `design-spec-prototyper` can lean on a design-system lookup to fill the gap. If you want that capability, install this alongside:

```bash
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max
```

It is an independent project (MIT), shipping 79 UI styles, 192 palette reasoning rules, 74 font pairings, and stack guidance for 22 frameworks: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

**It is entirely optional.** The core chain depends on nothing external. Without it, `design-spec-prototyper` falls back to your product experience baseline and is required to flag which decisions lack evidence.

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

Every step reads what the previous step left in the same directory. Nothing to copy by hand.

## What this is not

- **Not a design tool.** It does not replace Figma or Axure. The HTML prototypes are for **review**, not design source files.
- **`prototype-to-product` does write production code** — but only when it routes to `direct` (local, low-risk change that existing components and routes can absorb), and it must adapt to your repo's actual framework, routing and components rather than copying the prototype's CDN scripts and mock data. When the change touches API contracts, data models, permissions, or spans modules, it hands off to OpenSpec, Superpowers, or whatever governance flow your project already uses — it does not edit business code behind that flow's back.
- **`pm-frontend-prototype` never touches your production entry points.** It only adds isolated prototype routes inside your project.
- **Not automated testing.** `acceptance-checklist` produces a **product acceptance** checklist (user-observable outcomes), not test cases (implementation branch coverage).
- **No hidden prerequisites.** The core chain itself has zero dependencies, no MCP servers, no long-running process. The one exception is `product-prd-extract`, which needs Node ≥ 20 to parse `.docx` — the agent installs those dependencies for you on first use, and falls back to pasted text if Node isn't available. `prototype-to-product` only takes the OpenSpec/Superpowers route when your project actually has one, and will not guess commands from a name.
- **It will not decide for you.** Every skill is required to mark unknowns as `[UNKNOWN]` with an owner rather than invent an answer.

## Layout

```text
.
├── .claude-plugin/          # plugin manifests, for marketplace install
├── .github/workflows/       # CI: mojibake and internal-identifier gates
├── docs/                    # installation, chain reference
├── skills/<name>/           # 11 self-contained skills
└── THIRD-PARTY.md           # third-party attribution and licensing
```

## Third-party

`skills/prototype-html/` is included from [vagerent/prototype-html](https://github.com/vagerent/prototype-html) (Apache-2.0, unmodified);
`skills/acceptance-checklist/` borrows its dimension breakdown from [beautfulmt/PM-K12--skills](https://github.com/beautfulmt/PM-K12--skills),
which carries no open-source license — **no files were copied**.

Full attribution in [THIRD-PARTY.md](THIRD-PARTY.md).

## License

MIT — see [LICENSE](LICENSE).

Exception: `skills/prototype-html/` is third-party work under Apache-2.0, copyright its original author.
