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

reset-vm:
	gcloud compute instances reset $(shell terraform output -raw vm_name) \
	--project=$(shell  terraform output -raw project_id) \
	--zone=$(shell terraform output -raw zone)

ssh-vm:
	gcloud compute ssh $(shell terraform output -raw vm_name) \
		--project=$(shell terraform output -raw project_id) \
		--zone=$(shell terraform output -raw zone) \
		--tunnel-through-iap