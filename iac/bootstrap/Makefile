ifneq (,$(wildcard .env))
  include .env
  export
endif

TF_VAR_github_token ?= $(shell gh auth token)

.PHONY: init plan apply destroy fmt validate output

init:
	terraform init

plan:
	terraform plan

apply:
	terraform apply

destroy:
	terraform destroy

fmt:
	terraform fmt -recursive

validate:
	terraform validate

output:
	terraform output

test-cf-auth:
	curl -s -H "X-Auth-Key: $(TF_VAR_cloudflare_api_key)" \
	  -H "X-Auth-Email: $(TF_VAR_cloudflare_email)" \
	  https://api.cloudflare.com/client/v4/user | jq .status,.result.email

cf-permissions:
	@curl -s -H "X-Auth-Key: $(TF_VAR_cloudflare_api_key)" \
	  -H "X-Auth-Email: $(TF_VAR_cloudflare_email)" \
	  https://api.cloudflare.com/client/v4/user/tokens/permission_groups \
	  | jq '.result[] | select(.name | test("(?i)$(q)")) | {name, id}'