package dev.codingtycoon.review;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * The senior dev's review of one push. Linked to its submission by ID only, so the submission
 * domain doesn't depend on reviews. The scheduling columns belong to the DB review queue.
 */
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "submission_id", nullable = false)
    public Long submissionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ReviewStatus status = ReviewStatus.PENDING;

    @Enumerated(EnumType.STRING)
    public ReviewVerdict verdict;

    public String summary;

    @Column(name = "failure_count", nullable = false)
    public int failureCount;

    @Column(name = "next_attempt_at", nullable = false)
    public LocalDateTime nextAttemptAt = LocalDateTime.now(ZoneOffset.UTC);

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    @Column(name = "started_at")
    public LocalDateTime startedAt;

    @Column(name = "reviewed_at")
    public LocalDateTime reviewedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "review_id", nullable = false)
    @OrderBy("id")
    public List<ReviewComment> comments = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "review_id", nullable = false)
    @OrderBy("position")
    public List<ReviewCriterion> criteria = new ArrayList<>();
}
