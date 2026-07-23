create index if not exists candidates_asset_idx
  on public.candidates (asset_id);

create index if not exists candidates_validation_run_idx
  on public.candidates (validation_run_id)
  where validation_run_id is not null;

create index if not exists validation_issues_validation_run_idx
  on public.validation_issues (validation_run_id);
