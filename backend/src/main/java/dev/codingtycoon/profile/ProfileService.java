package dev.codingtycoon.profile;

import dev.codingtycoon.exception.ConflictException;
import dev.codingtycoon.topic.TopicRepository;
import dev.codingtycoon.user.User;
import dev.codingtycoon.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

/**
 * Domain service for player profile management.
 * Handles profile creation, retrieval, and updates. Also creates a User record on first login.
 */
@ApplicationScoped
public class ProfileService {

    @Inject
    ProfileRepository profileRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    TopicRepository topicRepository;

    /**
     * Creates a profile for the authenticated user.
     * Also creates the User record if this is the user's first login.
     * Throws ConflictException if a profile already exists for this user.
     *
     * @param sub   the Auth0 subject claim
     * @param email the user's email from the JWT
     * @param req   the profile creation request
     * @return the newly created PlayerProfile
     * @throws ConflictException if a profile already exists for this user
     */
    @Transactional
    public PlayerProfile createProfile(String sub, String email, CreateProfileRequest req) {
        User user = userRepository.findBySub(sub).orElseGet(() -> {
            var u = new User();
            u.sub = sub;
            u.email = email;
            return userRepository.save(u);
        });

        if (profileRepository.findByUserId(user.id).isPresent()) {
            throw new ConflictException("Profile already exists for this user");
        }

        var profile = new PlayerProfile();
        profile.userId = user.id;
        profile.language = req.language;
        profile.framework = req.framework;
        profile.seniority = req.seniority;
        profile.topics = topicRepository.listByIds(req.topicIds);
        return profileRepository.save(profile);
    }

    /**
     * Returns the profile for the authenticated user.
     * Throws NotFoundException if no profile exists yet.
     *
     * @param sub the Auth0 subject claim
     * @return the player's profile
     * @throws NotFoundException if no profile exists for this user
     */
    public PlayerProfile getProfile(String sub) {
        return userRepository.findBySub(sub)
                .flatMap(u -> profileRepository.findByUserId(u.id))
                .orElseThrow(() -> new NotFoundException("Profile not found"));
    }

    /**
     * Updates the player's onboarding settings (seniority and topics).
     * Throws NotFoundException if no profile exists yet.
     *
     * @param sub the Auth0 subject claim
     * @param req the updated profile data
     * @return the updated PlayerProfile
     * @throws NotFoundException if no profile exists for this user
     */
    @Transactional
    public PlayerProfile updateProfile(String sub, CreateProfileRequest req) {
        var profile = getProfile(sub);
        profile.language = req.language;
        profile.framework = req.framework;
        profile.seniority = req.seniority;
        profile.topics = topicRepository.listByIds(req.topicIds);
        return profileRepository.save(profile);
    }
}
