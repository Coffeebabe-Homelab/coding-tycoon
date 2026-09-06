package dev.codingtycoon.profile;

import dev.codingtycoon.topic.Topic;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a player's onboarding preferences: language, framework, seniority, and chosen topics.
 * One profile per user — enforced by a UNIQUE constraint on user_id.
 */
@Entity
@Table(name = "player_profiles")
public class PlayerProfile extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** References the User by ID. Not a JPA FK relationship — kept as a plain Long for simplicity. */
    @Column(name = "user_id", nullable = false, unique = true)
    public Long userId;

    @Column(nullable = false)
    public String language = "Java";

    @Column(nullable = false)
    public String framework = "Spring Boot";

    @Column(nullable = false)
    public String seniority = "Junior";

    /**
     * Topics the player selected during onboarding.
     * FetchType.EAGER ensures topics are always loaded with the profile (no lazy-load surprises).
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "player_profile_topics",
            joinColumns = @JoinColumn(name = "profile_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    public List<Topic> topics = new ArrayList<>();
}
