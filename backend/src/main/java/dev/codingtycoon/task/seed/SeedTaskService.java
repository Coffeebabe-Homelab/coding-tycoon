package dev.codingtycoon.task.seed;

import dev.codingtycoon.task.Task;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;

/**
 * Provides pre-defined coding tasks used as a fallback when AI generation is unavailable.
 * Tasks cover the five core topics: REST APIs, CRUD, OOP, Clean Code, and Git Workflow.
 * Every task targets shopfront and names the files the player edits (Phase 4 edits focus files only).
 */
@ApplicationScoped
public class SeedTaskService {

    private static final String MAIN = "src/main/java/com/shopfront/";
    private static final String TEST = "src/test/java/com/shopfront/";

    private static final List<SeedTask> SEEDS = List.of(
            new SeedTask(
                    "Build a REST endpoint to list all users",
                    "Shopfront's UserController has no way to list users yet. Add a GET /api/users endpoint "
                            + "to UserController, backed by a new UserService method, that returns a paginated list "
                            + "of all registered users. UserRepository already extends JpaRepository, so paging support "
                            + "is available. Each user object should include id, email, name and createdAt. "
                            + "The endpoint must accept optional query parameters: page (default 0) and size (default 20, max 100). "
                            + "Add tests for the new method to UserServiceTest.",
                    "- GET /api/users returns 200 with a JSON array of user objects\n"
                            + "- Each object contains id (Long), email (String), name (String), createdAt (ISO 8601)\n"
                            + "- page and size query params control pagination\n"
                            + "- size > 100 throws IllegalArgumentException, which GlobalExceptionHandler turns into a 400\n"
                            + "- UserServiceTest covers the new method",
                    "Junior",
                    new String[]{"rest-apis", "crud", "java"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "user/UserController.java",
                            MAIN + "user/UserService.java",
                            TEST + "user/UserServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Add update and delete to the user API",
                    "Customers can register and be looked up, but they can't change their name or close their "
                            + "account. Add both to UserController and UserService, and cover them in UserServiceTest. "
                            + "User already has a setName method.",
                    "- PATCH /api/users/{id} with {\"name\": \"...\"} updates the name and returns 200 with the user\n"
                            + "- A blank name returns 400 (@NotBlank on a request record, with @Valid)\n"
                            + "- DELETE /api/users/{id} returns 204\n"
                            + "- An unknown id returns 404 for both, through NotFoundException\n"
                            + "- UserServiceTest covers rename, delete and the unknown id",
                    "Junior",
                    new String[]{"crud", "java", "oop"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "user/UserController.java",
                            MAIN + "user/UserService.java",
                            TEST + "user/UserServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Move the checkout rules out of OrderController",
                    "POST /api/orders does everything inside OrderController: it finds the product, checks stock, "
                            + "applies the bulk discount, lowers the stock and saves the order. Move these business rules "
                            + "into OrderService, so the controller only maps HTTP, and test them in OrderServiceTest.",
                    "- OrderController only maps the request and response, and calls OrderService.placeOrder(...)\n"
                            + "- OrderService owns the stock check, the discount, the stock decrement and saving the order\n"
                            + "- Not enough stock throws IllegalArgumentException, which returns 400\n"
                            + "- POST /api/orders behaves the same as before for valid orders\n"
                            + "- OrderServiceTest covers a normal order, not enough stock and the bulk discount",
                    "Mid",
                    new String[]{"oop", "clean-code", "java"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "order/OrderController.java",
                            MAIN + "order/OrderService.java",
                            TEST + "order/OrderServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Add input validation to an existing REST API",
                    "Shopfront's ProductController accepts any JSON body without validation, so negative prices "
                            + "and blank names end up in the catalogue. Add Jakarta Bean Validation annotations to the "
                            + "request records in ProductController so invalid requests are rejected. "
                            + "GlobalExceptionHandler already turns validation failures into a 400 response.",
                    "- @NotBlank, @NotNull and @PositiveOrZero are applied to CreateProductRequest and UpdatePriceRequest, "
                            + "including stock\n"
                            + "- Request bodies are annotated with @Valid in ProductController\n"
                            + "- An invalid request body returns 400 with JSON: {\"error\": \"<field> <reason>\"}\n"
                            + "- A valid request still returns 201",
                    "Junior",
                    new String[]{"rest-apis", "java", "clean-code"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{MAIN + "product/ProductController.java"}
            ),
            new SeedTask(
                    "Add a low-stock query to the product catalogue",
                    "The shop needs to know which products are about to run out. Add a derived query to "
                            + "ProductRepository, expose it through ProductService, and add a GET /api/products/low-stock "
                            + "endpoint to ProductController that lists products whose stock is below a threshold. "
                            + "Test the new service method in ProductServiceTest.",
                    "- ProductRepository declares findByStockLessThan(int threshold)\n"
                            + "- ProductService.listLowStock(int threshold) delegates to the repository\n"
                            + "- GET /api/products/low-stock?threshold=5 returns 200 with matching products (default threshold 5)\n"
                            + "- A negative threshold throws IllegalArgumentException, which returns 400\n"
                            + "- ProductServiceTest covers the new method",
                    "Mid",
                    new String[]{"oop", "crud", "java"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "product/ProductRepository.java",
                            MAIN + "product/ProductService.java",
                            MAIN + "product/ProductController.java",
                            TEST + "product/ProductServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Fix case-sensitive category search, in one clean commit",
                    "GET /api/products?category=books misses products stored as \"Books\", because "
                            + "ProductRepository matches the category exactly. Fix it through ProductRepository and "
                            + "ProductService, add a test to ProductServiceTest, and practise a focused commit.",
                    "- Category search ignores case (findByCategoryIgnoreCase)\n"
                            + "- ProductServiceTest covers a mixed-case category\n"
                            + "- The commit message follows Conventional Commits: fix(product): <subject>, "
                            + "with a subject of at most 72 characters\n"
                            + "- The commit changes only what the fix needs",
                    "Junior",
                    new String[]{"git-workflow", "clean-code", "java"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "product/ProductRepository.java",
                            MAIN + "product/ProductService.java",
                            TEST + "product/ProductServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Design the shipping rules with polymorphism",
                    "ShippingCalculator.costFor(category, orderTotal) is a switch on category strings that grows "
                            + "with every new category. Replace it with an enum ShippingCategory, nested in "
                            + "ShippingCalculator, where each constant implements its own rule. "
                            + "ShippingCalculatorTest describes today's prices.",
                    "- No switch or if chain on the category string remains\n"
                            + "- Each category's rule lives in its own enum constant (BOOKS, ELECTRONICS, FOOD)\n"
                            + "- An unknown category throws IllegalArgumentException\n"
                            + "- The existing ShippingCalculatorTest cases still pass, and a test for the unknown category is added",
                    "Junior",
                    new String[]{"oop", "java", "clean-code"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "order/ShippingCalculator.java",
                            TEST + "order/ShippingCalculatorTest.java"
                    }
            ),
            new SeedTask(
                    "Stop two orders from overselling the last item",
                    "Two customers ordering the last item at the same moment can both pass the stock check in "
                            + "OrderController, leaving stock at -1. Add optimistic locking to Product so one of them "
                            + "gets a clear conflict, and map that conflict in GlobalExceptionHandler.",
                    "- Product has a @Version field\n"
                            + "- A concurrent update fails with ObjectOptimisticLockingFailureException, which "
                            + "GlobalExceptionHandler maps to 409 with a clear message\n"
                            + "- Stock never goes below zero\n"
                            + "- The commit message or a code comment explains why optimistic locking was chosen over a database lock",
                    "Senior",
                    new String[]{"java", "crud", "oop"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "product/Product.java",
                            MAIN + "order/OrderController.java",
                            MAIN + "common/GlobalExceptionHandler.java"
                    }
            ),
            new SeedTask(
                    "Apply Clean Code naming and extraction to a legacy method",
                    "SalesReportService.process(List<Object[]> rows) is a 45-line method with cryptic variable "
                            + "names, magic numbers and nested conditionals. Refactor it using Clean Code principles: "
                            + "meaningful names, extracted helper methods and no magic numbers. "
                            + "SalesReportServiceTest pins what it returns today.",
                    "- No variable is named with a single letter or a generic name (data, temp, obj)\n"
                            + "- Magic numbers and strings are replaced with named constants\n"
                            + "- Each extracted method is at most 20 lines and has a single responsibility\n"
                            + "- process is at most 30 lines after refactoring\n"
                            + "- All existing SalesReportServiceTest tests still pass",
                    "Mid",
                    new String[]{"clean-code", "java", "oop"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{
                            MAIN + "report/SalesReportService.java",
                            TEST + "report/SalesReportServiceTest.java"
                    }
            ),
            new SeedTask(
                    "Document the team's Git workflow",
                    "New developers keep asking how to contribute to shopfront. Add a \"Contributing\" section to "
                            + "README.md that explains the team's Git workflow.",
                    "- Explains branch naming: feat/<ticket>-<short-description>\n"
                            + "- Explains Conventional Commits, with examples\n"
                            + "- Explains the pull request steps and squash merging into main, including why squash merging is used\n"
                            + "- \"Known gaps\" no longer lists anything the README itself now answers",
                    "Junior",
                    new String[]{"git-workflow", "clean-code"},
                    Task.DEFAULT_CODEBASE_KEY,
                    new String[]{"README.md"}
            )
    );

    /**
     * Returns all 10 seed tasks.
     *
     * @return immutable list of all seed tasks
     */
    public List<SeedTask> getAll() {
        return SEEDS;
    }

    /**
     * Returns a random seed task selected via ThreadLocalRandom.
     *
     * @return a randomly selected SeedTask
     */
    public SeedTask getRandom() {
        int index = ThreadLocalRandom.current().nextInt(SEEDS.size());
        return SEEDS.get(index);
    }

    /**
     * Returns a random seed task whose tags contain any of the provided topic slugs.
     * Falls back to a random task if no match is found.
     *
     * @param topicSlugs the list of topic slugs to match against task tags
     * @return a matching SeedTask, or a random one if no match exists
     */
    public SeedTask getForTopics(List<String> topicSlugs) {
        if (topicSlugs == null || topicSlugs.isEmpty()) {
            return getRandom();
        }

        var matchingSeeds = SEEDS.stream()
                .filter(seed -> Stream.of(seed.tags())
                        .anyMatch(topicSlugs::contains))
                .toList();

        if (matchingSeeds.isEmpty()) {
            return getRandom();
        }

        int index = ThreadLocalRandom.current().nextInt(matchingSeeds.size());
        return matchingSeeds.get(index);
    }
}
