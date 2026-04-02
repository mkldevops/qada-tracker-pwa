#!/bin/bash
# PreToolUse hook — fires before a Bash tool call.
# If the command is a git commit, asks Claude to update Changelog.tsx first
# so the changelog entry is included in the same commit.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only act on git commit commands
if ! echo "$COMMAND" | grep -qE 'git commit'; then
  exit 0
fi

# Extract commit message (handles -m "..." and heredoc EOF style)
MSG=$(echo "$COMMAND" | sed -n "s/.*-m[[:space:]]*[\"']\([^\"']*\)[\"'].*/\1/p")
# Fallback: heredoc style (git commit -m "$(cat <<'EOF'...)")
if [ -z "$MSG" ]; then
  MSG=$(echo "$COMMAND" | grep -oP "(?<=commit -m \")([^\"]+)" | head -1)
fi

if [ -z "$MSG" ]; then
  exit 0
fi

# Skip if the commit message itself is a changelog update (prevents infinite loop)
if echo "$MSG" | grep -qiE '^chore\(changelog\)|^\[skip changelog\]|changelog.*entr'; then
  exit 0
fi

# Get current version from package.json
VERSION=$(jq -r '.version' "$CLAUDE_PROJECT_DIR/package.json" 2>/dev/null || echo "unknown")
TODAY=$(date +%Y-%m-%d)

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "BEFORE running this git commit, you MUST first: 1) Update src/components/Changelog.tsx — insert a new ChangelogEntry at the TOP of the ENTRIES array with version '$VERSION', date '$TODAY', and both 'fr' and 'en' translations based on the commit message: \"$MSG\". 2) Run git add src/components/Changelog.tsx. Only then run the original commit command so the changelog is included in the same commit."
  }
}
EOF
