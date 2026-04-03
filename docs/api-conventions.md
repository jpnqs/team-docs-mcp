# API Conventions

## REST API Design

### Endpoint Naming

- Use nouns for resources, not verbs
- Use plural names for collections
- Use kebab-case for multi-word resources
- Be consistent across all endpoints

```
✅ Good:
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/user-profiles/:id

❌ Bad:
GET    /api/getUsers
POST   /api/createUser
GET    /api/user_profiles/:id
```

### HTTP Methods

| Method | Purpose                 | Idempotent |
| ------ | ----------------------- | ---------- |
| GET    | Retrieve resource(s)    | Yes        |
| POST   | Create new resource     | No         |
| PUT    | Replace entire resource | Yes        |
| PATCH  | Update partial resource | No         |
| DELETE | Remove resource         | Yes        |

### Status Codes

Use standard HTTP status codes:

- **200 OK** - Successful GET, PUT, PATCH, or DELETE
- **201 Created** - Successful POST
- **204 No Content** - Successful DELETE with no response body
- **400 Bad Request** - Client error (validation failure)
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Request conflicts with current state
- **422 Unprocessable Entity** - Validation errors
- **500 Internal Server Error** - Server error

### Response Format

All responses should use this structure:

```typescript
// Success Response
{
    "success": true,
    "data": {
        "id": "123",
        "name": "John Doe",
        "email": "john@example.com"
    },
    "meta": {
        "timestamp": "2026-04-03T10:30:00Z"
    }
}

// List Response with Pagination
{
    "success": true,
    "data": [
        { "id": "1", "name": "Item 1" },
        { "id": "2", "name": "Item 2" }
    ],
    "meta": {
        "page": 1,
        "perPage": 20,
        "total": 50,
        "totalPages": 3
    }
}

// Error Response
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "email",
                "message": "Email is required"
            }
        ]
    }
}
```

## Authentication

### JWT Tokens

- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Include token in Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Flow

```typescript
// Login
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password123"
}

// Response
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGc...",
        "refreshToken": "dGhpc2...",
        "expiresIn": 900
    }
}

// Refresh Token
POST /api/auth/refresh
{
    "refreshToken": "dGhpc2..."
}
```

## Pagination

Use query parameters for pagination:

```
GET /api/users?page=1&perPage=20
GET /api/users?offset=0&limit=20
```

Response includes pagination metadata in `meta` field.

## Filtering and Sorting

### Filtering

```
GET /api/users?status=active&role=admin
GET /api/products?minPrice=10&maxPrice=100
```

### Sorting

```
GET /api/users?sortBy=createdAt&order=desc
GET /api/products?sortBy=name&order=asc
```

### Search

```
GET /api/users?search=john
GET /api/products?q=laptop
```

## Versioning

- Use URL versioning: `/api/v1/users`
- Maintain backward compatibility when possible
- Deprecate old versions with 6-month notice
- Document version changes in changelog

## Rate Limiting

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- Rate limit headers included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1617210000
```

## Error Codes

### Standard Error Codes

| Code                  | Description              |
| --------------------- | ------------------------ |
| `VALIDATION_ERROR`    | Input validation failed  |
| `UNAUTHORIZED`        | Authentication required  |
| `FORBIDDEN`           | Insufficient permissions |
| `NOT_FOUND`           | Resource not found       |
| `CONFLICT`            | Resource conflict        |
| `RATE_LIMIT_EXCEEDED` | Too many requests        |
| `INTERNAL_ERROR`      | Server error             |

## Request/Response Examples

### Create User

```http
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_123abc",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "createdAt": "2026-04-03T10:30:00Z"
  }
}
```

### Update User

```http
PATCH /api/v1/users/usr_123abc
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
    "name": "Jane Smith"
}
```

## Documentation

- All endpoints must be documented in OpenAPI/Swagger
- Include examples for all requests and responses
- Document all error conditions
- Keep documentation in sync with implementation
