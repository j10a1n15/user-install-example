import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Pattern command to get skyhanni patterns
const PATTERN_COMMAND = {
  name: 'pattern',
  type: 1,
  description: 'Get SkyHanni patterns',
  options: [
    {
      type: 3,
      name: 'key',
      description: 'The key of the pattern to get',
      required: true,
    },
  ],
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [
  PATTERN_COMMAND
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
