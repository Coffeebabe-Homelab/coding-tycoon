package com.shopfront.user;

import com.shopfront.common.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void registerSavesNewUser() {
        when(userRepository.existsByEmail("ana@shop.test")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = userService.register("ana@shop.test", "Ana");

        assertEquals("ana@shop.test", user.getEmail());
        assertEquals("Ana", user.getName());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("ana@shop.test")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userService.register("ana@shop.test", "Ana"));
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.getById(42L));
    }
}
