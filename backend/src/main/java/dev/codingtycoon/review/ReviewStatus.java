package dev.codingtycoon.review;

/** Where a review is in its life. A FAILED review keeps the push: the player's attempt isn't used up. */
public enum ReviewStatus {
    /** Waiting for the worker, first time or after a failure. */
    PENDING,
    /** A worker is reviewing it now. */
    RUNNING,
    /** Reviewed: the verdict and comments are set. */
    DONE,
    /** Our side failed too many times; the player can retry it. */
    FAILED
}
