module.exports = {
  apps: [
    {
      name: "nextest-queue",
      script: "C:\\PHP\\PHP.EXE",
      args: "artisan queue:work",
      cwd: "C:\\Users\\syrin\\Desktop\\TestPFE\\backend",
      windowsHide: true,
      autorestart: true
    },
    {
      name: "nextest-scheduler",
      script: "C:\\PHP\\PHP.EXE",
      args: "artisan schedule:work",
      cwd: "C:\\Users\\syrin\\Desktop\\TestPFE\\backend",
      windowsHide: true,
      autorestart: true
    }
  ]
};
