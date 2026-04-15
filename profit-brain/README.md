# Profit Brain — Vendored Doctrine

This folder contains a curated subset of files copied from the
[uncommonpope-png/Profits-brain](https://github.com/uncommonpope-png/Profits-brain) repository.

## Provenance

| Source repo | `uncommonpope-png/Profits-brain` (public) |
|---|---|
| Copy method | Manual vendor — see file list below |
| Last synced | 2026-04-15 |

## Files included

| File | Purpose |
|------|---------|
| `IDENTITY.md` | Who the entity is |
| `PLT-DIRECTIVE.md` | Core operating directive |
| `PLT-OPERATIONS.md` | Autonomous revenue + operational directives |
| `SOUL.md` | Personality and continuity guide |
| `TOOLS.md` | Tool setup notes |
| `AGENTS.md` | Workspace startup / heartbeat protocol |
| `SOUL_DELEGATION.md` | Soul army delegation system |
| `MEMORY.md` | Long-term memory (curated) |
| `profit_memory.json` | Compact working memory |
| `PROFIT_EXPANSION_LOG.md` | Expansion activity log |
| `HEARTBEAT.md` | Heartbeat / proactive check protocol |
| `SEO-ARMY-BATTLE-PLAN.md` | SEO strategy playbook |
| `SEO-ARMY-COMMAND.md` | SEO army command structure |

## How to update

To pull the latest versions from the source repo:

```bash
# Clone or pull the source
git clone https://github.com/uncommonpope-png/Profits-brain /tmp/profits-brain-sync

# Copy the desired files
FILES="IDENTITY.md PLT-DIRECTIVE.md PLT-OPERATIONS.md SOUL.md TOOLS.md AGENTS.md \
       SOUL_DELEGATION.md MEMORY.md profit_memory.json PROFIT_EXPANSION_LOG.md \
       HEARTBEAT.md SEO-ARMY-BATTLE-PLAN.md SEO-ARMY-COMMAND.md"

for f in $FILES; do
  cp /tmp/profits-brain-sync/$f ./profit-brain/$f
done

# Commit
git add profit-brain/
git commit -m "chore: sync profit-brain from Profits-brain $(date -u +%Y-%m-%d)"
```

## Important notes

- **Do not** commit API keys, tokens, or `.env` files here.
- Shell scripts from the source repo that reference external services are **not** included.
- The `entity-runtime/` server loads these files at startup to provide doctrine context to the entity.
