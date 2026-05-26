---
name: route-verification
description: Verify route render and navigation integrity.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
CHECK: render|noBlank|noCrash|noConsoleErr|noNavFail|domVisible
