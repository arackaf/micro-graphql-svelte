export const BOOKS_QUERY = `
query ALL_BOOKS($page: Int, $search: String) {
  allBooks(SORT: { title: 1 }, PAGE: $page, PAGE_SIZE: 10, title_contains: $search) {
    Books { _id title pages, subjects, authors, publisher, publicationDate, isbn, dateAdded, smallImage } 
    Meta { count }
  }
}`;

export const BOOKS_MUTATION = `mutation modifyBook($_id: String, $title: String, $pages: Int) {
  updateBook(_id: $_id, Updates: { title: $title, pages: $pages }) {
    Book { _id title pages }
  }
}`;

export const MODIFY_BOOK_TITLE = `mutation modifyBook($_id: String, $title: String) {
  updateBook(_id: $_id, Updates: { title: $title }) {
    success
    Book { _id title pages }
  }
}`;

export const MODIFY_BOOK_PAGE = `mutation modifyBook($_id: String, $pages: Int) {
  updateBook(_id: $_id, Updates: { pages: $pages }) {
    success
    Book { _id title pages }
  }
}`;

export const BOOKS_MUTATION_MULTI = `mutation modifyBooks($_ids: [String], $title: String, $pages: Int) {
  updateBooks(_ids: $_ids, Updates: { title: $title, pages: $pages }) {
    Books { _id title pages }
  }
}`;

export const BOOK_DELETE = `mutation deleteBook($_id: String) {
  deleteBook(_id: $_id)
}`;

export const BOOK_CREATE = `mutation createBook($Book: BookInput) {
  createBook(Book: $Book) { Book { _id title } }
}`;

export const ALL_SUBJECTS_QUERY = `
query ALL_SUBJECTS {
  allSubjects(SORT: { name: 1 }) {
    Subjects { _id, name, textColor, backgroundColor  }
  }
}`;

export const SUBJECTS_QUERY = `
query ALL_SUBJECTS($page: Int) {
  allSubjects(SORT: { name: 1 }, PAGE: $page, PAGE_SIZE: 10) {
    Subjects { _id name }
  }
}`;

export const SUBJECTS_MUTATION = `mutation modifySubject($_id: String, $name: String) {
  updateSubject(_id: $_id, Updates: { name: $name }) {
    Subject { _id name }
  }
}`;

export const SUBJECTS_MUTATION_MULTI = `mutation modifySubjects($_ids: [String], $name: String) {
  updateSubjects(_ids: $_ids, Updates: { name: $name }) {
    Subjects { _id name }
  }
}`;

export const SUBJECT_DELETE = `mutation deleteSubject($_id: String) {
  deleteSubject(_id: $_id)
}`;

export const SUBJECT_CREATE = `mutation createSubject($Subject: SubjectInput) {
  createSubject(Subject: $Subject) { Subject { _id name } }
}`;
