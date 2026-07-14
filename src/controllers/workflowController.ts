import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflowService';

export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  health = (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  };

  listTemplates = (_req: Request, res: Response) => {
    res.json(this.workflowService.listTemplates());
  };

  createTemplate = (req: Request, res: Response) => {
    try {
      const template = this.workflowService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateTemplate = (req: Request, res: Response) => {
    try {
      const template = this.workflowService.updateTemplate({ id: req.params.id, ...req.body });
      res.json(template);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  deleteTemplate = (req: Request, res: Response) => {
    try {
      const templateId = String(req.params.id);
      this.workflowService.deleteTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  assignUsersToTemplate = (req: Request, res: Response) => {
    try {
      const templateId = String(req.params.id);
      const template = this.workflowService.assignUsersToTemplate(templateId, req.body.userIds ?? []);
      res.json(template);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  };

  createUser = (req: Request, res: Response) => {
    try {
      const user = this.workflowService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  listUsers = (_req: Request, res: Response) => {
    res.json(this.workflowService.listUsers());
  };

  createItem = (req: Request, res: Response) => {
    try {
      const item = this.workflowService.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  listItems = (_req: Request, res: Response) => {
    res.json(this.workflowService.listItems());
  };

  transitionItem = (req: Request, res: Response) => {
    try {
      const itemId = String(req.params.id);
      const item = this.workflowService.transitionItem(itemId, req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
}
