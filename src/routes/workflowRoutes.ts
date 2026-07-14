import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController';
import { WorkflowService } from '../services/workflowService';

const router = Router();
const workflowService = new WorkflowService();
const workflowController = new WorkflowController(workflowService);

router.get('/health', workflowController.health);

router.get('/templates', workflowController.listTemplates);
router.post('/templates', workflowController.createTemplate);
router.put('/templates/:id', workflowController.updateTemplate);
router.delete('/templates/:id', workflowController.deleteTemplate);
router.post('/templates/:id/assign-users', workflowController.assignUsersToTemplate);

router.post('/users', workflowController.createUser);
router.get('/users', workflowController.listUsers);

router.post('/items', workflowController.createItem);
router.get('/items', workflowController.listItems);
router.post('/items/:id/transition', workflowController.transitionItem);

export default router;
