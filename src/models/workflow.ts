export type UserRole = 'admin' | 'reviewer' | 'employee' | string;

export interface WorkflowUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface WorkflowStage {
  id: string;
  name: string;
}

export interface TransitionRule {
  fromStageId: string;
  toStageId: string;
  allowedUserIds: string[];
  allowedRoles: UserRole[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  transitionRules: TransitionRule[];
  assignedUserIds: string[];
  createdAt: string;
}

export interface WorkflowEvent {
  id: string;
  type: 'created' | 'transitioned' | 'assigned';
  actorUserId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowItem {
  id: string;
  templateId: string;
  title: string;
  description: string;
  currentStageId: string;
  assignedUserIds: string[];
  createdByUserId: string;
  version: number;
  events: WorkflowEvent[];
  createdAt: string;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  stages: WorkflowStage[];
  transitionRules: TransitionRule[];
  assignedUserIds: string[];
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export interface CreateItemInput {
  templateId: string;
  title: string;
  description: string;
  createdByUserId: string;
}

export interface TransitionItemInput {
  userId: string;
  toStageId: string;
}
