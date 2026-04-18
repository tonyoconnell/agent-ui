# Changelog — @oneie/templates

## 0.2.0

- 30 presets total (was 16): added `tutor`, `researcher`, `coach` (edu); `telegram-bot`, `discord-bot`, `notifier` (edge); `creative-director`, `copywriter` (creative); `concierge`, `classifier`, `triage`, `escalation` (support); `data-analyst`, `qa-engineer` (tech)
- `buildWorld(name, presets[])` — compose multiple presets into a named world with deploy instructions
- `buildTeam(cluster, size?)` — generate a cluster of agents by role (`csuite`, `marketing`, `support`, `edu`, `creative`, `edge`, `tech`)
- `TEMPLATES_VERSION` export — `"0.2.0"`

## 0.1.0

- Initial release: `generate()`, `listPresets()`, `registry`, base agent presets.
