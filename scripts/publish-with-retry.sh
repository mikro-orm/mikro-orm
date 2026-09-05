#!/usr/bin/env bash
# Retries `lerna publish`, which flakes on sigstore provenance ("409 an equivalent entry
# already exists in the transparency log") when Rekor times out and the request is retried
# with the same signature. A fresh attempt signs with a new ephemeral key, so it goes
# through; `from-package` only picks up packages missing from the registry, so retrying
# never republishes anything.
set -uo pipefail

attempts=${PUBLISH_ATTEMPTS:-3}
delay=${PUBLISH_RETRY_DELAY:-30}
root=$(git rev-parse --show-toplevel)

for i in $(seq 1 "$attempts"); do
  if "$@"; then
    exit 0
  fi

  if [ "$i" -lt "$attempts" ]; then
    # lerna rewrites the package.json files while packing and only restores them when the
    # publish completes, so a failed attempt leaves the tree dirty and the next one would
    # bail out with EUNCOMMIT before it even starts
    git -C "$root" checkout -- .
    echo "::warning::publish attempt $i/$attempts failed, retrying in ${delay}s"
    sleep "$delay"
  fi
done

echo "::error::publish failed after $attempts attempts"
exit 1
