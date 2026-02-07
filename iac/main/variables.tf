variable "domain" {
  description = "Domain name"
  type        = string
  default     = "pricewatchdog.cy"
}


variable "zone" {
  description = "GCE zone"
  type        = string
  default     = "europe-west1-b"
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

variable "vpc_connector_cidr" {
  description = "VPC connector CIDR"
  type        = string
  default     = "10.8.0.0/28"
}

variable "vm_machine_type" {
  description = "VM machine type"
  type        = string
  default     = "e2-small"
}

variable "vm_disk_size_gb" {
  description = "Boot disk size in GB"
  type        = number
  default     = 30
}
