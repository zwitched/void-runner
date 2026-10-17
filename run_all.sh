#!/bin/bash
# runs every test_*.py (4 at a time) and prints BAD/ERRORS summary lines
cd "$(dirname "$0")"; python3 build.py >/dev/null; mkdir -p .tmp/logs
ls test_*.py | xargs -P 4 -I{} sh -c 'timeout 600 python3 {} > .tmp/logs/{}.log 2>&1; echo "{} exit=$?"'
for f in .tmp/logs/*.log; do echo "== $f"; grep -E "^(BAD|ERRORS)|Traceback|Error" $f | head -5; done
