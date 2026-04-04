# ONE Substrate — Development Workflow
# Proven pattern from ../ants-at-work/Makefile

SHELL := /bin/bash

# ── Dev ──────────────────────────────────────────────

.PHONY: dev build preview

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

# ── Deploy ───────────────────────────────────────────

.PHONY: deploy deploy-preview

deploy: build
	@echo "=== Deploying to Cloudflare Pages ==="
	./scripts/deploy.sh

deploy-preview: build
	@echo "=== Deploying preview ==="
	./scripts/deploy.sh preview

# ── Git ──────────────────────────────────────────────

.PHONY: push

push:
	@echo "=== Push to GitHub ==="
	git add -A
	@read -p "Commit message: " msg; git commit -m "$$msg"
	git push origin main
