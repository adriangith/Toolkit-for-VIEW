#!/usr/bin/env bash
set -e

CONFIG_PATH="$HOME/.rclone.conf"
SANDBOX_PATH="/workspace/.rclone.conf.sandbox"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "⚠️ No $CONFIG_PATH found. Falling back to sandbox mode."
  cp "$SANDBOX_PATH" "$CONFIG_PATH"
  echo "✅ Sandbox Rclone config applied."
else
  PLACEHOLDERS=$(grep -E 'changeme' "$CONFIG_PATH" || true)
  if [ -n "$PLACEHOLDERS" ]; then
    echo "⚠️ Some values in $CONFIG_PATH are still placeholders."
    echo "Please update tenant, token, and drive_id with real values."
  else
    echo "✅ Rclone config present."
  fi
fi
