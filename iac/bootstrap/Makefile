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
