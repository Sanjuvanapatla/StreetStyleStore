# StreetStyleStore

This repository contains a Node.js application built with Express.js and SQLite. The API provides CRUD operations for managing items and includes user authentication, rate limiting, and logging functionalities.

## Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Logging](#logging)
- [Design Decisions](#design-decisions)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Sanjuvanapatla/StreetStyleStore.git
   cd item-management-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Environment Setup

1. Create a `.env` file in the project root and set up your environment variables:
   ```sh
   JWT_SECRET=your_secret_key
   ```
2. Ensure `database.db` exists, or initialize it using the provided schema.

## Running the Application

To start the server, run:

```sh
npm start
```

The application will run on `http://localhost:3000`.

## API Endpoints

### Authentication

- **Register a new user**

  ```sh
  POST /new_users/
  ```

  **Request Body:**

  ```json
  {
    "username": "user1",
    "name": "John Doe",
    "password": "securepassword",
    "location": "New York",
    "gender": "Male"
  }
  ```

  **Response:**

  - `200 OK`: User created successfully
  - `400 Bad Request`: User already exists

- **Login**

  ```sh
  POST /login
  ```

  **Request Body:**

  ```json
  {
    "username": "user1",
    "password": "securepassword"
  }
  ```

  **Response:**

  ```json
  {
    "jwtToken": "your_generated_token"
  }
  ```

### Item Management (Requires Authentication)

- **Get all items**

  ```sh
  GET /api/items/
  ```

- **Get a specific item by ID**

  ```sh
  GET /api/items/:id/
  ```

- **Add a new item**

  ```sh
  POST /api/items/
  ```

  **Request Body:**

  ```json
  {
    "name": "Laptop",
    "description": "Gaming laptop"
  }
  ```

- **Update an existing item**

  ```sh
  PUT /api/items/:id/
  ```

- **Delete an item**

  ```sh
  DELETE /api/items/:id/
  ```

## Database Schema

The SQLite database consists of two tables:

### `new_users`

| Column   | Type    | Description       |
| -------- | ------- | ----------------- |
| id       | INTEGER | Primary key       |
| username | TEXT    | Unique username   |
| name     | TEXT    | Full name         |
| password | TEXT    | Hashed password   |
| location | TEXT    | User location     |
| gender   | TEXT    | Male/Female/Other |

### `items`

| Column      | Type    | Description      |
| ----------- | ------- | ---------------- |
| id          | INTEGER | Primary key      |
| name        | TEXT    | Item name        |
| description | TEXT    | Item description |

## Authentication

This API uses JWT authentication. Include the token in the `Authorization` header as follows:

```sh
Authorization: Bearer your_token
```

## Rate Limiting

To prevent abuse, the API limits requests to **100 requests per 15 minutes per IP**.

## Logging

Requests are logged in `logs.json`, including timestamps, request methods, and request bodies.

## Design Decisions

1. **Security**: Passwords are hashed using bcrypt.
2. **Database Choice**: SQLite is used for simplicity.
3. **Logging**: File-based logging is used for tracking requests.
4. **Rate Limiting**: Implemented using `express-rate-limit` to prevent abuse.

## License

This project is licensed under the MIT License.

---

For contributions or issues, create a pull request or open an issue on GitHub.

