package com.shopfront.report;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Builds the revenue report the shop owner reads every Monday.
 * Written in a hurry for the first sales review and never cleaned up.
 */
@Service
public class SalesReportService {

    // Each row is { category, quantity, unit price, status }, straight from a SQL query.
    public Map<String, BigDecimal> process(List<Object[]> rows) {
        Map<String, BigDecimal> m = new TreeMap<>();
        BigDecimal t = BigDecimal.ZERO;
        if (rows != null) {
            for (Object[] r : rows) {
                if (r != null && r.length >= 4) {
                    String c = (String) r[0];
                    int q = (Integer) r[1];
                    BigDecimal p = (BigDecimal) r[2];
                    String s = (String) r[3];
                    if (s != null && !s.equals("CANCELLED")) {
                        if (q > 0) {
                            BigDecimal x = p.multiply(BigDecimal.valueOf(q));
                            if (q >= 10) {
                                x = x.multiply(new BigDecimal("0.90"));
                            }
                            if (s.equals("REFUNDED")) {
                                x = x.negate();
                            }
                            if (c == null || c.isBlank()) {
                                c = "uncategorised";
                            }
                            BigDecimal old = m.get(c);
                            if (old == null) {
                                m.put(c, x);
                            } else {
                                m.put(c, old.add(x));
                            }
                            t = t.add(x);
                        }
                    }
                }
            }
        }
        for (String k : m.keySet()) {
            m.put(k, m.get(k).setScale(2, RoundingMode.HALF_UP));
        }
        m.put("TOTAL", t.setScale(2, RoundingMode.HALF_UP));
        return m;
    }
}
