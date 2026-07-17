.PHONY: setup dev build check test clean

## setup: install dependencies from scratch
setup:
	npm install

## dev: start the local dev server with hot reload
dev:
	npm run dev

## build: type-check + production build
build:
	npm run build

## check: full verification pipeline — must exit 0 before every commit
check: build
	@echo "✓ make check passed — repository is in a consistent state."

## test: run the test suite (planned — see feature_list.json F07)
test:
	@echo "No unit tests yet. See feature_list.json (F07) for the verification plan."

## clean: remove build output
clean:
	rm -rf dist
