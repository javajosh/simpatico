package com.javajosh.bookservice;

import com.javajosh.bookservice.web.BookController;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;


@RunWith(SpringRunner.class)
@WebMvcTest
@AutoConfigureMockMvc
public class BookControllerIntegrationTest {

  @MockBean
  private BookRepository bookRepository;

  @Autowired
  BookController bookController;

  @Autowired
  private MockMvc mockMvc;

  //...

}
