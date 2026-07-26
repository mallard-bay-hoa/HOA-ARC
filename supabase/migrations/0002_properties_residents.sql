-- Adds a real properties/residents roster so multiple people can share
-- access to a property's requests (e.g. spouses), and one person can be
-- linked to more than one property (residents <-> properties is
-- many-to-many via resident_properties, not a single FK column, precisely
-- to allow that). Email/name/phone belong to the person (residents);
-- address belongs to the property (properties) — they're separate tables
-- on purpose.

create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null unique,
  created_at timestamptz not null default now()
);

create table residents (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table resident_properties (
  resident_id uuid not null references residents(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resident_id, property_id)
);

create index resident_properties_property_id_idx on resident_properties(property_id);
create index residents_email_lower_idx on residents (lower(email));

alter table requests add column property_id uuid references properties(id);

-- Backfill: a property per distinct existing request address, and link
-- existing requests to it.
insert into properties (address)
select distinct address from requests
on conflict (address) do nothing;

update requests set property_id = properties.id
from properties
where requests.address = properties.address;

alter table properties enable row level security;
alter table residents enable row level security;
alter table resident_properties enable row level security;
