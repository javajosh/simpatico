package com.javajosh.bookservice;

import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.Id;

public record Book(
  @Id
  Long id,
  @NotBlank()
  String isbn,
  @NotBlank()
  String title
){}
