# Java Install

## Java on bare metal
It's generally useful to have a local java installed to "bare metal" for developer tools like `gradle` or `intellij`.

For installing, I like these instructions for [Ubuntu 22 from DO](https://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-on-ubuntu-22-04). In particular I like their recommendation to `sudo update-alternatives --config java`. The only downside is that this is interactive, and must be done for each tool, like `javac` e.g. `sudo update-alternatives --config javac`. They also recommend setting `JAVA_HOME` using `sudo vim /etc/environment && source /etc/environment`, which is new to me. I think I'd prefer to keep it local to the user, and `export JAVA_HOME=...` in .bashrc. (Another alternative is to use [jenv](https://github.com/jenv/jenv))

Note that Windows users should use WSL2 and install Ubuntu and follow the above directions. There will be a slight performance hit running in a VM however in the long run it's better to just stick with Linux. The other option is to use Chocolatey. Mac users have the option to use homebrew.

## Java in containers
In general it's good to decouple the java you use for tools from the java you use for applications.
The versions for the latter need to be more precise, in general, and match CI/CD and container images.
To do otherwise is to introduce a compatibility nightmare.

In this case, your image will only ever have one version of java, and you'll never need to mess with "alternative versions". The tricky part here is that often people will pick a "container specific" Linux like [alpine](https://www.alpinelinux.org/), and so the Dockerfile commands will be slightly different. Another popular choice is [GraalVM](https://www.graalvm.org/) (although it looks like Oracle is changing the licensing model).

For simplicity we'll stick with Ubuntu starting point and use the same `sudo apt install` command. Here are some okay [java instructions from docker](https://docs.docker.com/language/java/build-images/) although I'd actually prefer to expand the docker file to install java from apt rather than from the image to ensure we can reproduce the install manually. (Note that this applies directly to https://podman.io/ which is more open source and works without root.)

# Java use

## Vanilla Java
Using java with `java` and `javac` is hardly ever done, but it's a useful skill to have.
You don't get dependency managment and you must wrestle with the command line strings yourself.
However this is really the basis of everything else, so you have to learn it.

## Groovy and Gradle
Groovy is a JVM hosted language that reads like Ruby, and it's an important langauge because Java's #1 build-tool is `gradle` which relies heavily on `groovy` language features.

  1. Install [sdkman](https://sdkman.io/) `curl -s "https://get.sdkman.io" | bash`
  1. Install [java]() `sdk install java 20.0.2-open`
  2. Install [gradle]() `sdk install gradle 8.3`
  4. Create a Spring Boot scaffold with [Spring Initializr](https://start.spring.io/)
      1. Project: `gradle - groovy` (other options `gradle - kotlin` and `maven`)
      2. Language: `java` (other options `kotlin` and `groovy`)
      3. Packaging: `jar` (not `war`)
      4. Java: 20 (not 8, 11, 17 because I want to play with [Loom](https://www.baeldung.com/openjdk-project-loom))
      5. Dependencies:
          1. Spring Web (not HATEOAS which would be useful for htmx frontend, not Spring Reactive Web with netty for performance, not Jersey which is a standard jdk rest lib.)
          2. JDBC and PostgreSQL we will eventually want. Also Spring Data JDBC and Spring Data JPA. Sad to not see JDBI as an option.
          3. NoSQL, Messaging, Cloud and Observability we will skip for now.

