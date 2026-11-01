# P3-01 — Synthetic Codebase `shopfront`

**Phase:** 3 — Codebase Explorer  
**Status:** 🔲 Not started  
**Depends on:** P2-06  

---

## Goal

Hand-write a small, believable Java Spring Boot codebase (Users + Products) that players browse for context. It is stored as static text files in backend resources: no generation, never compiled or executed.

---

## Acceptance Criteria

- [ ] Codebase lives under `backend/src/main/resources/codebases/shopfront/`
- [ ] Contains a `README.md` explaining what the fictional app does
- [ ] Layered structure per domain (`user`, `product`): entity, repository, service, controller
- [ ] Shared `common` package: `NotFoundException`, `GlobalExceptionHandler`
- [ ] `pom.xml`, `application.properties`, and at least one test class (`UserServiceTest`) for realism
- [ ] 12–20 files total: big enough to explore, small enough to read in a session
- [ ] Code is idiomatic Junior-readable Java (no Lombok, no reactive), and gives seed tasks obvious places to work (e.g. `UserController` has no list endpoint yet)
- [ ] `index.txt` at the codebase root lists every file path (one per line, relative, sorted)
- [ ] A backend test asserts `index.txt` matches the files actually present (catches forgotten entries)

---

## Implementation Notes

- Files sit under `src/main/resources`, so Maven copies them as resources and never compiles them. Don't put them under `src/main/java`.
- `index.txt` exists because listing a classpath directory inside a packaged JAR isn't reliable; the index is also the allow-list P3-02 uses for safe file access.
- Package name `com.shopfront` keeps it visually distinct from `dev.codingtycoon`.

---

## File Locations

```
backend/src/main/resources/codebases/shopfront/
├── index.txt
├── README.md
├── pom.xml
└── src/
    ├── main/java/com/shopfront/
    │   ├── ShopfrontApplication.java
    │   ├── common/   NotFoundException.java, GlobalExceptionHandler.java
    │   ├── user/     User.java, UserRepository.java, UserService.java, UserController.java
    │   └── product/  Product.java, ProductRepository.java, ProductService.java, ProductController.java
    ├── main/resources/application.properties
    └── test/java/com/shopfront/user/UserServiceTest.java
```

---

## Definition of Done

Files and `index.txt` committed; the index consistency test passes in `./mvnw verify`.
