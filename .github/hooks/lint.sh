#!/usr/bin/env bash
# Lints the project after Copilot edits a file.
#
# Reads the postToolUse payload on stdin (unused — oxlint is fast enough to
# check everything, and toolArgs shapes vary per tool). On failure it returns
# additionalContext so the agent sees the errors and can fix them itself.
set -uo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0

# Durable proof the hook actually fired, independent of what any UI shows.
printf '%s  fired (tool=%s)\n' "$(date '+%Y-%m-%d %H:%M:%S')" "${TOOL_NAME:-?}" \
  >> .github/hooks/hook-runs.log

# Progress lines are visible in the Copilot UI, so a passing run is not silent.
echo '{"type": "progress", "message": "oxlint: checking…", "temporary": true}'

if output=$(npx --no-install oxlint 2>&1); then
  echo '{"type": "progress", "message": "oxlint: clean ✓"}'
else
  echo '{"type": "progress", "message": "oxlint: problems found ✗"}'
  jq -nc --arg out "$output" \
    '{additionalContext: ("oxlint reported problems. Fix them before continuing:\n\n" + $out)}'
fi

exit 0
