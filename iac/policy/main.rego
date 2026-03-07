package terraform.analysis

import input as tfplan

blast_radius := 30

weights := {
  "google_compute_instance":                    {"delete": 100, "create": 10, "update": 1},
  "google_compute_network":                     {"delete": 50,  "create": 5,  "update": 1},
  "google_compute_subnetwork":                  {"delete": 50,  "create": 5,  "update": 1},
  "google_secret_manager_secret_version":       {"delete": 20,  "create": 2,  "update": 1},
  "google_service_account":                     {"delete": 20,  "create": 2,  "update": 1},
  "google_compute_firewall":                    {"delete": 5,   "create": 1,  "update": 1},
  "cloudflare_pages_project":                   {"delete": 10,  "create": 2,  "update": 1},
  "cloudflare_record":                          {"delete": 10,  "create": 2,  "update": 1},
  "cloudflare_zero_trust_tunnel_cloudflared":   {"delete": 10,  "create": 2,  "update": 1},
}

resource_types := {r | weights[r]}

default authz := false

authz if {
  score < blast_radius
  count(deny) == 0
}

# Hard deny: recreating any random_password rotates all dependent app secrets
deny contains msg if {
  some r in tfplan.resource_changes
  r.type == "random_password"
  "delete" in r.change.actions
  msg := sprintf("recreating random_password '%v' would rotate all dependent secrets", [r.address])
}

# Hard deny: force-replacing the compute instance causes downtime and potential data loss
deny contains msg if {
  some r in tfplan.resource_changes
  r.type == "google_compute_instance"
  r.change.actions == ["delete", "create"]
  msg := sprintf("force-replacing compute instance '%v' causes downtime and potential data loss", [r.address])
}

score := s if {
  all_scores := [x |
    some resource_type in resource_types
    w := weights[resource_type]
    x := (w.delete * num_deletes[resource_type]) + (w.create * num_creates[resource_type]) + (w.update * num_modifies[resource_type])
  ]
  s := sum(all_scores)
}

resources[resource_type] := all if {
  some resource_type in resource_types
  all := [r | some r in tfplan.resource_changes; r.type == resource_type]
}

num_creates[resource_type] := n if {
  some resource_type in resource_types
  n := count([r | some r in resources[resource_type]; "create" in r.change.actions])
}

num_deletes[resource_type] := n if {
  some resource_type in resource_types
  n := count([r | some r in resources[resource_type]; "delete" in r.change.actions])
}

num_modifies[resource_type] := n if {
  some resource_type in resource_types
  n := count([r | some r in resources[resource_type]; "update" in r.change.actions])
}
