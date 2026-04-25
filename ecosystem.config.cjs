module.exports = {
  apps: [{
    name: 'bizgen',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/apps/bizgen',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    }
  }]
}