# Implementation Plan: [Short Description]

**Feature ID**: [change_name]
**Status**: 🔄 Discovery Phase
**Created**: [creation_date]
**Goal**: [short_goal_description]

---

## 1. Overview
[PENDING]

## 2. Architecture Analysis

### Data Model / Type Definitions

<!--
Document new types, modified types, and their relationships.
For each type: name, fields with types, purpose, and which layer it belongs to.
Use code blocks in the project's language for type signatures.
-->

[PENDING — fill with actual type definitions]

### Data Flow

<!--
Show how data moves through the system for the key operations this feature introduces.
Use ASCII diagrams, numbered step lists, or both.
-->

[PENDING — fill with data flow for key operations]

### Contract Specifications

<!--
MANDATORY for any plan that introduces or modifies types, interfaces, or data schemas.
List every new or changed contract the implementer needs to know about:
- New interfaces/ports with method signatures
- Modified function signatures (before → after)
- New data schemas (request/response DTOs, database entities, event payloads)
- Configuration shapes (YAML keys, env vars, JSON structures)

Use code blocks with exact signatures. The implementer will copy these directly.
-->

[PENDING — fill with contract specifications, or "N/A — no new contracts" if purely behavioral]

### Before/After Analysis

<!--
MANDATORY for any task that MODIFIES existing code/config (as opposed to creating new files).
For each modified component, show:
- **Before**: Current state (relevant code snippet, config block, or structure)
- **After**: Proposed state with changes highlighted
- **Why**: Rationale for the change

This prevents the implementer from having to reverse-engineer the current state.
-->

[PENDING — fill with before/after for modified components, or "N/A — all new files" if greenfield]

## Team Selection

<!--
Adviser skills identified during planning. These are NOT invoked by sdd-plan directly.
If guidance is needed, sdd-plan returns a guidance_requested envelope listing these skills.
The orchestrator then launches each adviser, collects guidance, and re-enters sdd-plan
with the recommendations. See SKILL.md steps 5, 7, and 8 for the full flow.
-->

| Skill | Reason for Selection |
|-------|---------------------|
| _No skills selected yet_ | |

## Advice Received

<!--
Adviser recommendations integrated into the plan. This section is populated during
Guidance Integration re-entry (step 8) — after the orchestrator collects adviser
outputs and re-launches sdd-plan with a GUIDANCE block.
For each adviser: document what was integrated and what was skipped (with rationale).
-->

_No advice received yet. Advisers will be consulted by the orchestrator if guidance is requested._

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

TASK DETAIL BLOCKS (MANDATORY for non-trivial tasks):
After each task line (or group of related tasks), include a Detail Block:

**Details for TXXX**: [description with exact signatures, types, or schema]

For creation tasks: include type/function signatures the implementer should create
For modification tasks: include before/after snippets showing what changes
For configuration tasks: include the exact config keys/values to add or change

Trivial tasks (renaming, import changes, config toggles) may omit the Detail Block.
When in doubt, include it — too much detail is better than too little.

Example:
- [ ] T004 [US1] Create OrderStatus value object — src/domain/OrderStatus.java

    **Details for T004**: Create an enum-based value object:
    ```java
    public enum OrderStatus {
        PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED;
        public boolean canTransitionTo(OrderStatus target) { ... }
    }
    ```
    Must implement: `canTransitionTo()` with valid transition rules (PENDING→CONFIRMED→SHIPPED→DELIVERED, any→CANCELLED).

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

**Checkpoint**: Foundation ready
- [ ] Project builds without errors (`mvn compile` / `npm run build` / `go build`)
- [ ] Database migrations run successfully
- [ ] Linting passes with zero warnings

---

## Phase 2: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

- [ ] T004 [US1] Create domain entity — src/models/Entity.java

**Details for T004**: Create `Entity` record with fields:
- `id: UUID` (generated, not user-provided)
- `name: String` (non-null, max 255 chars)
- `status: EntityStatus` (enum: ACTIVE, INACTIVE, ARCHIVED)
- `createdAt: Instant` (set on creation, immutable)
  Implement `validate()` that enforces name length and non-null status.

- [ ] T005 [US1] Implement service layer — src/services/EntityService.java

**Details for T005**: Create `EntityService` with constructor-injected `EntityRepository` port.
Methods:
- `create(CreateEntityCommand) → Entity` — validates, persists, returns created entity
- `findById(UUID) → Optional<Entity>` — delegates to repository
  Throws `EntityValidationException` on invalid input (name blank or > 255 chars).

- [ ] T006 [US1] Create REST endpoint — src/controllers/EntityController.java

**Details for T006**: Implements generated `EntityApi` interface from OpenAPI spec.
- `POST /api/v1/entities` → `create()` → returns 201 with `EntityResponse` body
- `GET /api/v1/entities/{id}` → `findById()` → returns 200 or 404
  Request/response mapping via MapStruct `EntityMapper`.

- [ ] T007 [US1] Add integration test — tests/integration/EntityIT.java

**Details for T007**: @AdapterIT test for the REST adapter. Scenarios:
- `shouldCreateEntityWhenValidInput` — POST with valid body, assert 201 + response fields
- `shouldReturn400WhenNameBlank` — POST with blank name, assert 400 error model
- `shouldReturn404WhenEntityNotFound` — GET with random UUID, assert 404

**Checkpoint**: User Story 1 independently functional
- [ ] Entity can be created via POST and retrieved via GET
- [ ] Validation rejects blank names (400 response)
- [ ] Non-existent entities return 404
- [ ] All 3 integration test scenarios pass

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