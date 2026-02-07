resource "google_service_account" "vm" {
  account_id   = "vm-runtime"
  display_name = "VM Runtime"
}

resource "google_project_iam_member" "vm" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
  ])

  project = local.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vm.email}"
}

resource "google_compute_instance" "vm" {
  name                      = "${local.project_id}-vm"
  machine_type              = var.vm_machine_type
  zone                      = var.zone
  tags                      = ["${local.project_id}-vm"]
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = var.vm_disk_size_gb
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    # No access_config — no external IP
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  service_account {
    email  = google_service_account.vm.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = templatefile("${path.module}/templates/startup-script.sh.tpl", {
      project_id        = local.project_id
      github_repo       = local.github_repo
      api_image         = "ghcr.io/${local.github_repo}/api:${var.image_tag}"
      postgres_image    = "postgres:15"
      timescaledb_image = "timescale/timescaledb:latest-pg15"
      telegraf_image    = "telegraf:latest"
      grafana_image     = "grafana/grafana:latest"
      cloudflared_image = "cloudflare/cloudflared:latest"
      tunnel_token      = cloudflare_zero_trust_tunnel_cloudflared.main.tunnel_token
    })
  }
}
