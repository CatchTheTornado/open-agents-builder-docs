module.exports = {
    apps : [{
      name   : "openagentsbuilder-docs",
      script : "./src/run-server.js",
      watch: ["/home/openagentsbuilder-docs/deployment-watch.txt"],
    }]
  }