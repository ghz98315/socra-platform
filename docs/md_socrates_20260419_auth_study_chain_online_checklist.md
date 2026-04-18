# Socrates Auth Study Chain Online Checklist

- Date: 2026-04-19
- Scope: auth-hardening regression for `error-book / error-session / study-assets / variants`
- Goal: confirm both `student self` and `parent acting for linked child` work correctly after backend authorization tightening

## Precondition

- Use the deployed Socrates environment that already includes this round of backend changes.
- Prepare 2 accounts:
  - one student account
  - one parent account that is already linked to at least one child student
- Prepare 1 existing error-session record and 1 study-asset record if possible, so both create flow and read/update flow can be checked.

## A. Student Self Flow

### A1. Error Book List

- [ ] Log in as a student.
- [ ] Open `/error-book`.
- [ ] Confirm the list loads normally.
- [ ] Confirm filtering, pagination, and stats still load.
- [ ] Confirm there is no `401 / 403 / Student not found` response in the browser network panel.

### A2. Create Error Session

- [ ] Upload or create a new wrong-question session from the student side.
- [ ] Confirm the session is created successfully.
- [ ] Confirm the first chat messages are saved.
- [ ] Confirm refresh after creation still shows the same session in the wrong-question list.

### A3. Error Session Follow-up Actions

- [ ] Submit difficulty rating.
- [ ] Submit structured diagnosis.
- [ ] Complete one round of guided reflection.
- [ ] Trigger wrap-up preview.
- [ ] Submit wrap-up result.
- [ ] Click submit-to-error-book / finish flow if the page exposes it.
- [ ] Confirm the session status updates normally and the page does not get stuck loading.

### A4. Review Loop Bridge

- [ ] After wrap-up submission, confirm review-loop creation succeeds.
- [ ] Open the generated review session.
- [ ] Confirm the review session page loads without permission error.

### A5. Study Session

- [ ] Start a study session from a study page or workbench page.
- [ ] Leave the page open long enough for at least one heartbeat.
- [ ] End the study session.
- [ ] Confirm duration data and study stats still update.

### A6. Study Asset

- [ ] Open study-asset list or study history.
- [ ] Open one study-asset detail page.
- [ ] Confirm messages, legacy bridge data, and related links still load.
- [ ] Update one study-asset if the UI exposes save/update behavior.
- [ ] Trigger "add to review" from a study-asset and confirm it succeeds.

### A7. Variant Practice

- [ ] Generate variants for one wrong-question session.
- [ ] Confirm generated variants appear in the list.
- [ ] Submit at least one variant answer through the normal submit flow.
- [ ] Confirm practice logs and summary update normally.

## B. Parent Acting For Linked Child

### B1. Wrong Question List Under Child Context

- [ ] Log in as a parent.
- [ ] Switch to a linked child in the parent/student selector flow.
- [ ] Open the child wrong-question view or workbench entry.
- [ ] Confirm wrong-question list loads for the selected child.

### B2. Parent-Assisted Error Session Flow

- [ ] Create a wrong-question session while parent is acting on behalf of the selected child.
- [ ] Confirm session creation succeeds.
- [ ] Confirm diagnosis, difficulty, guided reflection, wrap-up preview, and wrap-up submit all succeed.
- [ ] Confirm review-loop creation still succeeds for the child.

### B3. Parent-Assisted Study Flow

- [ ] Start and end a study session while parent is operating in child context.
- [ ] Open study assets for the selected child.
- [ ] Trigger study-asset review creation.
- [ ] Generate variants for the child and submit one answer.
- [ ] Confirm all requests succeed without cross-student leakage.

## C. Authorization Guard Checks

- [ ] While logged in as Student A, manually revisit a URL belonging to Student B if such a test sample exists.
- [ ] Confirm the API returns rejection instead of leaking data.
- [ ] While logged in as a parent, switch to an unlinked or nonexistent child id through devtools or a crafted request if convenient.
- [ ] Confirm the API rejects the request with `404 / 403 / student_id is required`, and does not expose another child's data.

## D. Network Regression Focus

Check these endpoints during the above flows:

- [ ] `GET /api/error-book`
- [ ] `GET/POST/PATCH /api/error-session`
- [ ] `POST /api/error-session/complete`
- [ ] `GET/POST /api/error-session/diagnose`
- [ ] `GET/POST /api/error-session/guided-reflection`
- [ ] `POST /api/error-session/wrap-up`
- [ ] `GET/POST /api/error-session/difficulty`
- [ ] `GET/POST /api/study/session`
- [ ] `GET/POST/PATCH /api/study/assets`
- [ ] `POST /api/study/assets/review`
- [ ] `GET/POST/PATCH /api/variants`
- [ ] `POST /api/variants/submit`

## Pass Standard

This round is considered closed only if all of the following are true:

- Student self-flow works end to end.
- Parent acting for linked child works end to end.
- Unauthorized cross-student access is rejected.
- No route enters permanent loading because of new auth checks.
- No wrong-question, review, study-asset, or variant data disappears after refresh.

## Current Local Verification

Already verified locally before online regression:

- [x] `pnpm.cmd --filter @socra/socrates build`

Online regression is still required for the flows above.
