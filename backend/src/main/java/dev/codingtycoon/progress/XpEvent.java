package dev.codingtycoon.progress;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * One XP award in the player's ledger. Totals, "XP today" and streaks are derived from these rows.
 * {@code createdAt} is stored in UTC because a game day is a UTC calendar day.
 */
@Entity
@Table(name = "xp_event",
        uniqueConstraints = @UniqueConstraint(name = "uq_xp_event_task_reason", columnNames = {"task_id", "reason"}))
public class XpEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "player_profile_id", nullable = false)
    public Long playerProfileId;

    @Column(name = "task_id", nullable = false)
    public Long taskId;

    @Column(nullable = false)
    public int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public XpReason reason;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);
}
