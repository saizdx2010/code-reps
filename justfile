# List available recipes.
default:
    @just --list

# Install dependencies from the lockfile.
install:
    yarn install --frozen-lockfile

# Start the development server.
dev:
    yarn dev

# Typecheck and build the app.
build:
    yarn build

# Lint the source.
lint:
    yarn lint

# Run the test suite.
test:
    yarn test

# Run lint, build, tests, and content validation.
check:
    yarn lint
    yarn build
    yarn test
    yarn content:check

# Run every check, including the Chromium browser flows (reuses the build from check).
check-all: check
    E2E_SKIP_BUILD=1 yarn test:e2e

# Preview the production build.
preview:
    yarn preview

# Run the local server after building the app.
serve: build
    yarn serve

# Create the portable bundle.
package:
    yarn package
