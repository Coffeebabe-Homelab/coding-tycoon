package com.shopfront.product;

import com.shopfront.common.NotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> listAll() {
        return productRepository.findAll();
    }

    public List<Product> listByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    public Product create(String name, String category, BigDecimal price, int stock) {
        return productRepository.save(new Product(name, category, price, stock));
    }

    public Product updatePrice(Long id, BigDecimal newPrice) {
        Product product = getById(id);
        product.setPrice(newPrice);
        return productRepository.save(product);
    }
}
