#!/bin/bash
set -e

SERVER_MODE=${SERVER_MODE:-normal}
CLINIC_OPTION=${CLINIC_OPTION:-doctor}
CLINIC_INTERVAL=${CLINIC_INTERVAL:-10}

case $SERVER_MODE in
  normal)
    exec node --max-old-space-size=250 /app/dist/server
    ;;
  inspect)
    exec node --max-old-space-size=250 --inspect=0.0.0.0:9229 /app/dist/server
    ;;
  clinic)
    exec sh -c "clinic $CLINIC_OPTION --sample-interval $CLINIC_INTERVAL --collect-only -- node --max-old-space-size=250 /app/dist/server.js; sleep 120"
    ;;
  *)
    echo "Error: Unknown SERVER_MODE '$SERVER_MODE'"
    echo "Valid options: normal, inspect, clinic"
    exit 1
    ;;
esac

