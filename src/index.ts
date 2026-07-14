import express from 'express';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflowRoutes';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/', workflowRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
