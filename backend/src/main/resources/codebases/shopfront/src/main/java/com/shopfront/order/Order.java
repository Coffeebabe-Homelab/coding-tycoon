package com.shopfront.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One customer buying one product. Keeping a single product per order
 * keeps checkout simple until the shop needs baskets.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Order() {
        // required by JPA
    }

    public Order(Long userId, Long productId, int quantity, BigDecimal total) {
        this.userId = userId;
        this.productId = productId;
        this.quantity = quantity;
        this.total = total;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
