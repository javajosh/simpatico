package io.simpatico.java.spring.exercises;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test with `http localhost:8080/post id==1`
 */
@RestController
public class PostController {

  private final AtomicLong counter = new AtomicLong();
  private PostRepository postRepository;

  public PostController(PostRepository repository){
    this.postRepository = repository;
  }

  @GetMapping("/post")
  public Post post(@RequestParam(name = "id", defaultValue = "1") Integer id) {
    return postRepository.findByIdEquals(id).orElseThrow();
  }
}
