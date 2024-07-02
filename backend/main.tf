provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}


# Cloud Run service
resource "google_cloud_run_service" "app" {
  name     = "tappz"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/tappz:latest"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
}
# Load Balancer
resource "google_compute_global_forwarding_rule" "default" {
  name       = "global-rule"
  target     = google_compute_target_http_proxy.default.id
  port_range = "80"
}

resource "google_compute_target_http_proxy" "default" {
  name    = "target-proxy"
  url_map = google_compute_url_map.default.id
}

resource "google_compute_url_map" "default" {
  name            = "url-map-target-proxy"
  default_service = google_compute_backend_service.default.id
}

resource "google_compute_backend_service" "default" {
  name        = "backend-service"
  port_name   = "http"
  protocol    = "HTTP"
  timeout_sec = 10

  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }

  health_checks = [google_compute_health_check.default.id]
}

resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "my-cloud-run-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.app.name
  }
}

resource "google_compute_health_check" "default" {
  name               = "health-check"
  check_interval_sec = 1
  timeout_sec        = 1

  tcp_health_check {
    port = "80"
  }
}

# Cloud Function

# Cloud Storage bucket for function source code
# Cloud Storage bucket for function source code
resource "google_storage_bucket" "function_bucket" {
  name     = "${var.project_id}-function-source"
  location = var.region
  uniform_bucket_level_access = true
}

# Cloud Function
resource "google_cloudfunctions_function" "function" {
  name        = "my-function"
  description = "My function"
  runtime     = "nodejs18"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.function_zip.name
  trigger_http          = true
  entry_point           = "noteApp"  # Make sure this matches your function's main export

  # Optional: Environment variables if needed
  environment_variables = {
    # Add any environment variables your function needs
  }
}

data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "./dist"  # Adjust this path to your function directory
  output_path = "/tmp/function.zip"
}

# Upload the ZIP archive to the Cloud Storage bucket
resource "google_storage_bucket_object" "function_zip" {
  name   = "function-${data.archive_file.function_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.function_zip.output_path
}
# API Gateway
resource "google_api_gateway_api" "api" {
  provider = google-beta
  api_id   = "my-api"
}

resource "google_api_gateway_api_config" "api_config" {
  provider      = google-beta
  api           = google_api_gateway_api.api.api_id
  api_config_id = "my-api-config"

  openapi_documents {
    document {
      path = "spec.yaml"
      contents = base64encode(<<-EOF
        swagger: '2.0'
        info:
          title: My API Gateway
          description: API Gateway for Cloud Function
          version: 1.0.0
        schemes:
          - https
        produces:
          - application/json
        paths:
          /hello:
            get:
              summary: Hello World
              operationId: hello
              x-google-backend:
                address: ${google_cloudfunctions_function.function.https_trigger_url}
              responses:
                '200':
                  description: A successful response
                  schema:
                    type: string
      EOF
      )
    }
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "gateway" {
  provider   = google-beta
  api_config = google_api_gateway_api_config.api_config.id
  gateway_id = "my-gateway"
  region     = var.region
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.function.project
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${google_api_gateway_gateway.gateway.default_hostname}"
}