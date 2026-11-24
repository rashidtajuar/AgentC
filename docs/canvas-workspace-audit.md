# Canvas workspace audit

The audit covered the project entry, saved canvas, and sample workflow. The aim was to make relationships easier to author and reveal while preserving the established Crit Wall design.

| Area | Finding | Change |
| --- | --- | --- |
| Navigation | Sources became unreachable at narrower widths. The tools panel occupied a fixed portion of small screens. | Make both panels independently dismissible on desktop. Give narrow screens a lower panel dock with both toggles available. Add a focus mode that restores the previous panel layout. |
| Appearance | A fixed board color provided no alternative for working with pale images. The established tokens did not describe the workspace's separate views. | Add five light background presets and a subdued optional dot pattern. Document the relationship view and source icon rules in the design system. |
| Accessibility | The original source rail assumed every stored link was valid. The initial mobile appearance popup could overflow the screen. | Treat invalid stored URLs as unavailable links. Keep the appearance controls in the viewport. Use named controls, pressed/expanded states, Escape dismissal, and live status for link mutations. |
| Persistence | Every canvas mutation re-read the board for its Sources list, including selections of unrelated items and drag position changes. Preview animation also competed with the read-only review state. | Subscribe the list to source content and membership changes. Keep per-project appearance separate from document writes. Position preview cards before locking edits. |
| Code structure | The project entry rendered the full editor bundle and mixed storage, forms, layout, and canvas operations in one component. | Defer the editor and the sample until needed. Separate project entry, panels, toolbar, document state, and view state. |
| Initial download | The original home page loaded 658.56 kB gzip of JavaScript in its entry bundle. | The home page now loads about 74 kB gzip of JavaScript. The canvas SDK still accounts for most editor-route JavaScript and is loaded on demand. |

The sample stays on its own route and continues to use the original document and scripted workflow. Sources in a saved board are links. Browser storage remains single-device and has a quota, particularly for embedded image data. The current tldraw evaluation license must be replaced before it expires. The audit did not include a formal assistive technology conformance evaluation or field performance measurements.


## Mobile and discovery follow-up

| Area | Finding | Change |
| --- | --- | --- |
| Canvas space | The scripted sample and saved workspace opened with secondary panels taking up part of the touch viewport. | Start both canvases with panels closed on compact and touch layouts. Expose one resizable dock at a time. |
| Finding content | The Sources list could only locate source cards. | Add an ordered, searchable Layers list for all current-page elements. Selecting a layer brings it into view; edits to lock state are undoable. |
| Hierarchy and accessibility | Small panel buttons and unlabeled icon clusters made controls harder to discover on touch. | Group the three workspace tools and add short captions, 44px touch targets, named panel controls, and focus recovery for the optional guide. |
| Feedback | Cloud queries showed plain text and a false empty state while fetching. | Add shared skeletons for editor and account startup, and static list placeholders for cloud projects. |
| Assistant | The saved workspace mixed file entry and a layout proposal in the same scrolling panel. | Separate Add and Assistant, explain the local suggestion rule, and exclude locked sources from layout proposals. |
| Performance | A flat element list can rerender for every canvas movement. | Subscribe only when Layers is open and reuse equal layer-list entries while positions change. Keep the tldraw editor separate from the initial project route. |

The hosted preview verifies owner isolation and revision guards. Public sign-up is disabled for the preview database. A live model and external tool execution stay in the product roadmap. The existing large editor chunk remains a release performance item.
