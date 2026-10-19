# Docker on Windows, development from the Mac

The local Docker workloads can run on the Windows PC while the Mac remains the editor. This does not move or change the hosted Railway application or hosted Supabase project. Model generation remains a separate, paused milestone.

## Access

On the migration Mac, the `formaglyph-windows` SSH alias uses a dedicated key and verifies the PC's existing SSH host key. The Docker context uses that SSH transport; no unauthenticated Docker TCP port is needed.

```bash
ssh formaglyph-windows
docker --context formaglyph-windows info
docker --context formaglyph-windows ps
```

These names are machine-local configuration, not repository credentials. Another computer needs its own authorized SSH key and context. Keep the PC, Tailscale and Windows Docker Desktop running. Do not assume Docker Desktop starts before the Windows user signs in.

## Local ports

The migrated containers publish ports only on the Windows loopback interface. For the captured development stacks:

| Service | Formaglyph | Digital Home |
| --- | ---: | ---: |
| API gateway | 54331 | 55321 |
| PostgreSQL | 54322 | 55322 |
| Studio | 54323 | 55323 |
| Test mail | 54324 | 55324 |
| Analytics | 54327 | 55327 |

Formaglyph's captured gateway uses **54331**, not the default 54321 in the repository's fresh-development configuration. Preserve that distinction when connecting to the migrated stack.

After stopping the Mac's Docker engine, securely forward those ports:

```bash
ssh -N -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:54331:127.0.0.1:54331 \
  -L 127.0.0.1:54322:127.0.0.1:54322 \
  -L 127.0.0.1:54323:127.0.0.1:54323 \
  -L 127.0.0.1:54324:127.0.0.1:54324 \
  -L 127.0.0.1:54327:127.0.0.1:54327 \
  -L 127.0.0.1:55321:127.0.0.1:55321 \
  -L 127.0.0.1:55322:127.0.0.1:55322 \
  -L 127.0.0.1:55323:127.0.0.1:55323 \
  -L 127.0.0.1:55324:127.0.0.1:55324 \
  -L 127.0.0.1:55327:127.0.0.1:55327 \
  formaglyph-windows
```

Keep the tunnel running while using the local backend. Closing it disconnects development access without stopping the PC's containers. Do not start a second tunnel or restart Mac containers on the same ports. The public website does not depend on this tunnel.

## Restore and rollback boundaries

- Preserve logical dumps of every application/managed database and PostgreSQL roles. Restore with the same PostgreSQL/Supabase versions into newly created, migration-labelled containers; do not replace an ARM64 raw PostgreSQL directory on AMD64.
- Database backups contain Auth records and Storage metadata, but Storage file bytes require their own volume backups. Compare both data/security fingerprints and asset paths/content hashes after restoration.
- Capture required files in container writable layers too, including custom gateway configuration. Container inspection alone does not preserve those files. Generate fresh local TLS certificates rather than reusing an exposed or missing key.
- Pull or rebuild AMD64 images. Archived custom ARM64 images are rollback material, not Windows runtime images. Stopped generation containers must not be enabled as part of the database migration.
- Keep backup archives, source snapshots, private environment files, runtime Compose configuration and restore logs outside Git, in an access-restricted folder. Never upload them as CI artifacts or public links.
- In an SSH session, Windows Docker's interactive credential helper may be unavailable. An isolated Docker client configuration can pull public images without changing the user's normal Docker login. Include the installed Compose plugin directory and explicit anonymous registry entries so Docker does not auto-detect the Windows credential helper.
- Create local-only browser configuration for a transferred working copy. Do not accidentally test migrations against hosted credentials. Use publishable browser keys for hosted projects; a preserved legacy anonymous key is only a compatibility option for the isolated local stack.

The private migration scripts refuse an unexpected populated target, preserve bootstrap databases, verify checksums and record completion separately for databases, Storage and services. Reinspect partial restores rather than rerunning destructive reset commands.

Stopping Mac Docker is reversible and does not reclaim its stored images or volumes. Before uninstalling it or deleting its data, require complete Windows backup checksums, a successful local sign-in and application workflow test, and an agreed rollback plan. Build success and healthy containers alone do not prove every application workflow.

References: [Docker SSH contexts](https://docs.docker.com/engine/security/protect-access/), [Supabase backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Windows OpenSSH key management](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement).
