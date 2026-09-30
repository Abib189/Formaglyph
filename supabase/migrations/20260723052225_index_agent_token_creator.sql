create index project_access_tokens_creator_idx
  on private.project_access_tokens (created_by);
