package dev.codingtycoon.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Domain service for user management.
 * Handles the first-login creation of user records from Auth0 identity.
 */
@ApplicationScoped
public class UserService {

    @Inject
    UserRepository userRepository;

    /**
     * Returns the existing user for the given Auth0 sub, or creates a new one if this is the first login.
     * This is the standard entry point for any authenticated request that needs a User record.
     *
     * @param sub   the Auth0 subject claim
     * @param email the user's email from the JWT (may be null)
     * @return the existing or newly created User
     */
    @Transactional
    public User findOrCreateUser(String sub, String email) {
        return userRepository.findBySub(sub).orElseGet(() -> {
            var user = new User();
            user.sub = sub;
            user.email = email;
            return userRepository.save(user);
        });
    }
}
