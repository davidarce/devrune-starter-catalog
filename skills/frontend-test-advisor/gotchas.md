# Gotchas — frontend-test-adviser

Common mistakes Claude makes when writing or reviewing frontend tests. Check these before finalizing your output.

## 1. Using fireEvent instead of userEvent

**Wrong**: `fireEvent.click(button)` or `fireEvent.change(input, { target: { value: 'hello' } })`.
**Right**: `const user = userEvent.setup()` then `await user.click(button)` and `await user.type(input, 'hello')`.
**Why**: Claude frequently reaches for `fireEvent` because it is simpler and synchronous. But `fireEvent` dispatches a single synthetic event — it skips focus, keyboard, and pointer events that `userEvent` simulates. Tests using `fireEvent` miss bugs that only manifest with real interaction sequences.

## 2. Forgetting async queries for dynamically rendered content

**Wrong**: `expect(screen.getByText('Order confirmed')).toBeInTheDocument()` immediately after triggering an async action.
**Right**: `expect(await screen.findByText('Order confirmed')).toBeInTheDocument()` or wrap in `waitFor`.
**Why**: Claude writes synchronous assertions for content that appears after an API call, state update, or animation. The test passes locally due to timing but fails intermittently on CI where execution is slower.

## 3. Asserting on implementation details instead of user-visible behavior

**Wrong**: `expect(setState).toHaveBeenCalledWith({ loading: true })` or `expect(component.state.count).toBe(1)`.
**Right**: `expect(screen.getByRole('progressbar')).toBeInTheDocument()` or `expect(screen.getByText('1 item')).toBeInTheDocument()`.
**Why**: Claude tests what the code does internally rather than what the user sees. Implementation-detail tests break on every refactor (rename state variable, switch from useState to useReducer) without catching real bugs.

## 4. Using getByTestId as the default query strategy

**Wrong**: `screen.getByTestId('submit-button')`, `screen.getByTestId('email-input')` for elements that have accessible roles and labels.
**Right**: `screen.getByRole('button', { name: /submit/i })`, `screen.getByLabelText('Email')`. Use `getByTestId` only when no accessible query is possible.
**Why**: Claude defaults to `data-testid` because it is reliable and never ambiguous. But it bypasses accessibility verification — tests pass even when the element has no accessible name, missing labels, or wrong ARIA roles.

## 5. Not cleaning up mocks between tests

**Wrong**: Setting up `vi.mock()` or `vi.spyOn()` without clearing or restoring between tests, causing test pollution.
**Right**: Add `beforeEach(() => vi.clearAllMocks())` or `afterEach(() => vi.restoreAllMocks())` to ensure each test starts with a clean mock state.
**Why**: Claude sets up mocks at the top of the describe block and forgets cleanup. Mock return values or call counts leak between tests, producing false passes when tests run together but failures when run individually.

## 6. Missing act() wrapper for state updates outside React's control flow

**Wrong**: Directly calling a callback that triggers a state update in a test and getting the "not wrapped in act()" warning — then ignoring it.
**Right**: Wrap state-triggering calls in `act()`, or better yet, use `userEvent` and `waitFor` which handle act-wrapping internally. Never suppress the act() warning — it signals a real timing issue.
**Why**: Claude either ignores the warning or wraps everything in `act()` indiscriminately. The warning means the test may assert before the UI updates, producing flaky tests that check stale DOM state.
