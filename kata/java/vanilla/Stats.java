public class Stats{
  int foo = 0;
  int bar = 0;
  Stats(){}
  Stats(int foo, int bar){
    this.foo=foo;
    this.bar= bar;
  }

  @Override
  public String toString() {
    return String.format("Stats{foo=%s, bar=%s}", this.foo, this.bar);
  }

  public Stats add(Stats other){
    return new Stats(this.foo + other.foo, this.bar + other.bar);
  }

  public static void main(String[] args){
      Stats a = new Stats(1,2);
      Stats b = new Stats(3, 4);
      Stats c = new Stats(5,6);

      Stats sum = a.add(b).add(c);
      System.out.println(sum);
  }
}
