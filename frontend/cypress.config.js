import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // A URL do seu Frontend React
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});