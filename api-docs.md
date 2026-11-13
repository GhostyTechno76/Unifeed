# College Grievance Platform - API Documentation

**Base Path:** `/api`  
**Runtime:** Cloudflare Pages Edge Runtime (`export const runtime = 'edge'`)  
**Standard Response Headers:** `Content-Type: application/json`

---

## 1. Authentication

### `POST /api/auth/login`
Authenticates a user via their institutional email address. Verifies the user against the Cloudflare D1 `users` table and issues a lightweight session token containing the user identity and permission role.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "student@iiit-bh.ac.in"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | User's institutional email address (case-insensitive) |

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJ1c2VySWQiOiJ1c3Jfc3R1ZGVudF8wMSIsImVtYWlsIjoic3R1ZGVudEBpaWl0LWJoLmFjLmluIiwicm9sZSI6InN0dWRlbnQiLCJ0aW1lc3RhbXAiOjE3OTQ0MjA4Nzl9",
  "role": "student",
  "user": {
    "id": "usr_student_01",
    "email": "student@iiit-bh.ac.in",
    "role": "student"
  }
}
```

#### Error Responses
- **`400 Bad Request`** (Missing or invalid email):
  ```json
  { "error": "Email is required" }
  ```
  ```json
  { "error": "Invalid email format" }
  ```
- **`404 Not Found`** (User not in D1 directory):
  ```json
  { "error": "User not found" }
  ```

---

## 2. Student Grievance Submission

### `POST /api/problems/submit`
Allows an authenticated student to file a campus grievance. Automatically assigns a unique UUID, initializes `upvotes` to `0`, sets `status` to `'unresolved'`, and timestamps the record.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "student_id": "usr_student_01",
  "title": "Wi-Fi access point failure in Hostel 3",
  "description": "The access point in Corridor B drops connection every 10 minutes during evening study hours."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `student_id` | `string` | **Yes** | Valid user ID of the submitting student (verified against `users` table) |
| `title` | `string` | **Yes** | Brief issue summary (minimum 3 characters) |
| `description` | `string` | **Yes** | Comprehensive issue details (minimum 5 characters) |

#### Successful Response (`201 Created`)
```json
{
  "success": true,
  "message": "Problem submitted successfully",
  "problem": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "student_id": "usr_student_01",
    "title": "Wi-Fi access point failure in Hostel 3",
    "description": "The access point in Corridor B drops connection every 10 minutes during evening study hours.",
    "upvotes": 0,
    "status": "unresolved",
    "created_at": "2026-11-11T18:15:30.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`** (Validation failures):
  ```json
  { "error": "student_id is required" }
  ```
  ```json
  { "error": "title is required and must be at least 3 characters" }
  ```
  ```json
  { "error": "description is required and must be at least 5 characters" }
  ```
- **`404 Not Found`** (Student does not exist):
  ```json
  { "error": "Student not found in user directory" }
  ```

---

## 3. Admin Grievance Management

### `GET /api/admin/problems`
Fetches all reported grievances from Cloudflare D1 with student email joins for administration overview. Supports real-time sorting and filtering.

#### Query Parameters
| Parameter | Type | Required | Default | Options / Description |
|---|---|---|---|---|
| `sort` | `string` | No | `upvotes` | `upvotes` (highest priority first) or `newest` (latest timestamp first) |
| `status` | `string` | No | *None (All)* | e.g. `unresolved` or `resolved` |

#### Example Request
```http
GET /api/admin/problems?sort=upvotes&status=unresolved
```

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "sort": "upvotes",
  "problems": [
    {
      "id": "prob_02",
      "student_id": "usr_student_01",
      "student_email": "student@iiit-bh.ac.in",
      "title": "Library AC malfunctioning in 40C heat",
      "description": "The central reading hall units have stopped cooling, disrupting exam preparation.",
      "upvotes": 42,
      "status": "unresolved",
      "created_at": "2026-11-11T12:00:00.000Z"
    },
    {
      "id": "prob_01",
      "student_id": "usr_student_01",
      "student_email": "student@iiit-bh.ac.in",
      "title": "Low water pressure in Block A",
      "description": "Showers on the 3rd floor have virtually no water pressure in the mornings.",
      "upvotes": 15,
      "status": "unresolved",
      "created_at": "2026-11-10T10:00:00.000Z"
    }
  ]
}
```

---

## 4. AI Executive Summarization

### `GET /api/admin/summarize` or `POST /api/admin/summarize`
Fetches all active unresolved problems from Cloudflare D1, structures them into an analytical prompt, and passes the context to the bound Cloudflare Workers AI model (`@cf/meta/llama-3-8b-instruct`). Returns an executive 2-paragraph briefing for campus administration.

#### Request Body
*None required.*

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "unresolved_count": 2,
  "summary": "Campus grievance reports at IIIT Bhubaneswar indicate urgent infrastructure challenges centered on academic climate control and basic residential utilities. Students have reported severe disruptions caused by defunct air conditioning units in the main library reading hall during peak temperatures, alongside recurring low water pressure across senior hostel blocks. These issues are directly impacting student well-being and academic readiness.\n\nTo remediate these concerns, the administration should immediately deploy HVAC technicians to service and recharge the central library compressors before the upcoming examination cycle. Concurrently, the campus maintenance team must inspect the auxiliary booster pumps serving Hostel Block A to restore standard water pressure.",
  "model": "@cf/meta/llama-3-8b-instruct"
}
```

#### Zero-Problem Fallback (`200 OK`)
```json
{
  "success": true,
  "unresolved_count": 0,
  "summary": "There are currently no unresolved campus problems reported. All issues have been resolved.",
  "model": "@cf/meta/llama-3-8b-instruct"
}
```

#### Error Response (`500 Internal Server Error`)
```json
{
  "error": "Workers AI binding \"AI\" is not available on the execution context."
}
```
