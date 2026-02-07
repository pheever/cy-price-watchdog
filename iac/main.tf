terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "cy-price-watchdog-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "cy-price-watchdog"
  format        = "DOCKER"

  depends_on = [google_project_service.services]
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "main" {
  name             = "cy-price-watchdog-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
  }

  deletion_protection = true

  depends_on = [google_project_service.services]
}

resource "google_sql_database" "main" {
  name     = "scraper_db"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = "admin"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Secret for database URL
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.main.name}:${var.db_password}@/${google_sql_database.main.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
}

# Service account for Cloud Run
resource "google_service_account" "cloudrun" {
  account_id   = "cy-price-watchdog-run"
  display_name = "Cyprus Price Watchdog Cloud Run"
}

resource "google_project_iam_member" "cloudrun_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

resource "google_secret_manager_secret_iam_member" "cloudrun_secret" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun.email}"
}

# Cloud Run - API
resource "google_cloud_run_v2_service" "api" {
  name     = "cy-price-watchdog-api"
  location = var.region

  template {
    service_account = google_service_account.cloudrun.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}/api:latest"

      ports {
        container_port = 3000
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  depends_on = [
    google_project_service.services,
    google_secret_manager_secret_version.database_url,
  ]
}

# Allow public access to API
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run - Web Application
resource "google_cloud_run_v2_service" "web" {
  name     = "cy-price-watchdog-web"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}/web:latest"

      ports {
        container_port = 80
      }

      env {
        name  = "API_URL"
        value = google_cloud_run_v2_service.api.uri
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  depends_on = [google_project_service.services]
}

# Allow public access to web app
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Job - Scraper
resource "google_cloud_run_v2_job" "scraper" {
  name     = "cy-price-watchdog-scraper"
  location = var.region

  template {
    template {
      service_account = google_service_account.cloudrun.email

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}/scraper:latest"

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.database_url.secret_id
              version = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.main.connection_name]
        }
      }

      max_retries = 3
      timeout     = "600s"
    }
  }

  depends_on = [
    google_project_service.services,
    google_secret_manager_secret_version.database_url,
  ]
}

# Cloud Scheduler to run scraper every 6 hours
resource "google_cloud_scheduler_job" "scraper" {
  name             = "cy-price-watchdog-scraper-schedule"
  region           = var.region
  schedule         = "0 */6 * * *"
  time_zone        = "Europe/Athens"
  attempt_deadline = "600s"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.scraper.name}:run"

    oauth_token {
      service_account_email = google_service_account.cloudrun.email
    }
  }

  depends_on = [google_project_service.services]
}

# Grant scheduler permission to invoke the job
resource "google_cloud_run_v2_job_iam_member" "scheduler_invoker" {
  name     = google_cloud_run_v2_job.scraper.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloudrun.email}"
}
