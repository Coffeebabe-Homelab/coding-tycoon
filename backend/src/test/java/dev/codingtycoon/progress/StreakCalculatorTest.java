package dev.codingtycoon.progress;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Unit tests for the pure streak date logic. */
class StreakCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 1);

    private static LocalDate daysAgo(int days) {
        return TODAY.minusDays(days);
    }

    @Test
    void noActivityGivesZero() {
        assertEquals(new Streak(0, 0), StreakCalculator.calculate(List.of(), TODAY));
    }

    @Test
    void singleDayTodayGivesOne() {
        assertEquals(new Streak(1, 1), StreakCalculator.calculate(List.of(TODAY), TODAY));
    }

    @Test
    void consecutiveRunEndingTodayCountsEveryDay() {
        var days = List.of(daysAgo(2), daysAgo(1), TODAY);
        assertEquals(new Streak(3, 3), StreakCalculator.calculate(days, TODAY));
    }

    @Test
    void gapResetsCurrentButKeepsLongest() {
        var days = List.of(daysAgo(6), daysAgo(5), daysAgo(4), daysAgo(1), TODAY);
        assertEquals(new Streak(2, 3), StreakCalculator.calculate(days, TODAY));
    }

    @Test
    void runEndingYesterdayKeepsStreakAlive() {
        var days = List.of(daysAgo(2), daysAgo(1));
        assertEquals(new Streak(2, 2), StreakCalculator.calculate(days, TODAY));
    }

    @Test
    void runEndingBeforeYesterdayIsLost() {
        var days = List.of(daysAgo(3), daysAgo(2));
        assertEquals(new Streak(0, 2), StreakCalculator.calculate(days, TODAY));
    }

    @Test
    void multipleEventsOnOneDayCountOnce() {
        var days = List.of(TODAY, TODAY, daysAgo(1), daysAgo(1));
        assertEquals(new Streak(2, 2), StreakCalculator.calculate(days, TODAY));
    }
}
