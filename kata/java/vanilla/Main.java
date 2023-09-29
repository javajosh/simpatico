import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static java.util.Map.entry;

/**
 * Here is an example of how to run the program and what it prints to the console:
 *
 * <pre>
 *   {@code
 *     /home/simpatico/.jdks/openjdk-18.0.2/bin/java
 *     -Dfile.encoding=UTF-8
 *     -classpath /home/simpatico/IdeaProjects/simpatico/out/production/java
 *     Main
 *     Hello World!
 *
 *     Process finished with exit code 0
 *   }
 * </pre>
 * Note that I elided the javaagent command line arguments.
 * These are added by IntelliJ to support debugging and can be ignored:
 * <pre>
 *   {@code
 *      -javaagent
 *        :/home/simpatico/idea-IU-211.7628.21/lib/idea_rt.jar=36427
 *        :/home/simpatico/idea-IU-211.7628.21/bin
 *    }
 * </pre>
 * The {@code -Dfile.encoding=UTF-8} argument is added by IntelliJ to support
 * UTF-8 characters in the source code (I think - it may also have to do with textual IO at runtime).
 * <p>
 * This requirement to build a classpath is why people invented countless technologies to avoid doing this.
 * The way with which I am most familiar is the "Fat Jar" approach, which requires a bunch of Maven/Gradle boilerplate.
 * Another approach is to avoid the JDK install altogether and use a container like podman or docker.
 */
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
      I guess they added this in Java 15.
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
    String expectedValue = "import java.io.IOException;";
    Path path = Paths.get("./Main.java");
    String read = Files.readAllLines(path).get(0);
    // Mini hamcrest
    if (!read.equals(expectedValue)) {
      throw new RuntimeException("Expected " + expectedValue + " but got " + read);
    }
  }

  // TODO Java file IO is painful, too many options!
  // https://www.baeldung.com/reading-file-in-java

}
