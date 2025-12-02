import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import { graphqlIoTCoreButtonEvents } from './functions/graphqlIoTCoreButtonEvents/resource';
import { graphqlIoTCoreStatus } from './functions/graphqlIoTCoreStatus/resource';
import { dynamodbToTimestream } from './functions/dynamodbToTimestream/resource';

defineBackend({
  auth,
  data,
  graphqlIoTCoreButtonEvents,
  graphqlIoTCoreStatus,
  dynamodbToTimestream,
});
