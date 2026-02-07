locals {
  secrets = toset([
    "postgres-admin-password",
    "data-writer-password",
    "data-reader-password",
    "metrics-db-password",
    "metrics-writer-password",
    "metrics-reader-password",
    "grafana-admin-password",
    "cloudflare-api-token",
    "cloudflare-tunnel-secret",
  ])
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  project   = google_project.this.project_id
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}
