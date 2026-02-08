resource "cloudflare_pages_project" "web" {
  account_id        = local.cloudflare_account_id
  name              = "${local.project_id}-web"
  production_branch = "deploy/web"

  source {
    type = "github"

    config {
      owner                         = split("/", local.github_repo)[0]
      repo_name                     = split("/", local.github_repo)[1]
      production_branch             = "deploy/web"
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "none"
    }
  }

  build_config {
    build_command       = "yarn install && yarn build"
    destination_dir     = "dist"
    root_dir            = "web"
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION = "24"
        YARN_VERSION = "4"
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
