# MLS Tour Planner — Optimized Product and Implementation Plan

**Version:** 2.0  
**Date:** July 23, 2026  
**Initial market:** New York / OneKey MLS  
**Primary users:** Buyer’s agents and their assistants  
**Document purpose:** Implementation specification for an AI coding agent or engineering team  
**Product stage:** MVP validation  

---

## 1. Product Summary

MLS Tour Planner is a mobile-friendly web application for planning and maintaining multi-property showing tours.

The product converts a list of property addresses into a feasible, timed itinerary. It accounts for:

- The agent’s overall tour window
- Property-specific showing availability
- Confirmed appointment times
- Visit duration
- Parking and access buffers
- Estimated driving time
- Required versus optional properties
- Manual ordering preferences

It also generates ready-to-copy appointment-request messages and tracks whether each showing has been requested, confirmed, declined, or offered an alternate time.

The product’s core value is not merely finding the shortest route. Its primary value is keeping the tour feasible while appointments are being confirmed and changed.

### Core workflow

```text
Candidate properties
    ↓
Proposed schedule
    ↓
Appointment requests
    ↓
Confirmations, declines, and alternate times
    ↓
Partial re-optimization
    ↓
Final executable tour
```

---

## 2. Product Principles

The implementation should follow these principles:

1. **Scheduling correctness comes before AI.**  
   All arrival times, conflicts, and route decisions must come from deterministic scheduling and mapping logic.

2. **Confirmed appointments are protected.**  
   Once a showing is confirmed, its appointment time becomes a hard constraint unless the user explicitly unlocks it.

3. **The system must explain infeasibility.**  
   If all requested stops cannot fit, show the conflict and actionable alternatives. Never silently omit a property.

4. **The agent remains in control.**  
   The user can lock stops, reorder stops, adjust durations, and accept or reject suggestions.

5. **Traffic estimates are estimates.**  
   Display buffers and warnings rather than presenting future traffic predictions as guaranteed.

6. **Data licensing boundaries are respected.**  
   Before MLS licensing is active, rely on addresses and user-entered listing-agent information. Do not scrape consumer listing websites.

7. **The MVP stays focused.**  
   Do not turn the first release into a CRM, brokerage platform, marketing system, or general real-estate database.

---

## 3. MVP Goals and Non-Goals

### 3.1 MVP goals

The MVP must allow an agent to:

- Sign in
- Create a showing tour
- Enter the tour date and available time
- Define a starting location and optional ending location
- Add 5–12 properties by address
- Enter showing availability and visit duration per property
- Prioritize properties
- Generate a feasible timed itinerary
- Review the route on a map and timeline
- Lock a stop at a specific time
- Reorder stops manually
- Understand scheduling conflicts
- Generate an appointment-request email or SMS draft
- Track appointment responses
- Re-optimize flexible stops around confirmed appointments
- Save, reopen, duplicate, and archive a tour
- Use the essential workflow on a phone

### 3.2 Explicit MVP non-goals

Do not implement the following unless the user later expands the scope:

- Full OneKey MLS/MLS Grid integration
- Consumer listing-site scraping
- Native iOS or Android applications
- Full client relationship management
- Brokerage teams, roles, or shared workspaces
- Direct email or SMS delivery
- Inbox monitoring or automatic response parsing
- Calendar synchronization
- Live turn-by-turn navigation
- Automatic tour-day rerouting
- Extensive AI features
- Brokerage analytics
- Custom report builder
- Multiple mapping providers
- General-purpose background-job infrastructure
- Separate object storage unless needed for a later export feature

---

## 4. Target Users

### 4.1 Buyer’s agent

The primary user is a licensed buyer’s agent planning several showings in one day. The agent needs a fast and trustworthy schedule, clear conflict warnings, and easy communication with listing agents.

### 4.2 Agent assistant

An assistant may prepare the route and appointment requests for an agent. In the MVP, assistants can use a normal account. Delegation and shared accounts are not required.

### 4.3 Brokerage administrator

Brokerage administration is a future persona and should not influence the MVP architecture beyond using tenant-safe ownership fields.

---

## 5. Terminology

- **Tour:** One planned outing containing multiple property showings.
- **Stop:** One property visit within a tour.
- **Tour window:** The earliest allowed tour start and latest allowed tour finish.
- **Availability window:** A period during which a showing may begin or occur.
- **Confirmed appointment:** A showing time accepted by the listing side.
- **Flexible stop:** A stop whose position and arrival time may be changed by optimization.
- **Locked stop:** A stop the optimizer must keep at a specified time and/or sequence position.
- **Service duration:** Expected time spent viewing the property.
- **Access buffer:** Time for parking, building entry, keys, elevators, or similar overhead.
- **Travel buffer:** Additional protection added to a drive-time estimate.
- **Route revision:** A saved result of an optimization or manual rescheduling operation.
- **Feasible plan:** A schedule satisfying every hard constraint.

---

## 6. Core User Journey

### 6.1 Create the initial proposal

1. The user signs in.
2. The user selects **New Tour**.
3. The user enters:
   - Tour name
   - Optional client display name
   - Tour date
   - Earliest start time
   - Latest finish time
   - Starting address
   - Optional ending address
   - Default visit duration
   - Default access buffer
   - Default travel buffer
4. The user pastes or enters property addresses.
5. The system standardizes and geocodes each address.
6. The user resolves any ambiguous or invalid address.
7. The user optionally enters for each stop:
   - MLS number
   - Listing-agent contact details
   - Availability window
   - Custom visit duration
   - Custom access buffer
   - Priority
   - Notes
8. The user selects **Build Schedule**.
9. The system returns:
   - A proposed visit order
   - Planned arrival and departure times
   - Drive-time estimates
   - Waiting time
   - Buffers
   - Any warnings
10. The user reviews the timeline and map.

### 6.2 Request appointments

1. The user opens a stop.
2. The system generates email and SMS drafts from deterministic templates.
3. The user copies the appropriate message.
4. The user marks the stop as **Requested**.
5. The application records the requested time and status change.

### 6.3 Process a response

The user records one of the following:

- **Confirmed:** The proposed time was accepted.
- **Declined:** The property cannot be shown.
- **Alternate proposed:** The listing side offered another time or window.
- **No response:** The request remains pending.

When a stop becomes confirmed:

1. The confirmed time becomes a hard scheduling constraint.
2. The stop becomes locked by default.
3. The system determines whether the current plan is still feasible.
4. If needed, it offers to re-optimize the remaining flexible stops.
5. The user previews the changes before applying them.

### 6.4 Finalize the tour

1. All required stops are either confirmed or intentionally left flexible.
2. The user reviews unresolved warnings.
3. The user changes the tour status to **Confirmed**.
4. The application provides a clean mobile itinerary and printable view.

---

## 7. Tour and Appointment States

### 7.1 Tour status

Use the following state values:

```text
DRAFT
PLANNED
REQUESTING
PARTIALLY_CONFIRMED
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELLED
ARCHIVED
```

Suggested transitions:

```text
DRAFT → PLANNED
PLANNED → REQUESTING
REQUESTING → PARTIALLY_CONFIRMED
PARTIALLY_CONFIRMED → CONFIRMED
CONFIRMED → IN_PROGRESS
IN_PROGRESS → COMPLETED
Any active state → CANCELLED
Any finished state → ARCHIVED
```

The UI may infer intermediate statuses from stop states, but the stored status should remain explicit and auditable.

### 7.2 Appointment status

Each stop must use one of:

```text
NOT_REQUESTED
REQUESTED
CONFIRMED
DECLINED
ALTERNATE_PROPOSED
CANCELLED
```

### 7.3 Priority

Each stop must use one of:

```text
MUST_SEE
PREFERRED
OPTIONAL
```

### 7.4 Scheduling mode

Each stop must support:

```text
FLEXIBLE
TIME_LOCKED
ORDER_LOCKED
TIME_AND_ORDER_LOCKED
```

For the MVP, `FLEXIBLE` and `TIME_LOCKED` are mandatory. Order locking may be included if it does not materially delay delivery.

---

## 8. Functional Requirements

### 8.1 Authentication and account

Requirements:

- Email magic link or OAuth sign-in
- Sign out
- Authenticated routes
- Every record scoped to its owner
- Basic profile:
  - Full name
  - Phone
  - Email
  - Brokerage name
  - Optional license number
- Settings:
  - Default visit duration
  - Default access buffer
  - Default travel buffer
  - Default starting address
  - Time zone

Do not expose user-managed AI or mapping API keys.

### 8.2 Tour management

Requirements:

- Create, view, edit, duplicate, archive, and cancel a tour
- List active and recent tours
- Filter by status and date
- Autosave form changes
- Confirm before discarding unsaved destructive changes
- Store all timestamps in UTC
- Display times in the tour’s configured IANA time zone
- Prevent the latest finish from preceding the earliest start
- Warn when the tour duration is unusually short or long

### 8.3 Property entry

Supported input:

- One address at a time
- Bulk paste, one address per line
- Optional MLS number beside an address

For every pasted row:

1. Parse the input.
2. Geocode the address.
3. Store both the original input and normalized address.
4. Display confidence or ambiguity when available.
5. Require the user to resolve failed or ambiguous results.

Do not allow unresolved stops into optimization.

Duplicate detection:

- Warn when two stops resolve to the same normalized address or coordinates.
- Allow the user to keep a duplicate intentionally.

### 8.4 Stop editing

Every stop must support:

- Original input
- Normalized address
- Latitude and longitude
- Optional MLS number
- Optional list price and basic property summary
- Listing-agent name
- Listing-agent email
- Listing-agent phone
- Brokerage name
- Visit duration
- Access buffer
- One or more availability windows
- Priority
- Appointment status
- Confirmed time
- Proposed time
- Lock state
- Agent notes
- Client-facing notes

Default visit duration and buffers should be copied from tour settings when a stop is created. Later changes to account defaults must not retroactively alter existing stops.

### 8.5 Availability windows

The MVP should support at least one window per stop. The data model should allow multiple windows.

Examples:

- Available any time during the tour
- Available only from 11:00 AM to 12:00 PM
- Confirmed for 1:30 PM
- Available from 10:00–11:00 AM or 2:00–3:00 PM

Validation:

- Window end must be after window start.
- The UI should warn when a window lies outside the overall tour window.
- A confirmed appointment should automatically create or replace the relevant hard window.

### 8.6 Route generation

The system must:

- Optimize a single vehicle
- Respect tour start and end
- Respect start and optional end location
- Respect visit durations
- Respect confirmed times
- Respect hard availability windows
- Consider soft availability preferences
- Include access and travel buffers
- Prefer higher-priority stops
- Return skipped or infeasible stops explicitly
- Persist a route revision

The optimization operation should be idempotent for an identical input snapshot where practical.

### 8.7 Manual editing

The itinerary UI must allow:

- Dragging a stop to another position
- Locking or unlocking a stop time
- Editing the planned arrival
- Editing visit duration and buffers
- Removing a stop
- Re-running optimization
- Recalculating times without changing order
- Previewing proposed changes before applying them

After a manual reorder:

- Recalculate drive and schedule times.
- Do not silently move confirmed stops.
- Display any newly created conflict immediately.

### 8.8 Conflict handling

The application must distinguish:

- Invalid address
- Stop availability conflict
- Confirmed appointment conflict
- Insufficient driving time
- Tour-end overrun
- Start-location conflict
- End-location conflict
- Duplicate property
- Unreachable route
- Mapping-provider failure
- Optimization-provider failure

For infeasible schedules, show:

- A concise explanation
- The affected stops
- The amount of time by which the plan fails
- At least one actionable remedy when possible

Suggested remedies:

- Increase the tour end time
- Start earlier
- Shorten a visit
- Reduce a buffer
- Move a flexible showing
- Remove an optional stop
- Request another appointment window

### 8.9 Appointment messages

The MVP must use deterministic templates with variable replacement.

Initial variables:

```text
{{agent_name}}
{{agent_phone}}
{{agent_email}}
{{agent_brokerage}}
{{client_name}}
{{listing_agent_name}}
{{listing_address}}
{{mls_number}}
{{proposed_arrival_time}}
{{proposed_departure_time}}
{{visit_duration}}
{{tour_date}}
{{tour_day}}
```

Provide:

- One default email template
- One default SMS template
- Copy-to-clipboard
- Editable draft text
- A visible warning for missing variables
- A status action to mark the request as sent/requested

Default email:

```text
Subject: Showing request for {{listing_address}} on {{tour_date}}

Hi {{listing_agent_name}},

I would like to request a showing of {{listing_address}} on {{tour_date}} at approximately {{proposed_arrival_time}} for {{visit_duration}} minutes.

Please let me know whether that time works or if another nearby time is preferred.

Thank you,
{{agent_name}}
{{agent_brokerage}}
{{agent_phone}}
```

Default SMS:

```text
Hi {{listing_agent_name}}, this is {{agent_name}} with {{agent_brokerage}}. May I show {{listing_address}} on {{tour_date}} at approximately {{proposed_arrival_time}} for {{visit_duration}} minutes? Please let me know if that time or a nearby time works. Thank you.
```

### 8.10 Printable and mobile itinerary

The MVP should provide:

- A mobile timeline view
- Address
- Planned arrival and departure
- Appointment status
- Drive time to next stop
- Listing-agent contact
- Notes
- Open-in-maps action
- Browser print styling

A generated PDF file is deferred. A high-quality print stylesheet is sufficient for the MVP.

---

## 9. Scheduling and Optimization Rules

### 9.1 Time calculation

For each stop:

```text
planned_departure =
    planned_arrival
    + access_buffer_before
    + visit_duration
    + access_buffer_after
```

If the MVP stores only one access buffer, apply it before the visit unless the product team chooses a documented split.

The next arrival is:

```text
next_arrival =
    previous_departure
    + estimated_drive_time
    + travel_buffer
```

### 9.2 Interpreting showing windows

Mapping and routing APIs may treat a stop’s time window as a constraint on the visit start. The application must translate business windows correctly.

If the showing must finish within a window:

```text
latest_valid_start =
    window_end
    - visit_duration
    - applicable_access_buffer
```

Example:

- Showing window: 1:00–1:30 PM
- Visit duration: 20 minutes
- Required access buffer inside window: 5 minutes
- Latest valid start: 1:05 PM

Do not send the raw window end as the latest start unless the business meaning truly allows the visit to extend beyond the window.

### 9.3 Hard constraints

Hard constraints must never be violated:

- Tour date
- Overall earliest start
- Overall latest finish
- Confirmed appointment time
- Explicit hard showing windows
- Valid and reachable locations
- Locked stop rules

### 9.4 Soft constraints

Soft constraints may be violated at a defined penalty:

- Preferred but unconfirmed time
- Preferred visit order
- Avoiding excessive waiting
- Keeping a previous proposed time stable
- Minimizing driving
- Including optional stops

### 9.5 Optimization priority

Use the following objective hierarchy:

1. Preserve hard constraints.
2. Schedule all `MUST_SEE` stops.
3. Avoid lateness risk.
4. Preserve already communicated proposed times when possible.
5. Schedule `PREFERRED` stops.
6. Minimize total driving time.
7. Minimize excessive waiting time.
8. Schedule `OPTIONAL` stops.
9. Minimize unnecessary changes from the previous route revision.

The implementation may represent this hierarchy with sufficiently separated penalty weights. Keep weights centralized and configurable.

### 9.6 Stability during re-optimization

Re-optimization must not unnecessarily scramble the entire day.

When a new appointment is confirmed:

- Lock that stop.
- Preserve other confirmed stops.
- Penalize changes to times already sent to listing agents.
- Move flexible, unrequested stops first.
- Show a before-and-after comparison.

### 9.7 Dropped stops

If every stop cannot fit:

- Never hide a dropped stop.
- Return a reason code.
- Prefer dropping `OPTIONAL` before `PREFERRED`.
- Do not drop `MUST_SEE` unless no feasible schedule exists.
- Require user acknowledgment before applying a plan that excludes a stop.

### 9.8 Traffic handling

Use traffic-aware estimates when supported and appropriate.

Requirements:

- Store when route estimates were calculated.
- Label old estimates as stale.
- Provide **Refresh travel times**.
- Explain that future estimates use historical patterns and may change.
- Allow a default travel buffer.
- Surface potential lateness rather than promising an exact arrival.

Suggested display:

```text
Planned arrival: 11:20 AM
Recommended window: 11:20–11:30 AM
Travel estimate refreshed: 9:05 AM
```

---

## 10. User Interface

### 10.1 Required screens

1. Sign in
2. Tours dashboard
3. New/edit tour setup
4. Property entry and validation
5. Schedule workspace
6. Stop detail panel
7. Appointment message panel
8. Settings/profile
9. Mobile/print itinerary

### 10.2 Schedule workspace

Desktop layout:

```text
┌───────────────────────────────────────────────────────────┐
│ Tour name · Date · Status · Save · Re-optimize           │
├──────────────────────────────┬────────────────────────────┤
│ Timed stop list              │ Map                        │
│                              │                            │
│ 10:00  Stop 1               │ Numbered markers           │
│         Confirmed            │ Route polyline             │
│         25 min               │                            │
│         ↓ 18 min drive       │                            │
│ 10:48  Stop 2               │                            │
│         Requested            │                            │
│                              │                            │
├──────────────────────────────┴────────────────────────────┤
│ Warnings / conflicts / unscheduled stops                 │
└───────────────────────────────────────────────────────────┘
```

Mobile layout:

- Timeline is primary.
- Map is collapsible or on a separate tab.
- Main actions remain reachable with one hand.
- Important appointment state is never represented by color alone.
- Stop rows must have large touch targets.

### 10.3 Visual status language

Suggested semantics:

- Gray: Not requested
- Blue: Requested
- Green: Confirmed
- Amber: Alternate proposed or warning
- Red: Declined or conflict

Always combine color with an icon and text label.

### 10.4 Empty states

Provide useful empty states for:

- No tours
- No stops in a tour
- No route generated
- All stops declined
- No conflicts
- Mapping service unavailable

Each empty state should include the next available action.

---

## 11. Data Model

The exact ORM is flexible. The following model is the required logical structure.

### 11.1 UserProfile

```text
id                    UUID / auth user id
full_name             string
phone                 string nullable
email                 string
brokerage_name        string nullable
license_number        string nullable
default_start_address string nullable
default_visit_minutes integer default 25
default_access_minutes integer default 5
default_travel_buffer integer default 5
timezone              IANA timezone default America/New_York
created_at            timestamp
updated_at            timestamp
```

### 11.2 Tour

```text
id                    UUID
owner_id              UUID
name                  string
client_display_name   string nullable
status                TourStatus
tour_date             date
timezone              IANA timezone
earliest_start        timestamp
latest_finish         timestamp
start_input           string
start_address         string
start_latitude        decimal
start_longitude       decimal
end_input             string nullable
end_address           string nullable
end_latitude          decimal nullable
end_longitude         decimal nullable
default_visit_minutes integer
default_access_minutes integer
default_travel_buffer integer
notes                 text nullable
current_revision_id   UUID nullable
created_at            timestamp
updated_at            timestamp
archived_at           timestamp nullable
```

### 11.3 TourStop

```text
id                         UUID
tour_id                    UUID
source_type                MANUAL | MLS_GRID
source_key                 string nullable
original_input             string
normalized_address         string
place_id                   string nullable
latitude                   decimal
longitude                  decimal
geocode_status             RESOLVED | AMBIGUOUS | FAILED
geocode_provider           string
geocoded_at                timestamp
mls_number                 string nullable
list_price                 decimal nullable
property_summary           json nullable
listing_agent_name         string nullable
listing_agent_phone        string nullable
listing_agent_email        string nullable
listing_brokerage          string nullable
priority                   StopPriority
appointment_status         AppointmentStatus
scheduling_mode            SchedulingMode
visit_minutes              integer
access_before_minutes      integer
access_after_minutes       integer
travel_buffer_minutes      integer
proposed_start             timestamp nullable
confirmed_start            timestamp nullable
planned_arrival            timestamp nullable
planned_departure          timestamp nullable
planned_order              integer nullable
agent_notes                text nullable
client_notes               text nullable
created_at                 timestamp
updated_at                 timestamp
```

### 11.4 StopAvailabilityWindow

```text
id                  UUID
tour_stop_id        UUID
start_at            timestamp
end_at              timestamp
constraint_type     HARD | SOFT
must_finish_by_end  boolean default true
source              USER_ENTERED | CONFIRMED_APPOINTMENT
created_at          timestamp
updated_at          timestamp
```

### 11.5 RouteRevision

```text
id                    UUID
tour_id               UUID
revision_number       integer
status                SUCCESS | INFEASIBLE | FAILED
trigger               INITIAL | USER_REORDER | CONFIRMATION | EDIT | REFRESH
input_snapshot        json
provider_request_ref  string nullable
route_summary         json
warnings              json
created_by            UUID
created_at            timestamp
```

The input snapshot should contain enough scheduling data to explain or reproduce the revision without storing secrets.

### 11.6 RouteRevisionStop

```text
id                    UUID
route_revision_id     UUID
tour_stop_id          UUID
planned_order         integer nullable
arrival_at            timestamp nullable
departure_at          timestamp nullable
drive_seconds         integer nullable
drive_distance_meters integer nullable
wait_seconds          integer default 0
is_scheduled          boolean
unscheduled_reason    string nullable
warnings              json
```

### 11.7 MessageDraft

```text
id                    UUID
tour_stop_id          UUID
channel               EMAIL | SMS
subject               string nullable
body                  text
generated_from        DEFAULT_TEMPLATE | USER_EDIT | AI_REWRITE
proposed_time         timestamp nullable
copied_at             timestamp nullable
marked_requested_at   timestamp nullable
created_at            timestamp
updated_at            timestamp
```

### 11.8 AuditEvent

```text
id                    UUID
owner_id              UUID
tour_id               UUID nullable
tour_stop_id          UUID nullable
event_type            string
event_payload         json
created_at            timestamp
```

Audit events should cover important scheduling and MLS-data access changes, not every mouse interaction.

---

## 12. Technical Architecture

### 12.1 Recommended MVP stack

| Layer | Recommendation | Notes |
|---|---|---|
| Web application | Next.js with TypeScript | App Router is acceptable |
| UI | Tailwind CSS plus an accessible component library | Keep the component system consistent |
| Authentication | Supabase Auth | Magic link or supported OAuth |
| Database | Supabase PostgreSQL | Enable row-level security |
| Query layer | Choose one: Supabase client, Drizzle, or Prisma | Do not implement multiple query layers |
| Maps | Google Maps JavaScript API | Map, markers, and polyline |
| Geocoding | Google Geocoding or Places API | Store normalized results and provider IDs |
| Routing | Google Route Optimization API and/or Routes API | Single vehicle |
| Hosting | Vercel | Keep secrets server-side |
| Monitoring | Vercel logs plus an error tracker | Add structured events |

### 12.2 Services

Organize business logic into explicit services:

```text
AddressService
TourService
SchedulingService
RouteProvider
TemplateService
AppointmentService
ListingDataProvider
AuditService
```

Use interfaces around third-party providers:

```typescript
interface RouteProvider {
  optimize(input: RouteOptimizationInput): Promise<RouteOptimizationResult>;
  recalculateFixedOrder(input: FixedOrderRouteInput): Promise<RouteCalculationResult>;
}

interface ListingDataProvider {
  lookupByMlsNumber(mlsNumber: string): Promise<ListingLookupResult>;
}
```

Initially, `ListingDataProvider` may be a manual/no-op provider. This prevents MLS Grid assumptions from leaking throughout the application.

### 12.3 Background work

Do not add a job platform initially.

The following can run synchronously for an MVP-sized tour:

- Geocoding a small batch
- Optimizing 5–12 stops
- Recalculating a fixed route
- Rendering templates

Add background jobs only if observed request duration, retries, exports, or MLS synchronization justify them.

### 12.4 Secrets

Keep these server-side:

- Google Maps server API key
- Database service credentials
- Future MLS Grid token
- Future AI provider key

Use a separately restricted browser key for Maps JavaScript if required. Apply domain and API restrictions.

---

## 13. Application API

The implementation may use REST handlers or server actions. Keep business behavior equivalent to the following contract.

### 13.1 Tours

```text
POST   /api/tours
GET    /api/tours
GET    /api/tours/:tourId
PATCH  /api/tours/:tourId
POST   /api/tours/:tourId/duplicate
POST   /api/tours/:tourId/archive
POST   /api/tours/:tourId/cancel
```

### 13.2 Stops

```text
POST   /api/tours/:tourId/stops
POST   /api/tours/:tourId/stops/bulk
PATCH  /api/tours/:tourId/stops/:stopId
DELETE /api/tours/:tourId/stops/:stopId
POST   /api/tours/:tourId/stops/:stopId/lock
POST   /api/tours/:tourId/stops/:stopId/unlock
```

### 13.3 Geocoding

```text
POST /api/geocode
POST /api/geocode/batch
```

Responses must distinguish resolved, ambiguous, and failed inputs.

### 13.4 Scheduling

```text
POST /api/tours/:tourId/optimize
POST /api/tours/:tourId/recalculate
POST /api/tours/:tourId/preview-reoptimization
POST /api/tours/:tourId/apply-revision/:revisionId
GET  /api/tours/:tourId/revisions
```

`preview-reoptimization` must not overwrite the current route.

### 13.5 Appointment actions

```text
POST /api/tours/:tourId/stops/:stopId/requested
POST /api/tours/:tourId/stops/:stopId/confirm
POST /api/tours/:tourId/stops/:stopId/decline
POST /api/tours/:tourId/stops/:stopId/alternate
```

### 13.6 Messages

```text
POST  /api/tours/:tourId/stops/:stopId/messages/generate
PATCH /api/tours/:tourId/stops/:stopId/messages/:messageId
POST  /api/tours/:tourId/stops/:stopId/messages/:messageId/copied
```

### 13.7 API rules

- Authenticate every endpoint.
- Verify ownership at the database boundary.
- Validate input with a schema library.
- Return stable machine-readable error codes.
- Do not expose provider credentials or raw sensitive provider responses.
- Apply rate limits to geocoding and optimization.
- Use request IDs for troubleshooting.

---

## 14. Route Provider Integration

### 14.1 Provider request construction

Translate the internal model into the provider model:

- One vehicle
- Vehicle start and end location
- Vehicle operating window
- One task/shipment per property
- Visit/service duration
- Stop hard or soft time windows
- Penalty costs based on priority
- Locked appointment constraints

Centralize:

- Priority penalties
- Lateness penalties
- Change-stability penalties
- Waiting cost
- Travel cost
- Default optimization timeout

### 14.2 Provider response normalization

Convert provider output to an internal result:

```typescript
type RouteOptimizationResult = {
  status: "SUCCESS" | "INFEASIBLE" | "FAILED";
  stops: Array<{
    stopId: string;
    order: number | null;
    arrivalAt: string | null;
    departureAt: string | null;
    driveSeconds: number | null;
    distanceMeters: number | null;
    waitSeconds: number;
    scheduled: boolean;
    reasonCode?: string;
    warnings: string[];
  }>;
  totals: {
    driveSeconds: number;
    visitSeconds: number;
    waitSeconds: number;
    distanceMeters: number;
  };
  warnings: string[];
};
```

### 14.3 Failure behavior

If the provider is unavailable:

- Preserve the last successful route.
- Do not clear planned times.
- Display a retryable error.
- Allow manual fixed-order editing when existing drive estimates are available.
- Record the failure without storing credentials or unnecessary raw payloads.

---

## 15. MLS Data Strategy

### 15.1 Pre-license MVP

Supported:

- Address entry
- Optional MLS number
- Manual listing-agent contact entry
- Manual basic property details

Not supported:

- Scraping Zillow, Realtor.com, Redfin, brokerage websites, or search results
- Treating public IDX pages as an unofficial enrichment API
- Displaying non-public MLS fields without authorization

### 15.2 MLS Grid phase

Run the licensing effort in parallel with MVP validation:

1. Register as an MLS Grid data consumer.
2. Confirm the correct broker/agent customer and sponsorship arrangement.
3. Describe the private, authenticated product use accurately.
4. Complete the applicable OneKey data license.
5. Confirm allowed resources, fields, retention, display, and auditing rules.
6. Implement a provider adapter.
7. Add field-level access controls.
8. Test data refresh and deletion requirements.

Current OneKey guidance states that technology vendors register through MLS Grid and publishes vendor fees of $250 per month for the feed plus $20 per month per license. Confirm pricing and terms again before contracting:

- [OneKey Data Delivery Resources](https://support.onekeymls.com/hc/en-us/articles/27251536794644-Data-Delivery-Resources)

### 15.3 Cache behavior

Do not select a fixed TTL until the applicable license is reviewed.

The future listing cache should record:

- Provider
- Provider key
- Retrieved time
- Last modified time when available
- Expiration time
- Field provenance
- License/customer context

The tour stop should retain a permitted snapshot so that a saved itinerary does not unexpectedly change when current listing data is refreshed.

---

## 16. Optional AI Layer

AI is not required for the MVP’s core workflow.

### 16.1 Permitted later uses

- Rewrite an appointment request in a selected tone
- Summarize the tour for the buyer
- Convert free-form scheduling notes into a proposed structured constraint
- Explain an infeasible route in plain language

### 16.2 Prohibited uses

- Calculating arrival or departure times
- Choosing a route without deterministic validation
- Silently changing confirmed appointments
- Inventing listing details or contact information
- Sending a message without explicit user action
- Receiving unnecessary client or listing-agent personal data

### 16.3 Implementation rules

- Put the AI provider behind an interface.
- Keep the model name in configuration.
- Validate structured output.
- Treat all AI output as untrusted.
- Never execute AI-generated constraints until the user reviews them.
- Provide a deterministic fallback.
- Log usage and latency without logging unnecessary message content.
- Do not ask users to supply personal API keys.

DeepSeek currently documents `deepseek-v4-pro`, but the product must not depend permanently on a particular model:

- [DeepSeek API changelog](https://api-docs.deepseek.com/updates/)

---

## 17. Security, Privacy, and Compliance

### 17.1 Required controls

- Authentication for all application data
- Row-level security or equivalent ownership enforcement
- Server-side authorization checks
- TLS in transit
- Managed encryption at rest
- Restricted provider keys
- Input validation
- Output encoding
- CSRF protection where applicable
- Rate limiting on expensive endpoints
- Audit events for MLS access and important schedule changes
- Secure secret management
- Dependency and vulnerability monitoring

### 17.2 Data minimization

The MVP should store only an optional client display name. Do not require:

- Client phone
- Client email
- Budget
- Financing details
- Detailed buyer preferences

These fields do not improve the core scheduling workflow and create additional privacy obligations.

### 17.3 Logs

Do not log:

- Authentication tokens
- Provider secrets
- Full client contact details
- Full listing-agent messages by default
- Raw MLS responses unless explicitly permitted and securely protected

### 17.4 MLS visibility

The product is private and authenticated. Do not expose non-public MLS data through public share links. Before adding sharing, verify applicable MLS display rules.

---

## 18. Accessibility and Responsive Requirements

Target WCAG 2.2 AA for core workflows.

Requirements:

- Keyboard-accessible forms and controls
- Visible focus indicators
- Labels for every input
- Error messages connected to fields
- Sufficient color contrast
- Status conveyed by text and icon, not color alone
- Reduced-motion support
- Screen-reader labels for map-adjacent controls
- A non-map timeline containing all essential information
- Touch targets appropriate for mobile use
- No horizontally scrolling primary workflow on common phone widths

The application must remain usable if the visual map is unavailable.

---

## 19. Performance and Reliability

### 19.1 Targets

- Initial authenticated dashboard usable within 3 seconds on a typical broadband connection
- Local UI responses within 100 ms where no network call is required
- Five-to-twelve-stop optimization normally completes within 10 seconds
- Autosave uses debouncing and visible state
- Map code loads only where needed

### 19.2 Resilience

- Preserve form input across transient failures.
- Retry safe provider reads with bounded exponential backoff.
- Do not automatically retry mutations that may create duplicates without idempotency.
- Keep the last successful route revision.
- Mark stale travel estimates.
- Provide clear recovery actions.

### 19.3 Cost controls

- Set daily mapping and routing quotas.
- Create billing alerts.
- Cache geocoding results where provider terms permit.
- Do not re-optimize on every keystroke.
- Debounce address searches.
- Use field masks to request only required mapping fields.

Google currently bills single-vehicle route optimization per shipment and lists a free usage threshold. Verify current pricing before production:

- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Route Optimization usage and billing](https://developers.google.com/maps/documentation/route-optimization/usage-and-billing)

---

## 20. Analytics and Success Metrics

Use privacy-conscious product events.

### 20.1 Primary metrics

- Median time from tour creation to first feasible plan
- Percentage of tours producing a feasible plan
- Median stops per planned tour
- Percentage of confirmed stops requiring manual rescheduling
- Median manual edits after initial optimization
- Percentage of routes accepted without reordering
- Tours created per active user per week
- Percentage of new users creating a second tour within 14 days
- Self-reported planning minutes saved

### 20.2 Diagnostic events

Suggested events:

```text
tour_created
addresses_submitted
address_resolution_failed
optimization_started
optimization_succeeded
optimization_infeasible
optimization_failed
route_manually_reordered
stop_locked
appointment_marked_requested
appointment_confirmed
appointment_declined
alternate_time_recorded
reoptimization_previewed
reoptimization_applied
message_copied
tour_confirmed
tour_completed
```

Do not use “template generation used” as the principal success measure. The desired outcome is a feasible tour created more quickly.

---

## 21. Testing Strategy

### 21.1 Unit tests

Test:

- Template variable substitution
- Time-zone conversion
- Window-to-latest-start translation
- Visit and buffer calculations
- Status transition rules
- Priority and penalty mapping
- Conflict classification
- Ownership authorization helpers
- Provider response normalization

### 21.2 Integration tests

Test:

- Authenticated CRUD
- Row-level ownership isolation
- Geocoding success, ambiguity, and failure
- Optimization request construction
- Route revision persistence
- Confirming an appointment and previewing re-optimization
- Declining a stop
- Copying/editing a message
- Provider timeouts and recoverable failures

Use provider fakes for deterministic automated tests.

### 21.3 End-to-end scenarios

At minimum:

1. Five flexible stops produce a feasible route.
2. One fixed appointment forces flexible stops around it.
3. Two confirmed appointments conflict.
4. An optional stop cannot fit and is visibly unscheduled.
5. A must-see stop cannot fit and blocks finalization.
6. Manual reorder creates a tour-end overrun.
7. An ambiguous address must be resolved.
8. A declined stop is removed from the active plan.
9. An alternate time triggers a re-optimization preview.
10. A provider outage preserves the previous route.
11. A user cannot access another user’s tour.
12. The core workflow works at a common mobile viewport.

### 21.4 Scheduling test fixtures

Include deterministic fixtures for:

- No availability constraints
- Single hard window
- Multiple windows
- Exact confirmed time
- Waiting required
- End-location required
- Same-address duplicate
- Very long drive
- Daylight-saving transition
- Tour crossing midnight, if allowed

Prefer disallowing cross-midnight tours in the MVP unless a validated use case requires them.

---

## 22. Seed Data and Demo Mode

Provide development seed data with:

- One demo user
- One draft tour
- One feasible planned tour
- One partially confirmed tour
- Five to seven synthetic property addresses or clearly labeled test fixtures
- A mixture of appointment states and priorities
- One infeasible scenario

Do not use real client information.

If external API keys are unavailable in local development, support a clearly labeled mock route provider. Production must never silently use mock results.

---

## 23. Implementation Milestones

### Milestone 0 — Product validation prototype

**Estimated duration:** 1–2 weeks

Deliver:

- Address entry
- Geocoding
- Tour time window
- Basic visit duration
- Single-vehicle route result
- Timeline
- Basic map
- No production-grade account system required for a disposable prototype

Validate with at least five agents using realistic tours.

Questions to answer:

- Do agents plan before requesting appointments or after receiving availability?
- How often are exact appointment times required?
- What buffer defaults feel realistic?
- Is a map or timeline more important?
- How often do plans change after the first request?
- What is the accepted meaning of “approximately” in a showing request?

### Milestone 1 — Application foundation

Deliver:

- Project setup
- Authentication
- Database migrations
- Ownership security
- User profile/settings
- Tour dashboard
- Tour CRUD
- Automated test framework
- Deployment environments

Exit criteria:

- Users can securely create and reopen their own tours.
- Cross-user access tests fail as expected.

### Milestone 2 — Property and constraint entry

Deliver:

- Individual and bulk address entry
- Geocoding
- Ambiguity resolution
- Stop editing
- Availability windows
- Visit duration and buffers
- Priority
- Appointment status

Exit criteria:

- A user can prepare a fully validated scheduling input without editing database records manually.

### Milestone 3 — Scheduling engine

Deliver:

- Internal route-provider interface
- Google provider adapter
- Hard and soft constraint translation
- Optimization result normalization
- Route revision persistence
- Conflict classification
- Fixed-order recalculation

Exit criteria:

- The required scheduling fixtures pass.
- Infeasible stops are never silently discarded.

### Milestone 4 — Schedule workspace

Deliver:

- Timeline
- Map
- Drag reorder
- Time locking
- Recalculate
- Re-optimize
- Warnings
- Before/after re-optimization preview

Exit criteria:

- An agent can understand and safely modify a proposed plan on desktop and mobile.

### Milestone 5 — Appointment workflow

Deliver:

- Default email and SMS templates
- Template substitution
- Copy-to-clipboard
- Requested/confirmed/declined/alternate actions
- Automatic lock on confirmation
- Re-optimization preview after appointment changes

Exit criteria:

- The complete candidate-to-confirmed-tour workflow works without external messaging integrations.

### Milestone 6 — Hardening and pilot

Deliver:

- Accessibility pass
- Mobile QA
- Error tracking
- Analytics events
- Rate limits
- Quotas and billing alerts
- Print styling
- Seed/demo scenario
- Pilot feedback mechanism

Exit criteria:

- Five pilot agents can independently complete real planning workflows.
- No critical security or scheduling defects remain.

### Parallel workstream — MLS licensing

Begin immediately, but do not block Milestones 0–6.

Deliver:

- MLS Grid registration
- OneKey licensing clarification
- Confirmed field and retention rules
- Broker/agent customer arrangement
- Integration design

---

## 24. MVP Acceptance Criteria

The MVP is complete only when all of the following are true:

### Authentication and ownership

- A user can sign in and sign out.
- A user can access only their own tours and stops.
- Unauthorized requests receive an appropriate response.

### Tour creation

- A user can create a tour with valid date, time, start, and optional end.
- Invalid time ranges are rejected with a clear message.
- Changes persist and reload correctly.

### Property entry

- A user can bulk add at least 12 addresses.
- Resolved addresses show a normalized result.
- Failed or ambiguous addresses cannot enter optimization.
- Duplicate addresses generate a warning.

### Scheduling

- A feasible route contains ordered stops and calculated arrival/departure times.
- Confirmed appointments are not moved by re-optimization.
- Visit durations and buffers affect subsequent arrival times.
- The route respects the overall tour finish.
- Unscheduled stops remain visible with reason codes.
- An infeasible plan provides actionable guidance.

### Manual control

- A user can reorder stops and recalculate the route.
- A user can lock and unlock a stop.
- A change that causes a conflict is visibly reported.
- Re-optimization can be previewed before replacing the current plan.

### Appointment workflow

- A user can generate and edit email and SMS drafts.
- Missing template data is visible.
- Copy-to-clipboard works.
- A stop can be marked requested, confirmed, declined, or alternate proposed.
- Confirming a time locks the appointment and prompts schedule validation.

### Mobile and accessibility

- The full core workflow is usable on a phone-sized viewport.
- The itinerary remains usable without the map.
- Keyboard navigation works for core desktop actions.
- Status is not communicated by color alone.

### Reliability

- A route-provider error does not erase the last successful schedule.
- A stale route estimate is identified.
- Key application errors are observable without exposing secrets.

---

## 25. Deferred Roadmap

### Phase 1B — Licensed listing enrichment

- MLS Grid/OneKey provider
- MLS-number lookup
- Permitted listing-agent details
- Listing status
- Licensed showing instructions
- Refresh and field provenance

### Phase 2 — Communication

- Reusable user templates
- Direct email sending
- SMS provider
- Message history
- Delivery status
- Explicit consent and compliance workflows

### Phase 3 — Tour-day experience

- Progressive Web App
- Offline itinerary
- Refresh traffic estimates
- Late-running indicator
- Suggested rerouting
- Navigation handoff

### Phase 4 — Collaboration

- Assistants
- Brokerage workspaces
- Roles and permissions
- Shared templates
- Activity log

### Phase 5 — Integrations and intelligence

- Calendar export and synchronization
- Showing-platform integrations where permitted
- Client-facing tour view
- AI-assisted summaries and constraint interpretation
- Additional MLS markets
- Usage analytics for brokerages

Native applications should be considered only after strong repeated usage of the mobile web product.

---

## 26. Open Product Decisions

Resolve these through pilot interviews rather than engineering preference:

1. Does an availability window constrain showing start or the entire visit?
2. What default visit duration is most common?
3. Should parking/access buffer occur before, after, or on both sides of a showing?
4. How much travel buffer is appropriate by geography?
5. Should a confirmed appointment be represented as an exact start or a narrow permitted window?
6. How often do agents need multiple availability windows?
7. Do agents want the first property to act as the starting location?
8. How frequently is returning to the starting location required?
9. When a tour is infeasible, do agents prefer dropping a stop or extending the day?
10. Is “copy one message at a time” sufficient for the initial workflow?
11. What listing-agent data is actually present and permitted in the licensed OneKey feed?
12. Does the applicable MLS agreement permit the intended saved snapshots and client-facing output?

Use configurable defaults until pilot evidence supports a single behavior.

---

## 27. Instructions for the Building Agent

The AI or engineering agent implementing this plan should:

1. Inspect the existing repository before selecting packages or creating architecture.
2. Preserve existing project conventions when they are compatible with this specification.
3. Implement milestones in order.
4. Keep routing, appointment state, and UI concerns separated.
5. Put external providers behind interfaces.
6. Use migrations for every database change.
7. Add automated tests with each scheduling rule.
8. Use fake providers in tests.
9. Never silently drop a stop or move a confirmed appointment.
10. Avoid adding deferred features “for completeness.”
11. Document required environment variables in an example environment file without secrets.
12. Provide development seed data.
13. Run linting, type checks, unit tests, integration tests, and a production build before handoff.
14. Test the complete workflow at desktop and mobile sizes.
15. Record material assumptions in the project README.

If an implementation choice conflicts with a product rule in this document, the product rule wins unless the user explicitly approves the change.

---

## 28. Definition of Done

A feature is done when:

- Its user-facing behavior matches the acceptance criteria.
- Loading, empty, success, error, and permission states are handled.
- Ownership and authorization are enforced.
- Relevant events are observable.
- Unit or integration coverage exists for business rules.
- Mobile behavior has been checked.
- Accessibility has been considered.
- No secret or personal information is exposed in logs or client bundles.
- Documentation and environment requirements are current.

The MVP is done when a new agent can sign in, enter a realistic set of properties, create a feasible schedule, request appointments, record responses, re-optimize around confirmed appointments, and use the resulting itinerary on a phone without developer assistance.

---

## 29. Reference Documentation

- [OneKey MLS Data Delivery Resources](https://support.onekeymls.com/hc/en-us/articles/27251536794644-Data-Delivery-Resources)
- [Google Route Optimization API overview](https://developers.google.com/maps/documentation/route-optimization/overview)
- [Google Route Optimization time windows](https://developers.google.com/maps/documentation/route-optimization/concepts/time-windows)
- [Google Routes traffic behavior](https://developers.google.com/maps/documentation/routes/config_trade_offs)
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Route Optimization usage and billing](https://developers.google.com/maps/documentation/route-optimization/usage-and-billing)
- [DeepSeek API changelog](https://api-docs.deepseek.com/updates/)

