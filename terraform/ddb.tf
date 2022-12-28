resource "aws_dynamodb_table" "tracker_swarms" {
  name = "${local.project_name}-swarms"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "InfoHash"
  attribute {
    name = "InfoHash"
    type = "S"
  }

  range_key = "IP"
  attribute {
    name = "IP"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = "TTL"
  }
}

# Allow the lambda function to access the DDB table
resource "aws_iam_policy" "tracker_swarms_table_policy" {
  name = "${local.project_name}-tracker-swarms-table-policy"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "",
        "Effect" : "Allow",
        "Action" : [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ],
        "Resource" : [
          "${aws_dynamodb_table.tracker_swarms.arn}",
          "${aws_dynamodb_table.tracker_swarms.arn}/index/*"
        ]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.tracker_function.name
  policy_arn = aws_iam_policy.tracker_swarms_table_policy.arn
}
