# TIFFINLINK — COMPLETE END-TO-END ORDER, DELIVERY & RATING SYSTEM

## 1. Objective

Implement a complete, fully functional food ordering and delivery workflow in my existing TiffinLink application.

The system must connect four stakeholders:

1. Customer
2. Food Provider (home chef, home kitchen, tiffin service, cloud kitchen, or restaurant)
3. Delivery Partner
4. Administrator

Do not build only the frontend or static dashboards. Implement the actual frontend, backend, database operations, APIs, authorization, business rules, notifications, order-state transitions, delivery assignment, payment integration, and rating system.

Before making changes, inspect the existing codebase, database schema, authentication, routing, and all four panels. Reuse the existing architecture and preserve working features. Do not replace the technology stack or duplicate existing modules unnecessarily.

Use real database records and real integrations. Never simulate successful orders, payments, assignments, or deliveries using hardcoded mock data.

---

## 2. Support Both Ordering Methods

TiffinLink supports two distinct but connected ordering methods. Implement both without confusing their workflows.

### Method A: Customer creates a meal request

The customer describes the meal they want. Eligible nearby providers receive the request and can submit competing offers.

Workflow:

Customer creates meal request → providers receive matching request → providers send offers → customer compares offers → customer selects an offer → confirmed order is created.

A provider submitting an offer must not automatically create a confirmed order.

### Method B: Customer orders directly from a kitchen

The customer browses kitchens, selects menu items, adds them to the cart, and checks out.

Workflow:

Customer places order → kitchen receives order notification → kitchen accepts or rejects the order → accepted order proceeds to preparation and delivery.

An order must not be dispatched to a delivery partner before it has reached the required confirmation state.

Both methods must use the same central order-management and delivery system after an order is confirmed.

---

## 3. Customer Registration and Address Selection

The customer must be authenticated before placing an order or creating a meal request.

Allow the customer to:

- Register and log in.
- Manage their profile.
- Add, edit, and delete delivery addresses.
- Select a saved address or enter a new address.
- Search for an address and select a map location.
- Store the address, latitude, longitude, and delivery instructions.
- See whether service is available at the selected location.

Validate the delivery address before accepting a request or order.

The backend must use stored coordinates for proximity matching rather than relying exclusively on a text address.

---

## 4. Customer Creates a Meal Request

Create a fully working “Create Meal Request” workflow.

The form should contain:

- Meal or food description.
- Food category or cuisine.
- Vegetarian or non-vegetarian preference.
- Number of people or meals required.
- Required delivery date.
- Preferred delivery time.
- Customer's budget or acceptable price range.
- Delivery address and coordinates.
- Special cooking instructions.
- Allergy or food restrictions, where applicable.
- Optional reference image.
- Delivery or pickup preference, if supported.

Required fields must be validated by both frontend and backend.

Before submission, show the customer a summary of their request.

When the customer submits:

1. Generate a unique request ID.
2. Save the request to the database.
3. Associate it with the authenticated customer.
4. Store its delivery location and required time.
5. Set its initial status to `OPEN`.
6. Identify eligible, active, verified providers who serve the requested location and can fulfil the request.
7. Notify eligible providers in real time.
8. Display the request status in the customer's panel.

### Customer request statuses

Use a consistent state model, such as:

`DRAFT → OPEN → OFFERS_RECEIVED → OFFER_SELECTED → CONVERTED_TO_ORDER`

Alternative terminal states:

`CANCELLED`, `EXPIRED`

A request can receive zero, one, or multiple offers.

Do not mark a request as an order until the customer selects an offer and all required confirmation rules have been satisfied.

---

## 5. Provider Receives the Request

In the provider panel, implement a functional Requests section.

Providers must see only requests for which they are eligible, according to location, service area, availability, food requirements, timing, and account status.

Each request should display:

- Request ID.
- Meal description.
- Requested quantity.
- Customer budget.
- Required date and time.
- Delivery area and estimated distance.
- Special instructions.
- Request expiry, if applicable.
- Current status.

The provider can open the full request and choose to submit an offer or decline it.

### Provider submits an offer

The offer must include:

- Proposed price.
- Meals or items included.
- Estimated preparation time.
- Estimated readiness time.
- Delivery or pickup arrangements.
- Additional conditions or a message.
- Offer validity period, if applicable.

Validate that the provider's offer meets the request requirements.

Save the offer with a unique ID and link it to the request and provider.

Offer statuses may include:

`PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`.

Notify the customer whenever a valid offer is received or its status changes.

### Customer selects an offer

The customer must be able to compare offers by:

- Provider name.
- Offered price.
- Meal description.
- Estimated preparation time.
- Distance.
- Provider rating.
- Relevant reviews.
- Delivery terms.

When the customer chooses an offer:

1. Verify that the offer is still valid.
2. Verify that the request remains open.
3. Confirm any required availability and payment conditions.
4. Prevent concurrent offer-selection requests from creating multiple orders.
5. Create exactly one order for the accepted offer.
6. Mark the selected offer as accepted.
7. Mark competing offers as rejected or closed according to the business rules.
8. Update the request's status.
9. Notify the customer and selected provider.

If payment is required before confirmation, use the configured payment workflow. Do not show an order as successfully paid until the payment provider confirms it.

---

## 6. Direct Menu Ordering

Implement the standard food-delivery workflow alongside the request-and-offer workflow.

The customer must be able to:

1. Discover nearby active kitchens.
2. Search and filter providers and menu items.
3. Open a provider's profile and menu.
4. Select available items and quantities.
5. Add items to the cart.
6. Modify or remove cart items.
7. Enter delivery instructions.
8. Select a delivery address.
9. Review the order total.
10. Apply an eligible coupon.
11. Select an available payment method.
12. Place the order.

Calculate prices on the backend using trusted menu prices and pricing rules. Do not trust totals supplied by the browser.

Display a clear checkout breakdown:

- Item subtotal.
- Discounts.
- Delivery charges.
- Platform or service fees, where configured.
- Applicable taxes.
- Final payable amount.

Validate menu availability, quantities, provider status, delivery eligibility, and the final amount during checkout.

### Kitchen accepts or rejects the order

When the customer places an order:

1. Create a unique order ID.
2. Save the order and its items.
3. Store price snapshots so later menu changes do not change historical orders.
4. Record the payment status.
5. Set the order to the appropriate initial state.
6. Notify the provider in real time.
7. Show the pending order in the provider dashboard.

The provider can accept or reject the order within the configured response period.

On acceptance, save the provider's confirmation and expected preparation time.

On rejection or timeout, update the order and notify the customer. Refund or release payment authorizations when appropriate under the configured payment policy.

---

## 7. Central Order Management

Both ordering methods must lead to the same reliable order-management system.

Every order must have:

- Unique order ID.
- Customer ID.
- Provider ID.
- Source: direct order or selected meal-request offer.
- Order items and quantities.
- Address snapshot.
- Delivery coordinates.
- Item subtotal.
- Discount and fee breakdown.
- Final amount.
- Payment status.
- Order status.
- Preparation time.
- Delivery assignment, when applicable.
- Creation and update timestamps.

Use a clear order state machine. Example:

`PENDING_PROVIDER_CONFIRMATION → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`

Additional states:

`REJECTED`, `CANCELLED`, `DELIVERY_FAILED`, `REFUND_PENDING`, `REFUNDED`.

Use only transitions valid for the current state and the user's role.

For example:

- A provider may accept or reject a pending order.
- A provider may mark a confirmed order as preparing.
- A provider may mark an order ready when preparation is complete.
- A driver may confirm pickup only when assigned and authorized.
- A driver may confirm delivery only after the required delivery verification.
- A customer may cancel only where the cancellation policy allows it.
- An administrator may intervene through authorized actions with an audit record.

Do not allow a browser request to directly change an order from pending to delivered.

---

## 8. Create and Assign a Delivery Job

The delivery job should be created when an order is confirmed and delivery is required, with dispatch timed according to provider readiness and expected pickup time.

Do not create duplicate delivery jobs for the same order.

Each delivery job must contain:

- Unique delivery ID.
- Associated order ID.
- Provider pickup address and coordinates.
- Customer drop-off address and coordinates.
- Expected pickup time.
- Required delivery time.
- Estimated route distance and travel time.
- Delivery fee or partner compensation.
- Assignment status.
- Assigned delivery partner, if any.
- Pickup and delivery verification states.

### Find eligible delivery partners

Identify delivery partners who:

- Have approved and valid accounts.
- Are currently online and available.
- Have required documents approved.
- Are within the eligible service area.
- Can support the assigned vehicle and delivery requirements.
- Do not have conflicting assignments under the system's capacity rules.

Use driver coordinates, provider coordinates, delivery location, route estimates, and availability to rank eligible partners.

Use straight-line distance only for initial proximity filtering when appropriate; use a routing provider for road distance and ETA when needed.

Do not assign a job solely because a driver appears nearby if the driver is unavailable or ineligible.

### Delivery assignment workflow

1. Create the delivery job.
2. Find eligible drivers.
3. Offer the delivery to eligible drivers according to the dispatch policy.
4. Notify the driver in real time.
5. Display pickup location, drop-off area, estimated distance, estimated earnings, and relevant timing.
6. Allow the driver to accept or decline.
7. Reserve or assign the job atomically so two drivers cannot both win the same delivery.
8. If the offer expires or is declined, offer it to another eligible driver.
9. If no driver is available, keep the job in a visible pending-assignment state and retry according to configured rules.
10. Notify the provider and customer when a driver is assigned.

The customer and provider must be able to see the delivery assignment status.

---

## 9. Delivery Partner Accepts the Job

In the driver panel, implement:

- Online/offline status.
- Available delivery jobs.
- Delivery request details.
- Accept and decline actions.
- Active delivery.
- Pickup and drop-off information.
- Navigation.
- Earnings.
- Delivery history.

The driver should see enough information to decide whether to accept a job. Protect the customer's private information until access is required for the assigned delivery.

After a driver accepts:

1. Verify that the delivery job is still available.
2. Confirm that the driver's account is eligible.
3. Assign the delivery to that driver.
4. Mark the job as assigned or accepted.
5. Remove it from competing drivers' available lists.
6. Notify the provider and customer.
7. Show the job in the driver's active deliveries.

If the driver cancels after acceptance, execute the configured reassignment and incident-handling process instead of leaving the order stuck.

---

## 10. Driver Travels to the Provider

The active delivery screen must show:

- Provider name.
- Pickup address.
- Pickup coordinates.
- Order ID.
- Number of packages.
- Pickup instructions.
- Estimated route distance and time.
- Navigation action.
- Contact options, where permitted.

Integrate the selected maps and routing provider. Do not invent route distance or ETA values.

Support a sequence such as:

`ASSIGNED → GOING_TO_PICKUP → ARRIVED_AT_PICKUP`

The driver should be able to open navigation and report a pickup problem.

When the driver arrives, record the arrival timestamp. GPS proximity can assist with verification, but it must not be treated as infallible proof.

---

## 11. Verify Pickup

Before confirming collection, display the correct order and provider details.

Where supported, require a pickup OTP or another secure verification mechanism.

Pickup flow:

1. Driver reaches the provider.
2. Provider confirms the order is ready.
3. Driver verifies the order ID and package count.
4. The required pickup OTP or verification method is validated.
5. The backend confirms that the delivery is assigned to this driver.
6. Record pickup time and verification result.
7. Change the delivery status to `PICKED_UP`.
8. Update the associated order status.
9. Notify the customer and provider.

Do not mark an order as picked up merely because the driver pressed a button.

OTP codes must expire, be rate-limited, and be stored securely. Do not expose the verification secret in public API responses.

Provide an authorized exception workflow when verification fails or a legitimate pickup problem occurs.

---

## 12. Live Driver Tracking

Implement live location updates for the assigned delivery.

The driver application should request the appropriate location permission and send location updates while a delivery is active.

Store or publish:

- Driver ID.
- Delivery ID.
- Latitude.
- Longitude.
- Location timestamp.
- Relevant accuracy metadata, when available.

Use authenticated APIs and real-time technology supported by the existing architecture, such as WebSockets.

The backend must verify that the driver is authorized to update the location associated with the delivery.

Display the driver's latest valid location on the customer's tracking map and update it as new positions arrive.

Provide:

- Provider pickup location.
- Customer drop-off location.
- Driver location.
- Route and ETA when available.
- Current delivery status.
- Last updated time.

Handle location permission denial, stale GPS data, network interruptions, duplicate updates, and temporary offline periods.

Do not fabricate driver movement when no valid location updates are available.

Stop or limit delivery-specific tracking after completion according to the privacy policy and retention rules.

---

## 13. Driver Travels to the Customer

After pickup verification succeeds:

1. Mark the order as picked up.
2. Start the delivery stage.
3. Display the route to the customer.
4. Update the estimated arrival time using available routing data.
5. Send a delivery-started notification to the customer.
6. Allow the driver to report problems such as an inaccessible address or an unavailable customer.
7. Show authorized contact options.

The customer should see a tracking page with the current status, provider information, delivery partner information, and location updates.

Do not expose unnecessary customer contact details or the customer's full address to unrelated users.

---

## 14. Confirm Delivery

At the drop-off location, the driver must complete an actual delivery-confirmation workflow.

Show:

- Order ID.
- Customer or recipient details.
- Delivery address.
- Delivery instructions.
- Required delivery OTP or verification method.

The workflow should be:

`OUT_FOR_DELIVERY → ARRIVED_AT_CUSTOMER → DELIVERY_VERIFICATION → DELIVERED`

On confirmation:

1. Verify that the order is assigned to the authenticated driver.
2. Verify the delivery is currently eligible for completion.
3. Validate the OTP or configured verification method.
4. Record the delivery timestamp.
5. Store permitted proof of delivery when required.
6. Set the delivery job to `DELIVERED`.
7. Set the order to `DELIVERED`.
8. Record who performed the action.
9. Update payment and earnings records according to the payment policy.
10. Notify the customer, provider, and driver.
11. Make the completed order eligible for ratings.

The operation must be idempotent: repeating the same confirmation request must not create duplicate earnings, duplicate payment transactions, or multiple completion records.

A driver must not be able to complete another driver's job.

---

## 15. Payments, Commissions, and Earnings

Integrate the configured payment gateway and use its verified transaction statuses.

Support:

- The selected customer payment method.
- Payment initiation and confirmation.
- Payment failure.
- Order cancellation.
- Refund handling.
- Provider commission.
- Delivery fee.
- Driver earnings.
- Provider net earnings.
- Payout tracking.
- Transaction history.

Store monetary values safely using the project's chosen currency and precise decimal or integer-minor-unit representation.

Never treat a successful browser redirect as definitive proof of payment. Verify payment using trusted backend responses and webhook signatures.

Maintain a ledger or equivalent auditable transaction records. Ensure retries do not generate duplicate charges, refunds, commissions, or payouts.

Do not assume that customer collection, provider settlement, and driver payouts occur at the same moment. Implement them according to the configured payment and settlement policy.

---

## 16. Customer Rates Both the Provider and the Driver

After a valid order reaches `DELIVERED`, display a rating invitation on the customer order-details page.

The customer must be able to submit two separate ratings:

### A. Provider rating

Ask the customer to rate:

- Food quality.
- Taste and freshness.
- Accuracy of the order.
- Packaging.
- Overall provider experience.

Allow an overall star rating and an optional written review.

### B. Delivery partner rating

Ask the customer to rate:

- Delivery punctuality.
- Professionalism.
- Handling of the food.
- Communication.
- Overall delivery experience.

Allow an overall star rating and an optional written review.

Keep the provider's and driver's ratings separate. A provider rating must not change the driver's score, and a driver rating must not change the provider's score.

### Rating eligibility and validation

Enforce these rules:

1. Only the authenticated customer associated with the completed order can submit its ratings.
2. Ratings are unavailable before delivery is confirmed, except for any separately defined feedback workflow.
3. Each order can have at most one provider rating and one driver rating per customer under the default policy.
4. Ratings must reference the provider and driver actually associated with that order.
5. Users cannot rate themselves.
6. Validate the rating range on both frontend and backend.
7. Prevent duplicate submissions from repeated clicks or API retries.
8. Make review editing or moderation follow an explicit policy.
9. Allow customers to skip a rating and submit it later if the policy permits.
10. Do not invent ratings, testimonials, or customer reviews.

### Display ratings

Update the provider profile with verified-order provider ratings.

Update the delivery partner profile with verified-delivery driver ratings.

Display:

- Average rating.
- Rating count.
- Written reviews where permitted.
- Review date.
- Associated order verification status.

Recalculate aggregates safely when reviews are added, edited, removed, or moderated.

Do not use unverified or fabricated reviews to inflate ratings.

---

## 17. Notifications at Every Stage

Deliver appropriate in-app notifications and use the configured push, email, or SMS services where applicable.

Examples include:

**Customer**
- Request created.
- Offer received.
- Offer accepted.
- Order confirmed.
- Kitchen started preparing.
- Food ready.
- Driver assigned.
- Driver picked up the order.
- Delivery in progress.
- Order delivered.
- Payment or refund update.
- Rating reminder.

**Provider**
- New eligible request.
- New customer order.
- Offer selected.
- Order accepted or cancelled.
- Preparation reminder.
- Driver assigned.
- Driver arrived for pickup.
- Food pickup confirmed.
- Payment or settlement update.
- New review.

**Delivery partner**
- New delivery opportunity.
- Assignment accepted.
- Pickup details.
- Customer destination.
- Delivery update.
- Earnings update.
- Rating received, where permitted.

Notifications must reflect committed backend changes. Do not send a successful-order notification before the order has actually been confirmed.

Use appropriate idempotency and retry handling so delivery of the same event does not create duplicate actions.

---

## 18. Cancellation, Failure, and Exception Workflows

Implement real handling for:

- Customer cancels before confirmation.
- Provider rejects an order.
- Provider misses the response deadline.
- Customer cancels after confirmation.
- Payment fails.
- Payment succeeds but order creation fails.
- No drivers are available.
- Driver declines a job.
- Driver goes offline after assignment.
- Driver cancels an accepted delivery.
- Provider is not ready at pickup.
- Wrong or inaccessible address.
- Customer is unavailable.
- OTP verification fails.
- Driver experiences a vehicle problem.
- Delivery cannot be completed.
- Customer requests a refund.
- Provider or customer reports a dispute.

Use role-specific permissions, clear status transitions, audit records, notifications, and the configured refund or reassignment rules.

Do not silently delete failed or cancelled orders. Preserve their history for support and financial reconciliation.

An administrator must be able to investigate legitimate exceptions using authorized tools.

---

## 19. Security and Data Integrity

Implement:

- Authenticated endpoints.
- Role-based access control for customer, provider, driver, and administrator.
- Server-side validation.
- Ownership checks for every order, offer, delivery, and rating.
- Secure password and session handling.
- Rate limiting for sensitive endpoints.
- Secure OTP handling.
- API key and payment-secret protection.
- Audit logging for critical status and financial actions.
- Database transactions for order creation and assignment.
- Idempotency for critical operations.
- Appropriate privacy controls for locations and contact information.

The frontend must never be the source of truth for order totals, payment success, user permissions, driver assignments, delivery completion, or rating eligibility.

Use a consistent backend status model and prevent unauthorized or out-of-order status changes.

---

## 20. Database and API Requirements

Inspect the existing database before making schema changes.

Reuse existing entities when possible and add only the missing fields, tables, indexes, constraints, and relationships.

Ensure the data model can represent:

- Users and roles.
- Customer profiles and addresses.
- Provider profiles and verification.
- Menus and menu items.
- Meal requests.
- Provider offers.
- Confirmed orders and order items.
- Payments and refunds.
- Delivery jobs and assignments.
- Driver availability and location updates.
- Notifications and messages.
- Ratings and reviews.
- Commissions, earnings, and payouts.
- Support incidents and audit records.

Use database constraints and transactions to prevent duplicate orders, multiple winning drivers, duplicate ratings, and inconsistent payment records.

Expose the functionality through properly authenticated APIs or the equivalent architecture already used by the project.

Do not introduce a second, conflicting source of truth for order status.

---

## 21. Admin Monitoring

The administrator must be able to investigate the entire lifecycle of a request, order, or delivery.

Provide access-controlled views for:

- Meal requests and their offers.
- Direct and offer-based orders.
- Current order status and status history.
- Provider confirmation and preparation.
- Driver assignment attempts.
- Driver pickup and delivery verification.
- Payment transactions and refunds.
- Provider and driver earnings records.
- Customer, provider, and driver reviews.
- Failed deliveries and disputes.
- Relevant notifications and audit history.

Allow authorized interventions with mandatory reasons and audit records. Do not provide an unrestricted way to fabricate completed deliveries or payments.

---

## 22. Required End-to-End Test Scenarios

Create and execute integration tests for the following workflows:

### Scenario A: Meal request and competing offers

Customer creates a meal request → two providers receive it → both submit offers → customer compares the offers → customer selects one → exactly one order is created → selected provider receives confirmation → competing offers close correctly.

### Scenario B: Direct menu order

Customer selects a kitchen → adds food to cart → completes checkout → payment is processed correctly → provider accepts the order → order preparation begins.

### Scenario C: Successful delivery

Confirmed order → delivery job created → eligible driver receives it → driver accepts → driver reaches provider → pickup is verified → customer sees live tracking → driver reaches customer → delivery is verified → order is completed.

### Scenario D: Customer ratings

Customer opens the delivered order → rates the provider → rates the driver separately → both reviews are saved against the correct entities → both rating aggregates update correctly → repeat submissions do not create duplicates.

### Scenario E: Driver reassignment

First driver declines or allows the assignment to expire → delivery is offered to another eligible driver → only one driver becomes assigned → customer and provider receive the correct updates.

### Scenario F: Payment and cancellation

Payment fails or a confirmed order is cancelled under an allowed policy → the correct status transition occurs → required refunds or authorization releases are recorded → no duplicate charges or refunds occur.

### Scenario G: Unauthorized operations

A customer attempts to change an order to delivered → a driver attempts to complete another driver's delivery → an unrelated user attempts to view a private address → a user attempts to submit a rating for an unrelated order.

Each operation must be rejected by the backend.

### Scenario H: Concurrency and retries

Two drivers accept the same delivery simultaneously → only one assignment succeeds.

A checkout request is repeated → no duplicate order or charge is created.

A delivery confirmation is repeated → no duplicate completion or earnings record is created.

---

## 23. Final Acceptance Criteria

Do not consider the task complete merely because the pages exist or the application compiles.

The implementation is ready for review only when:

1. Both ordering methods work end to end.
2. Provider requests, offers, and confirmations use persistent database records.
3. Exactly one valid order results from selecting an offer.
4. Confirmed delivery-required orders can enter the delivery assignment process.
5. Driver assignment cannot be won by two drivers.
6. Pickup and delivery use the configured verification rules.
7. The customer sees genuine driver location updates when location permissions and network connectivity allow.
8. Delivered orders unlock separate provider and driver ratings.
9. Rating aggregates update from valid reviews only.
10. Payments, refunds, earnings, and commissions reconcile correctly under the configured financial policy.
11. Notifications follow actual backend events.
12. Invalid transitions, unauthorized access, and duplicate operations are rejected.
13. Critical integration tests pass.
14. Failed tests are fixed and rerun.
15. No critical workflow depends on hardcoded success responses or fabricated data.

Provide a final implementation report listing the files changed, database migrations, APIs, integrations, test cases executed, test results, remaining limitations, and any external configuration or credentials still required.

If an existing feature is incomplete, implement and verify it. If an external service is not configured, clearly identify the blocker rather than pretending that the integration works.

**Final goal:** A connected TiffinLink system in which the customer can request or order food, the provider can respond and prepare it, a delivery partner can collect and deliver it, the customer can track the delivery, and the customer can rate both the provider and delivery partner—with every important action correctly saved, authorized, and tested.