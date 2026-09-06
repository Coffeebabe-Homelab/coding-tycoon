package dev.codingtycoon.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for POST /api/profile and PUT /api/profile.
 * Topic IDs are resolved to full Topic entities by the service layer.
 */
public class CreateProfileRequest {

    @NotBlank
    public String language;

    @NotBlank
    public String framework;

    @NotBlank
    public String seniority;

    /** IDs of the topics the player selected. Must contain at least one topic. */
    @NotNull
    @Size(min = 1)
    public List<Long> topicIds;
}
