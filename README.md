# DevRune Starter Catalog

A curated collection of skills, rules, MCP server definitions, and workflows for AI development agents. This is the default catalog used by [DevRune](https://github.com/davidarce/devrune), a package manager for AI agent instructions.

## Structure

```
skills/       Reusable AI agent skills (advisers, automation)
rules/        Technology-specific coding standards and patterns
mcps/         MCP server definitions for tool integrations
workflows/    Multi-phase development workflows
```

## Skills

| Skill | Description |
|-------|-------------|
| `api-first-adviser` | API-first design patterns -- OpenAPI, REST conventions, error models, versioning |
| `arch-flow-explorer` | Interactive HTML playgrounds that visualize backend architecture flows |
| `architect-adviser` | Clean architecture patterns -- hexagonal, DDD, ports and adapters |
| `component-adviser` | React component design -- composition, hooks, state management, performance |
| `frontend-test-adviser` | Frontend testing -- React Testing Library, Vitest/Jest, Cypress e2e |
| `git-commit` | Automated git commits following Conventional Commits with JIRA integration |
| `git-pull-request` | Pull request creation with template selection and platform auto-detection |
| `integration-test-adviser` | Integration test patterns -- adapter testing, external service mocking |
| `unit-test-adviser` | Domain unit test patterns -- test structure, mocking, Given-When-Then |
| `web-accessibility-adviser` | Web accessibility -- WCAG 2.1 AA, ARIA, keyboard navigation, screen readers |

## Rules

| Rule | Scope |
|------|-------|
| `api-standards` | REST API naming, validation, error models, versioning |
| `4-rules-of-simple-design` | Kent Beck's 4 Rules of Simple Design |
| `clean-architecture` | Hexagonal architecture, DDD, ports and adapters |
| `accessibility-standards` | WCAG 2.2 AA, ARIA patterns, keyboard navigation, semantic HTML |
| `frontend-testing` | React Testing Library, Vitest/Jest, Cypress/Playwright e2e |
| `java-spring` | Java Spring Boot conventions -- module structure, DI, testing |
| `microfrontends` | Host/shell mediator pattern, EventBus communication |
| `react` | React and TypeScript coding standards |
| `adapter-it-patterns` | Adapter integration tests with WireMock |
| `java-unit-tests` | Java unit test standards |
| `mother-pattern` | Mother builder pattern, test data construction, BDDMockito |

## MCP Server Definitions

| MCP | Description |
|-----|-------------|
| `atlassian` | Jira and Confluence integration via OAuth |
| `context7` | Up-to-date library documentation and code examples |
| `engram` | Persistent memory across sessions |
| `exa` | Web and code search |
| `playwright` | Browser automation for testing and scraping |
| `ref` | Technical documentation search |

## Workflows

| Workflow | Description |
|----------|-------------|
| `sdd` | Spec-Driven Development -- explore, plan, implement, review |

## Usage

Add this catalog to your `devrune.yaml`:

```yaml
source: github:davidarce/devrune-starter-catalog
```

Then install with DevRune:

```bash
devrune install
```

Skills, rules, MCPs, and workflows from this catalog will be available to your AI development agent.

## License

MIT -- see [LICENSE](LICENSE) for details.
