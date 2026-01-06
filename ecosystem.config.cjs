// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'bizgen',
      cwd: '/home/ubuntu/apps/bizgen',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3003',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};