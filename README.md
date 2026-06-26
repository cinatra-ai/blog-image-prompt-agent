# Blog Image Prompt Agent

Generate ready-to-use image prompts for a finished blog draft. Give the agent your draft and it proposes where images belong — cover, inline, and social share — then writes a vivid, image-generator-ready description for each spot, paired with a rationale explaining the placement. The agent produces text descriptions only; it does not generate images.

Install from the Cinatra marketplace. The only mandatory input is a blog draft object (`{ title, excerpt, content }`). Optional inputs: `count` (default 3, capped at 5), `placements` (default `["cover","inline","social"]`), `style` (a visual style hint applied to every prompt), and `brandKeywords` (keywords woven into at least half the prompts). No external credentials are needed; the agent uses the platform LLM bridge.

The agent returns `{ prompts, notes }`. Each entry in `prompts` carries `{ placement, prompt, rationale }`. The `notes` field summarises distribution trade-offs (for example, when `count` exceeds the cap). If `count` is below 1, `prompts` is empty and the issue appears in `notes`.

A context slot (`imagePromptContext`) lets you attach a brand-voice artifact or a blog-post artifact before generation. In interactive runs the platform shows a context-selection UI; in autonomous mode the slot resolves from previously attached artifacts.

For local development, clone the repo and run `node extension-kind-gate.mjs --package-root .` to validate the manifest. No build step is needed. If the output contains fewer prompts than requested, verify the draft object has a non-empty `content` field.

## Works with

- Cinatra blog-post artifacts
- Cinatra brand-voice artifacts
- Any downstream image generator that accepts text prompt strings

## Capabilities

- Read a blog draft and propose image placements for cover, inline, and social use
- Write a vivid, image-generator-ready prompt for each proposed placement
- Pair every prompt with an editorial rationale explaining the placement choice
- Enforce brand voice and visual style via optional keyword and style inputs
- Cap prompt count at five and report distribution trade-offs in plain-language notes
