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
        crearForeignKeysTenant(schemaName);
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
    
    private void crearForeignKeysTenant(String schema) {

        // Solicitud_proyecto -> public
        addConstraint(schema, "solicitud_proyecto", "fk_sp_institucion",
                "FOREIGN KEY (id_institucion) REFERENCES public.institucion(id_institucion)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_usuario_contratista",
                "FOREIGN KEY (id_usuario_contratista) REFERENCES public.usuario(id_usuario)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_usuario_central",
                "FOREIGN KEY (id_usuario_central) REFERENCES public.usuario(id_usuario)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_estado",
                "FOREIGN KEY (id_estado) REFERENCES public.cat_estado(id_estado)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_municipio",
                "FOREIGN KEY (id_municipio) REFERENCES public.cat_municipio(id_municipio)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_localidad",
                "FOREIGN KEY (id_localidad) REFERENCES public.cat_localidad(id_localidad)");

        addConstraint(schema, "solicitud_proyecto", "fk_sp_tipo_edificacion",
                "FOREIGN KEY (id_tipo_edificacion) REFERENCES public.tipo_edificacion(id_tipo_edificacion)");

        // Solicitud_proyecto_documento -> schema y public
        addConstraint(schema, "solicitud_proyecto_documento", "fk_spd_solicitud",
                "FOREIGN KEY (id_solicitud) REFERENCES " + schema + ".solicitud_proyecto(id_solicitud)");

        addConstraint(schema, "solicitud_proyecto_documento", "fk_spd_usuario_subio",
                "FOREIGN KEY (id_usuario_subio) REFERENCES public.usuario(id_usuario)");

        addConstraint(schema, "solicitud_proyecto_documento", "fk_spd_usuario_correccion",
                "FOREIGN KEY (id_usuario_solicito_correccion) REFERENCES public.usuario(id_usuario)");

        addConstraint(schema, "solicitud_proyecto_documento", "fk_spd_institucion",
                "FOREIGN KEY (id_institucion) REFERENCES public.institucion(id_institucion)");

        // Proyecto -> schema y public
        addConstraint(schema, "proyecto", "fk_proyecto_solicitud",
                "FOREIGN KEY (id_solicitud) REFERENCES " + schema + ".solicitud_proyecto(id_solicitud)");

        addConstraint(schema, "proyecto", "fk_proyecto_usuario_supervisor",
                "FOREIGN KEY (id_usuario_supervisor) REFERENCES public.usuario(id_usuario)");

        addConstraint(schema, "proyecto", "fk_proyecto_institucion",
                "FOREIGN KEY (id_institucion) REFERENCES public.institucion(id_institucion)");

        // Proyecto_etapa -> schema y public
        addConstraint(schema, "proyecto_etapa", "fk_pe_proyecto",
                "FOREIGN KEY (id_proyecto) REFERENCES " + schema + ".proyecto(id_proyecto)");

        addConstraint(schema, "proyecto_etapa", "fk_pe_etapa_padre",
                "FOREIGN KEY (id_proyecto_etapa_padre) REFERENCES " + schema + ".proyecto_etapa(id_proyecto_etapa)");

        addConstraint(schema, "proyecto_etapa", "fk_pe_etapa_plantilla",
                "FOREIGN KEY (id_etapa_plantilla) REFERENCES public.etapa_plantilla(id_etapa_plantilla)");

        // Proyecto_etapa_entrega -> schema y public
        addConstraint(schema, "proyecto_etapa_entrega", "fk_pee_proyecto_etapa",
                "FOREIGN KEY (id_proyecto_etapa) REFERENCES " + schema + ".proyecto_etapa(id_proyecto_etapa)");

        addConstraint(schema, "proyecto_etapa_entrega", "fk_pee_usuario_constructor",
                "FOREIGN KEY (id_usuario_constructor) REFERENCES public.usuario(id_usuario)");

        // Proyecto_etapa_interaccion -> schema y public
        addConstraint(schema, "proyecto_etapa_interaccion", "fk_pei_proyecto_etapa",
                "FOREIGN KEY (id_proyecto_etapa) REFERENCES " + schema + ".proyecto_etapa(id_proyecto_etapa)");

        addConstraint(schema, "proyecto_etapa_interaccion", "fk_pei_usuario_actor",
                "FOREIGN KEY (id_usuario_actor) REFERENCES public.usuario(id_usuario)");
    }
    
    private void addConstraint(String schema, String tabla, String constraintName, String fkDefinition) {
        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint c
                    JOIN pg_namespace n ON n.oid = c.connamespace
                    WHERE c.conname = '%3$s'
                      AND n.nspname = '%1$s'
                ) THEN
                    ALTER TABLE %1$s.%2$s
                    ADD CONSTRAINT %3$s
                    %4$s;
                END IF;
            END $$;
        """.formatted(schema, tabla, constraintName, fkDefinition));
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