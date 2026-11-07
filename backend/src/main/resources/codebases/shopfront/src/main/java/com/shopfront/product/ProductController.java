package com.shopfront.product;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> list(@RequestParam(required = false) String category) {
        if (category == null) {
            return productService.listAll();
        }
        return productService.listByCategory(category);
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@RequestBody CreateProductRequest request) {
        return productService.create(request.name(), request.category(), request.price(), request.stock());
    }

    @PatchMapping("/{id}/price")
    public Product updatePrice(@PathVariable Long id, @RequestBody UpdatePriceRequest request) {
        return productService.updatePrice(id, request.price());
    }

    // No validation yet: negative prices and blank names are accepted.
    public record CreateProductRequest(String name, String category, BigDecimal price, int stock) {
    }

    public record UpdatePriceRequest(BigDecimal price) {
    }
}
