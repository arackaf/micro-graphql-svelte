<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { query } from "../../../src/index";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";
  import { bookSoftResetQuery, softResetQuery, subjectSoftResetQuery } from "./softResetHelpers";

  let searchState = getContext("search_params");

  // let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY, {
  //   onMutation: {
  //     when: /(update|create|delete)Books?/,
  //     run: ({ softReset, currentResults }, resp) => {
  //       const updatedBooks = resp.updateBooks?.Books ?? [resp.updateBook.Book];
  //       updatedBooks.forEach(book => {
  //         let CachedBook = currentResults.allBooks.Books.find(b => b._id == book._id);
  //         CachedBook && Object.assign(CachedBook, book);
  //       });
  //       softReset(currentResults);
  //     }
  //   }
  // });
  // let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY, {
  //   onMutation: {
  //     when: /(update|create|delete)Subjects?/,
  //     run: ({ softReset, currentResults }, resp) => {
  //       const updatedSubjects = resp.updateSubjects?.Subjects ?? [resp.updateSubject.Subject];
  //       updatedSubjects.forEach(subject => {
  //         let CachedSubject = currentResults.allSubjects.Subjects.find(b => b._id == subject._id);
  //         CachedSubject && Object.assign(CachedSubject, subject);
  //       });
  //       softReset(currentResults);
  //     }
  //   }
  // });

  // let { queryState: booksState, sync: booksSync } = softResetQuery("Book", BOOKS_QUERY);
  // let { queryState: subjectsState, sync: subjectsSync } = softResetQuery("Subject", ALL_SUBJECTS_QUERY);

  let { queryState: booksState, sync: booksSync } = bookSoftResetQuery(BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = subjectSoftResetQuery(ALL_SUBJECTS_QUERY);

  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
