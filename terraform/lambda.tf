resource "aws_lambda_layer_version" "tracker_function" {
  layer_name = "${local.project_name}-tracker-function-layer"

  filename         = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")

  compatible_runtimes      = ["nodejs16.x"]
  compatible_architectures = ["x86_64"]
}

# Create the default lambda function role
resource "aws_iam_role" "tracker_function" {
  name = "${local.project_name}-tracker-function-role"

  assume_role_policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : "sts:AssumeRole",
          "Principal" : {
            "Service" : "lambda.amazonaws.com"
          },
          "Effect" : "Allow",
          "Sid" : ""
        }
      ]
    }
  )
}

resource "aws_lambda_function" "tracker" {
  function_name = "${local.project_name}-tracker-function"

  filename         = "function.zip"
  source_code_hash = filebase64sha256("function.zip")
  layers           = [aws_lambda_layer_version.tracker_function.arn]

  role    = aws_iam_role.tracker_function.arn
  runtime = "nodejs16.x"
  handler = "index.handler"
}

# Add a function url
resource "aws_lambda_function_url" "tracker" {
  function_name      = aws_lambda_function.tracker.function_name
  authorization_type = "NONE"
}

# Setup lambda logging
resource "aws_cloudwatch_log_group" "tracker_function" {
  name = "/aws/lambda/${aws_lambda_function.tracker.function_name}"
}
resource "aws_iam_policy" "tracker_function_logging" {
  name = "${local.project_name}-tracker-function-logging-policy"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : "${aws_cloudwatch_log_group.tracker_function.arn}:*",
        "Effect" : "Allow"
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "tracker_function_logging" {
  role       = aws_iam_role.tracker_function.name
  policy_arn = aws_iam_policy.tracker_function_logging.arn
}
