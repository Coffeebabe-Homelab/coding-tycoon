package com.shopfront.order;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Works out the shipping cost of an order from its product category.
 * Every new category so far has meant another case in the switch below.
 */
@Component
public class ShippingCalculator {

    public BigDecimal costFor(String category, BigDecimal orderTotal) {
        switch (category.toLowerCase()) {
            case "books":
                if (orderTotal.compareTo(new BigDecimal("25")) >= 0) {
                    return BigDecimal.ZERO;
                }
                return new BigDecimal("2.99");
            case "electronics":
                return new BigDecimal("9.99");
            case "food":
                if (orderTotal.compareTo(new BigDecimal("50")) >= 0) {
                    return BigDecimal.ZERO;
                }
                return new BigDecimal("4.99");
            default:
                return new BigDecimal("5.99");
        }
    }
}
