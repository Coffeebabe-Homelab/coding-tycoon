package dev.codingtycoon.codebase;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Test
    void unreadableResourceThrows() {
        Thread thread = Thread.currentThread();
        ClassLoader original = thread.getContextClassLoader();
        thread.setContextClassLoader(new ClassLoader(original) {
            @Override
            public InputStream getResourceAsStream(String name) {
                return new InputStream() {
                    @Override
                    public int read() throws IOException {
                        throw new IOException("disk failure");
                    }
                };
            }
        });
        try {
            assertThrows(UncheckedIOException.class, () -> repository.readFile("shopfront", "README.md"));
        } finally {
            thread.setContextClassLoader(original);
        }
    }
}
