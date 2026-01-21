# ROADMAP.md

> **Current Phase**: Phase 3: Admin Review & AI SOW Engine
> **Milestone**: v1.0 MVP

## Must-Haves (from SPEC)
- [ ] RPM Intake Workflow (Mobile/Web)
- [ ] Admin Review Console
- [ ] SOW Generation & PDF Export
- [ ] Client Approval Web View
- [ ] Audio Recording & Transcription

## Phases

### Phase 1: Foundation & Core Entities
**Status**: ✅ Completed
**Objective**: Set up the project structure, authentication, and core database schema.
**Requirements**: 
- Initialize Next.js (Web) and React Native (Mobile) repositories (or Monorepo)
- Set up PostgreSQL and Prisma (or equivalent ORM)
- Implement Authentication (Supabase/Auth0 or NextAuth)
- Define User, Client, Project, Category, QuestionSet entities

### Phase 2: Intake Engine (RPM)
**Status**: ✅ Completed
**Objective**: Enable RPMs to start projects and answer questions.
**Requirements**:
- Category & Question Set Management (Seeding/Basic UI)
- RPM New Project Wizard
- Dynamic Question Renderer (Text, Select, Date, Uploads)
- Autosave & Draft Management
- Submission Workflow (Draft -> Submitted)

### Phase 3: Admin Review & AI SOW Engine
**Status**: 🔄 In Progress
**Objective**: Enable Admins to review intakes and generate AI-enhanced SOWs.
**Current Task**: Database & API Integration
**Accomplished**:
- Merged mobile schema models into web database.
- Created public API endpoints for Mobile App (`/projects`, `/categories`, `/ai`).
- Seeded database with Film Production category.
**Next Steps**:
- Verify Mobile App end-to-end flow.
- Build Admin Review Dashboard.
- Intake Detail View & Review Actions (Approve/Request Changes)
- **Talent & Team Integration**: Network models, API endpoints, and assignment logic during SOW finalization.
- **Custom GPT API Integration**: Connect to Custom GPT for intake analysis/SOW generation
- SOW Template System & Rich Editor
- SOW Editor & PDF Generation
- Status Machine Implementation (Submitted -> Approved -> SOW Sent)
- **Web Network Display**: Featured teams and talent showcased on landing page.

### Phase 4: Client Loop & Rich Media
**Status**: ⬜ Not Started
**Objective**: Complete the loop with Client approval and add Audio capabilities.
**Requirements**:
- Client SOW View (Secure Link)
- Client Approval/Revision Workflow
- Audio Recording (Consent Capture)
- File Uploads (S3) & Transcription Integration
- Transcript Viewer/Editor

### Phase 5: Polish, Store Launch & API Hardening
**Status**: ⬜ Not Started
**Objective**: Notifications, Logging, Security Hardening, and App Store Release.
**Requirements**:
- Notification System (Email/In-App)
- Audit Logging (Who did what when)
- Access Control Hardening
- **App Store Preparation**: Assets, Screenshots, and Builds for iOS/Android
- **API Versioning**: Ensure API is ready for future external website consumers
