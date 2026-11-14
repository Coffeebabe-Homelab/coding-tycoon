package com.shopfront.order;

import com.shopfront.common.NotFoundException;
import com.shopfront.product.Product;
import com.shopfront.product.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * HTTP endpoints for orders.
 * Checkout was written straight into this controller to ship the first sale quickly.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository,
                           ProductRepository productRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order place(@Valid @RequestBody PlaceOrderRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found: " + request.productId()));

        if (product.getStock() < request.quantity()) {
            throw new IllegalArgumentException("Not enough stock for product " + product.getId());
        }

        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
        if (request.quantity() >= 10) {
            total = total.multiply(new BigDecimal("0.90"));
        }
        total = total.setScale(2, RoundingMode.HALF_UP);

        product.setStock(product.getStock() - request.quantity());
        productRepository.save(product);

        return orderRepository.save(new Order(request.userId(), product.getId(), request.quantity(), total));
    }

    @GetMapping
    public List<Order> listForUser(@RequestParam Long userId) {
        return orderService.listForUser(userId);
    }

    public record PlaceOrderRequest(@NotNull Long userId, @NotNull Long productId, @Positive int quantity) {
    }
}
