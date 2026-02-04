output "server_url" {
  description = "URL of the API server"
  value       = google_cloud_run_v2_service.server.uri
}

output "web_url" {
  description = "URL of the web application"
  value       = google_cloud_run_v2_service.web.uri
}

output "artifact_registry" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "database_instance" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}
