package dev.codingtycoon.task;

/**
 * Simple generic pair of two values.
 * Used to return a task alongside a boolean flag (e.g., wasCreated).
 *
 * @param <A> type of the first element
 * @param <B> type of the second element
 */
public record Pair<A, B>(A first, B second) {}
