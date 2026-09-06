package dev.codingtycoon.topic;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Represents an available learning topic that players can select during onboarding.
 * Topics are seeded via Flyway and shared across all players.
 */
@Entity
@Table(name = "topics")
public class Topic extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** Human-readable topic name (e.g. "REST APIs"). */
    @Column(nullable = false, unique = true)
    public String name;

    /** URL-safe identifier used in the frontend (e.g. "rest-apis"). */
    @Column(nullable = false, unique = true)
    public String slug;
}
