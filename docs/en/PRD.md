# PRD.md — Product Requirements Document

## 1. Metadata

- **Project name:** SecuraDocs
- **Document version:** v0.1
- **Date:** 2025-01-10
- **Author(s):** SecuraDocs Team
- **Status:** Approved

---

## 2. Context & Problem

> Explain in a few lines the political, social, or business context and the problem the product solves.

- **Context:**  
  - Dependence on Big Techs for storing sensitive documents exposes popular organizations, collectives, and social movements to risks of surveillance, data leaks, and loss of control over critical information.
  - Digital colonialism and lack of data sovereignty for organizations working with social causes, human rights, and activism.
  - Need for FOSS (Free and Open Source Software) alternatives that allow self-hosting and complete control over infrastructure.

- **Main problem:**  
  - Popular collectives, NGOs, and social movements need to store and share documents without exposing data to third parties, but don't have simple and secure alternatives that are technically and financially accessible.

- **Secondary/optional problems:**
  - Lack of fine-grained permission control for accessing sensitive documents.
  - Difficulty auditing who accessed which documents and when.
  - Dependence on proprietary services that may change policies or discontinue services.
  - High cost of enterprise solutions for non-profit organizations.
  - Technical complexity of existing self-hosted solutions (Nextcloud, Seafile) for small teams.

---

## 3. Product Vision

> A paragraph summarizing the vision.

> _"Create a simple, secure, and sovereign alternative for file storage and sharing for popular organizations, focusing on digital autonomy, privacy, and complete control over data."_  

- **Mission:**  
  Empower popular organizations with document storage and sharing tools that ensure digital sovereignty, privacy, and control over their data, without depending on Big Techs or proprietary solutions.

- **Positioning:**  
  "Google Drive-like, but self-hostable, focused on security, autonomy, and privacy for collectives and social movements."

---

## 4. Objectives (MVP and beyond)

### 4.1 MVP Objectives

List 3 to 5 clear objectives.

- [ ] Enable basic file upload, organization, and sharing with an intuitive interface.
- [ ] Ensure data remains on infrastructure under the organization's control (self-hosted or cloud with control).
- [ ] Implement basic authentication with minimum viable authorization (users, permissions per file/folder).
- [ ] Provide basic audit logs (who accessed what and when).
- [ ] Offer a simple user experience, without requiring advanced technical knowledge for basic operation.

### 4.2 Long-term Objectives

- [ ] Detailed access auditing with report export.
- [ ] End-to-end encryption for sensitive files.
- [ ] Collaborative tools (real-time editing, comments, versions).
- [ ] Support for multiple organizations (multi-tenant) in the same deployment.
- [ ] Integration with communication tools (Matrix, Signal, etc.).
- [ ] Public API for custom integrations.
- [ ] Desktop/mobile synchronization (native client).

---

## 5. Target Audience & Personas

### 5.1 Target Audience

- **Organization type:** Popular collectives, unions, NGOs, social movements, activism groups, community associations.
- **User team size:** 5 to 50 people per organization.
- **Digital literacy level:** Basic to intermediate (does not require advanced technical knowledge for basic use).

### 5.2 Personas (example structure)

**Persona 1 — Maria, Collective Coordinator**

- Role: Coordinator of a residents' collective fighting for housing.
- Objectives:  
  - Organize collective documents (meeting minutes, legal documents, occupation photos).
  - Ensure access to the right members without exposing sensitive information.
  - Share documents with lawyers and partners securely.
- Pain points:  
  - Fear that sensitive documents will leak or be accessed by third parties.
  - Difficulty managing permissions in tools like Google Drive.
  - Concern about costs of paid solutions.

**Persona 2 — João, NGO Member**

- Role: Member of an NGO working with human rights.
- Objectives:  
  - Quickly access documents shared by the team.
  - Know when documents were modified or accessed.
  - Work offline when possible.
- Pain points:  
  - Dependence on internet to access critical documents.
  - Lack of transparency about who accessed which documents.
  - Confusing interface of existing tools.

**Persona 3 — Ana, Technical Administrator**

- Role: Person responsible for maintaining the organization's technical infrastructure.
- Objectives:  
  - Ensure the system is easy to maintain and update.
  - Have complete control over where data is stored.
  - Be able to backup and migrate when necessary.
- Pain points:  
  - Complexity of existing self-hosted solutions.
  - Lack of clear documentation for migration and maintenance.
  - Difficulty scaling when the organization grows.

---

## 6. Main Use Cases

List the flows that really matter for the MVP.

1. **[UC-01] File Upload**
   - Actor: Authenticated user
   - Description: User sends a file through the web interface. The system validates the file (type, size), stores it in secure storage, and displays it in the interface immediately.
   - Acceptance criteria:
     - [ ] User sees success/error feedback during upload.
     - [ ] File appears in the list immediately after successful upload.
     - [ ] Invalid files (too large, disallowed types) are rejected with a clear message.
     - [ ] System maintains file metadata (name, size, type, upload date, owner).

2. **[UC-02] Share File/Folder**
   - Actor: File/folder owner or user with sharing permission
   - Description: User creates a sharing link or shares directly with other system users, defining permissions (read, write).
   - Acceptance criteria:
     - [ ] Allow sharing via public link (with secure token) and/or with specific users.
     - [ ] Allow defining minimum permissions (read, write, administration).
     - [ ] Sharing links can have configurable expiration.
     - [ ] Shared users receive notification (optional in MVP).

3. **[UC-03] Manage Permissions**
   - Actor: Resource owner or administrator
   - Description: User views and modifies access permissions for files and folders, including access removal.
   - Acceptance criteria:
     - [ ] View list of users/groups with access to the resource.
     - [ ] Add/remove permissions for specific users.
     - [ ] Modify permission level (read → write, etc.).
     - [ ] Revoke sharing links.

4. **[UC-04] Navigate and Organize Files**
   - Actor: Authenticated user
   - Description: User navigates folders, creates new folders, moves files between folders, and renames resources.
   - Acceptance criteria:
     - [ ] View hierarchical folder structure.
     - [ ] Create new folders within existing folders.
     - [ ] Move files/folders by dragging or via context menu.
     - [ ] Rename files and folders.
     - [ ] Search files by name.

5. **[UC-05] File Download**
   - Actor: User with read permission
   - Description: User downloads a shared or own file through the interface.
   - Acceptance criteria:
     - [ ] Download works for own and shared files (with permission).
     - [ ] System records download in audit logs.
     - [ ] Download maintains original file name.

6. **[UC-06] View Audit Logs**
   - Actor: Administrator or resource owner
   - Description: User views history of actions performed on files/folders (accesses, downloads, modifications).
   - Acceptance criteria:
     - [ ] Display list of events (action, user, date/time, resource).
     - [ ] Filter by action type, user, or period.
     - [ ] Export logs in CSV/JSON format (optional in MVP).

---

## 7. Functional Requirements (FR)

List as FR-01, FR-02, etc.

- **FR-01 — User authentication**
  - The system must allow users to register and login using email and password.
  - Passwords must be stored with secure hash (argon2 or bcrypt).
  - Sessions must be managed securely (signed cookies, configurable expiration).

- **FR-02 — File upload**
  - The system must allow individual file uploads through the web interface.
  - Must validate file type and configurable maximum size.
  - Must store files in secure storage (Nextcloud WebDAV).
  - Must maintain metadata in the database (name, size, MIME type, date, owner).

- **FR-03 — Folder/collection creation**
  - The system must allow creating hierarchical folders for file organization.
  - Folders can contain other folders and files.
  - Each folder has an owner and inherits permissions from context.

- **FR-04 — Sharing with access control**
  - The system must allow sharing files and folders via public link (with unique token).
  - Must allow sharing with specific system users.
  - Must support permission levels: read, write, administration.
  - Sharing links can have expiration date.

- **FR-05 — File download**
  - Authenticated users can download own files.
  - Users with read permission can download shared files.
  - System must validate permissions before allowing download.

- **FR-06 — Navigation and organization**
  - System must display hierarchical folder and file structure.
  - Must allow moving files/folders between folders.
  - Must allow renaming files and folders.
  - Must allow searching by file/folder name.

- **FR-07 — Audit event logging**
  - System must log critical events: login, logout, upload, download, sharing, permission modifications.
  - Logs must include: user, action, affected resource, date/time, IP address (optional).
  - Administrators must be able to view audit logs.

- **FR-08 — Permission management**
  - Resource owners must be able to view and modify permissions.
  - Must be possible to revoke access for specific users or sharing links.
  - Permissions must be inherited from parent folders when applicable (optional in MVP).

---

## 8. Non-Functional Requirements (NFR)

### 8.1 Sovereignty & Data Control

- **NFR-SOB-01** — The system must allow deployment on own infrastructure (local server, VPS, own cloud).
- **NFR-SOB-02** — Avoid critical proprietary dependencies (or plan clear exit route).
- **NFR-SOB-03** — Data must be exportable/migratable without vendor lock-in.
- **NFR-SOB-04** — Source code must be open source and auditable.

### 8.2 Security & Privacy

- **NFR-SEC-01** — All traffic must use HTTPS/TLS in production.
- **NFR-SEC-02** — Passwords must never be stored in plain text (hash with modern algorithm).
- **NFR-SEC-03** — There must be a clear logging policy (what to log, for how long, who has access).
- **NFR-SEC-04** — Sharing tokens must be cryptographically secure and unpredictable.
- **NFR-SEC-05** — Input validation to prevent attacks (XSS, SQL injection, path traversal).
- **NFR-SEC-06** — Rate limiting on critical endpoints (login, upload).

### 8.3 Access Control

- **NFR-CTL-01** — Permissions must be context-based (users, groups, resources).
- **NFR-CTL-02** — Sensitive permissions cannot be public by default (principle of least privilege).
- **NFR-CTL-03** — Permission validation must occur in all critical operations (server-side).

### 8.4 Auditing & Transparency

- **NFR-AUD-01** — The system must log, at minimum, logins, uploads, downloads, and permission modifications.
- **NFR-AUD-02** — There must be a way to export logs for external analysis (CSV/JSON).
- **NFR-AUD-03** — Logs must be immutable or protected against unauthorized modification.

### 8.5 Performance & Scalability

- **NFR-PERF-01** — The system must support at least 20 simultaneous users in the MVP.
- **NFR-PERF-02** — Average response time < 500ms for common operations (listing, navigation).
- **NFR-PERF-03** — File uploads up to 100MB must complete in reasonable time (< 30s on stable connection).
- **NFR-PERF-04** — Interface must be responsive and not freeze during asynchronous operations.

### 8.6 Usability & Accessibility

- **NFR-UX-01** — Responsive interface (mobile/desktop).
- **NFR-UX-02** — Follow accessibility best practices (contrast, keyboard navigation, ARIA labels).
- **NFR-UX-03** — Error messages must be clear and actionable.
- **NFR-UX-04** — Interface must be intuitive for users with basic digital literacy level.

### 8.7 Maintainability & Deployment

- **NFR-DEP-01** — Deployment must be simple (preferably via Docker Compose).
- **NFR-DEP-02** — Clear documentation for setup, migration, and maintenance.
- **NFR-DEP-03** — System must support updates without data loss.
- **NFR-DEP-04** — Backup and restore must be documented and testable.

---

## 9. MVP Scope (First Delivery)

> List what **is included** and what **is not included** in the MVP.

### 9.1 Included

- [ ] Basic authentication (register/login with email and password).
- [ ] Upload/Download of individual files.
- [ ] Minimum folder/collection structure (create, navigate, move).
- [ ] Simple sharing (public link with token, sharing with specific users).
- [ ] Basic permissions (read, write).
- [ ] Basic audit logs (viewing main events).
- [ ] Basic responsive web interface.

### 9.2 Out of scope (for now)

- [ ] Real-time collaborative document editing.
- [ ] End-to-end encryption (E2EE).
- [ ] Advanced administration interface (bulk user management, global settings).
- [ ] File versions (modification history).
- [ ] Comments and annotations on files.
- [ ] File preview (image, PDF viewing, etc.) in the interface.
- [ ] Desktop/mobile synchronization (native client).
- [ ] Multi-tenant (multiple organizations in the same deployment).
- [ ] Integration with external services (email, push notifications).
- [ ] Public API for integrations.

---

## 10. Success Metrics

- **Adoption:**  
  - N organizations using in X months (initial goal: 3-5 pilot organizations).
  - User retention rate (users who continue using after first week).

- **Usage:**  
  - N files stored per organization.
  - N logins per week/month.
  - N shares created.

- **Satisfaction:**  
  - Qualitative feedback from collectives (interviews, surveys).
  - NPS or similar (goal: > 50).

- **Sovereignty/Security:**  
  - % of infrastructure under own control (goal: 100% for organizations that choose self-hosted).
  - Zero data leak incidents during test period.
  - Average time for self-hosted deployment (goal: < 2 hours for person with basic knowledge).

- **Performance:**  
  - Average response time for critical operations.
  - Upload success rate (> 95%).

---

## 11. Dependencies & Constraints

- **External dependencies:**
  - PostgreSQL (self-hosted via Docker, shared with Nextcloud)
  - Nextcloud (self-hosted via Docker) for file storage
  - Deployment infrastructure (VPS, cloud, own server)
  - Docker and Docker Compose

- **Time constraints:**
  - MVP must be developed incrementally, validating each feature before advancing.

- **Budget constraints:**
  - Solution must be viable for non-profit organizations (low or zero costs for basic use).
  - Self-hosted infrastructure eliminates managed service costs.
  - Basic VPS (4GB RAM) sufficient for small/medium organizations.

- **Technical constraints:**
  - Must work on common infrastructure (VPS with 2GB RAM minimum, recommended 4GB+).
  - Must be deployable via Docker Compose by person with basic technical knowledge.
  - Requires Nextcloud for file storage (via WebDAV API).

---

## 12. Risks & Assumptions

- **Risks:**  
  - Lack of people to maintain the server long-term (mitigation: clear documentation, community).
  - Technical complexity for small organizations (mitigation: simple interface, automated deployment).
  - Storage scalability for large organizations (mitigation: architecture prepared for growth).
  - Security: undetected vulnerabilities (mitigation: code audits, best practices).

- **Assumptions:**  
  - There will be someone responsible for backup and basic maintenance in each organization.
  - Organizations have access to basic infrastructure (VPS or own server).
  - Users have basic web navigation knowledge.
  - Stable internet for basic operation (does not require offline-first in MVP).

---

## 13. Next Steps

- [ ] Validate this PRD with collectives and potential stakeholders.
- [ ] Define initial backlog based on use cases.
- [ ] Prioritize stories for MVP following incremental approach (see PLAN.md).
- [ ] Create interface prototypes for UX validation.
- [ ] Establish tracking metrics and analytics tools (respecting privacy).

---

## 14. References & Inspirations

- **Similar projects:**
  - Nextcloud (now used as SecuraDocs storage backend).
  - Seafile (focus on sync, less focus on web).
  - CryptPad (focus on collaboration and privacy).

- **Nextcloud integration:**
  - SecuraDocs uses Nextcloud as storage backend via WebDAV API.
  - PostgreSQL is shared between SecuraDocs and Nextcloud.
  - Users can access files directly via Nextcloud interface if needed.
  - Nextcloud mobile and desktop apps can synchronize files.

- **Philosophy:**
  - Free software principles and digital sovereignty.
  - Privacy by design.
  - Accessibility and digital inclusion.
  - Complete data sovereignty via self-hosted infrastructure.
