import {
  CreateItemInput,
  CreateTemplateInput,
  TransitionItemInput,
  UpdateTemplateInput,
  WorkflowItem,
  WorkflowTemplate,
  WorkflowUser
} from '../models/workflow';
import { InMemoryWorkflowStore, PostgresWorkflowStore, WorkflowState } from '../persistence/workflowStore';

export class WorkflowService {
  private users: WorkflowUser[] = [];
  private templates: WorkflowTemplate[] = [];
  private items: WorkflowItem[] = [];
  private readonly store: InMemoryWorkflowStore | PostgresWorkflowStore;

  constructor(store?: InMemoryWorkflowStore | PostgresWorkflowStore) {
    this.store = store ?? (process.env.DATABASE_URL ? new PostgresWorkflowStore() : new InMemoryWorkflowStore());
  }

  private async persist(): Promise<void> {
    await this.store.saveState({ users: this.users, templates: this.templates, items: this.items });
  }

  private async hydrate(): Promise<void> {
    const state = await this.store.loadState();
    this.users = state.users;
    this.templates = state.templates;
    this.items = state.items;
  }

  async initialize(): Promise<void> {
    await this.hydrate();
  }

  async createUser(input: Omit<WorkflowUser, 'id'>): Promise<WorkflowUser> {
    await this.hydrate();
    const user: WorkflowUser = {
      id: `user-${this.users.length + 1}`,
      ...input
    };
    this.users.push(user);
    await this.persist();
    return user;
  }

  async listUsers(): Promise<WorkflowUser[]> {
    await this.hydrate();
    return [...this.users];
  }

  async createTemplate(input: CreateTemplateInput): Promise<WorkflowTemplate> {
    await this.hydrate();
    const template: WorkflowTemplate = {
      id: `template-${this.templates.length + 1}`,
      ...input,
      createdAt: new Date().toISOString()
    };
    this.templates.push(template);
    await this.persist();
    return template;
  }

  async listTemplates(): Promise<WorkflowTemplate[]> {
    await this.hydrate();
    return [...this.templates];
  }

  async updateTemplate(input: UpdateTemplateInput): Promise<WorkflowTemplate> {
    await this.hydrate();
    const template = this.templates.find((candidate) => candidate.id === input.id);
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, input);
    await this.persist();
    return template;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.hydrate();
    const index = this.templates.findIndex((candidate) => candidate.id === templateId);
    if (index === -1) {
      throw new Error('Template not found');
    }
    this.templates.splice(index, 1);
    await this.persist();
  }

  async assignUsersToTemplate(templateId: string, userIds: string[]): Promise<WorkflowTemplate> {
    await this.hydrate();
    const template = this.templates.find((candidate) => candidate.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.assignedUserIds = userIds;
    await this.persist();
    return template;
  }

  async createItem(input: CreateItemInput): Promise<WorkflowItem> {
    await this.hydrate();
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
    await this.persist();
    return item;
  }

  async listItems(): Promise<WorkflowItem[]> {
    await this.hydrate();
    return [...this.items];
  }

  async transitionItem(itemId: string, input: TransitionItemInput): Promise<WorkflowItem> {
    await this.hydrate();
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

    const hasExplicitUserAccess = rule.allowedUserIds.includes(input.userId);
    const hasRoleAccess = rule.allowedRoles.some((role) => user.roles.includes(role));

    const isAllowed =
      (rule.allowedUserIds.length > 0 ? hasExplicitUserAccess : hasRoleAccess) ||
      (rule.allowedUserIds.length === 0 && hasRoleAccess);

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

    await this.persist();
    return item;
  }
}
