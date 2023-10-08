import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static java.util.Map.entry;


public class Main  {
  public static void main(String[] args) throws IOException {
    System.out.println("Hello World!");
    javaPain();
    javaFilePain();
  }

  static void javaPain() {
    // No multi-line strings. Everything needs to be a string literal.
    // See https://stackoverflow.com/questions/878573/does-java-have-support-for-multiline-strings
    String multi = "This is a multi-line strings. \n" +
      "It's a pain to write. \n" +
      "It's a pain to read. \n" +
      "It's a pain to maintain. \n";

    String multi2 = """
      Oh hey look, multi-line strings!
      Added this in Java 15.
      Do they support templates?
    """;
    // No object literals.
    // You can use an initializer to populate the map
    // See https://stackoverflow.com/questions/6802483/how-to-directly-initialize-a-hashmap-in-a-literal-way

    // The old way
    Map<String, String> map1 = new HashMap<>() {{
      put("a", "b");
      put("c", "d");
    }};

    // The new way, > Java 9 works for up to 10 elements:
    Map<String, String> map2 = Map.of(
      "a", "b",
      "c", "d"
    );

    // The new way > Java 9 works for any number of elements:
    Map<String, String> map3 = Map.ofEntries(
      entry("a", "b"),
      entry("c", "d")
    );

    // improved for loop
    for (char c : "foobar".toCharArray()) {
      if (c == 'z') throw new RuntimeException("foobar should not contain z");
    }

  }

  public static void javaPackagePain() {
    // No built in package manager or build.
    // You have to pick: Maven, Gradle, Ant, or something else.
    // At least with Gradle, you can also choose to use the Kotlin DSL.
    // Note: IntelliJ has a built-in build system, but it doesn't include a package manager.
    // (It maps from your project build to its internal build system, which causes issues sometimes.)
  }

  public static void javaFilePain() throws IOException {
    // The logging story in Java is a mess.
    String expectedValue = "import java.io.File;";
    String cwd = new File("").getAbsolutePath();
    Path path = Paths.get(cwd + "/kata/java/vanilla/Main.java");
    String read = Files.readAllLines(path).get(0);
    // Mini hamcrest
    if (!read.equals(expectedValue)) {
      throw new RuntimeException("Expected " + expectedValue + " but got " + read);
    }
  }

  // TODO Java file IO is painful, too many options!
  // https://www.baeldung.com/reading-file-in-java

}
