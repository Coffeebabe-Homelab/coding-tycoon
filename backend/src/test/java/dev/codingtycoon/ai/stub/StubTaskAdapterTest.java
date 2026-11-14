package dev.codingtycoon.ai.stub;

import dev.codingtycoon.ai.TaskAiPortContract;
import dev.codingtycoon.task.TaskAiPort;

/** The stub has no provider to fail, so it is both the healthy and the failing adapter. */
class StubTaskAdapterTest extends TaskAiPortContract {

    @Override
    protected TaskAiPort healthyAdapter() {
        return new StubTaskAdapter();
    }

    @Override
    protected TaskAiPort failingAdapter() {
        return new StubTaskAdapter();
    }
}
