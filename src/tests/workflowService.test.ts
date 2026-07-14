import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowService } from '../services/workflowService';

test('admin can create a template and move an item through a permitted stage', () => {
  const service = new WorkflowService();

  const admin = service.createUser({ name: 'Admin', email: 'admin@example.com', roles: ['admin'] });
  const reviewer = service.createUser({ name: 'Reviewer', email: 'reviewer@example.com', roles: ['reviewer'] });

  const template = service.createTemplate({
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

  const item = service.createItem({
    templateId: template.id,
    title: 'Holiday request',
    description: 'One week leave',
    assignedUserIds: [reviewer.id],
    createdByUserId: admin.id
  });

  const firstTransition = service.transitionItem(item.id, {
    userId: reviewer.id,
    toStageId: 'review'
  });

  assert.equal(firstTransition.currentStageId, 'review');
  assert.equal(firstTransition.version, 2);
  assert.equal(firstTransition.events.length, 2);

  const secondTransition = service.transitionItem(firstTransition.id, {
    userId: admin.id,
    toStageId: 'approved'
  });

  assert.equal(secondTransition.currentStageId, 'approved');
  assert.equal(secondTransition.version, 3);
});
