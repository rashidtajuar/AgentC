# Cloud Projects Implementation Plan

**Goal** — Open a private AgentC project across devices with its cards, edges, and images intact.

**Architecture** — Supabase Auth identifies the owner. Postgres enforces owner access and revision checks. Private storage holds board media. The React canvas runs in the browser and in an iPhone/iPad WKWebView feasibility build. The existing local workspace and sample remain available.

- Create the owner-scoped schema, private media bucket, and a revision-checked save operation. Verify cross-account reads and writes, stale saves, and anonymous access.
- Add account entry, cloud project creation, opening a project from its URL, and importing an existing board and its media. Keep the local original and make repeat imports safe.
- Connect the existing editor to cloud persistence. Serialize saves and recover from failed writes without replacing another device’s work. Keep camera and appearance preferences on the device.
- Run the shared editor in an iPhone and iPad container. Verify card creation, drawing, relationships, image selection, undo, and reopen. Test gestures, Pencil, and large boards on physical hardware before distribution.
- Deploy to a Git-linked preview once the dedicated backend is configured. Verify with two separate real accounts before inviting studios.

The first iOS release requires editing on iPhone and iPad. This feasibility build evaluates reusing the shared canvas in a native container. Studio invitations, multiplayer, real AI, macOS distribution, and App Store release follow this slice. Production Apple builds require a trusted HTTPS origin, signing, privacy and account flows, and confirmed tldraw distribution terms.
