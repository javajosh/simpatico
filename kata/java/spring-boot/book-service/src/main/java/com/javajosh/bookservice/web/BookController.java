package com.javajosh.bookservice.web;

import com.javajosh.bookservice.Book;
import com.javajosh.bookservice.BookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("books")
public class BookController {

  private final BookRepository bookRepository;

  public BookController(BookRepository bookRepository) {
    this.bookRepository = bookRepository;
  }

  @GetMapping
  public Iterable<Book> getAllBooks() {
    return bookRepository.findAll();
  }

  @GetMapping("{isbn}")
  public Book getBookByIsbn(@PathVariable("isbn") String isbn) throws BookNotFoundException {
    return bookRepository.findByIsbn(isbn)
      .orElseThrow(() -> new BookNotFoundException(isbn));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Book addBook(@RequestBody Book book) {
    return bookRepository.save(book);
  }
}
