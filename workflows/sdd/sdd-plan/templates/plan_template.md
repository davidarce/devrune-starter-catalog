# Implementation Plan: [Short Description]

**Feature ID**: [change_name]
**Status**: 🔄 Discovery Phase
**Created**: [creation_date]
**Goal**: [short_goal_description]

---

## 1. Overview
[PENDING]

## 2. Architecture Analysis
[PENDING]

## Team Selection

<!--
Skills selected for advice during planning phase.
-->

| Skill | Reason for Selection |
|-------|---------------------|
| _No skills selected yet_ | |

## Advice Received

<!--
Document key recommendations from each skill consulted.
This section is populated during the Advice phase (step 6).
-->

_No advice received yet. Skills will be invoked after team selection._

## 3. Implementation Tasks

<!--
============================================================================
TASK FORMAT SPECIFICATION (MANDATORY — machine-parsed by sdd-implement)

Pattern: - [STATUS] TXXX [TAGS]? Description — file_path

Components:
  STATUS → space character = incomplete, X (uppercase) = complete
  TXXX → T + 3-digit zero-padded number (T001, T002, ... T999)
  [TAGS] → optional, user story tag like [US1], [US2]
  Description → what to do (imperative verb: Create, Add, Update, Implement...)
  file_path → target file path after em-dash (—)

Valid examples:
  - [ ] T001 Create User entity — src/models/User.java
  - [ ] T002 Add validation logic — src/services/ValidationService.java
  - [ ] T003 [US1] Create endpoint — src/controllers/UserController.java
  - [X] T004 Setup project structure — build.gradle

Invalid (WILL BREAK sdd-implement parsing and session resumption):
  - [ ] Create User entity ← missing TXXX id
  - [x] T001 Create entity ← lowercase x (must be uppercase X)
  - [ ] T1 Create entity ← T1 not T001 (must be 3 digits)
  - [ ] T001 Create entity [x] ← trailing [x] (status only at start)
  - [ ] TASK-001 Create entity ← wrong id format (must be TXXX)
  - [ ] T001 Create User entity ← missing file path after em-dash
  - [ ] T002 [P] Add validation ← using [P] markers (parallelism is defined in Batch Assignment Table only)

WHY THIS MATTERS:
  sdd-implement reads the Batch Assignment Table (see below) to determine
  execution order and parallelism, and tracks progress via [ ] → [X]
  transitions. Broken format = broken implementation tracking and session
  resumption.

IMPORTANT: The phases below are SAMPLE structure only.
- Replace with actual phases and tasks for your feature
- Tasks MUST be organized by user story for independent delivery
- Each task MUST include the target file path after an em-dash (—)
- IDs must be sequential across ALL phases (T001, T002, ... not restarting per phase)
- Parallelism is defined ONLY in the Batch Assignment Table — never in task lines
============================================================================
-->

## Phase 1: Setup & Foundational

**Purpose**: Project initialization and core infrastructure

- [ ] T001 Create project structure per implementation plan — project_root/
- [ ] T002 Setup database schema and migrations — src/db/migrations/
- [ ] T003 Configure linting and formatting tools — .eslintrc.js

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 2: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

- [ ] T004 [US1] Create domain entity — src/models/Entity.java
- [ ] T005 [US1] Implement service layer — src/services/EntityService.java
- [ ] T006 [US1] Create REST endpoint — src/controllers/EntityController.java
- [ ] T007 [US1] Add integration test — tests/integration/EntityIT.java

**Checkpoint**: User Story 1 independently functional

---

[Add more user story phases as needed, following the same pattern. Keep IDs sequential (T008, T009, ...) across all phases.]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

_Continue sequential IDs from previous phases (e.g., if last task was T012, start here with T013)._

- [ ] T0__ Update documentation — docs/README.md
- [ ] T0__ Run full test suite validation — tests/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Foundational (Phase 1)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 2+)**: All depend on Phase 1 completion
    - User stories can proceed in parallel (if no cross-story dependencies)
    - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Tasks within the same batch execute sequentially (same file)
- Parallelism between batches is defined in the Batch Assignment Table below

### Batch Assignments for Sub-Agents

<!--
MANDATORY — this table is the SINGLE source of truth for parallelism and execution order.
sdd-implement reads this table to decide how to execute tasks.
Rules:
  - Group by target file: all tasks on the same file → same batch (sequential within)
  - Batches on different files with no cross-dependencies → Parallel=Yes
  - The table documents order even when all batches are sequential
  - DERIVE this table from the tasks above — scan file paths and group automatically
-->

| Batch | Tasks | File | Parallel | Depends on |
|-------|-------|------|----------|------------|
| A | T001-T003 | project_root/, src/db/migrations/, .eslintrc.js | No | — |
| B | T004-T007 | src/models/, src/services/, src/controllers/, tests/ | No | A |
| N | T0__-T0__ | docs/, tests/ | No | B |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup & Foundational
2. Complete Phase 2: User Story 1 (MVP)
3. **STOP and VALIDATE**: Test independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup & Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story N → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## 4. Clarifications

<!--
This section records clarifications obtained via AskUserQuestion tool during planning.
Format: - **[Category]**: Q: <question> → A: <answer>
Categories: Architecture, Data Model, Integration, Security, Performance, Edge Cases, User Scenarios
-->

### Session [YYYY-MM-DD]

_No clarifications recorded yet. Use AskUserQuestion tool to gather requirements._

## 5. Risks & Considerations

[PENDING]

---

## Notes

- Parallelism is defined ONLY in the Batch Assignment Table — never inline in task lines
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence