-- Optional user-entered note per scenario, so someone with several saved
-- plans can tell them apart before opening one. Nullable (typing a note is
-- optional) with a 100-character cap.
--
-- Unlike the resident/block dining mutual-exclusivity rule (deliberately
-- app-code-only, per the init migration's own comment), a plain length
-- limit is a real data-integrity constraint, not business logic that might
-- need to change independently of the schema -- a real `check` constraint
-- here is cheap, reliable insurance on top of the application-level check,
-- not a duplicate of it.
alter table scenarios
  add column note text,
  add constraint scenarios_note_length check (char_length(note) <= 100);
