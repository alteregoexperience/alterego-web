# ALTER EGO Web - Project Instructions for Codex

## Project overview

This is a web app for ALTER EGO events, ticket sales and real-time rankings.

Stack:

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- Supabase
- Stripe Checkout
- Resend
- QR generation
- PDF ticket generation

Main goals:

- Professional event/ticketing experience
- Admin panel for events, tickets and participants
- Real-time ranking for large club screens
- Clean, production-ready code
- Minimal, safe changes

## Style and UX

Global aesthetic:

- Dark background
- Black/purple gradients
- Purple accent color
- Subtle purple glow
- Zinc borders
- Light glassmorphism
- Large readable layouts for ranking screens
- Keep UI clean, simple and professional

Do not make large visual redesigns unless explicitly asked.
When improving UI, preserve existing layout and logic unless the user asks otherwise.

## Supabase data model

### events

Represents events.

Fields:

- id uuid primary key
- slug text unique not null
- title text not null
- description text nullable
- location text nullable
- starts_at timestamp with time zone not null
- ends_at timestamp with time zone nullable
- status text not null default 'draft'
- cover_image_url text nullable
- is_visible boolean default false
- ticket_sales_start_at timestamp with time zone nullable
- created_at timestamp with time zone default now()

Important:

- Use events.id as event_id in related tables.
- Use slug for public/admin event routes when applicable.
- Events may exist even if tickets are not yet on sale.

### event_ticket_types

Represents ticket types for an event.

Fields:

- id uuid primary key
- event_id uuid references events(id) on delete cascade
- name text not null
- description text nullable
- price numeric not null
- stock integer nullable
- sold integer default 0
- status text default 'active'
- order_index integer default 0
- created_at timestamp

Important:

- stock = null means unlimited stock.
- sold tracks the number of tickets sold for that ticket type.
- Available stock logic should be based on stock and sold.
- Only active ticket types should usually be offered for sale.

### orders

Represents a buyer order/purchase.

Fields:

- id uuid primary key
- event_id uuid references events(id) on delete cascade
- buyer_name text not null
- buyer_birthdate date not null
- buyer_email text not null
- buyer_phone text not null
- total_amount numeric not null
- status text not null default 'pending'
- created_at timestamp with time zone default now()
- stripe_checkout_session_id text nullable
- stripe_payment_intent_id text nullable
- fulfilled_at timestamp with time zone nullable
- stripe_session_id text nullable

Allowed status values:

- pending
- paid
- failed
- cancelled

Important:

- Stripe webhook is the source of truth for paid orders.
- Do not rely on the success page as the source of truth for payment completion.
- Be careful: the schema currently has both stripe_checkout_session_id and stripe_session_id. Prefer stripe_checkout_session_id for new logic unless existing code clearly requires otherwise.
- Do not duplicate orders if Stripe retries the webhook.
- Use Stripe session id idempotently.

### tickets

Represents actual generated tickets.

Fields:

- id uuid primary key
- order_id uuid references orders(id) on delete cascade
- event_id uuid references events(id) on delete cascade
- ticket_type_id uuid references event_ticket_types(id) on delete cascade
- qr_code text unique not null
- used boolean not null default false
- used_at timestamp with time zone nullable
- created_at timestamp with time zone default now()

Important:

- tickets is the source of truth for QR validation.
- QR validation must check tickets.qr_code.
- A valid ticket must exist, belong to the correct event, and have used = false.
- When validating a ticket, mark used = true and used_at = now().
- Do not expose service role keys to the client.

### participants

Represents the global participant catalog.

Fields:

- id uuid primary key
- name text not null
- instagram text nullable
- points integer not null default 0
- created_at timestamp with time zone default now()

Important:

- This is global.
- Do not count this table when the UI needs participants for a specific event.
- Do not delete all participants when replacing participants for one event unless explicitly required by the user.
- participants.points can represent a global ranking, but event-specific ranking should use event_participants.points.

### event_participants

Represents participants assigned to a specific event.

Fields:

- id uuid primary key
- event_id uuid references events(id) on delete cascade
- participant_id uuid references participants(id) on delete cascade
- points integer not null default 0
- created_at timestamp with time zone default now()

Constraints:

- unique(event_id, participant_id)

Important:

- This is the correct table for event-specific participant lists and event-specific ranking.
- Admin counters for participants in an event must count event_participants filtered by event_id.
- Event ranking should usually order by event_participants.points desc filtered by event_id.
- Replacing participants from Excel for one event should replace rows in event_participants for that event_id only.
- Do not affect participants assigned to other events.

## Business rules

### Stripe and checkout

- The user buys tickets through Stripe Checkout.
- The success page receives /checkout/success?session_id=...
- The success page may show a confirmation using session_id.
- The actual order/tickets should be created/fulfilled from Stripe webhook.
- The webhook must be idempotent because Stripe can retry events.
- Do not create duplicate orders or duplicate tickets.
- Do not increase sold twice for the same Stripe session.

### Ticket stock

- Ticket availability is based on event_ticket_types.stock and event_ticket_types.sold.
- If stock is null, treat it as unlimited.
- If stock is not null, available = stock - sold.
- Avoid overselling.
- Be careful when updating sold after successful purchase.

### QR validation

- Validate against tickets.qr_code.
- Reject if ticket does not exist.
- Reject if ticket belongs to another event.
- Reject if used = true.
- On success, set used = true and used_at = now().
- QR validation must run server-side.

### Participants and Excel import

Critical:

- participants is global.
- event_participants is event-specific.

When importing/replacing participants from Excel for an event:

1. Identify the current event_id.
2. Parse and validate Excel rows.
3. Create or reuse rows in participants.
4. Delete/replace only event_participants rows where event_id = current event.
5. Insert new event_participants rows for current event.
6. Do not remove event_participants for other events.
7. Do not count all participants globally for event counters.

When showing participant counters in the admin panel:

- Use event_participants filtered by event_id.
- Do not count participants globally unless the UI explicitly says it is a global total.

## Coding rules

- Use TypeScript.
- Prefer simple, readable code.
- Make minimal changes.
- Do not invent tables or fields.
- Do not rename existing routes or components unless required.
- Do not refactor unrelated code.
- Do not change business logic unrelated to the task.
- Do not touch .env.local or secrets.
- Do not expose Supabase service role keys to the client.
- For critical areas such as Stripe, Supabase, stock, tickets, QR or orders, first explain the plan before editing.

## Verification

After code changes, prefer running:

- npm run build

If there are lint/type commands in package.json, use those too.

For participant import and counters, manually verify:

1. Create/import participants for Event A.
2. Create/import participants for Event B.
3. Event A counter shows only Event A participants.
4. Event B counter shows only Event B participants.
5. Replacing Event A participants does not affect Event B.
6. Ranking for each event only uses event_participants for that event_id.

## How to respond

When asked to analyze:

- List files inspected.
- Explain the current behavior.
- Identify the real issue.
- Propose minimal changes.
- Mention risks.

When asked to edit:

- Apply minimal changes.
- Show the diff.
- Explain how to test.
