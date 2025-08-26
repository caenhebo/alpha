module.exports = {
  apps: [{
    name: 'caenhebo-alpha',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3018,
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/caenhebo-alpha-error.log',
    out_file: '/root/.pm2/logs/caenhebo-alpha-out.log',
    time: true,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3018,
    }
  }]
};