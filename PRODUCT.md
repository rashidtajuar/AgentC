# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript, with the tldraw SDK as the canvas engine (chosen by Rashid). Code lives in a GitHub repo so the demo can be reused in the real product. Tauri is planned for macOS. The first iOS release requires full canvas editing on iPhone and iPad. The SwiftUI validation app runs the shared canvas in WebKit.

License note: tldraw needs a license key in production. A free hobby key (watermarked) covers the prototype; the commercial product will need a paid commercial license.

## Users

Primary: small multidisciplinary design-and-development studios, roughly 3–15 people (designers, developers, creative leads), running several client projects at once, using Figma, GitHub and cloud documents, and constantly switching between inspiration, design, implementation and review. The buyer is the studio owner or creative director; daily users are designers, developers and project leads.

First audience for this demo: studio owners and creative directors seeing it in a short screen-recorded video or a live call, to judge whether they would pay for it.

## Product Purpose

An AI-native infinite canvas where ideas, references, real working files, code and decisions live together and stay connected to their original sources. Teams gather and moodboard, brainstorm with AI, decide on a direction, and turn approved decisions into real work in connected tools.

The clickable demo exists to prove one journey to studios: moodboard → approved direction → linked Figma context → AI-proposed code change → reviewed GitHub pull request. Success for the demo is that studios understand the value quickly and agree to paid pilots.

## Positioning

The canvas is a thinking surface over the tools a studio already uses, not a replacement for them. Every card is a Living Artifact: a live link to a real source (a Figma file, an Illustrator file, a repository file) that knows what it relates to and what AI is allowed to do with it. Arrows can carry meaning (inspired by, developed into, implemented in). AI proposes concrete changes, which people preview and approve before anything touches a real file.

Main competitors: Fabric (most direct), Grein, FigJam, Milanote. The product must not claim competitors lack AI or file features; the difference is cross-tool action tied to a traceable project history.

## Operating Context

Studio desks with large monitors; Figma, code editors and Adobe apps open alongside. Projects move from inspiration through design and development to client handoff. Demo is seen as a 30-second recorded video or during a video call.

## Capabilities and Constraints

Demo scope (confirmed): runs in the browser; the AI is scripted ahead of time but looks and behaves like a real assistant, producing structured canvas changes in the same shape a real model will produce later; external actions (opening Illustrator, creating a pull request) are simulated in the demo.

Real product (planned, not in demo): live AI model, Figma and GitHub integrations via MCP and APIs, macOS desktop app for opening local files, real-time multiplayer.

Working name: "Connected Canvas" (not final).

## Evidence on Hand

No real customers, testimonials, metrics or pricing exist yet. Demo content (the sample project, files, people, comments) is synthetic and must be labeled as sample data where it could be mistaken for real.

## Product Principles

1. Canvas first: drawing, moodboarding and arranging must feel effortless without AI.
2. Connect, don't duplicate: original files stay the source of truth.
3. AI participates in the work, not just the conversation.
4. People stay in control: every consequential change is previewed, approved and recorded.
5. Ideas, decisions and deliverables stay connected.
