# Task X Security Specification

## 1. Data Invariants
1. **Owner-Only Profile & PII Isolation**: `/users/{userId}` contains `email` and `displayName` and is strictly readable and writable only by `request.auth.uid == userId` with a verified email (`request.auth.token.email_verified == true`).
2. **Master Gate Relational Integrity**: Subcollections (`tasks`, `folders`, `tags`, `activityLogs`, `templates`) under `/users/{userId}` verify `exists(/databases/$(database)/documents/users/$(userId))` on creation and require `ownerId == request.auth.uid`.
3. **Immutable Ownership & Temporal Integrity**: `id`, `ownerId`, `uid`, and `createdAt` cannot be modified after creation. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
4. **Bounded Payloads & Strict Schemas**: Every entity uses a standalone `isValid[Entity]` validator enforcing `hasAll` + `hasOnly` key sets, string `.size()` limits, bounded list lengths, and `isValidId()` regex guards (`^[a-zA-Z0-9_\-]+$`).

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. Unauthenticated read/write to `/users/u1/tasks/t1` -> DENIED.
2. Unverified email token writing `/users/u1` -> DENIED.
3. Cross-user read/list/write (`uid: u2` accessing `/users/u1/tasks`) -> DENIED.
4. Identity spoofing (`uid: u1` creating task with `ownerId: "u2"`) -> DENIED.
5. Shadow field injection (`isAdmin: true` or `ghostField: 1`) -> DENIED (`hasOnly` rejects).
6. Resource exhaustion (`title` > 240 chars or `notes` > 2000 chars) -> DENIED.
7. ID poisoning (`taskId` with spaces/slashes or > 128 chars) -> DENIED (`isValidId`).
8. Unbounded array injection (`tags` with 11 items or `subtasks` with 21 items) -> DENIED.
9. Client timestamp forgery (`createdAt` != `request.time` on create) -> DENIED.
10. Immutable field mutation (`ownerId` or `createdAt` changed on update) -> DENIED.
11. Invalid enum injection (`priority: "urgent"` or `recurrence: "hourly"`) -> DENIED.
12. Orphan subcollection write when `/users/{userId}` document does not exist -> DENIED.
