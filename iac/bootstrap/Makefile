ifneq (,$(wildcard .env))
  include .env
  export
endif

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
	curl -s -H "Authorization: Bearer $(TF_VAR_cloudflare_api_token)" \
    https://api.cloudflare.com/client/v4/user/tokens/verify | jq .
	curl -s -H "Authorization: Bearer $(TF_VAR_cloudflare_api_token)" \
	https://api.cloudflare.com/client/v4/user/tokens/permission_groups | jq