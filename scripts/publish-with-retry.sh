#!/usr/bin/env bash
# Retries `lerna publish`, which flakes on sigstore provenance ("409 an equivalent entry
# already exists in the transparency log") when Rekor times out and the request is retried
# with the same signature. A fresh attempt signs with a new ephemeral key, so it goes
# through; `from-package` only picks up packages missing from the registry, so retrying
# never republishes anything.
set -uo pipefail

attempts=${PUBLISH_ATTEMPTS:-3}
delay=${PUBLISH_RETRY_DELAY:-30}

for i in $(seq 1 "$attempts"); do
  if "$@"; then
    exit 0
  fi

  if [ "$i" -lt "$attempts" ]; then
    echo "::warning::publish attempt $i/$attempts failed, retrying in ${delay}s"
    sleep "$delay"
  fi
done

echo "::error::publish failed after $attempts attempts"
exit 1
