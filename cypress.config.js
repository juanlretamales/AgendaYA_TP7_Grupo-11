const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://127.0.0.1:5501",
        supportFile: false,
        specPattern: "**/cypress/e2e/**/*.cy.js",
        setupNodeEvents(on, config) {},
    },
});
