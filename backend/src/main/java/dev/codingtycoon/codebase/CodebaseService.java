package dev.codingtycoon.codebase;

import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

/**
 * Domain service exposing the codebase of the player's active task, read-only.
 * The index allow-list is the security boundary: only indexed paths are ever read.
 */
@ApplicationScoped
public class CodebaseService {

    @Inject
    TaskService taskService;

    @Inject
    CodebaseRepository codebaseRepository;

    /**
     * Lists the files of the active task's codebase.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return codebase key, focus files and all file paths
     * @throws NotFoundException if the player, active task or codebase is missing
     */
    public CodebaseFilesResponse listFiles(String sub) {
        Task task = requireActiveTask(sub);
        return new CodebaseFilesResponse(task.codebaseKey, task.focusFileList(), requireIndex(task.codebaseKey));
    }

    /**
     * Reads one file of the active task's codebase.
     *
     * @param sub  the Auth0 subject claim identifying the player
     * @param path codebase-relative path as listed by {@link #listFiles(String)}
     * @return the path and its content
     * @throws NotFoundException if the path is not indexed, or the player, task or file is missing
     */
    public CodebaseFileResponse readFile(String sub, String path) {
        Task task = requireActiveTask(sub);
        if (!requireIndex(task.codebaseKey).contains(path)) {
            throw new NotFoundException("File not found: " + path);
        }
        String content = codebaseRepository.readFile(task.codebaseKey, path)
                .orElseThrow(() -> new NotFoundException("File not found: " + path));
        return new CodebaseFileResponse(path, content);
    }

    private Task requireActiveTask(String sub) {
        return taskService.findActiveTask(sub)
                .orElseThrow(() -> new NotFoundException("No active task: open today's task first"));
    }

    private List<String> requireIndex(String codebaseKey) {
        List<String> files = codebaseRepository.listFiles(codebaseKey);
        if (files.isEmpty()) {
            throw new NotFoundException("Codebase not found: " + codebaseKey);
        }
        return files;
    }
}
