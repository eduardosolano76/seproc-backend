package com.example.demo.config;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.stereotype.Component;

@Component
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    private static final long serialVersionUID = 1L;

    private static final Pattern SAFE_SCHEMA_PATTERN =
            Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*");

    private final DataSource dataSource;

    public SchemaMultiTenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        Connection connection = dataSource.getConnection();
        setSearchPath(connection, "public");
        return connection;
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        resetSearchPath(connection);
        connection.close();
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = dataSource.getConnection();

        String schema = validateSchema(tenantIdentifier);

        setSearchPath(connection, schema);

        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        resetSearchPath(connection);
        connection.close();
    }

    private void setSearchPath(Connection connection, String schema) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            if ("public".equals(schema)) {
                statement.execute("SET search_path TO public");
            } else {
                statement.execute("SET search_path TO " + schema + ", public");
            }
        }
    }

    private void resetSearchPath(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute("SET search_path TO public");
        }
    }

    private String validateSchema(String schema) {
        if (schema == null || schema.isBlank()) {
            return "public";
        }

        if (!SAFE_SCHEMA_PATTERN.matcher(schema).matches()) {
            throw new IllegalArgumentException("Nombre de schema inválido: " + schema);
        }

        return schema;
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean handlesConnectionSchema() {
        return true;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return unwrapType.isAssignableFrom(getClass())
                || unwrapType.isAssignableFrom(DataSource.class);
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        if (unwrapType.isAssignableFrom(getClass())) {
            return unwrapType.cast(this);
        }

        if (unwrapType.isAssignableFrom(DataSource.class)) {
            return unwrapType.cast(dataSource);
        }

        return null;
    }
}