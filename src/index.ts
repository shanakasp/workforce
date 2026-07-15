import express from 'express';
import dotenv from 'dotenv';
import { createWorkflowRoutes } from './routes/workflowRoutes';
import { WorkflowService } from './services/workflowService';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const workflowService = new WorkflowService();
app.use('/', createWorkflowRoutes(workflowService));

async function start() {
  await workflowService.initialize();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start app', error);
  process.exit(1);
});
