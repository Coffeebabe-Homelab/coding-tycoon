# P1-03 — Profile & Topics API Endpoints

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P1-01, P1-02  

---

## Goal

Expose REST endpoints for topics and player profile. The frontend loads available topics from `GET /api/topics` to drive the onboarding wizard and profile editor. Profile creation and retrieval use topic IDs, not free-text strings — the backend resolves them to full `Topic` objects.

The endpoints also handle **first-login user creation** — if the Auth0 `sub` doesn't exist in the `users` table yet, it's created automatically on `POST /api/profile`.

---

## Acceptance Criteria

### Topics
- [ ] `GET /api/topics` returns the full list of available topics, `200 OK`, no auth required
- [ ] `TopicService` and `TopicResource` exist in `dev.codingtycoon.topic`

### Profile
- [ ] `POST /api/profile` creates a `User` (if first login) and a `PlayerProfile`, returns `201` with the full profile including resolved topic objects
- [ ] `POST /api/profile` returns `409 Conflict` if a profile already exists for this user
- [ ] `GET /api/profile` returns the player's profile with topics resolved, `200 OK`
- [ ] `GET /api/profile` returns `404 Not Found` if no profile exists yet
- [ ] `PUT /api/profile` updates seniority and topics, returns `200 OK`
- [ ] All profile endpoints require a valid Bearer token (`@Authenticated`)
- [ ] Request body validated with `@Valid` — missing required fields return `422`
- [ ] `ExceptionMapper` handles `NotFoundException` → 404, `ConstraintViolationException` → 422, `ConflictException` → 409
- [ ] Integration tests cover: list topics, create profile, get profile, update profile, duplicate profile, unauthenticated

---

## API Contract

### GET /api/topics

No auth required. Used by the onboarding wizard and profile editor to populate the topic selection.

**Response 200:**
```json
[
  { "id": 1, "name": "REST APIs",    "slug": "rest-apis" },
  { "id": 2, "name": "CRUD",         "slug": "crud" },
  { "id": 3, "name": "OOP",          "slug": "oop" },
  { "id": 4, "name": "Clean Code",   "slug": "clean-code" },
  { "id": 5, "name": "Git Workflow", "slug": "git-workflow" }
]
```

### POST /api/profile

**Request body:** topic IDs (not names — the backend resolves them):
```json
{
  "language":  "Java",
  "framework": "Spring Boot",
  "seniority": "Junior",
  "topicIds":  [1, 2, 4]
}
```

**Response 201:**
```json
{
  "id": 1,
  "language":  "Java",
  "framework": "Spring Boot",
  "seniority": "Junior",
  "topics": [
    { "id": 1, "name": "REST APIs",  "slug": "rest-apis" },
    { "id": 2, "name": "CRUD",       "slug": "crud" },
    { "id": 4, "name": "Clean Code", "slug": "clean-code" }
  ]
}
```

### GET /api/profile

**Response 200:** same shape as POST response above.

### PUT /api/profile

**Request / Response:** same shape as POST. Returns `200 OK` with the updated profile.

---

## Implementation Notes

### DTOs

```java
// profile/CreateProfileRequest.java
public class CreateProfileRequest {
    @NotBlank           public String language;
    @NotBlank           public String framework;
    @NotBlank           public String seniority;
    @NotNull @Size(min=1) public List<Long> topicIds;
}

// topic/TopicResponse.java
public record TopicResponse(Long id, String name, String slug) {
    public static TopicResponse from(Topic t) {
        return new TopicResponse(t.id, t.name, t.slug);
    }
}

// profile/ProfileResponse.java
public record ProfileResponse(
    Long id, String language, String framework, String seniority,
    List<TopicResponse> topics
) {
    public static ProfileResponse from(PlayerProfile p) {
        return new ProfileResponse(
            p.id, p.language, p.framework, p.seniority,
            p.topics.stream().map(TopicResponse::from).toList()
        );
    }
}
```

### TopicService & TopicResource

```java
// topic/TopicService.java
@ApplicationScoped
public class TopicService {
    @Inject TopicRepository topicRepository;

    /** Returns all available topics for the onboarding wizard. */
    public List<Topic> listAll() {
        return topicRepository.findAll();
    }
}

// topic/TopicResource.java
@Path("/api/topics")
@Produces(MediaType.APPLICATION_JSON)
public class TopicResource {
    @Inject TopicService topicService;

    @GET
    @PermitAll
    public List<TopicResponse> list() {
        return topicService.listAll().stream().map(TopicResponse::from).toList();
    }
}
```

### ProfileService (key logic)

```java
// profile/ProfileService.java
@ApplicationScoped
public class ProfileService {

    @Inject ProfileRepository profileRepository;
    @Inject UserRepository userRepository;
    @Inject TopicRepository topicRepository;

    /**
     * Creates a profile for the authenticated user.
     * Also creates the User record on first login.
     * Throws ConflictException if a profile already exists.
     */
    @Transactional
    public PlayerProfile createProfile(String sub, String email, CreateProfileRequest req) {
        User user = userRepository.findBySub(sub).orElseGet(() -> {
            var u = new User();
            u.sub = sub;
            u.email = email;
            return userRepository.save(u);
        });

        if (profileRepository.findByUserId(user.id).isPresent()) {
            throw new ConflictException("Profile already exists for this user");
        }

        var profile = new PlayerProfile();
        profile.userId = user.id;
        profile.language = req.language;
        profile.framework = req.framework;
        profile.seniority = req.seniority;
        profile.topics = topicRepository.findByIds(req.topicIds);
        return profileRepository.save(profile);
    }

    /**
     * Returns the profile for the authenticated user.
     * Throws NotFoundException if no profile exists yet.
     */
    public PlayerProfile getProfile(String sub) {
        return userRepository.findBySub(sub)
            .flatMap(u -> profileRepository.findByUserId(u.id))
            .orElseThrow(() -> new NotFoundException("Profile not found"));
    }

    /**
     * Updates the player's onboarding settings.
     * Throws NotFoundException if no profile exists yet.
     */
    @Transactional
    public PlayerProfile updateProfile(String sub, CreateProfileRequest req) {
        var profile = getProfile(sub);
        profile.seniority = req.seniority;
        profile.topics = topicRepository.findByIds(req.topicIds);
        return profileRepository.save(profile);
    }
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/
├── topic/
│   ├── TopicResponse.java
│   ├── TopicService.java
│   └── TopicResource.java
├── profile/
│   ├── CreateProfileRequest.java
│   ├── ProfileResponse.java
│   ├── ProfileService.java
│   └── ProfileResource.java
└── exception/
    ├── ConflictException.java
    └── ExceptionMappers.java
```

---

## Definition of Done

- All endpoints respond correctly for every listed scenario. `GET /api/topics` returns seed data. Integration tests green. `./mvnw verify` passes.
