package dev.codingtycoon.task;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Represents a coding task assigned to a player profile.
 * Tags are stored as a comma-separated TEXT column for compatibility with H2 (tests) and PostgreSQL (prod).
 */
@Entity
@Table(name = "tasks")
public class Task extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** References the PlayerProfile this task belongs to. */
    @Column(name = "player_profile_id", nullable = false)
    public Long playerProfileId;

    @Column(nullable = false)
    public String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String description;

    @Column(name = "acceptance_criteria", nullable = false, columnDefinition = "TEXT")
    public String acceptanceCriteria;

    @Column(nullable = false)
    public String difficulty;

    /**
     * Comma-separated tag list (e.g. "java,oop,clean-code").
     * Parse in TaskResponse.from() via Arrays.stream(tags.split(",")).
     */
    @Column(nullable = false)
    public String tags = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public TaskStatus status = TaskStatus.ASSIGNED;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
