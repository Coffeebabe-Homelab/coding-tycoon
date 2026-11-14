package dev.codingtycoon.task;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaskTest {

    @Test
    void criteriaAreTheTrimmedNonBlankLines() {
        Task task = new Task();
        task.acceptanceCriteria = "  Returns 200 \n\n Returns JSON\r\n   \nHas a test";

        assertEquals(List.of("Returns 200", "Returns JSON", "Has a test"), task.criteriaList());
    }

    @Test
    void noCriteriaIsAnEmptyList() {
        assertEquals(List.of(), new Task().criteriaList());
    }
}
