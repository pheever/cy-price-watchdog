variable "domain" {
  description = "Root domain name"
  type        = string
  default     = "pricewatchdog.cy"
}


variable "image_tag" {
  description = "Container image tag"
  type        = string
  default     = "latest"
}

variable "subnet_cidr" {
  description = "Private subnet CIDR"
  type        = string
  default     = "10.0.0.0/24"
}

