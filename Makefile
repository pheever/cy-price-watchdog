SERVICE := ""

.PHONY: start stop restart watch logs migrate generate

start:
	docker compose up -d

stop:
	docker compose down

restart:
	docker compose restart $(SERVICE)

watch:
	docker compose watch

logs:
	docker compose logs -f $(SERVICE)

# Run database migrations
migrate:
	docker compose up migrate

# Regenerate Prisma client in api container
generate:
	docker compose exec api yarn prisma generate --schema=./prisma/schema.prisma

# Rebuild specific service
rebuild:
	docker compose up -d --build $(SERVICE)

reset:
	docker compose down -v

# --- Versioning ---

VALID_SERVICES := api scraper web
VALID_BUMPS := major minor patch

BUMP := patch

.PHONY: version release

_validate-service:
ifndef SERVICE
	$(error SERVICE is required (api|scraper|web))
endif
ifeq ($(filter $(SERVICE),$(VALID_SERVICES)),)
	$(error SERVICE must be one of: $(VALID_SERVICES))
endif

version: _validate-service
	@TAG=$$(git tag -l '$(SERVICE)/v*' --sort=-v:refname | head -n1); \
	if [ -z "$$TAG" ]; then \
		echo "$(SERVICE): v0.0.0 (no tags found)"; \
	else \
		echo "$(SERVICE): $${TAG#$(SERVICE)/}"; \
	fi

release: _validate-service
ifeq ($(filter $(BUMP),$(VALID_BUMPS)),)
	$(error BUMP must be one of: $(VALID_BUMPS))
endif
	@LATEST=$$(git tag -l '$(SERVICE)/v*' --sort=-v:refname | head -n1); \
	if [ -z "$$LATEST" ]; then \
		CURRENT="0.0.0"; \
	else \
		CURRENT=$${LATEST#$(SERVICE)/v}; \
	fi; \
	MAJOR=$$(echo "$$CURRENT" | cut -d. -f1); \
	MINOR=$$(echo "$$CURRENT" | cut -d. -f2); \
	PATCH=$$(echo "$$CURRENT" | cut -d. -f3); \
	case "$(BUMP)" in \
		major) MAJOR=$$((MAJOR + 1)); MINOR=0; PATCH=0 ;; \
		minor) MINOR=$$((MINOR + 1)); PATCH=0 ;; \
		patch) PATCH=$$((PATCH + 1)) ;; \
	esac; \
	NEXT="$(SERVICE)/v$$MAJOR.$$MINOR.$$PATCH"; \
	echo "Tagging $$NEXT (was $(SERVICE)/v$$CURRENT)"; \
	git tag "$$NEXT" && git push origin "$$NEXT"