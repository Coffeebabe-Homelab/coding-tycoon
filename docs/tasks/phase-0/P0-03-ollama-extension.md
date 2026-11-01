# P0-03 — Add Quarkus LangChain4j Ollama Extension

**Phase:** 0 — Foundation  
**Status:** ⏸ Deferred — revisit with the first real AI adapter (Phase 5 at the latest)  
**Depends on:** P0-02  

---

## Goal

Add `quarkus-langchain4j-ollama` to the backend and verify the application can make a basic AI call to a locally running Ollama instance.

---

## Acceptance Criteria

- [ ] `quarkus-langchain4j-ollama` extension added to `pom.xml`
- [ ] Ollama base URL and model configured in `application.properties`
- [ ] A `GET /api/ai/ping` endpoint sends a trivial prompt ("Say hello") to Ollama and returns the response
- [ ] The endpoint works in dev mode with Ollama running locally (see P0-04 for Docker Compose)
- [ ] AI service interface defined with `@RegisterAiService`
- [ ] Dev-only config profile used for Ollama URL (not hardcoded)

---

## Implementation Notes

```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.quarkiverse.langchain4j</groupId>
  <artifactId>quarkus-langchain4j-ollama</artifactId>
  <version>LATEST</version>  <!-- pin to current stable -->
</dependency>
```

```properties
# application.properties
quarkus.langchain4j.ollama.base-url=http://localhost:11434
quarkus.langchain4j.ollama.chat-model.model-id=deepseek-coder:6.7b-instruct-q4_K_M
quarkus.langchain4j.ollama.chat-model.timeout=60s
quarkus.langchain4j.ollama.log-requests=true
quarkus.langchain4j.ollama.log-responses=true
```

```java
// AiPingService.java
@RegisterAiService
public interface AiPingService {
    String ping(@UserMessage String message);
}

// AiPingResource.java
@Path("/api/ai")
public class AiPingResource {
    @Inject AiPingService aiService;

    @GET
    @Path("/ping")
    public String ping() {
        return aiService.ping("Say hello in one sentence.");
    }
}
```

**Model choice for MVP:** `deepseek-coder:6.7b-instruct-q4_K_M` — pull before running:
```bash
ollama pull deepseek-coder:6.7b-instruct-q4_K_M
```

---

## Notes

- Ollama must be running locally or via Docker Compose (P0-04) before this endpoint works.
- Model: **DeepSeek-Coder 6.7B Q4_K_M** (`deepseek-coder:6.7b-instruct-q4_K_M`) — decided for MVP.
- Log requests/responses in dev mode to aid prompt debugging.

---

## Definition of Done

- `GET /api/ai/ping` returns a non-empty string response from Ollama with no errors.

---

## Closure Note (2026-11-01)

Not implemented. `quarkus-langchain4j-ollama` 1.x regresses on Quarkus 3.33+ (see the comment in `backend/pom.xml`). Task generation uses `StubTaskAdapter` and falls back to seed tasks (P2-05). Pick this up when the first real AI adapter is needed.
