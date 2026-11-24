---
name: Connected Canvas
description: The studio's crit wall. Work pinned up as prints, decisions made with dot stickers.
colors:
  graphite-950: "#121417"
  graphite-900: "#1a1d21"
  graphite-850: "#20242a"
  graphite-800: "#272b31"
  graphite-700: "#343941"
  graphite-600: "#454b55"
  shell-text: "#eceef1"
  shell-muted: "#a3a9b3"
  shell-faint: "#878d97"
  shell-line: "rgba(236, 238, 241, 0.08)"
  board: "#e4e7eb"
  board-deep: "#d9dde2"
  print: "#ffffff"
  print-strip: "#f4f5f7"
  ink: "#16181b"
  ink-muted: "#5a616b"
  ink-faint: "#666c75"
  hairline: "rgba(22, 24, 27, 0.1)"
  hairline-strong: "rgba(22, 24, 27, 0.18)"
  dot-cobalt: "#2b57e8"
  dot-cobalt-soft: "rgba(43, 87, 232, 0.12)"
  dot-green: "#1c9a57"
  dot-green-soft: "rgba(28, 154, 87, 0.12)"
  dot-green-ink: "#157244"
  dot-amber: "#e89a1a"
  dot-amber-soft: "rgba(232, 154, 26, 0.14)"
  dot-vermilion: "#e5432b"
  dot-vermilion-soft: "rgba(229, 67, 43, 0.12)"
  dot-vermilion-ink: "#b3301c"
  sticky: "#fff3b8"
typography:
  display:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.026em"
  headline:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.018em"
  lede:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  specimen-gloock:
    fontFamily: "'Gloock', serif"
  specimen-bricolage:
    fontFamily: "'Bricolage Grotesque Variable', sans-serif"
  specimen-young-serif:
    fontFamily: "'Young Serif', serif"
  title:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'ss01', 'cv11'"
  body-small:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.01em"
  mono:
    fontFamily: "'Geist Mono Variable', ui-monospace, 'SFMono-Regular', monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  print: "6px"
  item: "7px"
  control: "8px"
  panel: "10px"
  menu: "12px"
  frame: "14px"
  sheet: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "32px"
  "8": "40px"
components:
  button-primary:
    backgroundColor: "{colors.shell-text}"
    textColor: "{colors.graphite-950}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-primary-hover:
    backgroundColor: "{colors.print}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-ghost-hover:
    textColor: "{colors.shell-text}"
  button-shell:
    backgroundColor: "{colors.graphite-850}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-shell-hover:
    backgroundColor: "{colors.graphite-800}"
  button-quiet:
    backgroundColor: "{colors.graphite-900}"
    textColor: "{colors.print}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  button-quiet-hover:
    backgroundColor: "{colors.graphite-700}"
  chip:
    backgroundColor: "{colors.graphite-850}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.pill}"
    padding: "0 12px 0 10px"
    height: "30px"
  chip-hover:
    backgroundColor: "{colors.graphite-800}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.shell-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  composer:
    backgroundColor: "{colors.graphite-850}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.frame}"
    padding: "8px 8px 8px 12px"
  print:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.print}"
  print-strip:
    backgroundColor: "{colors.print-strip}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0 10px"
    height: "28px"
  direction-frame:
    backgroundColor: "rgba(255, 255, 255, 0.42)"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "18px 22px 0"
  dot-sticker-s:
    size: "9px"
    rounded: "{rounded.pill}"
  dot-sticker-m:
    size: "13px"
    rounded: "{rounded.pill}"
  dot-sticker-l:
    size: "18px"
    rounded: "{rounded.pill}"
  dot-sticker-xl:
    size: "40px"
    rounded: "{rounded.pill}"
  vote-sticker:
    backgroundColor: "{colors.graphite-800}"
    textColor: "{colors.print}"
    rounded: "{rounded.pill}"
    size: "40px"
  proposal-card:
    backgroundColor: "{colors.graphite-850}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.menu}"
    padding: "12px"
  review-sheet:
    backgroundColor: "{colors.graphite-900}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.sheet}"
    width: "560px"
  popover:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.menu}"
    padding: "10px"
    width: "288px"
  toast:
    backgroundColor: "{colors.graphite-900}"
    textColor: "{colors.shell-text}"
    rounded: "{rounded.panel}"
    padding: "9px 14px"
---

# Design System: Connected Canvas

## Overview

**Creative North Star: "The Crit Wall"**

The canvas is the studio's pin-up wall at review time. A graphite felt shell (top bar, Sources rail, Assistant panel) frames a pale, cool-grey pinboard. Everything on the board is a white print with a paper shadow; a print that comes from a real tool carries a thin source strip naming that tool and its file type. Human notes are marker on sticky stock, in tldraw's hand font. Decisions are made the way studios make them: by sticking dots.

Colour carries meaning, not decoration. The shell and board are near-neutral graphite and grey. Four dot-sticker primaries (cobalt, green, amber, vermilion) are the only saturated UI colour, and each one is a state. AI work never lands silently: it arrives as a ghost print, a dashed cobalt outline with a large cobalt sticker in its corner, and becomes solid only when a person accepts it. Saturated colour that is not a state belongs to the work pinned on the wall (photos, palettes, type specimens), never to the interface.

The density is a working tool's density: 13px body, 30px controls, 4px spacing grid, with the board left as open space. Layout follows standard app conventions; the world supplies type, palette, density and the dot move. The category default it rejects (confirmed in the direction contract and the build spec) is the grey dot-grid board with a purple-sparkle AI panel, glass panels and glowing gradients.

**Key Characteristics:**
- Graphite felt shell around a pale cool-grey pinboard; light board, dark frame.
- White prints with a soft two-layer paper shadow and a source strip naming the tool.
- Four dot-sticker colours, each a state, and nothing else saturated in the UI.
- AI proposals are ghost prints until accepted.
- Sticking a dot is the signature motion: drop in large, press, settle.
- Geist and Geist Mono only; source marks pair with tool names and file-type tags.

## Colors

A near-neutral graphite and paper palette where four sticker primaries do all the signalling.

### Primary
- **Proposal Cobalt** (`dot-cobalt`): The AI-proposal state. Ghost outlines, the 40px ghost sticker, the proposal card's dot and border tint, the "Review changes" pending dot, the text caret and selection, the running spinner, and the shell's focus ring. It always means "waiting for a person".

### Secondary
- **Synced Green** (`dot-green`): Linked and in sync. The default dot on every Living Artifact and on the pull-request print, done ticks in thinking and execution steps. **Green Ink** (`dot-green-ink`) is its text-safe deep tone for the PR status pill and diff additions on white.
- **Changed Amber** (`dot-amber`): Source changed or missing. Defined and wired into the Dot component; no shipped beat currently reaches it.
- **Approved Vermilion** (`dot-vermilion`): Approved and chosen. The approval sticker on a direction frame, the Decision print's sticker, a 1.5px vermilion inner outline on the approved frame, and failed execution steps. **Vermilion Ink** (`dot-vermilion-ink`) is its text-safe tone for the "Approved" label and diff deletions on white.
- Each state has a matching soft tint (`*-soft`, 12–14% alpha) for fills behind state text.

### Neutral
- **Graphite Felt** (`graphite-950` to `graphite-600`): The shell. 950 is the top bar and diff wells; 900 the rails, review sheet and toasts; 850 raised shell surfaces (chips, composer, proposal card, menus); 800 hover; 700 pressed/hover-strong, user message bubbles and scrollbar thumbs.
- **Shell Text / Muted / Faint** (`shell-text`, `shell-muted`, `shell-faint`): Light neutrals on graphite, in that order of emphasis.
- **Shell Line** (`shell-line`): 8% light hairline for every shell border and divider.
- **Pinboard** (`board`): The canvas ground, also fed to tldraw as its background. `board-deep` is the one step darker.
- **Print White** (`print`) and **Source Strip** (`print-strip`): Paper and the band at the top of tool prints; the strip grey doubles as hover fill on light surfaces.
- **Ink / Ink Muted / Ink Faint** (`ink`, `ink-muted`, `ink-faint`): Text on prints and the board.
- **Hairline** (`hairline`, `hairline-strong`): Dividers and outlines on white.
- **Sticky Stock** (`sticky`): Reserved marker-note stock; the shipped notes use tldraw's own yellow (human) and light-blue (AI) note colours.

### Named Rules
**The Dots Mean State Rule.** Cobalt = AI proposal waiting, green = linked and in sync, amber = source changed or missing, vermilion = approved. No sticker colour is used as decoration, brand accent or category colour.

**The Votes Are Not State Rule.** A teammate's vote is a graphite sticker with their initial, never a coloured dot. Votes inform a decision; they are not one.

**The No Borrowed Blue Rule.** tldraw's saturated blue accent would read as the cobalt proposal state, so selection, primary and selection stroke on the board are re-themed to graphite (`--tl-color-selected`, `--tl-color-primary` to `graphite-900`, selection stroke `#1f2329`, fill at 6% alpha).

## Typography

**Display Font:** Geist Variable (with ui-sans-serif, system-ui)
**Body Font:** Geist Variable
**Label/Mono Font:** Geist Mono Variable (with ui-monospace, SFMono-Regular)

**Character:** One neutral grotesk at fine-grained variable weights (560, 580, 600, 650) and tight negative tracking on anything 15px and up; mono marks anything that is a literal string from a tool (paths, extensions, branches, hex values, token names, diffs). Body runs with stylistic sets `ss01` and `cv11` on.

### Hierarchy
- **Display** (650, 30px, 1.1, -0.026em): Direction frame names on the board only.
- **Headline** (650, 17px, -0.018em): Review sheet title, Decision print title.
- **Lede** (400, 17px, 1.4, max 38ch): A direction's rationale under its name.
- **Title** (650, 15px, -0.015em): Panel titles ("Sources", "Assistant") and the wordmark; artifact names at 600 and reference captions at 580 share the size.
- **Body** (400, 13px, 1.45–1.55, max 60ch): Shell default, messages, buttons (at 560), menu and source items.
- **Body Small** (12px): Meta lines, notes, permission copy, step lists, quiet buttons.
- **Label** (600, 11px, +0.01em): Group headings in the Sources rail, tags, source strips (at 560), face initials. Sentence case, never uppercase.
- **Mono** (400, 11px; 10px for extensions and paths on prints; 11.5px, 1.65 in diffs): Literal values only.

### Named Rules
**The UI Speaks Geist Rule.** Interface text is Geist or Geist Mono. Gloock, Bricolage Grotesque and Young Serif ship only as specimen content on reference prints, mini previews and the token diff's "Aa" sample; they are the client's work on the wall, not the product's voice.

**The Mono Is Literal Rule.** Mono appears only where the text is a real string from a file or tool: `.fig`, `website/src/theme.ts`, `direction/warm-tactile`, `#1F3A5F`.

## Layout

A three-column app grid: Sources rail (248px), canvas (fluid), Assistant panel (368px), under a 52px top bar. The canvas owns all remaining space and is the only light area. Spacing runs on a 4px grid (4, 8, 12, 16, 20, 24, 32, 40); panel heads pad 16px, list items are 30–32px tall, chips and buttons 30px, quiet board buttons 28px.

Overlays sit on the canvas, not in new columns: the review sheet docks to the canvas's right edge (12px inset, max 560px wide, non-modal) and hides tldraw's bottom toolbar while open; the artifact popover (288px) anchors below its print and flips above when there is no room; toasts stack centred 132px above the canvas bottom; presence cursors glide in their own layer.

Responsive behaviour: at 1100px and below the Sources rail is dropped and the Assistant narrows to 320px; at 760px and below the layout stacks top bar, canvas, then the Assistant at 44vh, and the wordmark, crumbs and faces hide. Desktop 1280–1920 is the target for the sample. In saved projects, panel toggles stay in the top bar and either panel can dock below the canvas on narrow screens. Focus canvas hides both panels; Restore panels brings them back.

## Elevation & Depth

Hybrid. The shell is flat and tonal: graphite steps (950 to 700) and 8% hairlines separate surfaces, with no shadows at rest. The board is where paper physics live: prints sit on it with a soft paper shadow and lift on hover. Floating shell surfaces (menus, toasts, the review sheet) use one deep pop shadow.

### Shadow Vocabulary
- **Print** (`box-shadow: 0 1px 1px rgba(16,18,22,0.06), 0 4px 10px -2px rgba(16,18,22,0.1)`): Every print at rest.
- **Print lift** (`box-shadow: 0 2px 2px rgba(16,18,22,0.06), 0 14px 28px -8px rgba(16,18,22,0.22)`): Print under the pointer; combined with a 2px ink ring for highlighted lineage.
- **Pop** (`box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 18px 40px -12px rgba(0,0,0,0.45)`): Menus, toasts, review sheet.
- **Sticker** (`box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.35), 0 1px 1.5px rgba(16,18,22,0.28)`; 40px stickers use `0 2px 4px`): A dot's own thickness, with a highlight gradient at 34%/30%.
- **Proposal glow** (`box-shadow: 0 10px 30px -16px rgba(43,87,232,0.55)`): Only under the AI proposal card, the one cobalt-tinted shadow.

### Named Rules
**The Paper Only On The Board Rule.** Paper shadows belong to prints on the pinboard. Shell surfaces separate by tone and hairline; they float only when they are transient (menu, toast, sheet).

**The Ghost Has No Shadow Rule.** A ghost print drops its paper shadow entirely; it is not on the wall yet.

## Shapes

Gently cornered paper. Prints round at 6px, image wells inside them at 3–4px, direction frames at 14px, so a frame reads as a zone that holds prints. Shell controls round at 7–8px, floating panels at 10–12px, the review sheet at 16px. Pills (999px) are reserved for chips, tags and the PR status. Dots, vote stickers and faces are perfect circles. Ghosts are marked by a 2.5px dashed cobalt outline offset 4px, never by a changed shape.

## Components

### Buttons
Quiet and solid; one light primary per group on graphite.
- **Shape:** 8px radius, 30px tall, 0 12px padding, 13px at weight 560.
- **Primary:** Shell-text fill with graphite-950 text (Accept, Review change, Approve and open pull request); hover goes to pure white.
- **Ghost:** Transparent with a shell-line border and muted text (Discard, Cancel); hover brightens text and border.
- **Shell:** Graphite-850 fill for top-bar actions; when changes are pending, a cobalt border tint plus a 7px cobalt dot with a 3px halo.
- **Quiet (on the board):** Graphite-900 fill, white 12px text, 28px tall (Approve direction).
- **States:** Press nudges down 1px; disabled sits at 45% opacity; focus is a 2px cobalt ring offset 2px (graphite ring for quiet buttons on the board).

### Chips
- **Style:** Graphite-850 pill, 30px, shell-line border, a corner-down-right icon in faint, then the suggestion text. Hover lifts to graphite-800.
- **Use:** The Assistant always offers the next step as a chip.

### Tags
- **Style:** 20px outlined pill in muted 11px text ("Sample data"). On prints, file-type tags (`.fig`, `.ai`, `#42`) are 10px mono in a white 4px-radius box with a hairline.

### Cards / Containers
- **Print:** White, 6px radius, print shadow, ink text. Tool prints add a 28px source strip (tool name, mono extension tag, 9px state dot at the right). Reference prints show the work in an inset well with a two-line caption.
- **Direction frame:** 14px radius, white at 42% over the board with a hairline inner outline; 30px name, 17px rationale, vote count and the quiet Approve button. Stickers stack in the top-right corner. Approved: white at 62% and a vermilion inner outline.
- **Decision print:** A print with a 40px vermilion sticker beside its 17px title and an "Approved by · time · votes" meta line.
- **Pull-request print:** Source strip reading "Pull request #n", green dot, branch in mono, green status pill and diff counts.
- **Proposal card (shell):** Graphite-850, 12px radius, cobalt border at 45% and the proposal glow; a 13px cobalt dot, summary, one note line, Accept/Review plus Discard.

### Workspace Canvas Views
- **Moodboard:** White prints with paper shadows. Fully attached arrows and authored relationships are hidden while retaining their geometry and bindings.
- **Node map:** The same canvas shows saved connections. Artifact prints use a thin ink outline and small neutral connection markers. Image and note shapes get a thin outline. Select two items and connect them from the top bar, or use the canvas arrow tool.
- **Appearance:** A quiet dotted surface is the workspace default. Five light backgrounds preserve contrast for existing canvas ink. Grid visibility, background, and view are local per project.

### Inputs / Fields
- **Composer:** Graphite-850, 14px radius, shell-line border that brightens to 24% on focus-within; borderless textarea, cobalt caret, faint placeholder; a 30px send square at 9px radius in shell-text, graphite-700 when empty.

### Navigation
- **Top bar:** 52px graphite-950. Wordmark (a tilted white print) and name at 15px/650, a hairline separator, studio / project crumbs, the Sample data tag; right side holds overlapping 26px initial faces, Review changes (n) and the Demo menu.
- **Sources rail:** Groups by tool with 11px faint headings and counts; 30px rows with name, mono extension (or a kind word) and the item's state dot. A "Connected tools" footer states each tool's permission in plain words.

### Dot Sticker (signature)
One component, four states, four sizes (9, 13, 18, 40px). A flat state colour with a white specular highlight and a thin contact shadow. Every dot carries an accessible label naming its state. **Sticking motion:** 520ms, starts 1.7x large, 3px up and transparent with a dropped shadow, presses to 0.88 at 45%, settles to 1, on `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion removes it.

### Vote Sticker
A 40px graphite-800 sticker with a white 17px/650 initial and the same specular highlight; it sticks with the same motion. Presence cursors (graphite arrow, white stroke, name label) glide to the frame's sticker corner over 900ms before the vote lands.

### Ghost Print
The AI-proposal state of any custom print or direction frame: 2.5px dashed cobalt outline at 4px offset, no paper shadow, contents at 50% (frame head at 55%), print fill white at 60% or frame fill cobalt at 5%, and a 40px cobalt sticker overhanging the top-right corner (-16px, -14px). Accepting removes all of it.

### Review Sheet
A docked, non-modal graphite-900 sheet: state dot and 17px title, a "Reads:" line, token diff (mono names, swatch chips, before → after), code diff on graphite-950 with green/vermilion-tinted lines, execution steps (pending, running, done in green, failed in vermilion), and a footer with the permission level in words and Cancel / Approve. Slides in 24px over 520ms.

### Artifact Popover and Toasts
The popover is the one light surface off the board-ground: a white 12px-radius card with the item's state dot, name, tool · mono location, and three 32px actions. Toasts are graphite-900 pills of plain text at 10px radius with the pop shadow, auto-dismissed after 3.6s.

## Do's and Don'ts

### Do:
- **Do** use a dot sticker only to state one of four states: cobalt proposal, green synced, amber changed or missing, vermilion approved.
- **Do** show every AI change first as a ghost: dashed cobalt outline (2.5px, 4px offset) plus a 40px cobalt sticker, until a person accepts.
- **Do** show votes as graphite initial stickers (40px, `graphite-800`).
- **Do** put everything on the board on a white print with the print shadow; tool prints get a source strip with the tool name and a mono file-type tag.
- **Do** keep the shell flat graphite with 8% hairlines; float only menus, toasts and the review sheet.
- **Do** name tools in text and file-type tags (`.fig`, `.ai`, `.tsx`, `.pdf`) and label simulated actions as simulated.
- **Do** keep the "Sample data" tag in the top bar while content is synthetic.
- **Do** keep the tldraw "made with tldraw" / license watermark visible; the demo runs on a free hobby key and the watermark is a licence condition.
- **Do** honour reduced motion: durations go to 0 and the sticking animation is removed.

### Don't:
- **Don't** use cobalt, green, amber or vermilion as decoration, accent, category or brand colour.
- **Don't** let tldraw's blue selection accent through; it reads as a proposal.
- **Don't** set interface text in Gloock, Bricolage Grotesque or Young Serif; they are specimen content only.
- **Do** use small monochrome source logos as identifiers alongside visible names. Generic file, PDF, folder and image icons describe the content type.
- **Don't** use purple gradients, sparkle icons, glowing or glass AI panels, or a high-contrast grid that competes with the work.
- **Don't** hide, cover or restyle the tldraw watermark.
- **Don't** darken the board or lighten the faint levels further: `shell-faint` measures 5.1:1 on graphite-900 and 4.7:1 on graphite-850, `ink-faint` 5.3:1 on white and 4.6:1 inside a direction frame. These are the AA floor for 11–12px text.
