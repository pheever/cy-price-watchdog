.PHONY: fmt validate

fmt:
	terraform -chdir=bootstrap fmt -recursive
	terraform -chdir=main fmt -recursive

validate:
	terraform -chdir=bootstrap validate
	terraform -chdir=main validate
