package com.javajosh.orderservice.config;

import org.springframework.boot.actuate.autoconfigure.security.reactive.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.savedrequest.NoOpServerRequestCache;

@Configuration
public class SecurityConfig {

	@Bean
	SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
		return http
				.authorizeExchange(exchange -> exchange.matchers(EndpointRequest.toAnyEndpoint()).permitAll()
						.anyExchange().authenticated())
				.oauth2ResourceServer(ServerHttpSecurity.OAuth2ResourceServerSpec::jwt)
				.requestCache(requestCacheSpec ->
						requestCacheSpec.requestCache((NoOpServerRequestCache.getInstance())))
				.build();
	}

}
