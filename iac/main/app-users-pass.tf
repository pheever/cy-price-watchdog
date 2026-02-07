resource "random_password" "postgres_admin_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "postgres_admin_password" {
  secret      = "projects/${local.project_id}/secrets/postgres-admin-password"
  secret_data = random_password.postgres_admin_password.result
}

resource "random_password" "data_writer_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "data_writer_password" {
  secret      = "projects/${local.project_id}/secrets/data-writer-password"
  secret_data = random_password.data_writer_password.result
}

resource "random_password" "data_reader_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "data_reader_password" {
  secret      = "projects/${local.project_id}/secrets/data-reader-password"
  secret_data = random_password.data_reader_password.result
}

resource "random_password" "metrics_db_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "metrics_db_password" {
  secret      = "projects/${local.project_id}/secrets/metrics-db-password"
  secret_data = random_password.metrics_db_password.result
}

resource "random_password" "metrics_writer_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "metrics_writer_password" {
  secret      = "projects/${local.project_id}/secrets/metrics-writer-password"
  secret_data = random_password.metrics_writer_password.result
}

resource "random_password" "metrics_reader_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "metrics_reader_password" {
  secret      = "projects/${local.project_id}/secrets/metrics-reader-password"
  secret_data = random_password.metrics_reader_password.result
}

resource "random_password" "grafana_admin_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "grafana_admin_password" {
  secret      = "projects/${local.project_id}/secrets/grafana-admin-password"
  secret_data = random_password.grafana_admin_password.result
}
