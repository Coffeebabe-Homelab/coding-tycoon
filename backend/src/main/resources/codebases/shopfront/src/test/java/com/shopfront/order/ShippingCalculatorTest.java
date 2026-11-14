package com.shopfront.order;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ShippingCalculatorTest {

    private final ShippingCalculator calculator = new ShippingCalculator();

    @ParameterizedTest
    @CsvSource({
            "books,       24.99, 2.99",
            "Books,       25.00, 0",
            "electronics, 500.00, 9.99",
            "food,        49.99, 4.99",
            "food,        50.00, 0"
    })
    void chargesByCategory(String category, BigDecimal orderTotal, BigDecimal expected) {
        assertEquals(0, expected.compareTo(calculator.costFor(category, orderTotal)));
    }
}
