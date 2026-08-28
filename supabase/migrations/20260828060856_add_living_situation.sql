-- Explicit field so "no housing selected" can be distinguished from "commuter,
-- deliberately no housing" -- previously only inferable from housing_rate_id
-- being null, which is ambiguous with "hasn't answered yet."

alter table scenarios
add column living_situation text not null check (living_situation in ('on_campus', 'commuter'));
