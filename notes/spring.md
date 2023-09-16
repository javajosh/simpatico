# Spring

A place to put interesting Spring knowledge, tools, and tips.
There may also be comments in any Java/Spring kata.

[Spring values](https://www.baeldung.com/spring-boot-properties-env-variables) `application.properties` if you add `java.home=${JAVA_HOME}` this will pull from the environment.
This value can then be accessed in your code with either

```java
@Value("${baeldung.presentation}")
private String baeldungPresentation;
```
or
```java
@Autowired
private Environment environment;
environment.getProperty("baeldung.presentation")
```

Could use support for `.env` files - for example something like [spring-dotenv](https://github.com/paulschwarz/spring-dotenv).



