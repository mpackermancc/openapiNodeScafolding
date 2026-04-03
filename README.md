# Purpose
This script generates an Express web server app using the openapi-backend library for request validation and routing.  It creates a folder heirarchy for the handlers in which the business logic can be developed to respond to HTTP REST API requests.

- Author: Mike Ackerman
- Date: 4/3/2026

# Instructions for Creating the App
## 1.  Create a valid OpenAPI 3.0 specification in JSON format:
This step is important to perform in a thorough manner.  Once the app is generated from this spec, there is no script to incrementally update app if the OpenAPI spec changes, so future changes are manually applied.
- use the Swagger Editor to assist in validation of the spec: https://editor.swagger.io/
- each path/verb must have a unique operation ID that mimics the folder structure of the handlers.  Here are some examples of how the operationId should be set:
    - GET /hello:  "operationId": "hello_get"
    - POST /hello:  "operationId": "hello_post"
    - GET /persons/{id}/addresses:  "operationId": "persons_{id}_addresses_get"
## 2.  Save the OpenAPI spec in the same directory as this script
## 3.  Run these BASH commands:
### 1. Create and enter your new project folder
`mkdir my-new-api && cd my-new-api`

### 2. Initialize the Node environment
`npm init -y`

`npm install express openapi-backend ajv-formats`

### 3. Run the scaffold script (assuming is in same parent folder as your project)
`node ../openapiNodeScafolding/scaffold.js ../openapiNodeScafolding/your-spec.json`

## 6.  Open the new folder in VS Code
BASH:  `code .`

## 7.  Run the app 
BASH:  `node app`
