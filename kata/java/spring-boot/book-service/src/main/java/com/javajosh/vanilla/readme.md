# Install Java

Use [sdkman](https://sdkman.io/), formerly `gvm`.
Use `sdk install java 21-amzn`.

## Running from the CLI
Here is an example of how to run the program and what it prints to the console:

```bash
 $ javac Main.java
 $ java Main
 Hello World!
```

## Running from IntelliJ

If you run from IntelliJ it may add debugging options like so:
```bash
  -javaagent
    :/home/simpatico/idea-IU-211.7628.21/lib/idea_rt.jar=36427
    :/home/simpatico/idea-IU-211.7628.21/bin
```
IntelliJ has a hard time with "bare" java locations.
Rather than wrestle with it, give in and run vanilla programs from within a typical gradle context.
(In this case, Spring Boot)

## Code formatting
Pick [Google Java Format](https://google.github.io/styleguide/javaguide.html) and the
[IntelliJ Google Java Format Plugin](https://plugins.jetbrains.com/plugin/8527-google-java-format).

Make sure [EditorConfig](https://editorconfig.org/) is consistent (it's a superset):

```properties
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```
