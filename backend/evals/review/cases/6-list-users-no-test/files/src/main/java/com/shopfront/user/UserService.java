package com.shopfront.user;

import com.shopfront.common.NotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String email, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }
        return userRepository.save(new User(email, name));
    }

    public List<User> list(int page, int size) {
        if (size > 100) {
            throw new IllegalArgumentException("size must be at most 100, was " + size);
        }
        return userRepository.findAll(PageRequest.of(page, size)).getContent();
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
    }
}
