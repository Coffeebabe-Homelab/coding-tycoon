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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
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

    /**
     * A short Git-looking id for the VCS panel. Decorative only: it is not a content hash and
     * identifies nothing, so never look a submission up by it.
     *
     * @return the first 7 hex characters of MD5("taskId:playerProfileId:attemptNumber")
     */
    public String displayHash() {
        String key = taskId + ":" + playerProfileId + ":" + attemptNumber;
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 7);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Every Java runtime must provide MD5", e);
        }
    }
}
