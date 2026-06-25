# Defect Reports — restful-booker API

**Environment (applies to all reports below)**
- System under test: restful-booker public instance
- Base URL: `https://restful-booker.herokuapp.com`
- Date observed: 2026-06-22
- Tooling: Playwright `request` client (also reproducible with cURL / Postman)
- Note: this is a shared instance that resets; bugs below are consistently reproducible regardless of reset state.

---

## BUG #1 — Invalid login returns HTTP 200 instead of 401

| **Title** | `POST /auth` with invalid credentials returns `200 OK` instead of `401 Unauthorized`
| **Severity** | High — incorrect status codes on an auth endpoint can mislead clients into treating a failed login as a success.
| **Priority** | High — authentication is security-sensitive and used by every write operation.
| **Environment** | See top of file.

**Preconditions**
- The API is reachable.

**Steps to reproduce**
1. Send `POST /auth` with a valid username but a wrong password:
   ```bash
   curl -i -X POST https://restful-booker.herokuapp.com/auth \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"definitely-wrong"}'
   ```
2. Observe the HTTP status line.

**Expected result**
- HTTP `401 Unauthorized`. A `403 Forbidden` would also be acceptable, but a `200 OK` is not.

**Actual result**
- HTTP `200 OK`.

**Evidence**
- Reproduced by automated test **TC03** (`tests/auth.spec.ts`), which asserts the expected `401 Unauthorized`.
- The response status (200 OK) is captured in the Playwright HTML report / trace for the TC03 run.

**Impact / why it matters**
- If we check only the HTTP status we will read a failed login as a success.

---

## BUG #2 — Creating a booking with missing fields returns HTTP 500 instead of 400

| **Title** | `POST /booking` with required fields missing returns `500 Internal Server Error` instead of `400 Bad Request`
| **Severity** | Medium — invalid client input shouldn't appear as a server crash.
| **Priority** | Medium — the API doesn't report error properly.
| **Environment** | See top of file.

**Preconditions**
- The API is reachable.

**Steps to reproduce**
1. Send `POST /booking` with an incomplete payload (most fields omitted):
   ```bash
   curl -i -X POST https://restful-booker.herokuapp.com/booking \
     -H "Content-Type: application/json" \
     -d '{"firstname":"OnlyAFirstName"}'
   ```
2. Observe the HTTP status.

**Expected result**
- HTTP `400 Bad Request` with a message describing which fields are missing.

**Actual result**
- HTTP `500 Internal Server Error` — the server fails while processing the incorect input rather than rejecting it cleanly.

**Evidence**
- Reproduced by automated test **TC12** (`tests/booking-negative.spec.ts`), which asserts the expected `400`.

**Impact / why it matters**
- A `500 Internal Sever Error` tells the caller something broke on the server, when in fact the caller sent wrong data and should be told so.

---

## Minor observations (API-design notes, not raised as blocking bugs)

These are logged for completeness. The automated suite asserts the *documented*
behaviour for these (so they pass) and records the observation here rather than
failing the build:

1. **`GET /ping` returns `201 Created`** where `200 OK` would be conventional for
   a health check — `201` implies a resource was created, which it was not.
2. **`POST /booking` returns `200 OK`** on success; `201 Created` is the
   conventional status for resource creation.
3. **`DELETE /booking/{id}` returns `201 Created`** on success; `200 OK` or
   `204 No Content` would be conventional for a deletion.

Each of these is a semantic / convention issue rather than a functional failure,
so they are documented but not treated as failures.
