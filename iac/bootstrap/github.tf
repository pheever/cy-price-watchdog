locals {
  repo_name = split("/", var.github_repo)[1]
}

# --- Actions variables (non-sensitive) ---

resource "github_actions_variable" "gcp_project_id" {
  repository    = local.repo_name
  variable_name = "GCP_PROJECT_ID"
  value         = google_project.this.project_id
}

resource "github_actions_variable" "gcp_region" {
  repository    = local.repo_name
  variable_name = "GCP_REGION"
  value         = var.region
}

# --- Actions secrets (sensitive) ---

resource "github_actions_secret" "wif_provider" {
  repository      = local.repo_name
  secret_name     = "WIF_PROVIDER"
  plaintext_value = google_iam_workload_identity_pool_provider.github.name
}

resource "github_actions_secret" "wif_sa_email" {
  repository      = local.repo_name
  secret_name     = "WIF_SA_EMAIL"
  plaintext_value = google_service_account.github_actions.email
}
