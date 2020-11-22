import { query } from "../../../src/index";

export const softResetQuery = (type, queryToUse, options = {}) =>
  query(queryToUse, {
    ...options,
    onMutation: {
      when: new RegExp(`update${type}s?`),
      run: ({ softReset, currentResults }, resp) => {
        const updatedItems = resp[`update${type}s`]?.[`${type}s`] ?? [resp[`update${type}`][type]];
        updatedItems.forEach(updatedItem => {
          let CachedItem = currentResults[`all${type}s`][`${type}s`].find(
            item => item._id == updatedItem._id
          );
          CachedItem && Object.assign(CachedItem, updatedItem);
        });
        softReset(currentResults);
      }
    }
  });

export const bookSoftResetQuery = (...args) => softResetQuery("Book", ...args);
export const subjectSoftResetQuery = (...args) => softResetQuery("Subject", ...args);
