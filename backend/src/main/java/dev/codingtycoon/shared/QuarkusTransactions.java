package dev.codingtycoon.shared;

import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.function.Supplier;

/** {@link Transactions} backed by Narayana, the JTA transaction manager Quarkus uses. */
@ApplicationScoped
public class QuarkusTransactions implements Transactions {

    @Override
    public <T> T inNewTransaction(Supplier<T> work) {
        return QuarkusTransaction.requiringNew().call(work::get);
    }
}
