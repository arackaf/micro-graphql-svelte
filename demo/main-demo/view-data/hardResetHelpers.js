import { query } from "../../../src/index";

export const hardResetQuery = (type, queryToRun, options = {}) =>
  query(queryToRun, {
    ...options,
    onMutation: {
      when: new RegExp(`(update|create|delete)${type}s?`),
      run: ({ hardReset }) => hardReset()
    }
  });

export const bookHardResetQuery = (...args) => hardResetQuery("Book", ...args);
export const subjectHardResetQuery = (...args) => hardResetQuery("Subject", ...args);
