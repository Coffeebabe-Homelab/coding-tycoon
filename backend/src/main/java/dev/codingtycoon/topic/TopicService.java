package dev.codingtycoon.topic;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Domain service for topic management.
 * Provides the list of available topics for the onboarding wizard and profile editor.
 */
@ApplicationScoped
public class TopicService {

    @Inject
    TopicRepository topicRepository;

    /**
     * Returns all available learning topics.
     * Used by the frontend to populate the topic selection in the onboarding wizard.
     *
     * @return list of all topics
     */
    public List<Topic> listAll() {
        return topicRepository.listTopics();
    }
}
