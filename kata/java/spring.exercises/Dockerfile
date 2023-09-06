# See https://hub.docker.com/_/amazoncorretto - amazon's build of openjdk
FROM amazoncorretto:20
MAINTAINER simpatico.io
COPY build/libs/spring.exercises-0.0.1-SNAPSHOT.jar spring.exercises-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java","-jar","/spring.exercises-0.0.1-SNAPSHOT.jar"]
