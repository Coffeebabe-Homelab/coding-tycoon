package dev.codingtycoon.shared;

import java.util.function.Supplier;

/**
 * Runs work in its own transaction. Services use it when part of a method must stay outside one,
 * such as a slow AI call between a read and a write.
 */
@FunctionalInterface
public interface Transactions {

    /**
     * Runs the work in a new transaction, committed when it returns and rolled back if it throws.
     *
     * @param work the work to run
     * @param <T>  the result type
     * @return the work's result
     */
    <T> T inNewTransaction(Supplier<T> work);
}
