package dev.codingtycoon.submission;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The full content of one file in a submission, as the player left it. */
@Entity
@Table(name = "submission_files")
public class SubmissionFile extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 500)
    public String path;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    /**
     * Creates an unsaved file entry.
     *
     * @param path    codebase-relative path
     * @param content the file's full content
     * @return the new entry
     */
    public static SubmissionFile of(String path, String content) {
        SubmissionFile file = new SubmissionFile();
        file.path = path;
        file.content = content;
        return file;
    }
}
