#!/bin/bash
# Run E2E tests in Docker (Linux environment) without affecting local node_modules
# This ensures tests run in the same environment as CI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$E2E_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to chromium project (matches CI)
PROJECT="${1:-chromium}"

echo -e "${YELLOW}Running E2E tests in Docker (Linux environment)...${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Use the official Playwright Docker image matching our version
PLAYWRIGHT_VERSION="v1.57.0"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"

echo "Using Playwright image: $IMAGE"
echo "Project: $PROJECT"
echo ""

# Run tests in Docker with isolated node_modules
# - Mount the repo as read-write for source files
# - Use anonymous volumes for node_modules directories to isolate from host
# - This prevents Docker's pnpm install from affecting your local node_modules
docker run --rm \
  -v "$ROOT_DIR:/work" \
  -v /work/node_modules \
  -v /work/packages/react/node_modules \
  -v /work/examples/react/node_modules \
  -v /work/examples/react-css-only/node_modules \
  -v /work/examples/react-custom/node_modules \
  -v /work/e2e/node_modules \
  -w /work \
  -e CI=true \
  "$IMAGE" \
  /bin/bash -c "
    cd /work && \
    npm install -g pnpm@10.12.4 && \
    pnpm install --frozen-lockfile && \
    pnpm build && \
    cd e2e && \
    pnpm e2e --project=$PROJECT
  "

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}E2E tests passed!${NC}"
else
  echo -e "${RED}E2E tests failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
