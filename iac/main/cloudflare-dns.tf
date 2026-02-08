resource "cloudflare_record" "web" {
  zone_id = data.cloudflare_zone.main.id
  name    = "@"
  content = "${cloudflare_pages_project.web.name}.pages.dev"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "web_www" {
  zone_id = data.cloudflare_zone.main.id
  name    = "www"
  content = "${cloudflare_pages_project.web.name}.pages.dev"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = "api"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.main.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "grafana" {
  zone_id = data.cloudflare_zone.main.id
  name    = "grafana"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.main.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
}
