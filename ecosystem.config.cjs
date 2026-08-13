module.exports = {
  apps: [
    {
      name: 'rshdbarabaicom',
      cwd: '/Users/basoro/Server/data/www/rshdbarabaicom',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
