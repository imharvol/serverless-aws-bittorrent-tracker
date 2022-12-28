# serverless-aws-bittorrent-tracker
Simple, quick and serverless bittorrent tracker on AWS

## Usage

1. Generate the function and layer archives using `npm run create-zip` and `npm run create-layer`
2. Move the function and layer archives to the `terraform` folder
3. Init and apply Terraform
4. Terraform will output the tracker's url

```bash
cd ./lambda/
npm run create-zip
npm run create-layer

cd ../
mv ./lambda/function.zip ./terraform/
mv ./lambda/layer.zip ./terraform/

cd ./terraform
terraform init
terraform apply
```