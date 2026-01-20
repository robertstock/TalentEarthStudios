# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 MVP

## Must-Haves (from SPEC)
- [ ] RPM Intake Workflow (Mobile/Web)
- [ ] Admin Review Console
- [ ] SOW Generation & PDF Export
- [ ] Client Approval Web View
- [ ] Audio Recording & Transcription

## Phases

### Phase 1: Foundation & Core Entities
**Status**: ⬜ Not Started
**Objective**: Set up the project structure, authentication, and core database schema.
**Requirements**: 
- Initialize Next.js (Web) and React Native (Mobile) repositories (or Monorepo)
- Set up PostgreSQL and Prisma (or equivalent ORM)
- Implement Authentication (Supabase/Auth0 or NextAuth)
- Define User, Client, Project, Category, QuestionSet entities

### Phase 2: Intake Engine (RPM)
**Status**: ⬜ Not Started
**Objective**: Enable RPMs to start projects and answer questions.
**Requirements**:
- Category & Question Set Management (Seeding/Basic UI)
- RPM New Project Wizard
- Dynamic Question Renderer (Text, Select, Date, Uploads)
- Autosave & Draft Management
- Submission Workflow (Draft -> Submitted)

### Phase 3: Admin Review & SOW Engine
**Status**: ⬜ Not Started
**Objective**: Enable Admins to review intakes and generate SOWs.
**Requirements**:
- Admin Dashboard (Review Queue)
- Intake Detail View & Review Actions (Approve/Request Changes)
- SOW Template System
- SOW Editor & PDF Generation
- Status Machine Implementation (Submitted -> Approved -> SOW Sent)

### Phase 4: Client Loop & Rich Media
**Status**: ⬜ Not Started
**Objective**: Complete the loop with Client approval and add Audio capabilities.
**Requirements**:
- Client SOW View (Secure Link)
- Client Approval/Revision Workflow
- Audio Recording (Consent Capture)
- File Uploads (S3) & Transcription Integration
- Transcript Viewer/Editor

### Phase 5: Polish & Launch
**Status**: ⬜ Not Started
**Objective**: Notifications, Logging, and Security Hardening.
**Requirements**:
- Notification System (Email/In-App)
- Audit Logging (Who did what when)
- Access Control Hardening
- Final QA & Bug Fixes
- Deployment
