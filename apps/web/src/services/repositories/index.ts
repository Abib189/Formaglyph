import { isSupabaseMode } from "../dataMode";
import { LocalRepository } from "./local";
import { SupabaseRepository } from "./supabase";

export const repository = isSupabaseMode ? new SupabaseRepository() : new LocalRepository();
export type { CandidateAssetInput, FormaglyphRepository, MembershipRole, ProjectAccess, WorkspaceData } from "./types";
