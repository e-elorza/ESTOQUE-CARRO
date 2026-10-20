-- Home page highlights: an ordered list of up to 5 picks, each valid until a date.
-- featured_position orders the active picks (1 = hero); featured_until ends the pick.
-- The old `featured` flag is kept in sync by the admin so the previous release keeps
-- working during the rollout; drop it in a later migration.

alter table vehicles
  add column featured_position smallint check (featured_position > 0),
  add column featured_until timestamptz;

-- Carry over the current picks in the order the home page used (newest first), for 7 days.
update vehicles v
set featured_position = r.pos, featured_until = now() + interval '7 days'
from (
  select id, row_number() over (order by created_at desc) as pos
  from vehicles where featured
) r
where v.id = r.id;

create index vehicles_featured_idx on vehicles (featured_position) where featured_position is not null;
