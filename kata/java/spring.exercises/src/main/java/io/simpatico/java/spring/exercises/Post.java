package io.simpatico.java.spring.exercises;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Although it is tempting to use https://projectlombok.org/ to reduce boilerplate, heavy use slows down the build considerably.
 */
@Table(name = "posts", schema = "main")
@Entity
public class Post {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Integer id;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "slug")
  private String slug;

  @Column(name = "\"timestamp\"")
  private Instant timestamp;

  public Instant getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(Instant timestamp) {
    this.timestamp = timestamp;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Integer getId() {
    return id;
  }

  public void setId(Integer id) {
    this.id = id;
  }
}
