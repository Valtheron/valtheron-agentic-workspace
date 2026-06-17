export type ContributionCategory = 'docs' | 'review' | 'tests' | 'onboarding' | 'brainstorm';

export interface ContributionTopic {
  id: string;
  category: ContributionCategory;
  title: string;
  shortDesc: string;
  fullDesc: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedEffort: string;
}

export interface DraftVersion {
  id: string;
  responseMarkdown: string;
  timestamp: string;
  label: string;
}

export interface ContributionDraft {
  id: string;
  topicId: string;
  title: string;
  category: ContributionCategory;
  promptNotes: string;
  responseMarkdown: string;
  createdAt: string;
  versions?: DraftVersion[];
}

export interface CodeReviewPayload {
  code: string;
  context: 'security' | 'sqlite' | 'express' | 'general';
}

export interface DocsPayload {
  topic: string;
  format: 'readme' | 'tutorial' | 'api-ref' | 'flowchart';
  scope: string;
}

export interface TestPayload {
  component: string;
  agentType: string;
  complexity: 'simple' | 'complex';
}

export interface BrainstormPayload {
  feature: 'postgresql' | 'kubernetes' | 'sso-oidc' | 'scaling';
  details: string;
}
