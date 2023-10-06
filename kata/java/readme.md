## Install Java, gradle (and groovy) and Spring Boot
Groovy is a JVM hosted language that reads like Ruby, and it's an important langauge because Java's #1 build-tool is `gradle` which relies heavily on `groovy` language features. It's almost always installed implicitly with gradle, these days:

  1. Install [sdkman](https://sdkman.io/) `curl -s "https://get.sdkman.io" | bash`
  1. Install [java]() `sdk install java 21-amzn`
  2. Install [gradle]() `sdk install gradle 8.3`
  4. Create a Spring Boot scaffold with [Spring Initializr](https://start.spring.io/) - or with the [Spring Boot CLI](https://docs.spring.io/spring-boot/docs/current/reference/html/cli.html#cli)
      1. Project: `gradle - groovy` (other options `gradle - kotlin` and `maven`)
      2. Language: `java` (other options `kotlin` and `groovy`)
      3. Packaging: `jar` (not `war`)
      4. Java: 21 (not 8, 11, 17 because I want to play with [Loom](https://www.baeldung.com/openjdk-project-loom))
      5. Dependencies:
          1. Spring Web (not HATEOAS which would be useful for htmx frontend, not Spring Reactive Web with netty for performance, not Jersey which is a standard jdk rest lib.)
          2. JDBC and PostgreSQL we will eventually want. Also Spring Data JDBC and Spring Data JPA. Sad to not see JDBI as an option. (But comment out because we don't have a database yet and Spring doesn't like that)
          3. NoSQL, Messaging, Cloud and Observability we will skip for now.

We now have a basic BTD loop for a Java Spring Boot RESTful webservice:
   1. `gradle build`
   2. `gradle bootRun`
   3. `curl http://localhost:8080/greeting\?name\=josh` (Or use `httpie`)


## Vanilla Java
Using java with `java` and `javac` is hardly ever done, but it's a useful skill to have.
You don't get dependency managment, and you must wrestle with the command line strings yourself.
However, this is really the basis of everything else, so you have to learn it.
The btd loop is as follows:
   1. `vim MyClass.java`
   2. `javac MyClass.java && java MyClass`

## Debugging Java
Usually I just depend on IntelliJ to "do the right thing".
However this [excellent write up](https://mostlynerdless.de/blog/2023/10/03/level-up-your-java-debugging-skills-with-on-demand-debugging/) highlights some valuable tips and tricks for working with the debugger. My favorite subcommand is `java "-agentlib:jdwp=help"`

# Notes

## Windows users
Note that Windows users should use WSL2 and install Ubuntu and follow the above directions. There will be a slight performance hit running in a VM however in the long run it's better to just stick with Linux. The other option is to use Chocolatey. Mac users have the option to use homebrew.

Something that is a little confusing is that your tool jvm will be running in windows and your app jvm will be running in linux, and this may bite you once in a while. But in practice you shouldn't be mixing them anyway.

## Lots and lots of ways to install Java
For installing, I like these instructions for [Ubuntu 22 from DO](https://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-on-ubuntu-22-04). In particular I like their recommendation to `sudo update-alternatives --config java`. The only downside is that this is interactive, and must be done for each tool, like `javac` e.g. `sudo update-alternatives --config javac`. They also recommend setting `JAVA_HOME` using `sudo vim /etc/environment && source /etc/environment`, which is new to me. I think I'd prefer to keep it local to the user, and `export JAVA_HOME=...` in .bashrc. (Another alternative is to use [jenv](https://github.com/jenv/jenv)). Or you can use

