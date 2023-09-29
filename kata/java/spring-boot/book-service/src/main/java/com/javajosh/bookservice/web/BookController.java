package com.javajosh.bookservice.web;

import com.javajosh.bookservice.Book;
import com.javajosh.bookservice.BookRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
  public Book addBook(@Valid @RequestBody Book book) {
    return bookRepository.save(book);
  }

  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public Map<String, String> handleValidationExceptions(
    MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach((error) -> {
      String fieldName = ((FieldError) error).getField();
      String errorMessage = error.getDefaultMessage();
      errors.put(fieldName, errorMessage);
    });
    return errors;
  }
}
