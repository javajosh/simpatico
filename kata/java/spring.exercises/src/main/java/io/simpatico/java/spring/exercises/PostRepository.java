package io.simpatico.java.spring.exercises;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public interface PostRepository extends JpaRepository<Post, Integer> {

  List<Post> findByTimestampLessThanEqual(Instant timestamp);

  Optional<Post> findByIdEquals(Integer id);

  @Query("select distinct p from post p order by p.title")
  List<Post> findDistinctByOrderByTitleAsc();



}
