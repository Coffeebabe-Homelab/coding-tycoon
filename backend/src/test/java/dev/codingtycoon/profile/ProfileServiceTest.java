package dev.codingtycoon.profile;

import dev.codingtycoon.exception.ConflictException;
import dev.codingtycoon.topic.Topic;
import dev.codingtycoon.topic.TopicRepository;
import dev.codingtycoon.user.User;
import dev.codingtycoon.user.UserRepository;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;

/** Unit tests for ProfileService with mocked repositories. */
class ProfileServiceTest {

    private static final String SUB = "auth0|profile-unit";
    private static final String EMAIL = "unit@example.com";
    private static final Long USER_ID = 7L;
    private static final List<Long> TOPIC_IDS = List.of(1L, 2L);

    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final TopicRepository topicRepository = Mockito.mock(TopicRepository.class);
    private final ProfileService service = new ProfileService();
    private final List<Topic> topics = List.of(new Topic(), new Topic());
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.id = USER_ID;

        Mockito.when(topicRepository.listByIds(TOPIC_IDS)).thenReturn(topics);
        Mockito.when(profileRepository.save(any())).then(AdditionalAnswers.returnsFirstArg());

        service.profileRepository = profileRepository;
        service.userRepository = userRepository;
        service.topicRepository = topicRepository;
    }

    @Test
    void createProfileCreatesUserOnFirstLogin() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.empty());
        Mockito.when(userRepository.save(any())).thenReturn(user);

        PlayerProfile profile = service.createProfile(SUB, EMAIL, request());

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        Mockito.verify(userRepository).save(saved.capture());
        assertEquals(SUB, saved.getValue().sub);
        assertEquals(EMAIL, saved.getValue().email);
        assertEquals(USER_ID, profile.userId);
    }

    @Test
    void createProfileReusesExistingUser() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));

        PlayerProfile profile = service.createProfile(SUB, EMAIL, request());

        Mockito.verify(userRepository, Mockito.never()).save(any());
        assertEquals(USER_ID, profile.userId);
        assertRequestApplied(profile);
        Mockito.verify(profileRepository).save(profile);
    }

    @Test
    void createProfileWhenOneExistsIsConflictAndSavesNothing() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(new PlayerProfile()));

        assertThrows(ConflictException.class, () -> service.createProfile(SUB, EMAIL, request()));

        Mockito.verify(profileRepository, Mockito.never()).save(any());
    }

    @Test
    void getProfileReturnsTheUsersProfile() {
        PlayerProfile existing = new PlayerProfile();
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        assertSame(existing, service.getProfile(SUB));
    }

    @Test
    void getProfileForUnknownUserIsNotFound() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getProfile(SUB));
    }

    @Test
    void getProfileWithoutProfileIsNotFound() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getProfile(SUB));
    }

    @Test
    void updateProfileAppliesRequestAndSaves() {
        PlayerProfile existing = new PlayerProfile();
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        PlayerProfile updated = service.updateProfile(SUB, request());

        assertSame(existing, updated);
        assertRequestApplied(updated);
        Mockito.verify(profileRepository).save(existing);
    }

    @Test
    void updateProfileWithoutProfileIsNotFoundAndSavesNothing() {
        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.updateProfile(SUB, request()));

        Mockito.verify(profileRepository, Mockito.never()).save(any());
    }

    private void assertRequestApplied(PlayerProfile profile) {
        assertEquals("Java", profile.language);
        assertEquals("Quarkus", profile.framework);
        assertEquals("Mid", profile.seniority);
        assertEquals(topics, profile.topics);
    }

    private CreateProfileRequest request() {
        CreateProfileRequest request = new CreateProfileRequest();
        request.language = "Java";
        request.framework = "Quarkus";
        request.seniority = "Mid";
        request.topicIds = TOPIC_IDS;
        return request;
    }
}
