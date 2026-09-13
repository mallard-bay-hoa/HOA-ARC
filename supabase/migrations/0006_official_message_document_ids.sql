-- Lets an official message (e.g. a resident's reply to an info request)
-- reference which of the request's documents were uploaded alongside it,
-- so the Communication & Vote tab can point the Board at the Documents
-- tab instead of leaving an upload silently undiscoverable.
alter table official_messages add column document_ids text[] not null default '{}';
