# Bootstrap

One-time Terraform module that creates the GCP foundation required by the main `iac/` module. Uses local state — run once, then move on to `iac/`.

## What It Creates

| Resource | Description |
|----------|-------------|
| GCP Project | Under org or folder, with billing linked |
| 11 GCP APIs | Compute, IAM, Cloud Run, Secret Manager, etc. |
| GCS Bucket | `${project_id}-tfstate` for remote state (versioned) |
| Terraform SA | `terraform@` — impersonated by main module |
| Cloud Run SA | `cloudrun-scraper@` — scraper runtime identity |
| GitHub Actions SA | `github-actions@` — CI/CD via WIF |
| WIF Pool + Provider | OIDC federation for GitHub Actions |
| 9 Secrets | Empty Secret Manager containers (values managed by main module) |
| Cloudflare API Token | Scoped token (Zone Read, DNS Write, Argo Tunnel Write) stored in Secret Manager |
| GitHub Actions Secrets | `WIF_PROVIDER`, `WIF_SA_EMAIL` for WIF-based CI/CD auth |
| GitHub Actions Variables | `GCP_PROJECT_ID`, `GCP_REGION` |

## Prerequisites

- Terraform >= 1.0
- Google Cloud SDK (`gcloud`) authenticated with org/folder admin permissions
- A GCP billing account ID — find it in the [Cloud Console](https://console.cloud.google.com/billing) or via `gcloud billing accounts list`
- A GitHub fine-grained Personal Access Token (PAT) with these repository permissions:
  - **Secrets** — Read and Write
  - **Variables** — Read and Write
  - Set an expiration date (e.g. 7 days) — the token is only needed during bootstrap
- A Cloudflare API token — create one in [API Tokens](https://dash.cloudflare.com/profile/api-tokens) using the **Create Custom Token** template with **API Tokens Write** permission (this bootstrap token creates a scoped token for the main module). Set a short TTL since it's only needed during bootstrap
- Your Cloudflare account ID — visible in the [dashboard](https://dash.cloudflare.com) sidebar or on any zone's overview page

## Setup

1. Copy and configure variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

1. Initialize and apply:

```bash
make init
make plan    # Review the ~30 resources
make apply
```

1. Note the outputs:

```bash
make output
```

## Post-Bootstrap Steps

1. Migrate the bootstrap state to the GCS bucket:

```bash
# Add a backend block to main.tf
cat >> main.tf <<'EOF'

# Uncomment after first apply to migrate state to GCS:
# terraform {
#   backend "gcs" {
#     bucket = "PROJECT_ID-tfstate"
#     prefix = "bootstrap"
#   }
# }
EOF
```

Uncomment the backend block (replacing `PROJECT_ID` with your actual project ID), then run:

```bash
terraform init -migrate-state
```

Terraform will prompt to copy the local state to GCS. Confirm with `yes`. After migration, delete the local state files:

```bash
rm -f terraform.tfstate terraform.tfstate.backup
```

1. Update `iac/main.tf` backend block with the `tfstate_bucket` output.

1. GitHub repo secrets and variables are now configured automatically by Terraform.

1. Run `terraform init` in `iac/`.

## Commands

| Command | Description |
|---------|-------------|
| `make init` | Initialize Terraform |
| `make plan` | Preview changes |
| `make apply` | Apply changes |
| `make destroy` | Destroy all resources |
| `make fmt` | Format Terraform files |
| `make validate` | Validate configuration |
| `make output` | Show outputs |
