package dev.codingtycoon.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;

/** Unit tests for UserService with a mocked repository. */
class UserServiceTest {

    private static final String SUB = "auth0|user-unit";
    private static final String EMAIL = "user@example.com";

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final UserService service = new UserService();

    @BeforeEach
    void setUp() {
        service.userRepository = userRepository;
    }

    @Test
    void existingUserIsReturnedWithoutSaving() {
        User existing = new User();
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(existing));

        assertSame(existing, service.findOrCreateUser(SUB, EMAIL));

        Mockito.verify(userRepository, Mockito.never()).save(any());
    }

    @Test
    void firstLoginCreatesUser() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.empty());
        Mockito.when(userRepository.save(any())).then(AdditionalAnswers.returnsFirstArg());

        User created = service.findOrCreateUser(SUB, EMAIL);

        assertEquals(SUB, created.sub);
        assertEquals(EMAIL, created.email);
        Mockito.verify(userRepository).save(created);
    }
}
