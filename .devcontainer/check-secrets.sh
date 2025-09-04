#!/usr/bin/env bash
set -e

CONFIG_PATH="$HOME/.rclone.conf"

# Look in repo root first, then .devcontainer
if [ -f "$PWD/.rclone.conf.sandbox" ]; then
  SANDBOX_PATH="$PWD/.rclone.conf.sandbox"
elif [ -f "$PWD/.devcontainer/.rclone.conf.sandbox" ]; then
  SANDBOX_PATH="$PWD/.devcontainer/.rclone.conf.sandbox"
fi

if [ ! -f "$CONFIG_PATH" ]; then
  if [ -n "$SANDBOX_PATH" ]; then
    echo "⚠️ No $CONFIG_PATH found. Falling back to sandbox mode."
    cp "$SANDBOX_PATH" "$CONFIG_PATH"
    echo "✅ Sandbox Rclone config applied from: $SANDBOX_PATH"
  else
    echo "❌ No sandbox config found in repo root or .devcontainer."
    exit 1
  fi
else
  PLACEHOLDERS=$(grep -E 'changeme' "$CONFIG_PATH" || true)
  if [ -n "$PLACEHOLDERS" ]; then
    echo "⚠️ Some values in $CONFIG_PATH are still placeholders."
    echo "Please update tenant, token, and drive_id with real values."
  else
    echo "✅ Rclone config present."
  fi
fi
