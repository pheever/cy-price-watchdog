resource "random_password" "tunnel_secret" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "cloudflare_tunnel_secret" {
  secret      = "projects/${local.project_id}/secrets/cloudflare-tunnel-secret"
  secret_data = random_password.tunnel_secret.result
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "main" {
  account_id = local.cloudflare_account_id
  name       = "${local.project_id}-tunnel"
  secret     = base64encode(random_password.tunnel_secret.result)
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "main" {
  account_id = local.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.main.id

  config {
    ingress_rule {
      hostname = "api.${var.domain}"
      service  = "http://api:3000"
    }

    ingress_rule {
      hostname = "grafana.${var.domain}"
      service  = "http://grafana:3000"
    }

    ingress_rule {
      service = "http_status:404"
    }
  }
}
