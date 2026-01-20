# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Finley Pro is a mobile-first web/app platform designed to streamline the project intake process for Regional Project Managers (RPMs). It replaces manual workflows with guided category-based question sets, integrated audio recording with transcription, and automated Statement of Work (SOW) generation. The platform ensures consistency, reduces errors, and accelerates the cycle from intake to signed contract.

## Goals
1. **Streamline Intake**: Enable RPMs to capture project details accurately using versioned question sets.
2. **Automate SOW**: Reduce administrative burden by generating professional SOWs directly from intake data.
3. **Enhance Accuracy**: Capture meeting audio and transcripts to ensure no details are missed.
4. ** accelerate Approval**: Provide a seamless digital workflow for internal review and client approval.

## Non-Goals (Out of Scope for MVP)
- E-signatures (Planned for Phase 2)
- Online Payments (Planned for Phase 2)
- CRM Synchronization (HubSpot/Salesforce) (Planned for Phase 2)
- Complex complex offline synchronization (MVP-lite local caching only)

## Users
- **RPM (Field User)**: Inputs project data, records meetings, submits intakes.
- **Admin Reviewer**: Reviews intakes, requests changes, generates and publishes SOWs.
- **Ops / Producer**: Assigns teams, quotes projects, manages production (Post-MVP mostly).
- **Client**: Reviews SOWs, requests revisions, or approves.

## Constraints
- **Mobile-First**: RPM interface must be optimized for mobile (iOS priority).
- **Security**: Audio and transcripts must be encrypted; signed URLs for access.
- **Compliance**: Strict consent capture required before recording audio.
- **Data Integrity**: Question sets must be versioned to prevent breaking historical project data.

## Success Criteria
- [ ] RPM can create, complete, and submit a project intake via mobile web/app.
- [ ] Admin can review submits, request changes, and approve intakes.
- [ ] System generates SOW documents (Web/PDF) from intake data + templates.
- [ ] Client can access SOW via secure link and approve or request revisions.
- [ ] Audio recording captures consent timestamp and generates editable transcript.
