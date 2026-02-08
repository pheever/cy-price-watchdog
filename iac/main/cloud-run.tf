data "google_project" "this" {
  project_id = local.project_id
}

data "google_secret_manager_secret_version" "ghcr_token" {
  secret  = "ghcr-token"
  project = local.project_id
}

resource "google_secret_manager_secret_iam_member" "ar_ghcr_token" {
  secret_id = "projects/${local.project_id}/secrets/ghcr-token"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-artifactregistry.iam.gserviceaccount.com"
}

resource "google_artifact_registry_repository" "ghcr" {
  repository_id = "ghcr"
  location      = local.region
  format        = "DOCKER"
  mode          = "REMOTE_REPOSITORY"

  remote_repository_config {
    docker_repository {
      custom_repository {
        uri = "https://ghcr.io"
      }
    }

    upstream_credentials {
      username_password_credentials {
        username                = "_token"
        password_secret_version = data.google_secret_manager_secret_version.ghcr_token.name
      }
    }
  }

  depends_on = [google_secret_manager_secret_iam_member.ar_ghcr_token]
}

resource "google_project_service" "vpcaccess" {
  service            = "vpcaccess.googleapis.com"
  disable_on_destroy = false
}

resource "google_vpc_access_connector" "connector" {
  name          = "vpc-conn"
  region        = local.region
  ip_cidr_range = var.vpc_connector_cidr
  network       = google_compute_network.vpc.name

  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.vpcaccess]
}

resource "google_cloud_run_v2_job" "scraper" {
  name     = "${local.project_id}-scraper"
  location = local.region

  template {
    template {
      service_account = local.bootstrap.cloudrun_sa_email
      timeout         = "1800s"

      containers {
        image = "${local.region}-docker.pkg.dev/${local.project_id}/${google_artifact_registry_repository.ghcr.repository_id}/${local.github_repo}/scraper:${var.image_tag}"

        env {
          name  = "DATABASE_URL"
          value = "postgresql://data_writer:${random_password.data_writer_password.result}@${google_compute_instance.vm.network_interface[0].network_ip}:5432/scraper_db"
        }

        env {
          name  = "METRICS_URL"
          value = "http://${google_compute_instance.vm.network_interface[0].network_ip}:8186/write"
        }

        env {
          name  = "TZ"
          value = "Europe/Athens"
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
      
      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "ALL_TRAFFIC"
      }
    }
  }
}
