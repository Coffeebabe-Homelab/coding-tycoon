package dev.codingtycoon.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One senior-dev comment, anchored to a line of a pushed file. */
@Entity
@Table(name = "review_comments")
public class ReviewComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String path;

    /** 1-based, in the pushed file. */
    @Column(nullable = false)
    public int line;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Severity severity;

    @Column(nullable = false)
    public String body;

    public static ReviewComment of(String path, int line, Severity severity, String body) {
        ReviewComment comment = new ReviewComment();
        comment.path = path;
        comment.line = line;
        comment.severity = severity;
        comment.body = body;
        return comment;
    }
}
