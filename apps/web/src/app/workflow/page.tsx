"use client";

import React from "react";
import "./workflow.css";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Camera,
  Check,
  ClipboardList,
  FileSignature,
  Handshake,
  ListChecks,
  SearchCheck,
  Smartphone,
  Tag
} from 'lucide-react';

const talentSteps = [
  {
    title: 'Talent Sign Up',
    label: 'Portfolio submitted',
    icon: Camera,
    description:
      'Team or talent signs up and adds visual evidence of their work into a portfolio, plus details about their abilities.'
  },
  {
    title: 'Talent Sign Up',
    label: 'Admin approved',
    icon: Camera,
    approved: true,
    description:
      'Team or talent is approved by the TalentEarth admin team before becoming visible for project matching.'
  }
];

const projectSteps = [
  {
    title: 'RPM Submission',
    subtitle: 'Finley App',
    icon: Smartphone,
    accent: 'teal',
    description:
      'Asks all the relevant questions to make sure the details are fully collected.'
  },
  {
    title: 'Statement of Work',
    icon: FileSignature,
    accent: 'lime',
    description: 'Creates a SOW that the client has to approve through DocuSign.'
  },
  {
    title: 'TalentIQ',
    icon: ListChecks,
    accent: 'blue',
    description:
      'TalentIQ matches the SOW to the right talent or team: individuals for small projects, teams for larger ones.'
  },
  {
    title: 'Team Pricing',
    icon: Tag,
    accent: 'blue',
    description:
      'Team or talent submits their pricing into the app for consideration.'
  },
  {
    title: 'Team Pricing',
    icon: Tag,
    approved: true,
    accent: 'blue',
    description:
      'Pricing is approved and the project is awarded with timelines, ownership, and next steps.'
  }
];

function ApprovalBadge() {
  return (
    <span className="approval-badge" aria-label="Approved">
      <BadgeCheck size={34} />
    </span>
  );
}

function StepCard({ step, lane }: { step: any, lane: string }) {
  const Icon = step.icon;

  return (
    <article className={`step ${lane}-step`}>
      <div className="device-card">
        <div className="device-title">
          <span>{step.title}</span>
          {step.subtitle && <span>{step.subtitle}</span>}
        </div>

        <div className={`icon-stage ${step.accent || 'blue'}`}>
          <Icon size={lane === 'talent' ? 64 : 72} strokeWidth={2.2} />
        </div>

        {step.label && <p className="card-label">{step.label}</p>}
        {step.approved && <ApprovalBadge />}
      </div>

      <p className="step-description">{step.description}</p>
    </article>
  );
}

function Connector({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`connector ${compact ? 'connector-compact' : ''}`} aria-hidden="true">
      <ArrowRight size={38} strokeWidth={3} />
    </div>
  );
}

export default function WorkflowDemoPage() {
  return (
    <div className="workflow-page-container">
      <main className="workflow-page">
        <section className="intro">
          <div>
            <p className="eyebrow">TalentEarth workflow prototype</p>
            <h1>From verified talent to awarded project</h1>
          </div>
          <p>
            A standalone layout for testing the onboarding, scoping, matching, and pricing flow before it moves into the main product.
          </p>
        </section>

        <section className="workflow-shell" aria-label="TalentEarth workflow">
          <div className="lane-header">
            <div>
              <p className="lane-kicker">Prerequisite lane</p>
              <h2>Talent verification</h2>
            </div>
            <div className="lane-note">
              <Award size={18} />
              <span>Only approved profiles become visible to TalentIQ.</span>
            </div>
          </div>

          <div className="talent-lane">
            {talentSteps.map((step, index) => (
              <div className="flow-item" key={`${step.title}-${step.label}`}>
                <StepCard step={step} lane="talent" />
                {index < talentSteps.length - 1 && <Connector compact />}
              </div>
            ))}
          </div>

          <div className="joiner">
            <div />
            <span>
              <SearchCheck size={18} />
              TalentIQ uses approved talent data during matching
            </span>
            <div />
          </div>

          <div className="lane-header project-header">
            <div>
              <p className="lane-kicker">Primary lane</p>
              <h2>Client project flow</h2>
            </div>
            <div className="lane-note">
              <ClipboardList size={18} />
              <span>Submission to award, shown as a Vercel-ready prototype.</span>
            </div>
          </div>

          <div className="project-lane">
            {projectSteps.map((step, index) => (
              <div className="flow-item" key={`${step.title}-${index}`}>
                <StepCard step={step} lane="project" />
                {index < projectSteps.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </section>

        <section className="summary-strip" aria-label="Workflow summary">
          <div>
            <Check size={18} />
            <span>Collect complete project details</span>
          </div>
          <div>
            <FileSignature size={18} />
            <span>Create and approve the SOW</span>
          </div>
          <div>
            <Handshake size={18} />
            <span>Match, price, approve, and award</span>
          </div>
        </section>
      </main>
    </div>
  );
}
