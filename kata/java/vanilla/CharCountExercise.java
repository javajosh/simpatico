import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** The exercise is to compute stats on an input string. */
public class CharCountExercise {
  static String[] DEFAULT_INPUT= {"aaabbccabbb"};
  public static void main(String[] args) {
    String[] inputs = (args.length == 0) ? DEFAULT_INPUT : args;
    for (String input : inputs) {
      printResults(input);
    }
  }
  private static void printResults(String test){
    System.out.println("=".repeat(40));
    System.out.println("computing for " + test);

    System.out.println("totalCounts       " + totalCounts(test));
    System.out.println("totalCountsStreams" + totalCountsStreams(test));
    System.out.println("runCounts         " + runCounts(test));
    System.out.println("runCountsStreams  " + runCountsStreams(test));
  }

  private static void checkInput(String input) throws IllegalArgumentException {
    if (input == null || input.trim().length() == 0) {
      throw new IllegalArgumentException("string must be non-null and non-empty");
    }
  }
  /**
   * Count characters using a for loop.
   *
   * @param str input
   * @return a map from character to its total number of occurrences in the string.
   */
  public static Map<Character, Long> totalCounts(String str) {
    checkInput(str);
    Map<Character, Long> charCounts = new LinkedHashMap<>();
    for (char c : str.toCharArray()) {
      charCounts.put(c, charCounts.getOrDefault(c, 0L) + 1L);
    }
    return charCounts;
  }

  /**
   * Count characters using a stream this time. LinkedHashMap preserves insertion order.
   *
   * @param str input
   * @return a map from character to its total number of occurrences in the string.
   */
  public static Map<Character, Long> totalCountsStreams(String str) {
    checkInput(str);
    Map<Character, Long> totalCounts = new LinkedHashMap<>();
    str.chars()
      .mapToObj(c -> (char) c)
      .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
      .forEach(totalCounts::put);
    return totalCounts;
  }

  /**
   * A useful class for counting character runs.
   */
  private static record CharCount(char c, long n) {
    @Override
    public String toString() {
      return c + "=" + n;
    }
  }

  /**
   * Count character runs. Maintain the order of runs. Use a for loop.
   *
   * @param str input
   * @return A list of ordered pairs of (char, long) which describe the runs, in order.
   */
  public static List<CharCount> runCounts(String str) {
    checkInput(str);
    char currentChar = str.charAt(0);
    long currentCount = 1;
    List<CharCount> result = new ArrayList<>();

    for (int i = 1; i < str.length(); i++) {
      char c = str.charAt(i);
      if (c == currentChar) {
        currentCount++;
      } else { // save and reset
        result.add(new CharCount(currentChar, currentCount));
        currentChar = c;
        currentCount = 1;
      }
    }
    result.add(new CharCount(currentChar, currentCount));
    return result;
  }

  /**
   * Count character runs. Maintain the order of runs. Use streams. Note: this code is <b>broken!</b>
   *
   * @param str input
   * @return A list of ordered pairs of (char, long) which describe the runs, in order.
   */
  public static List<CharCount> runCountsStreams(String str) {
    checkInput(str);
    List<CharCount> runCounts = new ArrayList<>();
    str.chars()
      .mapToObj(c -> (char) c)
      .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
      .forEach((c, n) -> runCounts.add(new CharCount(c, n)));
    return runCounts;
  }
}
