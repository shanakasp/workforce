import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowService } from '../services/workflowService';
import { InMemoryWorkflowStore } from '../persistence/workflowStore';

test('employee can create a workflow item while admin and reviewer participate in the flow', async () => {
  const service = new WorkflowService();

  const admin = await service.createUser({ name: 'Admin', email: 'admin@example.com', roles: ['admin'] });
  const reviewer = await service.createUser({ name: 'Reviewer', email: 'reviewer@example.com', roles: ['reviewer'] });
  const employee = await service.createUser({ name: 'Employee', email: 'employee@example.com', roles: ['employee'] });

  const template = await service.createTemplate({
    name: 'Leave Request',
    description: 'Employee leave request flow',
    stages: [
      { id: 'draft', name: 'Draft' },
      { id: 'review', name: 'Review' },
      { id: 'approved', name: 'Approved' }
    ],
    transitionRules: [
      { fromStageId: 'draft', toStageId: 'review', allowedUserIds: [reviewer.id], allowedRoles: [] },
      { fromStageId: 'review', toStageId: 'approved', allowedUserIds: [], allowedRoles: ['admin'] }
    ],
    assignedUserIds: [reviewer.id, admin.id]
  });

  const item = await service.createItem({
    templateId: template.id,
    title: 'Holiday request',
    description: 'One week leave',
    createdByUserId: employee.id
  });

  assert.equal(item.createdByUserId, employee.id);
  assert.equal(item.currentStageId, 'draft');

  const transitionedItem = await service.transitionItem(item.id, {
    userId: reviewer.id,
    toStageId: 'review'
  });

  assert.equal(transitionedItem.currentStageId, 'review');
});

test('service persists data across instances when using the same store', async () => {
  const store = new InMemoryWorkflowStore();
  const firstService = new WorkflowService(store);
  const createdUser = await firstService.createUser({ name: 'Persisted', email: 'persisted@example.com', roles: ['employee'] });

  const secondService = new WorkflowService(store);
  const users = await secondService.listUsers();

  assert.equal(users.length, 1);
  assert.equal(users[0]?.id, createdUser.id);
});

test('admin can create a template and move an item through a permitted stage', async () => {
  const service = new WorkflowService();

  const admin = await service.createUser({ name: 'Admin', email: 'admin@example.com', roles: ['admin'] });
  const reviewer = await service.createUser({ name: 'Reviewer', email: 'reviewer@example.com', roles: ['reviewer'] });

  const template = await service.createTemplate({
    name: 'Leave Request',
    description: 'Standard leave request flow',
    stages: [
      { id: 'draft', name: 'Draft' },
      { id: 'review', name: 'Review' },
      { id: 'approved', name: 'Approved' }
    ],
    transitionRules: [
      { fromStageId: 'draft', toStageId: 'review', allowedUserIds: [reviewer.id], allowedRoles: [] },
      { fromStageId: 'review', toStageId: 'approved', allowedUserIds: [], allowedRoles: ['admin'] }
    ],
    assignedUserIds: [reviewer.id, admin.id]
  });

  const item = await service.createItem({
    templateId: template.id,
    title: 'Holiday request',
    description: 'One week leave',
    createdByUserId: admin.id
  });

  const firstTransition = await service.transitionItem(item.id, {
    userId: reviewer.id,
    toStageId: 'review'
  });

  assert.equal(firstTransition.currentStageId, 'review');
  assert.equal(firstTransition.version, 2);
  assert.equal(firstTransition.events.length, 2);

  const secondTransition = await service.transitionItem(firstTransition.id, {
    userId: admin.id,
    toStageId: 'approved'
  });

  assert.equal(secondTransition.currentStageId, 'approved');
  assert.equal(secondTransition.version, 3);
});
