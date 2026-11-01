package dev.codingtycoon.codebase;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClasspathCodebaseRepositoryTest {

    private final ClasspathCodebaseRepository repository = new ClasspathCodebaseRepository();

    @Test
    void listFilesReadsSortedIndex() {
        List<String> files = repository.listFiles("shopfront");

        assertTrue(files.contains("README.md"));
        assertTrue(files.contains("src/main/java/com/shopfront/user/UserController.java"));
        assertEquals(files.stream().sorted().toList(), files);
    }

    @Test
    void listFilesIsCached() {
        assertSame(repository.listFiles("shopfront"), repository.listFiles("shopfront"));
    }

    @Test
    void listFilesForUnknownCodebaseIsEmpty() {
        assertTrue(repository.listFiles("does-not-exist").isEmpty());
    }

    @Test
    void readFileReturnsContent() {
        Optional<String> content = repository.readFile("shopfront", "README.md");

        assertTrue(content.orElseThrow().startsWith("# Shopfront"));
    }

    @Test
    void readFileForMissingFileIsEmpty() {
        assertTrue(repository.readFile("shopfront", "src/Missing.java").isEmpty());
    }
}
