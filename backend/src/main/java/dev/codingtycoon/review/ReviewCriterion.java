package dev.codingtycoon.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Whether the push meets one of the task's acceptance criteria, by its position in the list. */
@Entity
@Table(name = "review_criteria")
public class ReviewCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public int position;

    @Column(nullable = false)
    public boolean met;

    public static ReviewCriterion of(int position, boolean met) {
        ReviewCriterion criterion = new ReviewCriterion();
        criterion.position = position;
        criterion.met = met;
        return criterion;
    }
}
