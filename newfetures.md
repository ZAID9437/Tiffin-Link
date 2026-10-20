# MASTER IMPLEMENTATION PROMPT — TIFFINLINK ADVANCED MARKETPLACE FEATURES

## 1. PROJECT OVERVIEW

You are a senior full-stack software engineer, backend architect, database designer, and real-time systems developer.

Implement the nine advanced features listed below in my existing TiffinLink application.

TiffinLink is an AI-assisted hyperlocal food marketplace that connects:

1. Customers who want meals.
2. Home chefs, home kitchens, tiffin services, cloud kitchens, and restaurants.
3. Delivery partners who collect and deliver food.
4. Corporate customers, hostels, PG accommodations, and other bulk-order customers.
5. Administrators who manage the platform, investigate suspicious activity, and resolve operational issues.

The platform supports conventional food ordering as well as a request-and-offer marketplace.

The request-and-offer workflow is:

Customer creates a meal request → eligible providers receive the request → multiple providers submit offers → customer compares offers → customer selects an offer → confirmed order is created → provider prepares the meal → a delivery partner is assigned → delivery is completed → customer can rate the provider and delivery partner.

The nine advanced features to implement are:

1. AI Smart Provider Matching
2. Multi-Provider Auction
3. Smart Route Optimization
4. Emergency Meal Requests
5. Smart Queues
6. Fraud Detection
7. Corporate Meal Ordering
8. Hostel / PG Bulk Ordering
9. Hyperlocal Broadcasting

Every feature must connect to the existing customer, provider, delivery partner, and admin panels.

Do not implement these as isolated demo modules. Build a connected, persistent, testable system.

---

# 2. MANDATORY TECHNOLOGY STACK

Use the following stack.

## Frontend

- React.
- The existing React application and routing system.
- Reusable React components.
- A centralized API client.
- JWT-based authentication or the authentication method already used by the project.
- Socket.IO Client for real-time communication.
- Proper loading, empty, success, validation, and error states.

## Backend

- Node.js.
- Express.js.
- A centralized `server.js` entry point.
- REST APIs under a consistent `/api/v1` prefix.
- Socket.IO integrated with the Express HTTP server.
- Mongoose for MongoDB models and database access.
- Server-side authentication, authorization, validation, and business rules.

## Database

Use MongoDB as the authoritative data store.

All persistent domain data must be stored and retrieved through backend services and Express APIs.

Use MongoDB indexes, schema validation, transactions where supported and appropriately configured, atomic updates, and concurrency protection where necessary.

## Supporting libraries and services

Use appropriate libraries for:

- Request validation.
- Password hashing.
- Rate limiting.
- Secure HTTP headers.
- Error handling.
- Logging.
- Background jobs and scheduled expiry processing.
- Geospatial searches.
- Real-time event delivery.
- Testing.

Use a real external routing/maps service for road distances and route estimates. Configure it through environment variables and use an adapter so the provider can be changed without rewriting application logic.

Do not silently substitute fabricated routes, simulated GPS positions, artificial AI responses, or fake payment results.

---

# 3. NON-NEGOTIABLE DATA RULES

These rules apply to the complete application.

## 3.1 No hardcoded business data in React

Do not hardcode:

- Customer records.
- Provider records.
- Driver records.
- Meal requests.
- Offers.
- Orders.
- Delivery jobs.
- Earnings.
- Ratings or reviews.
- Corporate accounts.
- Hostel or PG accounts.
- Fraud alerts.
- Matching results.
- Broadcast recipients.
- Queue positions.
- Route distances or ETAs.
- Dashboard statistics.
- Notifications.
- Activity feeds.
- Pagination totals.

These must be obtained from backend APIs and the database.

Static text labels, icons, form definitions, visual layouts, and display formatting may exist in the frontend. Actual business content must come from the backend.

## 3.2 Required data flow

Every dynamic screen must follow this architecture:

React component → API client → Express route → authentication and authorization → controller/service → MongoDB → response to React.

For real-time updates:

Backend business operation → persist change in MongoDB → emit authorized Socket.IO event → connected clients update or refetch authoritative data.

Do not allow the frontend to connect directly to MongoDB.

Do not place Mongoose queries inside React.

Do not generate fake business data in frontend state to make unfinished screens look complete.

## 3.3 No fake feature completion

Do not create buttons that only change frontend state without saving the corresponding operation.

Do not return fabricated success responses.

Do not simulate a provider receiving a request when the backend has not actually matched and notified that provider.

Do not claim an event is real-time until it works across separate authenticated sessions.

Do not consider a feature complete until its API, database operations, permissions, real-time events, error handling, and tests work.

## 3.4 Development seed data

If seed data is needed, create an explicit development-only seed script using clearly identified test accounts.

Do not load mock business data automatically in production.

The production application must work with records created by actual users and actual platform operations.

---

# 4. SHARED ARCHITECTURE AND USER ROLES

Implement the following role boundaries.

## Customer

Can create meal requests, view eligible offers, select offers, create direct orders, use emergency requests, participate in supported bulk-order flows, track deliveries, receive broadcasts where eligible, and rate completed orders.

## Provider

Can receive eligible meal requests, submit and manage offers, manage menu items, view confirmed orders, update preparation statuses, participate in the provider queue, receive relevant broadcasts, and view authorized risk or operational warnings.

## Delivery partner

Can go online or offline, receive eligible delivery offers, accept or decline assignments, receive optimized route information, update pickup and delivery statuses, and receive authorized operational notifications.

## Corporate account

Can create and manage an organization, authorize team members, create group orders, configure allowed delivery locations, manage budgets and billing, and inspect organization orders.

## Hostel / PG account

Can create an authorized accommodation account, manage locations and residents, coordinate meal requests and bulk orders, and view applicable order and billing records.

## Administrator

Can configure business rules, investigate fraud flags, moderate activity, view authorized marketplace operations, manage emergency requests, inspect assignment history, and resolve support incidents.

Enforce role-based access control in Express. Hiding a button in React does not constitute authorization.

Verify ownership and access permissions for every resource requested by a user.

---

# 5. FEATURE ONE — AI SMART PROVIDER MATCHING

## Objective

Match each customer meal request with relevant providers based on real data.

Do not select providers using static lists or hardcoded rankings.

## 5.1 Customer creates a request

The customer must provide:

- Meal description.
- Meal category.
- Cuisine preference.
- Vegetarian or non-vegetarian preference, when applicable.
- Quantity.
- Required date and time.
- Budget or acceptable price range.
- Delivery address and coordinates.
- Special preparation requirements.
- Urgency level, where applicable.
- Delivery or pickup preference.

Validate the request on the backend and store it in MongoDB.

Generate a unique request ID and record its creation time, expiry policy, status, and customer ID.

## 5.2 Retrieve eligible providers

Use MongoDB geospatial queries and backend business rules to identify providers who:

- Have approved provider accounts.
- Are active and accepting requests.
- Operate within the relevant service area.
- Offer compatible food categories or cuisines.
- Can meet the requested date and time.
- Support the requested delivery or pickup method.
- Are not blocked or ineligible under the platform's policies.

Store provider coordinates using valid GeoJSON Point objects with a `2dsphere` index where appropriate.

Store locations as longitude followed by latitude, as required by GeoJSON.

Do not assume that every provider in a city is eligible for every request.

## 5.3 Matching algorithm

Implement a configurable matching service.

Evaluate signals such as:

- Geographic proximity.
- Route distance or estimated travel time, when available.
- Cuisine compatibility.
- Meal and category compatibility.
- Availability.
- Ability to fulfil the requested quantity.
- Food preparation time.
- Budget compatibility.
- Verified provider status.
- Historical rating and completed-order reliability.
- Valid cancellation and complaint indicators.

Normalize and weight these signals through configurable server-side rules.

The matching algorithm should be explainable. Store a matching result and its relevant reason codes where useful.

AI must not be represented as active unless an actual AI model or service has been configured and invoked. A deterministic scoring algorithm may be used as a genuine first implementation, clearly identified as rule-based smart matching.

Do not fabricate predictions, ratings, reviews, or provider performance data.

## 5.4 Matching outcomes

If suitable providers exist:

1. Create matching records.
2. Notify eligible providers through Socket.IO and configured notification channels.
3. Update the request's matching status.
4. Let providers retrieve the request through authorized APIs.
5. Record delivery and acknowledgement of notifications where supported.

If no eligible providers exist:

- Set an appropriate no-match state.
- Tell the customer that no suitable provider is currently available.
- Allow the customer to adjust the location, price range, date, or requirements.
- Offer a retry mechanism.
- Re-run matching when the request changes.

Do not display fake matching results.

## 5.5 Required APIs

Implement appropriate endpoints such as:

- `POST /api/v1/matching/evaluate`
- `GET /api/v1/meal-requests/:requestId/matches`
- `POST /api/v1/meal-requests/:requestId/rematch`

The endpoints must be protected and must use stored data.

Prefer automatically running matching when a valid meal request is created rather than requiring the customer to call an internal evaluation endpoint.

---

# 6. FEATURE TWO — MULTI-PROVIDER AUCTION

## Objective

Allow multiple providers to submit offers for the same meal request and let the customer choose an appropriate offer.

This is a competitive offer system, not an automatic order-creation system.

## 6.1 Provider receives the request

The provider sees:

- Request ID.
- Meal description.
- Quantity.
- Budget.
- Delivery area.
- Required time.
- Special instructions.
- Request expiry.
- Relevant matching information.

Only eligible providers should receive the request.

## 6.2 Provider submits an offer

An offer should contain:

- Provider ID.
- Request ID.
- Proposed total price.
- Price breakdown where applicable.
- Items or meal description.
- Quantity confirmation.
- Estimated preparation time.
- Estimated readiness time.
- Delivery arrangement.
- Additional conditions.
- Offer expiry.
- Creation timestamp.
- Offer status.

Validate the offered price, quantity, provider eligibility, and request status.

Prevent providers from submitting offers after the request has closed.

Where business rules permit a provider to change an offer, record its update history.

## 6.3 Customer compares offers

Retrieve offers from the backend.

Display:

- Provider details.
- Meal offered.
- Price.
- Estimated preparation and delivery timing.
- Distance.
- Verified provider rating, when available.
- Relevant review information.
- Delivery and payment terms.
- Offer expiry.
- Current offer status.

Allow filtering and sorting using actual offer data.

## 6.4 Offer selection

When the customer selects an offer:

1. Authenticate the customer and verify request ownership.
2. Check that the request remains open and the offer remains valid.
3. Confirm that the provider is still eligible.
4. Validate the latest price and terms.
5. Apply any required payment or confirmation rules.
6. Atomically reserve or close the request against competing selections.
7. Create exactly one order for the accepted offer.
8. Link the order to the request and selected offer.
9. Mark the selected offer as accepted.
10. Close or reject competing offers according to the rules.
11. Notify the customer and the selected provider.
12. Start the standard order lifecycle.

Use concurrency protection so simultaneous requests cannot create multiple winning orders for the same single-winner meal request.

An offer is not an order.

Do not create orders when offers are merely submitted.

## 6.5 Expiry and cancellation

Support:

- Offer expiry.
- Request expiry.
- Provider withdrawal before selection, where allowed.
- Customer cancellation before selection.
- Rejection of invalid selections.
- Reopening requests when permitted.

Use backend expiry jobs rather than relying on a user's browser being open.

## 6.6 Required APIs

Examples:

- `POST /api/v1/meal-requests/:requestId/offers`
- `GET /api/v1/meal-requests/:requestId/offers`
- `GET /api/v1/offers/:offerId`
- `PATCH /api/v1/offers/:offerId`
- `POST /api/v1/offers/:offerId/withdraw`
- `POST /api/v1/offers/:offerId/select`

Every endpoint must enforce role, ownership, request state, and offer state rules.

---

# 7. FEATURE THREE — SMART ROUTE OPTIMIZATION

## Objective

Improve delivery efficiency by calculating realistic routes and sequencing eligible delivery stops.

Do not create fabricated route paths, distances, traffic values, or ETAs.

## 7.1 Route provider integration

Create a backend routing adapter that supports a configured real routing service.

Keep API keys and provider credentials on the backend, not in public React code.

Use the routing provider to obtain, where supported:

- Road distance.
- Estimated travel time.
- Route geometry.
- Turn-by-turn steps.
- Traffic-aware estimates.
- Distance and duration matrices.
- Multi-stop route estimates.

Document which values are provided by the routing service and which are computed internally.

If a routing service is unavailable or not configured, display a clear unavailable status or an explicitly labelled approximation. Do not present straight-line distances as actual road distances.

## 7.2 Delivery job routing

For a confirmed delivery order:

1. Retrieve provider pickup coordinates.
2. Retrieve customer drop-off coordinates.
3. Retrieve the assigned driver's current valid coordinates.
4. Calculate a route to pickup and then to drop-off.
5. Estimate travel times using the configured routing provider.
6. Return route information to authorized panels.
7. Refresh estimates when the driver's location or relevant route changes.
8. Record the timestamp of the latest estimate.

The standard route is:

Driver location → Provider pickup → Customer drop-off.

Do not permit the frontend to overwrite route results with arbitrary values.

## 7.3 Multi-stop route optimization

When a driver is authorized to carry multiple deliveries:

- Retrieve only jobs eligible to be assigned to that driver.
- Respect pickup-before-drop-off dependencies.
- Respect required delivery windows.
- Respect driver capacity and vehicle constraints.
- Respect food handling and provider readiness constraints.
- Calculate candidate route sequences.
- Choose a valid sequence using route durations and the configured optimization objective.
- Return the proposed sequence and its estimated costs.
- Recalculate when a delivery is cancelled, added, or materially changes.

Do not combine unrelated jobs if the platform's delivery rules prohibit it.

Do not sacrifice required delivery deadlines merely to reduce distance.

Store route version, stop sequence, and optimization timestamp where needed for auditing.

## 7.4 Driver navigation

The driver panel must receive:

- Current delivery.
- Pickup address.
- Drop-off address.
- Route geometry where supported.
- Estimated distance and travel time.
- Navigation action.
- Relevant delivery instructions.

If the application uses external turn-by-turn navigation, open the configured navigation service rather than pretending the site itself provides turn-by-turn navigation.

## 7.5 APIs

Implement endpoints such as:

- `POST /api/v1/routes/calculate`
- `POST /api/v1/routes/optimize`
- `GET /api/v1/deliveries/:deliveryId/route`
- `POST /api/v1/deliveries/:deliveryId/recalculate-route`

Protect endpoints so users can only access routes relevant to their authorized roles and active work.

---

# 8. FEATURE FOUR — EMERGENCY MEAL REQUESTS

## Objective

Allow customers to mark an eligible meal request as urgent and prioritize the request using explicit backend rules.

Emergency meal requests must be part of the actual marketplace workflow.

## 8.1 Customer interface

Allow the customer to select an urgent-request option when creating a meal request.

Require the customer to provide:

- Meal requirements.
- Quantity.
- Delivery location.
- Required delivery time.
- Budget or acceptable price.
- Contact and delivery instructions where needed.

Display the urgency conditions before final submission.

Validate the requested delivery deadline rather than promising immediate delivery by default.

## 8.2 Emergency eligibility

Implement configurable server-side rules for:

- Maximum urgent delivery radius.
- Maximum acceptable preparation time.
- Provider eligibility.
- Driver availability.
- Supported service hours.
- Applicable additional fees, if any.
- Emergency request expiry.
- Maximum number of active emergency requests per customer, if required.

The rules must be configurable from authorized backend settings, not scattered hardcoded values in React.

## 8.3 Emergency matching

When an eligible emergency request is created:

1. Save it to MongoDB.
2. Mark its urgency level.
3. Find active and compatible providers.
4. Prioritize eligible providers based on proximity, readiness, availability, and feasibility.
5. Notify suitable providers immediately through real-time events.
6. Include the requested deadline and urgency level in the notification.
7. Collect provider responses and offers according to the configured emergency flow.
8. Allow the customer to compare eligible responses where the offer flow applies.
9. Create the order only after the required selection and confirmation steps.
10. Trigger delivery assignment according to the emergency dispatch policy.

Urgent requests can receive elevated queue priority, but they must not bypass payment validation, provider authorization, safety rules, or order-state validation.

## 8.4 Honest availability messaging

If no provider or delivery partner can fulfil the requested deadline, clearly inform the customer.

Offer the nearest feasible alternative when one is available.

Never show a guaranteed delivery deadline based only on an unverified estimate.

## 8.5 Notifications

Notify relevant users when:

- An emergency request is submitted.
- A suitable provider receives it.
- A feasible offer arrives.
- An offer is accepted.
- The order is confirmed.
- A delivery partner is assigned.
- The deadline becomes infeasible.
- The request expires or is cancelled.

## 8.6 APIs

Examples:

- `POST /api/v1/emergency-requests`
- `GET /api/v1/emergency-requests/:requestId`
- `POST /api/v1/emergency-requests/:requestId/cancel`
- `GET /api/v1/providers/emergency-requests`
- `POST /api/v1/admin/emergency-settings`

---

# 9. FEATURE FIVE — SMART QUEUES

## Objective

Implement real, persistent, server-controlled queues for managing requests and food preparation.

A queue is not simply a hardcoded list sorted in React.

## 9.1 Queue types

Implement separate queue views or logical queue partitions for:

- New provider meal requests.
- Pending provider offers or responses.
- Confirmed provider orders awaiting preparation.
- Orders currently being prepared.
- Orders ready for pickup.
- Delivery jobs awaiting assignment.
- Emergency requests requiring elevated priority.

Do not combine unrelated workflow states into one ambiguous queue.

## 9.2 Queue priority

Calculate queue priority using configurable factors:

- Emergency status.
- Required delivery time.
- Request or order age.
- Provider response deadlines.
- Preparation duration.
- Food readiness.
- Driver arrival estimates, where relevant.
- Previously accepted commitments.
- Valid business rules and fairness constraints.

Persist the relevant queue state or sufficient source data to derive it consistently.

Store priority reason codes for explainability.

Do not allow the browser to choose its own authoritative queue priority.

## 9.3 Provider preparation queue

When an order is confirmed:

1. Add the order to the provider's preparation queue.
2. Calculate or retrieve the expected preparation time.
3. Evaluate existing commitments.
4. Recommend an operational sequence.
5. Show upcoming orders and deadlines.
6. Allow authorized status updates.
7. Track preparation start and completion timestamps.
8. Re-evaluate the queue when new orders arrive or existing orders change.

Only allow an order to be marked ready when it is in an appropriate state.

When the provider marks an order ready, notify the assigned driver and trigger the relevant pickup flow.

If an order is not ready on time, flag the delay and adjust downstream estimates when feasible.

Do not add the previously excluded live kitchen-capacity module as a separate feature. Use only the existing order and preparation data required for queue processing.

## 9.4 Delivery assignment queue

Create a queue of confirmed delivery jobs awaiting assignment.

Prioritize based on:

- Delivery deadline.
- Emergency status.
- Pickup readiness.
- Route feasibility.
- Time since the job became available.
- Eligible driver availability.

When a driver accepts a job, remove or reserve that job atomically so another driver cannot claim it.

Provide safe reassignment when drivers decline, time out, or cancel under permitted rules.

## 9.5 Real-time queue updates

Use Socket.IO events to notify authorized dashboards when:

- Queue entries are added.
- An entry's status changes.
- Priority changes.
- A deadline becomes at risk.
- A request or order leaves the queue.
- A delivery job is assigned.

Persist the underlying business state in MongoDB before publishing the event.

After reconnection, clients must refetch authoritative queue state.

## 9.6 APIs

Examples:

- `GET /api/v1/providers/queues/requests`
- `GET /api/v1/providers/queues/preparation`
- `GET /api/v1/delivery/queues/available`
- `GET /api/v1/admin/queues/overview`
- `POST /api/v1/admin/queues/reprioritize`

---

# 10. FEATURE SIX — FRAUD DETECTION

## Objective

Build a backend fraud-risk detection service that identifies suspicious behavior and records reviewable alerts.

Fraud detection must be real, data-driven, explainable, and integrated with administrative workflows.

Do not claim to use machine learning unless an actual trained model or external model service is implemented.

Start with configurable rules and statistical checks. Design the service so a future model can be added without rewriting unrelated modules.

## 10.1 Signals to investigate

Use relevant platform data to detect possible indicators such as:

- Repeated order creation followed by cancellation.
- Abnormally frequent failed payment attempts.
- Duplicate payment references.
- Multiple accounts sharing suspicious attributes, where lawful and appropriate.
- Repeated abuse of coupons or referral benefits.
- Repeated refund requests with suspicious patterns.
- Unusual changes in delivery or order details.
- Repeated driver assignment and cancellation patterns.
- Suspicious review submission patterns.
- Attempts to bypass authorization or repeat restricted actions.
- Request or offer manipulation.
- Repeated failed verification attempts.

Treat these as indicators requiring context, not automatic proof of wrongdoing.

Do not flag legitimate users solely because they are new, live in a particular area, have a low order value, or use a shared network.

## 10.2 Risk scoring

Create a centralized risk-evaluation service.

Each supported rule should produce:

- Rule identifier.
- Triggering event.
- Relevant resource ID.
- Risk contribution.
- Reason code.
- Evidence references.
- Timestamp.
- Current review status.

Calculate the total risk score using configurable server-side thresholds.

Never store private credentials, full payment card data, or unnecessary sensitive information in risk evidence.

## 10.3 Response levels

Implement configurable response levels such as:

- Informational.
- Low risk.
- Medium risk.
- High risk.
- Critical risk.

The response policy may include:

- Record an event.
- Notify authorized administrators.
- Require additional verification.
- Temporarily restrict a particular operation.
- Place a transaction or refund under review.
- Escalate to manual investigation.

Do not automatically accuse, permanently ban, or confiscate money from a user solely because a score exceeded a threshold.

Any consequential restrictions must follow clear rules, appropriate authorization, audit logging, and an appeal or support process where applicable.

## 10.4 Administrator fraud dashboard

Retrieve genuine risk records from MongoDB.

Display:

- Alert ID.
- Severity.
- Rule triggered.
- Related order or transaction.
- Related user or provider, subject to authorization.
- Reason and relevant evidence.
- Time detected.
- Review status.
- Assigned reviewer.
- Review notes.
- Resolution.

Allow authorized administrators to:

- Assign an alert.
- Mark it under investigation.
- Request additional information.
- Dismiss a false positive with a reason.
- Resolve the case.
- Apply an authorized action.
- Review the audit history.

## 10.5 Integrate with existing operations

Evaluate relevant events such as:

- Order creation.
- Payment failures.
- Cancellation.
- Refund initiation.
- Coupon redemption.
- Driver assignment changes.
- Review submission.
- Suspicious authentication attempts.

Use idempotent event processing so retries do not create repeated alerts for the same event and rule unless repeated behavior is itself meaningful.

## 10.6 APIs

Examples:

- `POST /api/v1/risk/evaluate`
- `GET /api/v1/admin/fraud-alerts`
- `GET /api/v1/admin/fraud-alerts/:alertId`
- `PATCH /api/v1/admin/fraud-alerts/:alertId/status`
- `POST /api/v1/admin/fraud-alerts/:alertId/actions`

Protect administrative endpoints rigorously and audit every review action.

---

# 11. FEATURE SEVEN — CORPORATE MEAL ORDERING

## Objective

Allow organizations to arrange meals for employees using the same central provider, order, and delivery systems.

Do not create a separate disconnected ordering engine.

## 11.1 Corporate account onboarding

Create an organization model containing:

- Organization name.
- Organization type.
- Verified business contact.
- Approved organizational email or domain where appropriate.
- Billing address.
- Approved delivery locations.
- Authorized account administrators.
- Account status.
- Configured billing and spending rules.

Require administrator or configured verification before granting elevated corporate capabilities.

Do not trust a user merely because they entered a company name.

## 11.2 Corporate membership and roles

Support appropriate membership roles such as:

- Organization administrator.
- Meal coordinator.
- Department manager, if configured.
- Employee.
- Billing contact.

Enforce organization boundaries: members must not see unrelated organizations' employees, budgets, orders, or invoices.

## 11.3 Corporate meal requests

Allow authorized users to create:

- Individual workplace meal requests.
- Group meal requests.
- Scheduled meal orders.
- Catering or bulk meal requests where supported.

Each request should record:

- Organization ID.
- Request creator.
- Required date and time.
- Delivery location.
- Meal quantity.
- Menu or meal requirements.
- Dietary selections where required.
- Per-person budget or total budget.
- Allocation rules.
- Delivery and packaging instructions.
- Approval status where required.

## 11.4 Corporate ordering workflow

Implement:

1. Authorized user creates a request or order.
2. Validate membership and permissions.
3. Validate order size, deadline, delivery location, and budget.
4. Apply required approval rules.
5. Discover eligible providers.
6. Offer direct menu checkout or the request-and-offer flow according to the selected workflow.
7. Confirm orders through the central order system.
8. Prepare and deliver food through the standard delivery workflow.
9. Record order lines and costs against the organization.
10. Create appropriate billing or invoice records.
11. Expose order history and reports to authorized corporate users.

Bulk requests must not bypass provider capacity rules, order validation, or delivery feasibility checks.

## 11.5 Budget controls

Implement configurable policies for:

- Per-person spending limits.
- Per-order budget.
- Allowed meal categories.
- Allowed providers.
- Department budgets.
- Approval requirements.
- Billing method.
- Monthly spending limits where appropriate.

Enforce limits on the backend during checkout and confirmation.

If a request exceeds a policy, explain why and require the appropriate authorized action.

## 11.6 Corporate dashboard

All data must come from Express APIs.

Show:

- Active requests.
- Upcoming meal orders.
- Order history.
- Spending totals.
- Budget usage.
- Invoices and payment status.
- Participating employees.
- Delivery statuses.
- Relevant support issues.

Provide date filters and pagination.

Do not display fabricated spend totals or sample employee lists.

## 11.7 APIs

Examples:

- `POST /api/v1/corporate/organizations`
- `GET /api/v1/corporate/organizations/:organizationId`
- `POST /api/v1/corporate/organizations/:organizationId/members`
- `POST /api/v1/corporate/meal-orders`
- `GET /api/v1/corporate/meal-orders`
- `POST /api/v1/corporate/meal-orders/:orderId/approve`
- `GET /api/v1/corporate/budgets`
- `GET /api/v1/corporate/invoices`

Every endpoint must enforce organization-level access control and approval rules.

---

# 12. FEATURE EIGHT — HOSTEL / PG BULK ORDERING

## Objective

Enable hostels and paying-guest accommodations to organize meals for multiple residents through the existing marketplace and delivery system.

Support both recurring operational needs and one-time bulk orders without assuming every bulk order is a subscription.

## 12.1 Hostel / PG account

Create a hostel or PG profile containing:

- Accommodation name.
- Owner or authorized manager.
- Address and coordinates.
- Contact information.
- Verified account status.
- Relevant service preferences.
- Approved delivery instructions.
- Authorized staff or coordinators.
- Resident membership data, where needed.

Protect resident information and do not expose private accommodation records to unrelated users.

## 12.2 Ordering methods

Support the applicable ordering modes:

- Manager-created bulk meal request.
- Group order from a provider's menu.
- Multiple resident selections combined into an authorized group order.
- Scheduled bulk order.
- Repeated order templates if explicitly configured.
- Individual resident orders linked to a group or accommodation.

Do not create recurring orders automatically without clear user configuration and the required confirmation rules.

## 12.3 Bulk order form

Collect:

- Hostel or PG ID.
- Requested date and meal time.
- Meal category or description.
- Number of residents.
- Total quantity.
- Dietary or meal preferences where supported.
- Budget per person.
- Total budget.
- Delivery location.
- Packaging instructions.
- Order cutoff time.
- Required approval.
- Contact instructions.

Validate quantity, timing, maximum supported order size, provider feasibility, and the total cost.

## 12.4 Group ordering workflow

Implement:

1. An authorized coordinator creates the group order.
2. The backend creates a unique group-order record.
3. Residents can join or submit meal choices if that option is enabled.
4. Enforce membership and cutoff time.
5. Calculate the aggregate quantity from valid selections.
6. Prevent duplicate selections where prohibited.
7. Let the coordinator review the consolidated order.
8. Validate the final amount and budget.
9. Submit a direct order or meal request through the appropriate central workflow.
10. Obtain provider acceptance or offer selection as required.
11. Create the confirmed order.
12. Prepare the food.
13. Create the required delivery job.
14. Assign delivery partner(s) according to supported bulk-delivery rules.
15. Track preparation and delivery.
16. Record participant-level and group-level totals as appropriate.
17. Complete payment, delivery, and review workflows.

A group-order record is not itself proof that a provider has accepted the meal order.

## 12.5 Bulk delivery considerations

Allow configured rules for:

- Maximum meals per order.
- Provider preparation estimates.
- Required packaging.
- Number of delivery trips.
- Driver capacity.
- Multiple drivers or batches when needed.
- Delivery time windows.
- Drop-off instructions.
- Failed delivery handling.

Do not assign more food to a driver than the configured vehicle and operational rules allow.

If an order must be split into separate delivery jobs, preserve the relationship between the group order, confirmed food order, batches, delivery jobs, and payments.

## 12.6 Hostel / PG dashboard

Provide real database-backed views for:

- Upcoming meals.
- Pending group orders.
- Participant selections.
- Consolidated quantities.
- Total cost.
- Per-person cost.
- Provider confirmation.
- Preparation progress.
- Delivery progress.
- Order history.
- Relevant invoices and payments.

## 12.7 APIs

Examples:

- `POST /api/v1/hostels`
- `POST /api/v1/hostels/:hostelId/members`
- `POST /api/v1/hostels/:hostelId/group-orders`
- `POST /api/v1/group-orders/:groupOrderId/selections`
- `GET /api/v1/group-orders/:groupOrderId`
- `POST /api/v1/group-orders/:groupOrderId/finalize`
- `GET /api/v1/hostels/:hostelId/orders`

---

# 13. FEATURE NINE — HYPERLOCAL BROADCASTING

## Objective

Build a location-aware notification system that can send relevant meal requests, availability updates, emergency notices, or other approved messages to appropriate nearby users or providers.

Do not implement broadcasting as a static message shown to every user.

## 13.1 Broadcast types

Support appropriately authorized broadcasts such as:

- A new eligible meal request for matching providers.
- An emergency meal request.
- A newly available local delivery job.
- An authorized provider availability notice.
- A corporate or hostel meal opportunity.
- A platform service announcement.
- A geographically relevant operational notice.

Each broadcast must have a defined audience, reason, status, and expiry policy.

## 13.2 Targeting rules

Determine recipients using real stored attributes and permissions, including as relevant:

- Coordinates and service area.
- Provider categories and preferences.
- Provider verification status.
- Provider availability.
- Driver online status.
- Supported delivery area.
- Organizational membership.
- Emergency eligibility.
- Notification preferences.
- Exclusion or safety rules.

For a meal request, target only eligible providers.

For a delivery job, target only eligible delivery partners.

For corporate information, target only authorized members of the relevant organization.

Never expose an entire customer list, driver list, or provider directory to other users simply to send a broadcast.

## 13.3 Geographic targeting

Use MongoDB geospatial queries to retrieve candidate recipients within a configurable radius.

Where road distance matters, refine the candidate set using the configured routing service.

Do not use only the browser's current location to determine the authoritative recipient list.

Check each recipient's eligibility on the backend.

## 13.4 Broadcast workflow

1. A permitted business event or authorized user initiates a broadcast.
2. The backend validates the sender's permissions and broadcast type.
3. The backend determines the intended geographical or organizational audience.
4. It filters candidate recipients using current eligibility data.
5. It stores a broadcast record.
6. It creates recipient records or a reliable recipient-processing job.
7. It delivers events to authorized online recipients through Socket.IO.
8. It sends push, email, or SMS through configured services where appropriate.
9. It records delivery attempts and relevant outcomes.
10. It handles transient failures with controlled retries.
11. It expires or closes the broadcast according to policy.
12. It prevents accidental duplicate sends during job retries.

Do not send multiple messages to the same recipient because the initiating API was retried.

## 13.5 Recipient experience

Recipients should see relevant broadcasts in their panel.

The interface must show actual records containing:

- Message or opportunity.
- Sender or source where appropriate.
- Creation time.
- Expiry time.
- Current status.
- Relevant action.

Allow authorized dismissal or acknowledgement where applicable.

For request broadcasts, selecting the notification should open the actual request.

For delivery broadcasts, selecting the notification should open the actual delivery opportunity.

## 13.6 Real-time rooms and access controls

Use authenticated Socket.IO sessions and server-managed rooms or equivalent targeting.

Never allow a client to subscribe to arbitrary private user, provider, organization, or delivery rooms simply by supplying an ID.

The backend must validate the user's authorization before adding a socket to a private room.

Broadcast events should identify the record and event type; clients should fetch authoritative record details through authorized APIs.

## 13.7 APIs

Examples:

- `POST /api/v1/broadcasts`
- `GET /api/v1/broadcasts`
- `GET /api/v1/broadcasts/:broadcastId`
- `POST /api/v1/broadcasts/:broadcastId/acknowledge`
- `POST /api/v1/broadcasts/:broadcastId/dismiss`
- `GET /api/v1/admin/broadcasts`

Expose only permitted information to each recipient.

---

# 14. SOCKET.IO REAL-TIME ARCHITECTURE

Real-time functionality must work between independently authenticated browser sessions.

Do not use browser timers or local React state as a substitute for actual server events.

## 14.1 Required event categories

Define a consistent event catalogue, including events equivalent to:

### Matching

- `matching:started`
- `matching:completed`
- `matching:no_match`

### Meal requests and offers

- `meal_request:created`
- `meal_request:matched`
- `meal_request:updated`
- `meal_request:expired`
- `offer:created`
- `offer:updated`
- `offer:accepted`
- `offer:rejected`
- `offer:expired`

### Orders and queues

- `order:created`
- `order:confirmed`
- `order:rejected`
- `order:status_updated`
- `queue:updated`
- `queue:priority_updated`

### Emergency operations

- `emergency_request:created`
- `emergency_request:matched`
- `emergency_request:updated`
- `emergency_request:expired`

### Delivery

- `delivery:available`
- `delivery:assigned`
- `delivery:accepted`
- `delivery:reassigned`
- `delivery:pickup_updated`
- `delivery:status_updated`
- `delivery:location_updated`
- `delivery:completed`

### Risk and broadcasts

- `fraud_alert:created`
- `fraud_alert:updated`
- `broadcast:created`
- `broadcast:acknowledged`
- `broadcast:expired`

These are event names to implement consistently, not permission to emit every event to every socket.

## 14.2 Event-processing rules

- Authenticate each socket connection.
- Validate room membership on the server.
- Persist business changes before emitting state-change events.
- Emit events only to authorized recipients.
- Avoid exposing private addresses, identity documents, payment data, or internal fraud evidence.
- Include event IDs or version information where helpful.
- Make business actions idempotent.
- Refetch authoritative data after reconnecting.
- Handle disconnects, reconnects, and missed events.
- Avoid duplicate business side effects if an event or job is processed more than once.

For production deployment, account for multiple backend instances if necessary using a compatible Socket.IO adapter and reliable background job processing.

Do not assume an in-memory event or job queue is durable across server restarts.

---

# 15. MONGODB DATA MODEL

Inspect the existing models before adding new collections. Reuse existing entities and avoid duplicating the same business concept.

Create or extend the following data structures as needed.

## Matching and request marketplace

- `User`
- `Customer`
- `Provider`
- `MealRequest`
- `ProviderMatch`
- `Offer`

Each `MealRequest` should contain customer ownership, request requirements, geospatial location, urgency where applicable, lifecycle status, deadlines, and timestamps.

Each `ProviderMatch` should record the relevant request, provider, eligibility or result state, and explainable match information.

Each `Offer` should reference a request and provider and contain the proposed price and terms.

## Orders and operational queues

- `Order`
- `OrderItem`
- `QueueEntry` or an equivalent reliable queue representation
- `OrderStatusHistory`
- `EmergencyRequest` where a separate entity is justified

Preserve request-to-offer-to-order relationships.

An order must not be duplicated merely because a queue event is retried.

## Routing and delivery

- `DeliveryJob`
- `DeliveryAssignment`
- `DriverLocation` or the appropriate current/historical location model
- `RoutePlan`
- `DeliveryStatusHistory`

A delivery job must reference its confirmed order, pickup, drop-off, assignment state, and associated driver when assigned.

Support the configured route and delivery history requirements without storing unbounded location data forever.

## Fraud detection

- `RiskEvent`
- `FraudAlert`
- `FraudInvestigation`
- `FraudRuleConfig`
- `AuditLog`

Maintain references to triggering events and the actors who reviewed or resolved alerts.

## Corporate orders

- `Organization`
- `OrganizationMembership`
- `OrganizationBudget`
- `CorporateMealOrder`
- `CorporateApproval`
- `Invoice`

Reuse central order and payment entities where possible. An organization-specific request should eventually link to the normal order and delivery records.

## Hostel / PG bulk ordering

- `Hostel`
- `HostelMembership` or an equivalent access model
- `GroupOrder`
- `GroupOrderSelection`
- `DeliveryBatch` where multiple delivery trips are supported

Keep group coordination data distinct from final confirmed order data.

## Broadcasting and notifications

- `Broadcast`
- `BroadcastRecipient` or an equivalent reliable delivery record
- `Notification`
- `NotificationDeliveryAttempt`

## Required database practices

- Add appropriate indexes.
- Use `2dsphere` indexes on GeoJSON points used for geospatial queries.
- Add uniqueness constraints where needed.
- Use pagination for large datasets.
- Avoid returning entire user collections.
- Use projections to return only permitted fields.
- Store money consistently using the project's chosen monetary representation.
- Store dates as proper timestamps and define time zone handling explicitly.
- Add schema validation and allowed status values.
- Use atomic transitions for offers, assignments, and other competing operations.
- Configure MongoDB replica-set support if multi-document transactions are required.
- Handle transaction and index-creation failures clearly.

Do not rely on an assumed schema. Inspect actual records and existing relationships before introducing migrations or backfills.

---

# 16. EXPRESS API REQUIREMENTS

Organize the backend cleanly.

Suggested structure:

server.js
- App initialization.
- Database connection.
- Express setup.
- Socket.IO setup.
- Middleware registration.
- API route mounting.
- Central error handler.
- Graceful shutdown.

routes/
- Matching routes.
- Meal-request routes.
- Offer routes.
- Route optimization routes.
- Emergency-request routes.
- Queue routes.
- Fraud-detection routes.
- Corporate-order routes.
- Hostel/PG routes.
- Broadcast routes.
- Admin routes.

controllers/
- HTTP request/response handling.

services/
- Matching service.
- Auction service.
- Routing service.
- Emergency service.
- Queue service.
- Fraud-risk service.
- Corporate ordering service.
- Hostel/PG service.
- Broadcasting service.
- Notification service.

models/
- Mongoose models.

middleware/
- Authentication.
- Role authorization.
- Request validation.
- Rate limiting.
- Resource ownership checks.
- Error handling.

jobs/
- Request expiry.
- Offer expiry.
- Reservation cleanup where safe.
- Notification retry.
- Fraud-event processing.
- Broadcast delivery.
- Queue maintenance.

Use the existing project structure where possible rather than duplicating directories unnecessarily.

All state-changing operations must be validated and authorized by the backend.

Use a consistent response structure and meaningful HTTP status codes.

Support pagination, filtering, sorting, request validation, and documented error responses.

Never expose secrets or stack traces to clients.

---

# 17. REACT FRONTEND REQUIREMENTS

Build complete working modules in the appropriate existing panels.

## Customer panel

Include:

- Meal-request creation.
- Matching progress.
- Matched-provider results.
- Offer comparison.
- Offer selection.
- Emergency-request option.
- Corporate or group meal functionality where authorized.
- Request and order history.
- Broadcast notifications.
- Real-time status updates.

## Provider panel

Include:

- Incoming eligible requests.
- Matching information.
- Offer creation and editing.
- Offer history.
- Emergency requests.
- Preparation queue.
- Queue order and deadlines.
- Confirmed orders.
- Readiness updates.
- Relevant broadcasts.
- Authorized risk or account warnings.

## Delivery partner panel

Include:

- Online/offline status.
- Available delivery jobs.
- Relevant broadcast opportunities.
- Accepted deliveries.
- Pickup and drop-off details.
- Route information.
- Active delivery status.
- Location tracking.
- Assignment history.
- Delivery completion.

## Corporate dashboard

Include:

- Organization profile.
- Authorized members.
- Corporate requests.
- Group orders.
- Approval workflow.
- Budget usage.
- Confirmed orders.
- Delivery progress.
- Invoice history.

## Hostel / PG dashboard

Include:

- Accommodation profile.
- Authorized residents or members.
- Group meal order creation.
- Participant selections where enabled.
- Consolidated quantity.
- Budget review.
- Finalization.
- Order preparation and delivery status.
- Relevant history.

## Admin panel

Include:

- Matching and request monitoring.
- Offer and order monitoring.
- Queue overview.
- Emergency requests.
- Routing and assignment status.
- Fraud alerts and investigation.
- Corporate account administration.
- Hostel/PG account administration.
- Broadcast creation and history.
- Platform settings and audit history.

Every page must have working API integration, permission-aware actions, input validation, pagination when appropriate, and clear error states.

Do not create dashboards filled with hardcoded numbers.

If no records exist, show an honest empty state.

If a request fails, explain the error and allow a safe retry.

---

# 18. CONFIGURATION AND EXTERNAL INTEGRATIONS

Use environment variables for secrets and configurable integrations.

Prepare a `.env.example` documenting expected settings, such as:

- MongoDB connection string.
- Authentication secret.
- Frontend origin.
- Maps/routing provider.
- Routing API key.
- Optional AI service configuration.
- Notification or push provider.
- SMS/email service.
- Payment provider.
- Background job configuration.
- Rate-limit and timeout settings.

Do not include real credentials in the repository.

Do not expose secret keys in React build variables.

If a provider integration is not configured, report it as unconfigured and provide clear setup instructions.

Do not secretly replace a missing external service with a fake successful response.

The core backend, database operations, authorization, and workflows should still be testable with appropriate test doubles in automated tests, while the application must clearly distinguish tests from production behavior.

---

# 19. SECURITY AND RELIABILITY

Implement:

- Authenticated REST endpoints.
- Role-based authorization.
- Resource ownership checks.
- Input validation and sanitization.
- Rate limiting.
- Secure HTTP headers.
- Safe password and session handling.
- Environment-managed secrets.
- Protected Socket.IO rooms.
- Validated status transitions.
- Atomic offer selection.
- Atomic delivery assignment.
- Idempotent checkout and assignment operations.
- Idempotent event processing.
- Audit logging.
- Error handling and structured logs.
- Reasonable request timeouts and retry behavior.
- Data minimization and privacy controls.
- Appropriate retention policies for precise driver location.
- Safe handling of unavailable external services.

Prevent:

- Unauthorized price changes.
- Unauthorized order state changes.
- Duplicate winning offers.
- Duplicate driver assignments.
- Duplicate group-order finalization.
- Duplicate broadcast deliveries where idempotency is required.
- Fraud alerts leaking to ordinary users.
- Corporate account data leaking between organizations.
- Repeated event processing causing financial or operational side effects.

Do not trust any identifier, price, priority, risk score, permission, or status coming directly from the frontend without validating it on the backend.

---

# 20. TESTING REQUIREMENTS

Write automated unit and integration tests for all nine features.

Use a real test database or properly isolated test environment. Never run destructive tests against production data.

## Matching tests

- Compatible providers are matched.
- Ineligible providers are excluded.
- Out-of-area providers are not returned.
- Expired or unavailable providers are not selected.
- No-match results are handled honestly.

## Auction tests

- Multiple providers can submit valid offers.
- Customers only see offers they are authorized to access.
- Expired offers cannot be selected.
- Simultaneous selections create no duplicate orders.
- Competing offers close correctly.

## Routing tests

- Real routing integration is used when configured.
- Unavailable routing services are reported correctly.
- Invalid coordinates are rejected.
- Route calculations are authorization-protected.
- Multi-stop optimization respects pickup/drop-off dependencies.

## Emergency request tests

- Eligible urgent requests trigger matching.
- Invalid urgency requirements are rejected.
- No feasible provider results in an honest response.
- Requests cannot bypass order validation.

## Smart queue tests

- Queue entries reflect actual business state.
- Priority ordering follows configured rules.
- Provider readiness changes trigger the proper queue updates.
- Retries do not create duplicate work.

## Fraud tests

- Configured rules create the correct alert.
- Normal activity is not automatically treated as proven fraud.
- Duplicate event processing does not create duplicate alerts unintentionally.
- Only authorized administrators can review or resolve alerts.
- All consequential actions are audited.

## Corporate ordering tests

- Unauthorized members cannot create or approve orders.
- Budget rules are enforced on the backend.
- Corporate orders connect to normal orders and delivery records.
- Organization data is isolated.

## Hostel / PG tests

- Group orders calculate consolidated quantities correctly.
- Cutoff times are enforced.
- Duplicate selections are handled according to policy.
- Finalization creates the correct linked order records.
- Failed finalization can be safely retried.

## Broadcasting tests

- Only eligible recipients are targeted.
- Unauthorized socket subscriptions fail.
- Recipient delivery attempts are traceable.
- Retry handling does not produce unintended duplicate sends.
- Expired broadcasts stop generating new opportunities.

## Real-time tests

Use separate authenticated sessions representing different roles.

Prove that a customer action produces the correct backend record, reaches the correct recipients, updates their screens, and remains correct after a page refresh or reconnection.

## End-to-end workflow

Test this complete journey:

Customer creates meal request → real matching service retrieves eligible providers → providers receive the request in real time → multiple providers submit offers → customer compares and selects an offer → exactly one order is created → the provider confirms and prepares the food → queue updates → delivery job is created → an eligible driver receives and accepts the job → routing service provides a real route when configured → pickup and delivery statuses update → the order is completed → the customer receives relevant updates.

Then test the same central ordering and delivery system for a corporate order and a hostel/PG bulk order.

Do not declare success until actual tests have been executed and their results recorded.

---

# 21. IMPLEMENTATION PLAN

Do not generate the entire system as one enormous unreviewed code change.

Implement in phases.

### Phase 1 — Existing project inspection

Inspect the repository, package files, `server.js`, routes, models, authentication, frontend panels, and existing business logic.

Identify which features and models already exist.

Provide a concise implementation plan that respects the existing architecture.

### Phase 2 — Shared foundation

Implement or extend authentication, role permissions, common data models, validation, audit logging, error handling, MongoDB indexes, and the Socket.IO architecture.

Verify that existing functionality still works.

### Phase 3 — Matching and auction

Implement matching, provider eligibility, matching results, offer creation, offer comparison, atomic offer selection, order creation, and real-time notifications.

Test the complete request-to-order workflow.

### Phase 4 — Routing and emergency requests

Implement the routing provider adapter, driver route calculation, urgent request policies, matching priority, and relevant notifications.

Test configured routing behavior and unavailable-service handling.

### Phase 5 — Smart queues and fraud detection

Implement persistent queue processing, provider preparation queues, delivery assignment queues, fraud rules, risk alerts, admin review, and audit logs.

Test concurrency and retries.

### Phase 6 — Corporate and Hostel/PG

Implement organization membership and budgets, corporate ordering and approvals, group meal selection, consolidated order finalization, and shared delivery integration.

Test permissions and budget restrictions.

### Phase 7 — Hyperlocal broadcasting

Implement geographic recipient selection, organizational targeting, recipient records, Socket.IO delivery, configured external notification integrations, expiry, retries, and admin monitoring.

### Phase 8 — Frontend integration

Connect every screen to the real API.

Remove obsolete mock business data and hardcoded metrics from the modules being implemented.

Ensure all create, update, select, accept, decline, assign, acknowledge, finalize, and resolve actions call actual backend endpoints.

### Phase 9 — Automated verification

Run tests, repair failures, check authorization boundaries, test duplicate requests and concurrent operations, and verify reconnection behavior.

### Phase 10 — Deployment readiness

Document:

- Required environment variables.
- Database indexes and setup.
- External service configuration.
- Startup and build commands.
- Background job startup.
- Socket.IO configuration.
- Test commands.
- Known limitations.

---

# 22. FINAL DEFINITION OF DONE

A feature is complete only if all relevant conditions are satisfied:

1. Its data is stored and retrieved through MongoDB.
2. Its business rules are enforced by Express.
3. Its React interface uses the backend API.
4. Its actions are authorized for the correct roles.
5. Its important state changes generate appropriate real-time events.
6. Its error, empty, loading, and retry states work.
7. It has appropriate database indexes and concurrency protection.
8. It has automated tests that have actually been executed.
9. External integrations work when properly configured.
10. Missing external configuration is reported honestly.
11. Refreshing the page does not lose persisted business state.
12. No critical result relies on fabricated data or false success messages.

After implementation, provide a report of:

- Existing code inspected.
- Files changed or added.
- Database models and indexes created or modified.
- API endpoints implemented.
- Socket.IO events implemented.
- Actual integrations configured.
- Tests executed and their results.
- Known bugs or remaining limitations.
- Environment variables still required.

Start by inspecting my existing TiffinLink repository. Preserve all existing working features and naming conventions, identify the missing capabilities, then implement the nine features phase by phase.

Do not stop after producing an implementation plan. Proceed with the available work, run tests, fix discovered failures, and clearly report anything that remains blocked by external configuration or unavailable services.

**The final goal is a fully connected, database-driven, real-time marketplace—not a static UI prototype.**