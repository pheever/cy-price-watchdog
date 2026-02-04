# Infrastructure as Code

Terraform configuration for deploying Cyprus Price Watchdog to Google Cloud.

## Prerequisites

- Terraform >= 1.0
- Google Cloud SDK (`gcloud`)
- A GCP project with billing enabled

## Setup

1. Create a GCS bucket for Terraform state:

```bash
gcloud storage buckets create gs://cy-price-watchdog-tfstate --location=eu
```

2. Copy and configure variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. Initialize Terraform:

```bash
make init
```

## Commands

| Command | Description |
|---------|-------------|
| `make init` | Initialize Terraform |
| `make plan` | Preview changes |
| `make apply` | Apply changes |
| `make destroy` | Destroy all resources |
| `make fmt` | Format Terraform files |
| `make validate` | Validate configuration |

## Resources Created

- **Artifact Registry** - Container image storage
- **Cloud SQL PostgreSQL** - Database instance
- **Cloud Run Services** - API server and web application
- **Cloud Run Job** - Scraper job
- **Cloud Scheduler** - Runs scraper every 6 hours
- **Secret Manager** - Database credentials

## Deploying Images

After applying Terraform, push container images:

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker europe-west1-docker.pkg.dev

# Build and push images
cd ../scraper && docker build -t europe-west1-docker.pkg.dev/PROJECT_ID/cy-price-watchdog/scraper:latest . && docker push ...
cd ../server && docker build -t europe-west1-docker.pkg.dev/PROJECT_ID/cy-price-watchdog/server:latest . && docker push ...
cd ../web && docker build -t europe-west1-docker.pkg.dev/PROJECT_ID/cy-price-watchdog/web:latest . && docker push ...
```

## Costs

Estimated monthly costs (minimal usage):
- Cloud SQL (db-f1-micro): ~$10/month
- Cloud Run: Pay per use (likely < $5/month)
- Cloud Scheduler: Free tier
- Artifact Registry: < $1/month

Total: ~$15-20/month for low traffic
