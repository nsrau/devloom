---
name: vision-analysis
description: Analyze images and return structured, detailed descriptions tailored by image type for downstream agent consumption.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl

DETECT_TYPE:
- ui_screenshot: browser/app UI, windows, buttons, forms, navigation
- wireframe: low-fidelity mockup, boxes, labels, layout sketch
- diagram: flowchart, ERD, sequence, architecture, network, UML
- chart: bar/line/pie/scatter data visualization
- code_screenshot: code editor, terminal output, stack trace, logs
- design_mockup: high-fidelity design, colors, typography, components
- photo: real-world photograph, product, person, environment
- document: text document, form, invoice, specification
- unknown: none of the above

ANALYZE by type:

ui_screenshot:
- app/page name; layout structure (nav/sidebar/main/footer)
- all visible UI elements: labels, inputs, buttons, links, icons, placeholders
- state: loading/error/empty/success indicators; disabled states; active selections
- content: text values, data shown, counts, statuses
- UX issues visible: broken layout, overflow, missing states, a11y problems

wireframe:
- page/screen intent; sections and their purpose
- element inventory: inputs, labels, CTAs, content blocks
- user flow implied; open questions or ambiguities

diagram:
- diagram type and subject
- nodes/entities: name, role, attributes if shown
- relationships: direction, labels, cardinality
- flow or sequence: start>steps>end in order
- constraints or annotations noted

chart:
- chart type; data topic; axes labels + units
- data range, trends, peaks, anomalies
- legend items; what each series represents
- key insight in one sentence

code_screenshot:
- language/runtime if identifiable
- file name / path if visible
- code structure: functions, classes, logic flow
- errors or warnings: exact message, line, type
- relevant context: imports, configs visible

design_mockup:
- component inventory with names and variants
- color palette: primary/secondary/accent hex if readable
- typography: font names, sizes, weights if visible
- spacing and grid patterns
- interactive states shown
- brand/style notes

photo:
- subject and context
- key objects, people, text visible
- environment, lighting, composition notes
- any technical or domain details visible

document:
- document type and purpose
- sections and their content
- key data fields and values
- requirements, rules, or constraints stated

OUTPUT_FORMAT:
```
IMAGE_TYPE: <type>
SUMMARY: <one sentence — what this image shows and its purpose>

DETAILS:
<type-specific structured analysis — complete, no omissions>

FOR_AGENTS:
<actionable insights downstream agents need:
- developer: what to implement/fix based on this image
- planner: requirements or constraints visible
- qa: acceptance criteria derivable from the image
- security: any visible data exposure, auth flows, sensitive inputs
- documenter: what to document about this screen/flow>

OPEN_QUESTIONS:
<anything ambiguous or missing that the requesting agent should clarify>
```

RULES:
- describe what IS visible, not what you assume
- quote exact text seen in the image
- if image is unclear or low-res, state confidence level
- no hallucination of unvisible elements
- output must be self-contained — other agents have no access to the image
