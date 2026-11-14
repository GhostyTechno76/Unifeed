# Cloudflare D1 Database Schema Documentation

**Database Name:** `campus-helpdesk-db`  
**Database UUID:** `2070c0ea-2662-4d50-8dc3-265e9f7b8c1b`  
**Engine:** Cloudflare D1 (Serverless Distributed SQLite)  
**Primary Region:** `APAC` (Asia-Pacific)

---

## 1. Table Definitions

### Table: `users`
Stores campus user profiles and role authorizations.

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
  password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Column Dictionary
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Unique identifier for the user (e.g., `usr_student_01` or UUID) |
| `email` | `TEXT` | `UNIQUE`, `NOT NULL` | Institutional email address used for login |
| `role` | `TEXT` | `NOT NULL`, `CHECK(role IN ('student', 'admin'))` | Authorization role governing UI views and action permissions |
| `password` | `TEXT` | `NULLABLE` | Institutional account authentication password |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Account registration timestamp |

---

### Table: `problems`
Stores reported campus grievances, voting metrics, and resolution statuses.

```sql
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'unresolved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  eta TEXT,
  admin_notes TEXT,
  media_url TEXT,
  FOREIGN KEY (student_id) REFERENCES users(id)
);
```

#### Column Dictionary
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Unique problem ticket identifier (UUIDv4) |
| `student_id` | `TEXT` | `NOT NULL`, `REFERENCES users(id)` | Foreign key linking the grievance to the submitting student |
| `title` | `TEXT` | `NOT NULL` | Concise summary of the grievance |
| `description` | `TEXT` | `NOT NULL` | Clean details and location context (free of raw media strings) |
| `upvotes` | `INTEGER` | `DEFAULT 0` | Community consensus counter used for administrative prioritization |
| `status` | `TEXT` | `DEFAULT 'unresolved'` | Current ticket state (`unresolved` or `resolved`) |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Submission timestamp |
| `eta` | `TEXT` | `NULLABLE` | Estimated resolution time window set by administration |
| `admin_notes` | `TEXT` | `NULLABLE` | Administrative progress notes and resolution remarks |
| `media_url` | `TEXT` | `NULLABLE` | Public image URL or image attachment proof |

---

### Table: `problem_upvotes`
Tracks unique student upvotes per problem to ensure idempotent, user-scoped endorsement tracking.

```sql
CREATE TABLE IF NOT EXISTS problem_upvotes (
  problem_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (problem_id, user_id)
);
```

---

## 2. Seeded Test Records

The following verified accounts exist in the live database for demo and development testing:

### Seeded Admin Account
- **User ID:** `usr_admin_01`
- **Login Email:** `admin@iiit-bh.ac.in`
- **Role:** `admin`
- **Permissions:** View all problems, sort by upvotes/newest, trigger Cloudflare Workers AI Executive Summaries.

### Seeded Student Account
- **User ID:** `usr_student_01`
- **Login Email:** `student@iiit-bh.ac.in`
- **Role:** `student`
- **Permissions:** Submit new campus grievances, view active ticket statuses.

### Seeded Live Problem Record
```json
{
  "id": "prob_live_01",
  "student_id": "usr_student_01",
  "student_email": "student@iiit-bh.ac.in",
  "title": "High packet loss on Academic Block Wi-Fi",
  "description": "Students in Labs 3 and 4 experience over 40% packet loss during online coding contests.",
  "upvotes": 15,
  "status": "unresolved",
  "created_at": "2026-11-11 18:28:34"
}
```
