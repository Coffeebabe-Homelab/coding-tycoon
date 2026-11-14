package com.shopfront.report;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SalesReportServiceTest {

    private final SalesReportService service = new SalesReportService();

    @Test
    void sumsRevenuePerCategoryWithATotal() {
        Map<String, BigDecimal> report = service.process(List.of(
                row("Books", 2, "10.00", "COMPLETED"),
                row("Books", 1, "5.50", "COMPLETED"),
                row("Food", 3, "2.00", "COMPLETED")));

        assertEquals(new BigDecimal("25.50"), report.get("Books"));
        assertEquals(new BigDecimal("6.00"), report.get("Food"));
        assertEquals(new BigDecimal("31.50"), report.get("TOTAL"));
    }

    @Test
    void skipsCancelledOrdersAndSubtractsRefunds() {
        Map<String, BigDecimal> report = service.process(List.of(
                row("Books", 2, "10.00", "COMPLETED"),
                row("Books", 1, "10.00", "CANCELLED"),
                row("Books", 1, "10.00", "REFUNDED")));

        assertEquals(new BigDecimal("10.00"), report.get("TOTAL"));
    }

    @Test
    void appliesTheBulkDiscountFromTenItems() {
        Map<String, BigDecimal> report = service.process(List.<Object[]>of(row("Food", 10, "1.00", "COMPLETED")));

        assertEquals(new BigDecimal("9.00"), report.get("Food"));
    }

    @Test
    void groupsBlankCategoriesAsUncategorised() {
        Map<String, BigDecimal> report = service.process(List.<Object[]>of(row(" ", 1, "4.00", "COMPLETED")));

        assertEquals(new BigDecimal("4.00"), report.get("uncategorised"));
    }

    @Test
    void emptyInputReportsAZeroTotal() {
        assertEquals(Map.of("TOTAL", new BigDecimal("0.00")), service.process(List.of()));
    }

    private static Object[] row(String category, int quantity, String unitPrice, String status) {
        return new Object[]{category, quantity, new BigDecimal(unitPrice), status};
    }
}
