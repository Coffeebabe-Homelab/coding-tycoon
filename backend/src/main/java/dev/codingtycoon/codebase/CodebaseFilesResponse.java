package dev.codingtycoon.codebase;

import java.util.List;

/**
 * Response for GET /api/codebase/files. The frontend builds the tree from the flat list.
 *
 * @param codebase   codebase key of the player's active task
 * @param focusFiles paths the task is about
 * @param files      every file in the codebase, sorted
 */
public record CodebaseFilesResponse(String codebase, List<String> focusFiles, List<String> files) {}
