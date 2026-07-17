.PHONY: setup dev build check test clean

## setup: install dependencies from scratch
setup:
	cd frontend && npm install

## dev: start the local dev server with hot reload
dev:
	cd frontend && npm run dev

## build: type-check + production build
build:
	cd frontend && npm run build

## check: full verification pipeline — must exit 0 before every commit
check: build test
	@echo "✓ make check passed — repository is in a consistent state."

## test: run the test suite
test:
	cd frontend && npm test

## clean: remove build output
clean:
	rm -rf frontend/dist
