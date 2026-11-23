## Scope

The Connected Canvas clickable demo: the single-page canvas workspace (shell + infinite canvas + sources rail + AI panel + approval sheets). Visitor mode: Operate. Desktop web first (1280–1920 wide); narrow screens get a usable but reduced layout.

## Audience and job

Studio owners and creative directors watching a 30-second recording or a live call, and the founder driving the demo. Job: follow one journey end to end — gather → AI organizes into directions → team votes → approve a direction → AI proposes Figma-token + code change → approve → pull request appears linked on the wall. All content is synthetic sample data, labeled as such.

## Constraints

tldraw SDK canvas (React + TypeScript). Scripted AI producing structured canvas operations. External actions (open in Illustrator, create PR) are simulated. Open-source fonts only.

## Direction contract

THESIS: The canvas is the studio's crit wall: work pinned up as prints, decisions made with dot stickers. It refuses the category default of a grey dot-grid board with a purple sparkle AI panel.

OWN-WORLD: Graphite felt shell (top bar, rails) around a pale cool-grey pinboard. Artifacts are white prints with a paper shadow and a thin source strip naming their tool. Human notes are marker on sticky stock (tldraw's hand font). Dot-sticker primaries are the only saturated colour and always mean state: cobalt = AI proposal waiting, green = linked and in sync, amber = source changed or missing, vermilion = approved.

STORY: A studio lead sees scattered references and real files, lets AI sort them into directions, votes, approves one, and watches that approval become a reviewed pull request linked back to the wall.

FIRST VIEWPORT: Graphite top bar (project name, sample-data tag, collaborators, "Review changes" count); left Sources rail grouped by tool; centre canvas with clustered references and file prints; right AI panel holding one pending cobalt proposal with Preview / Accept; drawing toolbar bottom-centre. Primary action: the proposal's Accept.

FORM: Crit wall, position 4 of 7 on the ordered list, seed:56c933d4be564ed4. Signature interaction: sticking a dot (press-and-settle motion); AI proposals render as cobalt-dotted ghost prints until accepted.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
