module.exports = {
    apps : [{
      name   : "openagentsbuilder-docs",
      script : "./src/run-server.js",
      watch: ["src", "dist"],
    }]
  }