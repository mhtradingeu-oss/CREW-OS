export type AutomationEventName =
  | 'order.created'
  | 'order.paid'
  | 'user.registered'
  | 'price.changed';

// Use canonical AutomationEvent from @mh-os/shared
export type { AutomationEvent } from '@mh-os/shared';
