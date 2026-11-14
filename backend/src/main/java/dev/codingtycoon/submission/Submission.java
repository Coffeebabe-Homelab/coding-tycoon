package dev.codingtycoon.submission;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * One push from the VCS panel: the files the player changed and a commit message.
 * Linked to its task by ID only, like XpEvent, so the task domain doesn't depend on submissions.
 */
@Entity
@Table(name = "submissions")
public class Submission extends PanacheEntityBase {

    /** Same limit as the VCS panel's counter and the conventional subject line. */
    public static final int MAX_COMMIT_MESSAGE_LENGTH = 72;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "task_id", nullable = false)
    public Long taskId;

    @Column(name = "player_profile_id", nullable = false)
    public Long playerProfileId;

    @Column(name = "attempt_number", nullable = false)
    public int attemptNumber;

    @Column(name = "commit_message", nullable = false, length = MAX_COMMIT_MESSAGE_LENGTH)
    public String commitMessage;

    @Column(name = "submitted_at", nullable = false)
    public LocalDateTime submittedAt = LocalDateTime.now(ZoneOffset.UTC);

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "submission_id", nullable = false)
    @OrderBy("path")
    public List<SubmissionFile> files = new ArrayList<>();
}
