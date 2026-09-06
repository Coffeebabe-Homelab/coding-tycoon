package dev.codingtycoon.topic;

/**
 * JSON response record for a topic. Returned by GET /api/topics and embedded in profile responses.
 */
public record TopicResponse(Long id, String name, String slug) {

    /**
     * Creates a TopicResponse from a Topic entity.
     *
     * @param topic the topic entity to map
     * @return a new TopicResponse
     */
    public static TopicResponse from(Topic topic) {
        return new TopicResponse(topic.id, topic.name, topic.slug);
    }
}
