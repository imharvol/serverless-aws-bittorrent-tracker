output "tracker_base_url" {
  description = "Tracker base url"
  value       = aws_lambda_function_url.tracker.function_url
}

output "tracked_announce_url" {
  description = "Tracker announce url"
  value       = "${aws_lambda_function_url.tracker.function_url}announce"
}
