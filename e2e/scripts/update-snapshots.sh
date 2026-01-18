#!/bin/bash
# Update visual regression snapshots using Docker (Linux environment)
# This ensures snapshots match what CI will see

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$E2E_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating visual regression snapshots using Docker...${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Use the official Playwright Docker image matching our version
PLAYWRIGHT_VERSION="v1.50.1"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"

echo "Using Playwright image: $IMAGE"
echo "Mounting: $ROOT_DIR -> /work"
echo ""

# Run the update command in Docker
# - Mount the entire repo so pnpm workspace works
# - Set working directory to e2e folder
# - Run only chromium project (matches CI)
docker run --rm \
  -v "$ROOT_DIR:/work" \
  -w /work \
  -e CI=true \
  "$IMAGE" \
  /bin/bash -c "
    cd /work && \
    npm install -g pnpm@10.12.4 && \
    pnpm install --frozen-lockfile && \
    pnpm build && \
    cd e2e && \
    pnpm e2e:update --project=chromium
  "

echo ""
echo -e "${GREEN}Snapshots updated successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the updated snapshots in e2e/tests/visual/__snapshots__/"
echo "  2. Commit the changes: git add e2e/tests/visual/__snapshots__ && git commit -m 'chore: update visual regression baselines'"
