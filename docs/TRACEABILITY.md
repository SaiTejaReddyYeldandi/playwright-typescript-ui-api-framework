# Traceability Matrix

Maps each requirement of the application under test to the automated check(s) that cover it.
This is the same requirement-to-test discipline used with test-management tools (Jira + Xray /
Zephyr); here it is kept as version-controlled documentation alongside the tests.

| ID    | Requirement | Test(s) | Layer |
|-------|-------------|---------|-------|
| R-01  | A user with valid credentials can sign in | `auth.api` valid login · `ui/login` valid login | API + UI |
| R-02  | Invalid credentials are rejected | `auth.api` bad credentials → 401 · `ui/login` error shown | API + UI |
| R-03  | Protected endpoints require a token | `auth.api` no-token → 401 | API |
| R-04  | A signed-in user sees their tasks | `tasks.api` list · `ui/tasks` seed list visible | API + UI |
| R-05  | A user can create a task | `tasks.api` lifecycle (create) · `ui/tasks` add · data-driven adds | API + UI |
| R-06  | Empty task titles are rejected | `tasks.api` no-title → 422 · `ui/tasks` validation error | API + UI |
| R-07  | A user can mark a task complete | `tasks.api` lifecycle (update) · `ui/tasks` toggle | API + UI |
| R-08  | A user can delete a task | `tasks.api` lifecycle (delete) · `ui/tasks` delete | API + UI |
| R-09  | Reading a missing task returns 404 | `tasks.api` GET missing → 404 | API |
| R-10  | Deleting a missing task returns 404 | `tasks.api` DELETE missing → 404 | API |
| R-11  | A user can sign out | `ui/login` logout returns to login screen | UI |

**Coverage:** 11 requirements, every one with at least one automated check; 8 covered at both
the API and UI layers.
