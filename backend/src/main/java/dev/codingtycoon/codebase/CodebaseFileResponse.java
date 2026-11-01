package dev.codingtycoon.codebase;

/**
 * Response for GET /api/codebase/files/{path}.
 *
 * @param path    codebase-relative path
 * @param content UTF-8 file content
 */
public record CodebaseFileResponse(String path, String content) {}
