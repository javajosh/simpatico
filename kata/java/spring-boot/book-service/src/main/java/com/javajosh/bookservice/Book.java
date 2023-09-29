package com.javajosh.bookservice;

import org.springframework.data.annotation.Id;

public record Book(
  @Id
  Long id,
  String isbn,
  String title
){}
