#!/usr/bin/env node

import { spawn } from 'child_process';
import chalk from 'chalk';

// Start the server with debugging enabled
console.log(chalk.blue('Starting server in debug mode...'));
console.log(chalk.yellow('Debug URL: chrome://inspect'));

const server = spawn('node', [
  '--inspect',
  '--loader=tsx',
  'server/index.ts'
], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error(chalk.red('Failed to start debug server:'), error);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\nStopping debug server...'));
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\nStopping debug server...'));
  server.kill('SIGTERM');
  process.exit(0);
});