data "cloudflare_api_token_permission_groups" "all" {}

resource "cloudflare_api_token" "terraform" {
  name = "terraform-${var.project_id}"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.zone["Zone Read"],
      data.cloudflare_api_token_permission_groups.all.zone["DNS Write"],
    ]
    resources = {
      "com.cloudflare.api.account.zone.*" = "*"
    }
  }

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.account["Argo Tunnel Write"],
    ]
    resources = {
      "com.cloudflare.api.account.${var.cloudflare_account_id}" = "*"
    }
  }
}

resource "google_secret_manager_secret_version" "cloudflare_api_token" {
  secret      = google_secret_manager_secret.secrets["cloudflare-api-token"].id
  secret_data = cloudflare_api_token.terraform.value
}
