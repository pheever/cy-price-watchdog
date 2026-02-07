resource "cloudflare_pages_project" "web" {
  account_id        = local.cloudflare_account_id
  name              = "${local.project_id}-web"
  production_branch = "main"

  source {
    type = "github"

    config {
      owner             = split("/", local.github_repo)[0]
      repo_name         = split("/", local.github_repo)[1]
      production_branch = "main"
    }
  }

  build_config {
    build_command   = "cd web && yarn install && yarn build"
    destination_dir = "web/dist"
  }

  deployment_configs {
    production {
      environment_variables = {
        VITE_API_URL = "https://api.${var.domain}"
      }
    }
  }
}

resource "cloudflare_pages_domain" "web" {
  account_id   = local.cloudflare_account_id
  project_name = cloudflare_pages_project.web.name
  domain       = var.domain
}
