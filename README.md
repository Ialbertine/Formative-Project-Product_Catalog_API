# Product Catalog API 
## Description
The Product Catalog API is a robust and scalable backend solution designed for e-commerce platforms. It provides a comprehensive set of features to manage products, categories, inventory, user accounts, and reports. Built with Node.js and Express.js, this API is optimized for performance, security, and ease of use. It integrates with MongoDB for efficient data storage and retrieval, ensuring seamless handling of large-scale e-commerce operations.

## Key features include:

- Product Management: Add, update, delete, and retrieve product details.

- Category Management: Organize products into categories for better navigation.

- Inventory Management: Track and manage product stock levels.

- Search Functionality: Enable users to search for products by name, category, or other attributes.

- User Management: Handle user registration, authentication, and role-based access control.

- Reporting: Generate reports for sales, inventory, and other metrics.

This API is designed to besecure, and easy to integrate with frontend applications.

## Installation
To set up the Product Catalog API e-commerce locally, follow these steps:

## Clone the Repository:

```bash
git clone https://github.com/your-username/product-catalog-api.git
cd product-catalog-api
``` 
## Install Dependencies:

```bash
npm install
```

### Set Up Environment Variables:
- Create a .env file in the root directory.

```bash
#env
PORT=5000
MONGO_URI=mongodb://localhost:27017/product_catalog
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```
### Start the Server:

```bash
npm run dev
```
### For production:

```bash
#Access the API:
The API will be running at http://localhost:5000.
```
### Configuration
The API is configured using environment variables. Key configurations include:

- PORT: The port on which the server runs (default: 5000).

- MONGO_URI: The MongoDB connection string.

- JWT_SECRET: Secret key for signing JSON Web Tokens (JWT).

- JWT_EXPIRE: Expiration time for JWT tokens (default: 30d).

## API Endpoints
The API provides the following endpoints:

### Products
```bash
GET /api/products  #Retrieve all products.

GET /api/products/:id  #Retrieve a specific product by ID.

POST /api/products #Create a new product.

PUT /api/products/:id #Update a product.

DELETE /api/products/:id #Delete a product.
```
### Categories
```bash
GET /api/categories #Retrieve all categories.

GET /api/categories/:id #Retrieve a specific category by ID.

POST /api/categories #Create a new category.

PUT /api/categories/:id #Update a category.

DELETE /api/categories/:id #Delete a category.
```
### Inventory
```bash
GET /api/inventory #Retrieve inventory details.

PUT /api/inventory/:id #Update inventory stock.

Search
GET /api/search #Search for products by name, category, or other attributes.

Reports
GET /api/reports #Generate sales or inventory reports.
```

### Users
```bash
POST /api/users/register #Register a new user.

POST /api/users/login #Authenticate and log in a user.

GET /api/users #Retrieve all users (admin only).

DELETE /api/users/:id #Delete a user (admin only).
```

## Authentication
The API uses JSON Web Tokens (JWT) for authentication. To access protected routes:

- Log in using the /api/users/login endpoint to receive a JWT.

- Include the token in the Authorization header of subsequent requests:

- Authorization: Bearer <your_jwt_token>
## Rate Limiting
To prevent abuse, the API enforces rate limiting:
- Limit: 100 requests per 15 minutes.
- Response: If the limit is exceeded, the API returns: json

```bash
{
  "message": "Too many requests from this IP, please try again later."
}
```

## Error Handling
The API provides meaningful error messages for common issues, such as:

- Invalid input data.

- Unauthorized access.

- 404 not found.

- 500 Server errors.

## Security
The API includes the following security features:

- Helmet: Sets secure HTTP headers.

- CORS: Enables cross-origin resource sharing.

- Rate Limiting: Protects against brute-force attacks.

- JWT: Secures authentication and authorization.

## Testing
To test the API:
- Use tools like Postman or cURL.
- Start the server and send requests to the endpoints.
- Verify responses and error handling.


## How you can access it to contribute

- Fork the repository.
- Create a new branch:

```bash
git checkout -b feature/your-feature-name
#Commit your changes
git commit -m "Add your feature"
git push origin feature/your-feature-name

#Open a pull request.
```

## Click Here to the postman Link: [Here](https://documenter.getpostman.com/view/41987133/2sAYkLkwGt#0da05474-c560-4e72-8306-9dab0269bfe2)
