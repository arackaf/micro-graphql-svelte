export interface Book {
  id: number;
}

export interface UpdateBookResult {
  updateBook: {
    Book: Book;
  };
}
