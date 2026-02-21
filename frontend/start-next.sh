#!/usr/bin/env bash
set -euo pipefail
cd /srv/sites/coins.cosigo.io/frontend
exec ./node_modules/.bin/next start -H 127.0.0.1 -p 3005
