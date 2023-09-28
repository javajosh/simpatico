package com.javajosh.orderservice.web;

import java.time.Duration;

import com.javajosh.orderservice.domain.Order;
import com.javajosh.orderservice.domain.OrderRepository;
import com.javajosh.orderservice.domain.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping("orders")
public class OrderController {
	private static final Logger log = LoggerFactory.getLogger(OrderController.class);
	private final OrderRepository orderRepository;
	private final WebClient webClient;

	public OrderController(OrderRepository orderRepository, WebClient.Builder webClientBuilder) {
		this.orderRepository = orderRepository;
		this.webClient = webClientBuilder.build();
	}

	@GetMapping
	public Flux<Order> getAllOrders() {
		log.info("Accessing all the orders");
		return orderRepository.findAll();
	}

	@PostMapping
	public Mono<Order> submitOrder(@RequestBody OrderRequest orderRequest) {
		log.info("Submitting an order for book with isbn {}", orderRequest.isbn());
		return webClient.get().uri("http://book-service/books/" + orderRequest.isbn())
				.retrieve()
				.bodyToMono(Book.class)
				.timeout(Duration.ofSeconds(2), Mono.empty())
				.onErrorResume(exception -> Mono.empty())
				.retryWhen(Retry.backoff(3, Duration.ofMillis(100)))
				.flatMap(book -> Mono.just(new Order(null, orderRequest.isbn(), OrderStatus.ACCEPTED)))
				.defaultIfEmpty(new Order(null, orderRequest.isbn(), OrderStatus.REJECTED))
				.flatMap(orderRepository::save);
	}

}
