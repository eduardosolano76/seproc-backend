package com.example.demo.service;

import java.util.regex.Pattern;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InstitucionProvisioningService {

    private static final Pattern SAFE_SCHEMA =
            Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*");

    private final JdbcTemplate jdbcTemplate;

    public InstitucionProvisioningService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void crearTenantInstitucion(String schemaName) {
        validarSchema(schemaName);

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);

        crearTablasTenant(schemaName);
    }

    private void crearTablasTenant(String schema) {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.solicitud_proyecto
            (LIKE public.solicitud_proyecto INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.solicitud_proyecto_documento
            (LIKE public.solicitud_proyecto_documento INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.proyecto
            (LIKE public.proyecto INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.proyecto_etapa
            (LIKE public.proyecto_etapa INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.proyecto_etapa_entrega
            (LIKE public.proyecto_etapa_entrega INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.proyecto_etapa_interaccion
            (LIKE public.proyecto_etapa_interaccion INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES)
        """.formatted(schema));
    }

    private void validarSchema(String schemaName) {
        if (schemaName == null || schemaName.isBlank()) {
            throw new IllegalArgumentException("El nombre del schema no puede estar vacío.");
        }

        if (!SAFE_SCHEMA.matcher(schemaName).matches()) {
            throw new IllegalArgumentException("Nombre de schema inválido: " + schemaName);
        }
    }
}