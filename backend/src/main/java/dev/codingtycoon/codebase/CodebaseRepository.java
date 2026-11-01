package dev.codingtycoon.codebase;

import java.util.List;
import java.util.Optional;

/**
 * Port interface for read-only access to synthetic codebases.
 * Implementations never write; CodebaseService enforces the index allow-list.
 */
public interface CodebaseRepository {

    /**
     * Lists every file of a codebase as declared in its index.
     *
     * @param codebaseKey the codebase identifier (e.g. "shopfront")
     * @return sorted, codebase-relative paths; empty if the codebase does not exist
     */
    List<String> listFiles(String codebaseKey);

    /**
     * Reads a file's UTF-8 content.
     *
     * @param codebaseKey the codebase identifier
     * @param path        codebase-relative path, already checked against the index
     * @return the file content, or empty if the file does not exist
     */
    Optional<String> readFile(String codebaseKey, String path);
}
