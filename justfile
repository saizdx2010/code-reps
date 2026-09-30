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

# Run all project checks.
check:
    yarn lint
    yarn test
    yarn build

# Preview the production build.
preview:
    yarn preview

# Run the local server after building the app.
serve: build
    yarn serve

# Create the portable bundle.
package:
    yarn package
