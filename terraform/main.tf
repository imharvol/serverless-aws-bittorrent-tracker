terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.38.0"
    }
  }

  # backend "s3" {
  #   bucket         = ""
  #   region         = ""
  #   dynamodb_table = ""
  #   encrypt        = true

  #   key = ""
  # }
}

locals {
  project_name = "serverless-aws-bittorrent-tracker"
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Project   = local.project_name
      ManagedBy = "terraform"
    }
  }
}
