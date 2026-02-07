# Infrastructure as Code

Terraform configuration for deploying Cyprus Price Watchdog to Google Cloud + Cloudflare.

## Architecture

```text
Internet --> Cloudflare Edge (DNS, CDN, Pages)
                  |
                  | Cloudflare Tunnel (outbound-initiated, no public IP)
                  |
            +---- VPC (private subnet) ----------------+
            |                                           |
            |   Cloud NAT (outbound internet only)      |
            |                                           |
            |   GCE VM (internal IP only)               |
            |   +- cloudflared (tunnel daemon)          |
            |   +- api (Next.js API, :3000)             |
            |   +- postgres (scraper_db, :5432)         |
            |   +- timescaledb (metrics_db, :5433)      |
            |   +- telegraf (metrics collector, :8186)  |
            |   +- grafana (dashboards, :3001)          |
            |                                           |
            |   Cloud Run Job (Direct VPC Egress)       |
            |   +- scraper --> VM internal IP           |
            |                                           |
            +-------------------------------------------+
```

### Component Placement

| Component | Platform | Notes |
|-----------|----------|-------|
| Web (Vite SPA) | Cloudflare Pages | Free, global CDN |
| DNS | Cloudflare | Free |
| API | GCE VM (Docker) | Co-located with databases |
| PostgreSQL | GCE VM (Docker) | Scraper DB |
| TimescaleDB | GCE VM (Docker) | Metrics DB |
| Telegraf | GCE VM (Docker) | Metrics collection |
| Grafana | GCE VM (Docker) | Dashboards, exposed via Cloudflare Tunnel |
| Scraper | Cloud Run Job | Scheduled, pay-per-invocation |

### Networking

- The VM has **no public IP**. All inbound traffic flows through a Cloudflare Tunnel (`cloudflared` daemon on the VM creates an outbound-only connection to Cloudflare's edge).
- **Cloud NAT** provides outbound internet access for the VM (Docker image pulls, OS updates).
- **Cloud Run** reaches the VM via internal IP using Direct VPC Egress within the same VPC.
- Firewall rules only allow internal VPC traffic between Cloud Run and the VM.
- Cloudflare Tunnel selectively exposes services (api, grafana) on specific subdomains.

### CI/CD

- Container images are built via GitHub Actions and pushed to **GitHub Container Registry** (`ghcr.io`).
- Cloud Run pulls the scraper image from `ghcr.io`.
- The VM pulls service images from `ghcr.io`.

## Prerequisites

- Terraform >= 1.0
- Google Cloud SDK (`gcloud`)
- A GCP project with billing enabled
- A Cloudflare account with a registered domain

## Setup

1. Create a GCS bucket for Terraform state:

```bash
gcloud storage buckets create gs://cy-price-watchdog-tfstate --location=eu
```

1. Copy and configure variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

1. Initialize Terraform:

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

## Terraform Providers

| Provider | Purpose |
|----------|---------|
| `google` | GCE VM, VPC, Cloud NAT, Cloud Run, firewall rules |
| `cloudflare` | DNS records, Tunnel, Pages project |

## Estimated Monthly Costs

| Resource | Spec | Cost |
|----------|------|------|
| Cloudflare (Pages, DNS, Tunnel, CDN) | Free plan | €0 |
| GCE VM | e2-small (0.5 vCPU, 2GB) | ~€8 |
| Persistent disk | 30GB balanced | ~€3 |
| Cloud NAT | Gateway + data processing | ~€1.50 |
| Cloud Run (scraper) | Free tier (scheduled job) | ~€0 |
| GitHub Container Registry | Free tier | €0 |

Total: ~€13/mo

Observed memory usage for VM-hosted services (api, postgres, timescaledb, telegraf, grafana, cloudflared) is ~650MB, well within the e2-small's 2GB limit.
