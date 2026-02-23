# Terraform SA — impersonated by the main iac/ module
resource "google_service_account" "terraform" {
  project      = google_project.this.project_id
  account_id   = "terraform"
  display_name = "Terraform"

  depends_on = [google_project_service.services]
}

resource "google_project_iam_member" "terraform" {
  for_each = toset([
    "roles/compute.admin",
    "roles/secretmanager.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/resourcemanager.projectIamAdmin",
  ])

  project = google_project.this.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# GitHub Actions SA — CI/CD via Workload Identity Federation
resource "google_service_account" "github_actions" {
  project      = google_project.this.project_id
  account_id   = "github-actions"
  display_name = "GitHub Actions"

  depends_on = [google_project_service.services]
}

resource "google_project_iam_member" "github_actions" {
  for_each = toset([
    "roles/compute.instanceAdmin.v1",
    "roles/iam.serviceAccountUser",
    "roles/storage.objectViewer",
  ])

  project = google_project.this.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}
