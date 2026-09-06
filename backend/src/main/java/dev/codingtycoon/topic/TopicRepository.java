package dev.codingtycoon.topic;

import java.util.List;

/**
 * Port interface for topic persistence.
 * Services depend on this interface; Panache-specific code lives in JpaTopicRepository.
 */
public interface TopicRepository {

    /**
     * Returns all available topics.
     *
     * @return list of all topics, never null
     */
    List<Topic> listTopics();

    /**
     * Returns topics whose IDs are in the given list.
     * IDs not found in the database are silently ignored.
     *
     * @param ids list of topic IDs to look up
     * @return matching topics
     */
    List<Topic> listByIds(List<Long> ids);
}
