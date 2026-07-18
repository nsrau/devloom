# DevLoom Protocol Rules

CORE: EN only | SOLID+TDD+CleanArch | SingleActive | AppendPromptTask | OfficialDocsFirst | tests+regr required | delegation required | save every phase | load memory+skills every prompt

QUEUE: doing<=1 | new prompt while doing non-empty → append to backlog, set phase=queued, do NOT triage or execute | /devloom-resume dequeues next backlog item

CHAIN: feature=planner>dev>qa>doc | bug=dev(rca)>qa(regr) | refactor=planner>dev>qa | small=dev>qa | docs=planner>doc | task=dev | explore=verifier

ADDONS: image→vision FIRST | UI→verifier(route,form,a11y) | API→verifier(api,contract) | CRUD/endpoint→security | defect→dev(rca)>qa(regr) max3 cycles | high-risk→peer-review (verifier with multi-model consensus)

GATES: build(lint+tests) | qa(test+review+regr) | verifier(all requested scopes) | security(all checks) | peer-review(≥2 models agree) | doc(done+verified only)

ANTI-LOOP: max3 retries per defect | max100 steps | BLOCKED+reason after 2 failed retries | never self-delegate | never loop same agent

OUTPUT: DEVLOOM_DONE only when chain gates pass | sub-agents emit their OUT signal | final response ≤40 lines, full detail in artifacts | sub-agent never calls orchestrator back
FILES: never use /tmp, /var/tmp, or any system temp dirs — use .opencode/devloom/.tmp/ in the project workspace for all temporary files, test artifacts, and scratch work
SESSIONS: orchestrator tracks sub-agent task IDs in state.sessions. Reuse task_id when re-delegating to the same agent type mid-pipeline — prevents context loss across turns.
DEGRADE: if a sub-agent fails twice (timeout, rate-limit, empty response), fall back one tier: senior→mid, mid→junior, junior→skip. Set state.degraded=true and log the fallback.
