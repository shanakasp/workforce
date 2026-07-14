import {
  CreateItemInput,
  CreateTemplateInput,
  TransitionItemInput,
  UpdateTemplateInput,
  WorkflowItem,
  WorkflowTemplate,
  WorkflowUser
} from '../models/workflow';
export class WorkflowService {
  private users: WorkflowUser[] = [];
  private templates: WorkflowTemplate[] = [];
  private items: WorkflowItem[] = [];

  createUser(input: Omit<WorkflowUser, 'id'>): WorkflowUser {
    const user: WorkflowUser = {
      id: `user-${this.users.length + 1}`,
      ...input
    };
    this.users.push(user);
    return user;
  }

  listUsers(): WorkflowUser[] {
    return [...this.users];
  }

  createTemplate(input: CreateTemplateInput): WorkflowTemplate {
    const template: WorkflowTemplate = {
      id: `template-${this.templates.length + 1}`,
      ...input,
      createdAt: new Date().toISOString()
    };
    this.templates.push(template);
    return template;
  }

  listTemplates(): WorkflowTemplate[] {
    return [...this.templates];
  }

  updateTemplate(input: UpdateTemplateInput): WorkflowTemplate {
    const template = this.templates.find((candidate) => candidate.id === input.id);
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, input);
    return template;
  }

  deleteTemplate(templateId: string): void {
    const index = this.templates.findIndex((candidate) => candidate.id === templateId);
    if (index === -1) {
      throw new Error('Template not found');
    }
    this.templates.splice(index, 1);
  }

  assignUsersToTemplate(templateId: string, userIds: string[]): WorkflowTemplate {
    const template = this.templates.find((candidate) => candidate.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.assignedUserIds = userIds;
    return template;
  }

  createItem(input: CreateItemInput): WorkflowItem {
    const template = this.templates.find((candidate) => candidate.id === input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const creator = this.users.find((candidate) => candidate.id === input.createdByUserId);
    if (!creator) {
      throw new Error('User not found');
    }

    const initialStage = template.stages[0];
    if (!initialStage) {
      throw new Error('Template must define at least one stage');
    }

    const item: WorkflowItem = {
      id: `item-${this.items.length + 1}`,
      templateId: input.templateId,
      title: input.title,
      description: input.description,
      currentStageId: initialStage.id,
      assignedUserIds: template.assignedUserIds,
      createdByUserId: input.createdByUserId,
      version: 1,
      events: [
        {
          id: `event-${Date.now()}-1`,
          type: 'created',
          actorUserId: input.createdByUserId,
          payload: { title: input.title, stageId: initialStage.id },
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.items.push(item);
    return item;
  }

  listItems(): WorkflowItem[] {
    return [...this.items];
  }

  transitionItem(itemId: string, input: TransitionItemInput): WorkflowItem {
    const item = this.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const template = this.templates.find((candidate) => candidate.id === item.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const rule = template.transitionRules.find(
      (candidate) => candidate.fromStageId === item.currentStageId && candidate.toStageId === input.toStageId
    );

    if (!rule) {
      throw new Error('Invalid transition');
    }

    const user = this.users.find((candidate) => candidate.id === input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isAllowed =
      rule.allowedUserIds.includes(input.userId) ||
      rule.allowedRoles.some((role) => user.roles.includes(role));

    if (!isAllowed) {
      throw new Error('Unauthorized transition');
    }

    const previousStageId = item.currentStageId;
    item.currentStageId = input.toStageId;
    item.version += 1;
    item.events.push({
      id: `event-${Date.now()}`,
      type: 'transitioned',
      actorUserId: input.userId,
      payload: { fromStageId: previousStageId, toStageId: input.toStageId },
      createdAt: new Date().toISOString()
    });

    return item;
  }
}
