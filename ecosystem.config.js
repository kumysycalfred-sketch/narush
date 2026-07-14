module.exports = {
  apps: [
    {
      name: 'narush',
      script: 'server.js',
      cwd: '/var/www/narush',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        DATA_DIR: '/var/www/narush/data',
      },
    },
  ],
}
