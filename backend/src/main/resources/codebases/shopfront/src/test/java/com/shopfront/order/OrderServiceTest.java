package com.shopfront.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void listForUserReturnsTheirOrders() {
        Order order = new Order(3L, 1L, 2, new BigDecimal("65.00"));
        when(orderRepository.findByUserId(3L)).thenReturn(List.of(order));

        assertEquals(List.of(order), orderService.listForUser(3L));
    }

    @Test
    void listForUserIsEmptyWithoutOrders() {
        when(orderRepository.findByUserId(4L)).thenReturn(List.of());

        assertTrue(orderService.listForUser(4L).isEmpty());
    }
}
