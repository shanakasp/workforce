import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflowService';

export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  health = (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  };

  listTemplates = async (_req: Request, res: Response) => {
    const templates = await this.workflowService.listTemplates();
    res.json(templates);
  };

  createTemplate = async (req: Request, res: Response) => {
    try {
      const template = await this.workflowService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateTemplate = async (req: Request, res: Response) => {
    try {
      const template = await this.workflowService.updateTemplate({ id: req.params.id, ...req.body });
      res.json(template);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const templateId = String(req.params.id);
      await this.workflowService.deleteTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  assignUsersToTemplate = async (req: Request, res: Response) => {
    try {
      const templateId = String(req.params.id);
      const template = await this.workflowService.assignUsersToTemplate(templateId, req.body.userIds ?? []);
      res.json(template);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.workflowService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  listUsers = async (_req: Request, res: Response) => {
    const users = await this.workflowService.listUsers();
    res.json(users);
  };

  listUsersByRole = async (req: Request, res: Response) => {
    const role = String(req.params.role).toLowerCase();
    const users = (await this.workflowService.listUsers()).filter((user) => user.roles.map((item) => String(item).toLowerCase()).includes(role));
    res.json(users);
  };

  createItem = async (req: Request, res: Response) => {
    try {
      const item = await this.workflowService.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  listItems = async (_req: Request, res: Response) => {
    const items = await this.workflowService.listItems();
    res.json(items);
  };

  transitionItem = async (req: Request, res: Response) => {
    try {
      const itemId = String(req.params.id);
      const item = await this.workflowService.transitionItem(itemId, req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
}
