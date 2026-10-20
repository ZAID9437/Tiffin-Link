# MASTER IMPLEMENTATION PROMPT — TIFFINLINK ERROR PAGES, ACCOUNT STATES, EMPTY STATES, AND RECOVERY FLOWS

## 1. Your Role and Objective

Act as a senior React, Node.js, Express, MongoDB, CSS, accessibility, and product-engineering specialist. Implement complete error handling, status pages, account-state pages, checkout results, order/delivery exceptions, empty states, loading states, and recovery flows in my existing TiffinLink application.

TiffinLink is a food marketplace with four primary panels:

1. Customer
2. Provider / Home Chef / Kitchen
3. Delivery Partner / Driver
4. Administrator

The application uses React on the frontend, Node.js with Express and `server.js` on the backend, and MongoDB. Preserve the current architecture and integrate with the code already present.

**The most important design requirement is to reuse the exact visual theme of the existing TiffinLink landing page.** The landing page is the source of truth for all colors, fonts, typography, visual details, and UI patterns. Do not create a new theme for error pages.

Do not merely generate designs or static screens. Implement real routing, real API error handling, permissions, data-driven status states, retry behavior, and tests.

---

## 2. CRITICAL DESIGN REQUIREMENT — MATCH THE EXISTING LANDING PAGE EXACTLY

Before changing any file, inspect the actual TiffinLink landing-page source code and its assets. Do not infer the theme only from a screenshot if the real source code is available.

### 2.1 Inspect these items first

Identify and document the existing:

- Font families and font-loading method.
- Heading and body typography.
- Font sizes, weights, line heights, and letter spacing.
- Brand colors, background colors, text colors, muted colors, and border colors.
- CSS variables/design tokens.
- Global CSS, CSS modules, Tailwind configuration, or other styling system already in use.
- Button styles and variants.
- Link styles.
- Form control styles.
- Card and panel styles.
- Borders, radii, shadows, separators, and spacing conventions.
- Icons and icon library.
- Illustration and image treatment.
- Navigation and footer components.
- Responsive breakpoints and mobile layout behavior.
- Existing animation and reduced-motion behavior.
- Reusable UI components and their locations.

Search the repository for the landing page, imported stylesheets, font files or font imports, `:root` variables, Tailwind theme configuration, design tokens, shared components, and relevant assets.

### 2.2 Reuse the existing theme — do not invent one

- Reuse the exact existing font families and typography hierarchy.
- Reuse existing colors and CSS variables/design tokens.
- Reuse the existing button, card, input, link, and layout components wherever practical.
- Reuse the existing icons and illustration style.
- Match the landing page's treatment of whitespace, borders, backgrounds, shadows, and corner radii.
- Keep all error and status pages visually consistent with the existing customer landing page and other established pages.
- Do not introduce a new palette, new font family, random gradients, or a separate styling framework merely for the error pages.
- Do not arbitrarily introduce colors such as red, blue, purple, or green as new brand colors. If the existing theme already defines semantic error/success/warning colors, use those tokens. Otherwise use the existing theme's supported visual language and accessible text/icon/status labels without inventing a new palette.
- Do not replace the landing page's fonts or alter its appearance while extracting shared styles.
- Do not redesign or rewrite the landing page as part of this task.

### 2.3 If the theme is not centralized

If the landing page uses inline or scattered styles instead of shared tokens:

1. Identify its actual computed styles, source CSS, and font imports.
2. Extract reusable design tokens into the project's existing global theme/CSS system.
3. Ensure the landing page looks the same after extraction.
4. Use those same tokens for the new pages and components.
5. Avoid duplicated, conflicting definitions.

Example token names may include `--font-heading`, `--font-body`, `--color-background`, `--color-text`, `--color-muted`, `--color-border`, `--color-surface`, `--color-primary`, `--color-error`, `--color-warning`, `--color-success`, and spacing/radius tokens. These are only naming examples; prefer the existing naming convention and values rather than blindly adding these names.

### 2.4 Accessibility and responsive behavior

- Match the landing page at desktop, tablet, and mobile sizes.
- Keep headings, buttons, forms, errors, and links readable and keyboard accessible.
- Use semantic HTML and visible focus states consistent with the existing theme.
- Provide accessible names and appropriate ARIA attributes where needed.
- Do not communicate status by color alone; include text and/or icons.
- Respect the application's existing `prefers-reduced-motion` handling.
- Ensure layouts do not overflow on narrow screens.

---

## 3. Mandatory Implementation Rules

### 3.1 Inspect the existing application first

Before implementation:

1. Inspect the repository structure, `package.json`, React routes, layouts, global styles, existing landing page, and shared components.
2. Inspect Express setup, `server.js`, API route registration, authentication, error middleware, and current error response shape.
3. Inspect MongoDB models and the existing customer, provider, driver, and admin workflows.
4. Identify features already present and reuse them.
5. Provide a short plan and list the files likely to change.
6. Then implement the work; do not stop after providing a plan.

Do not replace the project's stack, router, styling system, authentication solution, or UI library without a compelling technical reason. Do not remove working functionality.

### 3.2 No fake data or frontend-only behavior

- Do not hardcode orders, users, meal requests, providers, drivers, payments, refunds, or account states.
- Dynamic information must come from Express APIs and MongoDB.
- Do not make a button appear to work by changing React state only when a backend operation is required.
- Do not create fake payment success, fake delivery status, or fake verification status.
- Static explanatory copy, icons, visual layouts, and reusable presentation defaults are allowed.
- If no record exists, show a truthful empty state rather than invented records.

### 3.3 Correct separation of responsibilities

- React handles page rendering, client interaction, form feedback, and presentation.
- Express authenticates, authorizes, validates requests, applies business rules, and returns the proper status code and safe error body.
- MongoDB remains the source of truth for persistent application data.
- Socket.IO may be used for live updates, but it must not replace the database as the source of truth.
- Never expose stack traces, database credentials, secrets, internal fraud evidence, or sensitive personal data to the browser.

---

## 4. Global Error Pages

Implement reusable pages or route-level views for these HTTP/application conditions. Reuse a shared error-page component when appropriate rather than building unrelated designs for every status.

### 4.1 404 — Page Not Found

Show when a user opens a nonexistent route or a resource does not exist/is not accessible under the application's disclosure policy.

Suggested content:

- Heading: `Oops! This page couldn't be found.`
- Brief explanation that the requested page may have moved or the link may be incorrect.
- Actions: `Go Home`, `Go Back`, and, where appropriate, `Contact Support`.

Requirements:

- Add a React Router catch-all route.
- Preserve the landing-page theme.
- Avoid an endless redirect loop when the previous page is also invalid.
- Do not confuse the frontend route-level 404 with API resource-not-found responses.

### 4.2 401 — Login Required / Session Expired

Show or handle when authentication is missing, invalid, or expired.

Suggested content:

`Your session has expired. Please sign in again.`

Actions:

- `Log In`
- Return to the originally requested page after successful login, if safe.

Requirements:

- Implement a centralized API client/interceptor for 401 responses.
- Avoid repeated redirects and redirect loops.
- Clear invalid client-side authentication state safely.
- Do not lose user-entered data unnecessarily when a session expires mid-form.
- Preserve and restore the intended route only after validating it.

### 4.3 403 — Access Denied

Suggested content:

`You don't have permission to access this page.`

Actions:

- `Return to Dashboard`
- `Go Back`
- `Contact Support`, where appropriate.

Requirements:

- Apply role-aware navigation for customer, provider, delivery partner, and admin.
- Enforce access at the Express backend as well as in React.
- Verify record ownership on order, request, offer, delivery, invoice, review, and organization endpoints.
- Do not leak information about private resources in error messages.

### 4.4 500 — Internal Server Error

Suggested content:

`Something went wrong on our side.`

Actions:

- `Try Again`
- `Go to Dashboard`
- `Contact Support`, where appropriate.

Requirements:

- Add centralized Express error middleware.
- Return a safe error response and a request/correlation ID where possible.
- Log technical details securely on the server.
- Never send stack traces or secrets to the frontend.
- Add a React Error Boundary for unexpected rendering errors. Explain that this boundary handles React rendering failures; it does not replace server/API error handling.

### 4.5 503 — Maintenance / Service Unavailable

Suggested content:

`TiffinLink is temporarily unavailable. Please try again shortly.`

Actions:

- `Retry`
- `Check Status`, only if an actual status page exists.

Requirements:

- Use an actual backend/service state where available.
- Do not falsely say the entire platform is under maintenance when only one integration is unavailable.
- Show specific inline states when a service such as maps or notifications is unavailable but the rest of the application works.

### 4.6 Offline / Connection Lost

Usually implement as a global reusable banner or overlay rather than a separate URL.

Suggested content:

`You're offline. Some features may not be available.`

Actions:

- `Retry Connection`

Requirements:

- Detect browser connectivity changes but also handle API timeouts; `navigator.onLine` alone does not prove that the backend is reachable.
- Reconnect Socket.IO safely.
- Refetch authoritative data after reconnecting.
- Never assume a write failed or succeeded solely from a client timeout. Allow the client to retrieve the operation's current server state and prevent duplicate submissions.

### 4.7 429 — Too Many Requests

Show a clear rate-limit message and a retry time when the server provides one. Respect `Retry-After` where present. Do not repeatedly retry a rate-limited action in a tight loop.

### 4.8 Validation and conflict responses

- `400` / `422`: show field-level validation messages where possible.
- `409`: handle stale data, duplicate submissions, a request already selected, or a delivery already assigned.
- `502` / `504`: show an appropriate temporary upstream-service state where applicable.

Do not send users to a full-page error route for ordinary form validation.

---

## 5. Authentication and Account-State Pages

Implement or reuse pages/components for the following:

1. Email / phone verification.
2. Forgot password.
3. Reset password with valid, expired, and invalid-token states.
4. Provider application pending approval.
5. Delivery partner application pending approval.
6. Application rejected, with safe reason and next steps when available.
7. Documents require correction/update.
8. Account suspended/restricted.
9. Onboarding incomplete.
10. Account/profile not found or unavailable.

Requirements:

- Fetch real verification/application status from the backend.
- Do not hardcode whether a provider or driver is approved.
- Show allowed next actions, such as resubmitting documents or contacting support.
- Do not reveal internal moderation notes or sensitive review information.
- Protect all approval-only actions on the server.
- Share components where practical so these states remain visually consistent.

---

## 6. Customer-Specific Empty, Error, and Status States

Implement these in the relevant customer page rather than making every one a separate route.

- No providers found for the selected location or criteria.
- No offers received yet.
- Meal request expired.
- Meal request cancelled.
- No search results.
- Provider currently unavailable.
- Menu item unavailable.
- Address outside the service area.
- Cart needs updating because item availability or trusted prices changed.
- Delivery option unavailable.

For every state:

1. Explain what happened in plain language.
2. Show only real backend information.
3. Provide a useful action, such as adjusting the request, changing the address, selecting another provider, refreshing offers, or returning to discovery.
4. Preserve appropriate user input when retrying.
5. Do not promise a provider, price, or ETA that has not been confirmed.

---

## 7. Payment and Checkout Result States

Create a consistent result view or page for each of the following:

### Payment Successful

Show the amount, transaction reference, and order details only after verifying the payment state through the backend.

### Payment Failed

Explain that payment failed, provide a safe retry path, and prevent duplicate charges.

### Payment Pending

Explain that confirmation has not yet arrived. Refresh/check the backend status and allow the view to update when a verified result arrives.

### Order Confirmation Pending

Handle cases where payment and order creation have not yet fully reconciled. Look up the operation/order status before asking the customer to retry.

### Refund Status

Show real states such as requested, processing, completed, or failed, as applicable.

Rules:

- A frontend redirect is not proof of payment success.
- Verify gateway responses/webhooks on the backend.
- Use idempotency keys or equivalent safeguards where supported.
- Do not initiate duplicate payment, refund, commission, or payout operations on retries.
- Keep payment status separate from order status.
- Do not show a successful order screen until the backend confirms the actual order state.

---

## 8. Order and Delivery Exception States

Implement these as status panels inside Order Details, Live Tracking, Delivery Details, or relevant dashboard pages where practical:

- Order not found or inaccessible.
- Order cancelled.
- Waiting for provider confirmation.
- Waiting for delivery partner assignment.
- No eligible driver currently available.
- Delivery delayed.
- Pickup problem.
- Customer unavailable at drop-off.
- Delivery failed.
- Refund/dispute pending.
- Provider/driver rating submitted.

Requirements:

- Read current state from the backend.
- Use the existing order/delivery state machine; do not create conflicting state models.
- Display ETA only when it comes from a valid routing estimate, and show when it was last updated if useful.
- Provide authorized next steps, issue reporting, support access, or refresh/retry actions.
- Do not let the frontend mark an order as delivered, paid, or refunded without backend validation.
- Handle reassignment and cancellation without leaving stale information on the screen.

---

## 9. Failure States for TiffinLink's Nine Advanced Features

Implement appropriate contextual error/fallback states for each feature.

### AI Smart Provider Matching

If matching fails, show that matching is temporarily unavailable and offer a safe retry. Do not fabricate matched providers. If a real rule-based fallback exists, label it accurately.

### Multi-Provider Auction

Handle expired offers, withdrawn offers, rejected offers, closed requests, and cases where another offer has already been selected. Refresh the authoritative request/offer state after a conflict.

### Smart Route Optimization

If the routing provider is unavailable, state that route/ETA data is temporarily unavailable. Do not display made-up routes, road distances, or traffic estimates.

### Emergency Meal Requests

If no provider/driver can meet the requested deadline, explain that the deadline cannot currently be confirmed and offer a feasible alternative where available.

### Smart Queues

If a queue update fails, show a retry message and refetch the real queue from the API. Handle stale priority and conflicting updates.

### Fraud Detection

If an operation requires review, show a neutral user-facing message. Keep internal risk scores, detection rules, and evidence restricted to authorized personnel.

### Corporate Meal Ordering

Handle budget exceeded, approval required, organization access denied, and organization unavailable states.

### Hostel / PG Bulk Ordering

Handle missed cutoff times, duplicate/invalid participant selections, unsupported quantities, group-order finalization conflicts, and unavailable providers.

### Hyperlocal Broadcasting

Handle no eligible recipients, expired broadcast, failed notification delivery, and retries. Do not claim recipients were notified unless that outcome is supported by backend delivery records.

Keep these failures within the corresponding feature context unless a true page-level error is appropriate.

---

## 10. Reusable Empty States for Every Panel

Create one reusable, theme-consistent empty-state component that accepts suitable props such as a title, description, optional icon/illustration, and an allowed action. Follow existing project conventions rather than forcing this exact interface if another pattern already exists.

Provide appropriate empty states for:

- No orders.
- No meal requests.
- No offers.
- No active deliveries.
- No notifications.
- No messages.
- No saved addresses.
- No menu items.
- No customers.
- No reviews.
- No earnings history.
- No coupons.
- No support tickets.
- No fraud alerts.
- No corporate orders.
- No group orders.
- No broadcasts.
- No matching providers.

Examples of appropriate actions:

- Customer: `Explore Food`, `Create Meal Request`, or `Add Address`.
- Provider: `Complete Menu`, `Review Business Profile`, or `View Requests`.
- Delivery partner: `Go Online`, `View Available Deliveries`, or `Update Documents`.
- Admin: describe that no records match the current filters and provide `Clear Filters` when appropriate.

Empty means the API succeeded but returned no matching records. It must not be used to hide API failures.

---

## 11. Reusable Loading, Form, Connection, and Integration States

Implement reusable components/states for:

- Page loading and skeletons.
- Button-level loading.
- API request failed / retry.
- Form field validation errors.
- File/document upload failure.
- Image loading failure.
- Location permission denied.
- GPS location unavailable or stale.
- Map/routing service unavailable.
- Socket.IO connection interrupted/reconnected.
- Duplicate submission warning.
- Session expired during a form submission.
- Stale data or conflicting updates.
- External notification provider unavailable.

Use the current landing page's typography and visual components throughout.

For operations that may be retried, use idempotent backend operations where required. For a client timeout, retrieve authoritative status instead of assuming that the operation failed.

---

## 12. Required React Implementation

Use the existing router and component structure.

Implement or extend:

- A catch-all 404 route.
- A shared themed error page.
- A reusable empty state.
- A reusable inline/API error state.
- A React Error Boundary.
- A centralized API client/error handler.
- Role-aware redirects.
- Session expiration handling.
- Network/reconnection feedback.
- Reusable status badges/labels using the existing theme tokens.
- Payment, order, and delivery status views.
- Contextual feature-failure states.

Requirements:

- Avoid duplicated error-page implementations.
- Do not break direct navigation to valid routes or refreshes of nested routes.
- Preserve intended navigation after login when secure and valid.
- Show errors near the action/field that caused them when that is clearer than a page-wide error.
- Never hide a backend error and show fabricated successful data.
- Ensure every visible button has a real, appropriate action.
- Use the existing icon package rather than adding another library unnecessarily.
- Keep screen-reader announcements appropriate for critical status changes.

---

## 13. Required Express/Backend Implementation

Inspect and reuse the existing server middleware. Implement or extend:

- Consistent error response format.
- Centralized Express error middleware.
- Correct HTTP status mapping.
- Request/correlation IDs where practical.
- Safe server-side logging.
- Authentication and role authorization.
- Resource ownership checks.
- Input validation.
- Safe retry/idempotency handling for sensitive operations.
- Proper API 404 handling for unknown endpoints.
- Accurate response status for missing, forbidden, invalid, conflicting, rate-limited, and unavailable operations.

Do not return HTTP 200 for failed operations. Do not expose stack traces, secrets, database internals, or private risk evidence.

Keep API error shapes consistent so the frontend can reliably map them to the appropriate inline, modal, notification, or page-level response.

---

## 14. Theme Consistency Acceptance Criteria

The implementation must not be accepted until the following are satisfied:

1. The original landing page remains visually unchanged.
2. Error and status pages reuse the landing page's actual fonts.
3. Existing brand colors and design tokens are reused instead of replaced.
4. Buttons, links, cards, fields, borders, and spacing follow the established design system.
5. No arbitrary second theme or unrelated palette has been introduced.
6. New shared design tokens, if required, preserve existing landing-page appearance.
7. Desktop, tablet, and mobile layouts are checked.
8. Focus states, keyboard navigation, contrast, and status text remain accessible.
9. New states look like a natural part of TiffinLink rather than a separate template.
10. Existing working pages and interactions remain functional.

If the landing page uses a distinctive editorial, minimal, serif/sans-serif, or other typography style, preserve the actual typography found in the source. Do not assume a font from the brand name or a screenshot.

---

## 15. Testing Requirements

Create or update tests for the frontend and backend using the project's current testing tools where possible.

Verify:

- Invalid React URL renders the themed 404 page.
- Invalid API endpoint returns a proper API 404 response.
- A logged-out user is handled correctly.
- A user from one role cannot access another role's protected pages or APIs.
- A user cannot read another user's private order or delivery.
- Backend errors display a safe, helpful message.
- React rendering errors are contained by the Error Boundary.
- Network loss and reconnection do not fabricate operation success.
- Payment success/failure/pending views reflect backend verification.
- Duplicate checkout or confirmation actions do not create duplicate operations.
- Empty pages show real empty states when there are no records.
- Failed APIs show error states rather than empty states.
- Every advanced feature's relevant failure state is handled.
- Account approval and document status are fetched from the backend.
- Theme and typography match the landing page at relevant breakpoints.
- The landing page has not regressed visually or functionally.

Record which tests were actually executed and whether they passed. Do not state that a test passed if it was not run.

---

## 16. Implementation Phases

### Phase 1 — Audit

Inspect the existing landing page, theme source, shared components, React routes, API client, `server.js`, Express error handling, and role-based routing. Document the actual fonts, colors, and design tokens. Identify existing reusable components.

### Phase 2 — Preserve and centralize the theme

If necessary, extract only the existing landing-page tokens into shared styles. Verify that the landing page's appearance does not change. Do not invent new brand styles.

### Phase 3 — Global error foundation

Implement route-level 404, React Error Boundary, centralized API error parsing, backend error middleware, safe logging, session handling, role-aware recovery navigation, and offline/reconnection feedback.

### Phase 4 — Account and authentication states

Implement verification, forgot/reset password states, pending/rejected approval, document update, suspended-account, and incomplete-onboarding states using real backend data.

### Phase 5 — Customer checkout and delivery states

Implement payment outcomes, request/offer states, cart conflicts, order states, tracking failures, delivery exceptions, and refunds/disputes.

### Phase 6 — Advanced-feature and panel empty states

Implement error/empty states for smart matching, auctions, routing, emergency requests, queues, fraud review, corporate orders, hostel/PG orders, broadcasting, and all relevant dashboard lists.

### Phase 7 — Responsive/accessibility validation

Verify desktop/tablet/mobile behavior, keyboard navigation, focus visibility, screen-reader status announcements, and appropriate reduced motion.

### Phase 8 — Tests and report

Run tests, fix failures, inspect the landing page for regressions, and provide an implementation report.

Do not stop after creating a plan. Implement the work in the existing application, test what can be tested, and report remaining blockers honestly.

---

## 17. Final Definition of Done

This task is complete only when:

- All required pages and contextual states are implemented or reused appropriately.
- All dynamic account/order/payment/status information comes from authorized Express APIs and MongoDB.
- Backend errors have correct status codes and safe responses.
- Frontend error handling is centralized and consistent.
- Loading, empty, retry, and connection states are distinguishable.
- Payment and order status are never fabricated.
- Role-based access is enforced on both frontend and backend.
- Critical operations have safe retry/conflict behavior.
- The original TiffinLink landing page's colors, fonts, and visual style remain intact.
- Responsive and accessibility checks have been performed.
- Relevant tests have been executed and results reported.
- No unfinished feature is falsely reported as working.

At completion, report:

1. Files created or modified.
2. Error pages and reusable components implemented.
3. API/backend changes made.
4. Theme tokens/fonts reused and where they were found.
5. Confirmation that the landing page appearance was preserved, based on actual inspection.
6. Tests executed and their results.
7. Remaining limitations or required configuration.

**Start by inspecting my existing TiffinLink codebase and landing page. Reuse the exact existing theme, colors, CSS, fonts, and components. Build the error/status/empty/recovery system as a consistent part of TiffinLink—not as a separately themed template.**
