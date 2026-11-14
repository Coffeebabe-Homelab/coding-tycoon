package com.shopfront.product;

import com.shopfront.common.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void listByCategoryDelegatesToRepository() {
        Product book = new Product("Clean Code", "Books", new BigDecimal("32.50"), 12);
        when(productRepository.findByCategory("Books")).thenReturn(List.of(book));

        assertEquals(List.of(book), productService.listByCategory("Books"));
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(productRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.getById(7L));
    }

    @Test
    void updatePriceSavesNewPrice() {
        Product book = new Product("Clean Code", "Books", new BigDecimal("32.50"), 12);
        when(productRepository.findById(1L)).thenReturn(Optional.of(book));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product updated = productService.updatePrice(1L, new BigDecimal("29.99"));

        assertEquals(new BigDecimal("29.99"), updated.getPrice());
    }
}
