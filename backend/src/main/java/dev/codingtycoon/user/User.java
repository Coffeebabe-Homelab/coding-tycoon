package dev.codingtycoon.user;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Represents an authenticated user. Created on first login using the Auth0 sub claim.
 */
@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** Auth0 subject claim — uniquely identifies the user across all requests. */
    @Column(nullable = false, unique = true)
    public String sub;

    /** User's email from the Auth0 token. May be null if the scope is not granted. */
    public String email;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
