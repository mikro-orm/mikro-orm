#!/usr/bin/env bash
# Retries `lerna publish` as a safety net for transient registry/sigstore failures.
# `from-package` only picks up packages missing from the registry, so retrying never
# republishes anything. The common failure mode (Rekor answering slowly, sigstore timing
# out and retrying the same signature, "409 an equivalent entry already exists", then the
# follow-up fetch of that entry timing out as well) is handled at the source by the sigstore
# patch in .yarn/patches: a 30s Rekor timeout instead of 5s, plus fetching the existing
# entry on conflict. Rekor outages tend to last a few minutes, so the attempts here are
# spread over several minutes instead of giving up within one.
set -uo pipefail

attempts=${PUBLISH_ATTEMPTS:-5}
delay=${PUBLISH_RETRY_DELAY:-60}
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
