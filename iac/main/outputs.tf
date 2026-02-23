output "vm_name" {
  description = "Name of the GCE VM"
  value       = google_compute_instance.vm.name
  sensitive   = true
}

output "vm_internal_ip" {
  description = "Internal IP of the VM"
  value       = google_compute_instance.vm.network_interface[0].network_ip
  sensitive   = true
}

output "project_id" {
  description = "GCP project ID"
  value       = local.project_id
}

output "zone" {
  description = "GCE zone"
  value       = var.zone
}
