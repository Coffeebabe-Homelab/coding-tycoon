package dev.codingtycoon.review.queue.db;

import dev.codingtycoon.review.ReviewQueue;
import dev.codingtycoon.review.ReviewQueueContract;
import dev.codingtycoon.review.ReviewTestData;
import dev.codingtycoon.submission.Submission;
import dev.codingtycoon.task.Task;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.TransactionalException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class DbReviewQueueTest extends ReviewQueueContract {

    @Inject
    DbReviewQueue queue;

    @Inject
    ReviewTestData testData;

    private Task task;
    private int attempt;

    @BeforeEach
    void setUp() {
        testData.clear();
        Submission first = testData.createPush("auth0|review-queue", "A.java", "class A {}");
        task = new Task();
        task.id = first.taskId;
        task.playerProfileId = first.playerProfileId;
        attempt = 1;
    }

    @Override
    protected ReviewQueue queue() {
        return queue;
    }

    @Override
    protected Long newReview() {
        attempt++;
        Submission push = testData.createPush(task, attempt, "A.java", "class A { int " + attempt + "; }");
        return testData.createReview(push.id).id;
    }

    @Override
    protected void inTransaction(Runnable work) {
        QuarkusTransaction.requiringNew().run(work);
    }

    @Test
    void enqueueOutsideTheTransactionOfThePushIsRefused() {
        Long id = newReview();

        assertThrows(TransactionalException.class, () -> queue.enqueue(id));
    }

    @Test
    void anUnknownReviewIsAnError() {
        assertThrows(IllegalArgumentException.class, () -> queue.complete(-1L));
    }
}
