#!/bin/bash

if which swiftformat >/dev/null; then
  cd ios && swiftformat "$@" .
else
  echo "error: SwiftFormat is not installed. Install with 'brew install swiftformat' or manually from https://github.com/nicklockwood/SwiftFormat"
  exit 1
fi
